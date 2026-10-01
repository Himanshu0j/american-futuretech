const Payment = require('../models/Payment');
const WebhookEvent = require('../models/WebhookEvent');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const AuditLog = require('../models/AuditLog');
const SiteSettings = require('../models/SiteSettings');

const { buildQuote, resolveOrderAmount } = require('../utils/pricing');
const { resolveCoupon, redeemCoupon } = require('../utils/couponEngine');
const { generateSecurePassword } = require('../utils/passwords');
const gateway = require('../utils/paymentGateway');
const { isStripeConfigured, isWebhookConfigured, getPaymentStatus } = require('../config/payments');
const { searchRegex } = require('../utils/search');
const { sendError } = require('../utils/apiError');
const {
  sendPaymentReceiptEmail,
  sendEnrollmentCredentialsEmail,
  sendAdminPaymentAlert,
} = require('../utils/emailService');

/**
 * Payment lifecycle
 * -----------------
 * 1. POST /api/payments/quote      → server computes the authoritative price.
 * 2. POST /api/payments/checkout   → a Pending Payment row + Stripe Checkout Session.
 * 3. Customer pays on Stripe's hosted page (card data never touches our servers).
 * 4. POST /api/payments/webhook    → signature-verified event settles the Payment,
 *                                    creates the student, enrollment and receipt emails.
 *
 * Nothing is ever marked "Paid" from a browser request.
 */

const ENROLLMENT_LOGIN_PATH = '/student/login';

const buildLoginUrl = (clientUrl) => `${clientUrl}${ENROLLMENT_LOGIN_PATH}`;

const generateReference = (prefix) =>
  `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const generateInvoiceNumber = () =>
  `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

const loadCheckoutContext = async (courseId, tier, couponCode, buyer = {}, depositAmount) => {
  if (!courseId) return { error: { status: 400, message: 'Please select a program to enroll in.' } };

  const course = await Course.findById(courseId);
  if (!course) return { error: { status: 404, message: 'Selected program could not be found.' } };

  const settings = (await SiteSettings.findOne().lean()) || {};

  // Coupons live in the database (Admin → Coupons). The undiscounted amount is
  // resolved first so minimum-order rules are checked against the real price.
  let resolvedCoupon = null;
  if (couponCode) {
    const base = resolveOrderAmount({ course, tier, settings, depositAmount });
    resolvedCoupon = await resolveCoupon(couponCode, {
      amount: base.amount,
      tier: base.tier,
      courseId: course._id,
      studentId: buyer.studentId,
      email: buyer.email,
    });
  }

  const quote = buildQuote({ course, tier, couponCode, settings, resolvedCoupon, depositAmount });

  return { course, settings, quote };
};

// @desc    Authoritative price quote (tier + voucher) — no side effects
// @route   POST /api/payments/quote
// @access  Public
const quoteOrder = async (req, res) => {
  try {
    const { courseId, tier, couponCode, email, depositAmount } = req.body || {};
    const context = await loadCheckoutContext(courseId, tier, couponCode, {
      email,
      studentId: req.user?._id,
    }, depositAmount);
    if (context.error) {
      return res.status(context.error.status).json({ success: false, message: context.error.message });
    }

    const { course, quote, settings } = context;
    const gatewaySettings = settings?.paymentGateway || {};

    return res.status(200).json({
      success: true,
      quote: {
        ...quote,
        courseId: course._id,
        courseTitle: course.title,
        courseDuration: course.duration,
      },
      checkout: {
        enabled: gatewaySettings.enabled !== false,
        message: gatewaySettings.checkoutNote || '',
        disabledMessage: gatewaySettings.disabledMessage || '',
        currency: gatewaySettings.currency || 'USD',
      },
      payments: getPaymentStatus(),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Start a real Stripe Checkout Session for an enrollment
// @route   POST /api/payments/checkout
// @access  Public
const createCheckoutSession = async (req, res) => {
  try {
    const { courseId, tier, fullName, email, phone, couponCode, depositAmount } = req.body || {};

    if (!courseId || !fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the program, your full name and email address.',
      });
    }

    const context = await loadCheckoutContext(courseId, tier, couponCode, {
      email,
      studentId: req.user?._id,
    }, depositAmount);
    if (context.error) {
      return res.status(context.error.status).json({ success: false, message: context.error.message });
    }
    const { course, quote } = context;

    // An invalid/expired/exhausted coupon must never be silently ignored on a
    // real charge — the buyer gets the exact reason instead.
    if (couponCode && quote.couponValid === false) {
      return res.status(400).json({
        success: false,
        code: quote.couponErrorCode || 'COUPON_INVALID',
        message: quote.couponError || 'That coupon code cannot be used on this order.',
        quote: { ...quote, courseTitle: course.title },
      });
    }

    // Admin switch: Stripe can be turned off from Admin → Payment Gateway. When
    // it is off (or the keys are not in place yet) we never fake a payment —
    // the customer is routed to the manual admissions flow instead.
    const gatewaySettings = context.settings?.paymentGateway || {};
    if (gatewaySettings.enabled === false) {
      return res.status(503).json({
        success: false,
        code: 'PAYMENTS_DISABLED',
        message:
          gatewaySettings.disabledMessage ||
          'Online card payments are temporarily unavailable. Please submit an admissions enquiry and we will send you a secure payment link.',
        fallback: 'manual-enquiry',
        quote: { ...quote, courseTitle: course.title },
        payments: getPaymentStatus(),
      });
    }

    // Graceful degradation before the gateway keys are added: never fake a payment.
    if (!isStripeConfigured() || !isWebhookConfigured()) {
      return res.status(503).json({
        success: false,
        code: 'PAYMENTS_NOT_CONFIGURED',
        message:
          'Online card payments are being activated right now. Share your details and our admissions team will send you a secure payment link and invoice within 24 hours.',
        fallback: 'manual-enquiry',
        quote: { ...quote, courseTitle: course.title },
        payments: getPaymentStatus(),
      });
    }

    // 1. Pending record first, so the webhook always has something to settle.
    const payment = await Payment.create({
      studentName: String(fullName).trim(),
      email: String(email).toLowerCase().trim(),
      phone: phone || '',
      course: course._id,
      courseTitle: course.title,
      batch: null,
      tier: quote.tier,
      amount: quote.amount,
      originalPrice: quote.originalPrice,
      discountAmount: quote.discountAmount,
      couponCode: quote.couponCode,
      couponLabel: quote.couponLabel,
      currency: quote.currency,
      status: 'Pending',
      transactionId: generateReference('PEND'),
      invoiceNumber: generateInvoiceNumber(),
      paymentMethod: 'Card / Stripe Secure Checkout',
      provider: 'stripe',
    });

    // 2. Hosted Stripe Checkout Session.
    let session;
    try {
      const clientUrl = gateway.resolveClientUrl(req);
      ({ session } = await gateway.createCheckoutSession({
        payment,
        course,
        quote,
        customer: { fullName, email, phone },
        clientUrl,
      }));
    } catch (stripeError) {
      payment.status = 'Failed';
      payment.failureReason = `Session creation failed: ${stripeError.message}`;
      await payment.save();
      return res.status(502).json({
        success: false,
        message: 'We could not reach the payment gateway. Please try again in a moment.',
      });
    }

    payment.checkoutSessionId = session.id;
    payment.checkoutSessionUrl = session.url || '';
    await payment.save();

    await AuditLog.create({
      actorName: payment.studentName,
      actorRole: 'STUDENT',
      action: 'CHECKOUT_SESSION_CREATED',
      entity: 'Payment',
      entityId: payment._id.toString(),
      details: `Stripe Checkout Session ${session.id} opened for ${course.title} (${quote.tier}) — ${quote.currency} ${quote.amount}`,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      requiresRedirect: true,
      sessionUrl: session.url,
      sessionId: session.id,
      paymentId: payment._id,
      invoiceNumber: payment.invoiceNumber,
      quote: { ...quote, courseTitle: course.title },
      message: 'Redirecting you to our secure Stripe payment page…',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Webhook fulfilment
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Webhook delivery log
// ─────────────────────────────────────────────────────────────────────────────

/** Keep the log an operational aid, not an archive. */
const WEBHOOK_EVENT_RETENTION = 500;

/**
 * Rejected deliveries are written by an UNAUTHENTICATED endpoint, so a stranger
 * posting garbage all day could otherwise turn the health log into a write
 * amplifier. Beyond this many rejections in the window we stop persisting them
 * (they are still logged to the console) — a real misconfigured endpoint sends a
 * handful, an attack sends thousands.
 */
const REJECTION_WRITE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REJECTIONS_PER_WINDOW = 25;
let rejectionWriteTimes = [];

const rejectionWritesAllowed = () => {
  const now = Date.now();
  rejectionWriteTimes = rejectionWriteTimes.filter((at) => now - at < REJECTION_WRITE_WINDOW_MS);
  if (rejectionWriteTimes.length >= MAX_REJECTIONS_PER_WINDOW) return false;
  rejectionWriteTimes.push(now);
  return true;
};

/**
 * Record one delivery. Never throws: a logging failure must never cost a student
 * their enrollment, so every call site uses this fire-and-forget style.
 */
const recordWebhookEvent = (entry) => {
  if (entry?.status === 'rejected' && !rejectionWritesAllowed()) return Promise.resolve(null);

  const job = WebhookEvent.create({
    eventId: entry?.eventId || '',
    type: entry?.type || '',
    status: entry?.status || 'ignored',
    httpStatus: entry?.httpStatus ?? 200,
    signatureValid: entry?.signatureValid !== false,
    message: String(entry?.message || '').slice(0, 300),
    payment: entry?.payment?._id || entry?.payment || null,
    invoiceNumber: entry?.payment?.invoiceNumber || '',
    paymentEmail: entry?.payment?.email || '',
    sessionId: entry?.sessionId || '',
    amount: entry?.amount ?? null,
    durationMs: entry?.durationMs ?? 0,
  }).catch((error) => {
    console.warn(`[Stripe Webhook] Could not record delivery: ${error.message}`);
    return null;
  });

  // Trim occasionally rather than on every write, so the log stays bounded
  // without paying for a count on the settlement path.
  if (Math.random() < 0.05) {
    WebhookEvent.find()
      .sort({ createdAt: -1 })
      .skip(WEBHOOK_EVENT_RETENTION)
      .select('_id')
      .lean()
      .then((stale) => {
        if (!stale.length) return null;
        return WebhookEvent.deleteMany({ _id: { $in: stale.map((row) => row._id) } });
      })
      .catch(() => {});
  }

  return job;
};

const dataOf = (session) => ({
  paymentIntentId:
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || '',
  method: (session.payment_method_types || []).join(', ') || 'card',
  amountTotal: session.amount_total != null ? session.amount_total / 100 : null,
});

/**
 * Idempotency guard: an event id can only be claimed once, so Stripe's retries
 * (which are normal and expected) can never double-enroll a student.
 */
const claimEvent = async (paymentId, eventId) => {
  if (!eventId) return null;
  return Payment.findOneAndUpdate(
    { _id: paymentId, webhookEventIds: { $ne: eventId } },
    { $addToSet: { webhookEventIds: eventId } },
    { new: true },
  );
};

const fulfillPaidCheckout = async ({ payment, session, clientUrl }) => {
  const gatewayData = dataOf(session);

  // 1. Settle the payment record.
  payment.status = 'Paid';
  payment.paidAt = new Date();
  payment.paymentDate = new Date();
  payment.paymentMethod = `Stripe Checkout (${gatewayData.method})`;
  payment.stripePaymentIntentId = gatewayData.paymentIntentId;
  payment.transactionId = gatewayData.paymentIntentId || session.id;
  payment.failureReason = '';
  if (gatewayData.amountTotal != null) payment.amount = gatewayData.amountTotal;
  await payment.save();

  // 1b. Count the redemption once the money is actually settled, so a coupon's
  //     usage limit reflects paid orders only (abandoned checkouts never burn it).
  if (payment.couponCode) {
    await redeemCoupon(payment.couponCode).catch(() => {});
  }

  // 2. Create (or reuse) the student account. The temporary password is random
  //    per student and is only ever delivered by email.
  let student = await User.findOne({ email: payment.email });
  let tempPassword = null;

  if (!student) {
    tempPassword = generateSecurePassword();
    student = await User.create({
      name: payment.studentName,
      email: payment.email,
      password: tempPassword,
      phone: payment.phone || '',
      role: 'STUDENT',
      isActive: true,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(payment.studentName)}`,
      studentDetails: {
        enrollmentNumber: `AFT-${Math.floor(100000 + Math.random() * 900000)}`,
        assignedBatch: payment.batch || null,
        targetCareer: payment.courseTitle,
      },
    });
  }

  // 2b. Link the receipt to the account. Without this the buyer could never see
  //     their own invoice under Student → Payments, and the admin ledger showed a
  //     "guest checkout" even though a real account exists.
  if (String(payment.student || '') !== String(student._id)) {
    payment.student = student._id;
    await payment.save();
  }

  // 3. Enrollment + progress.
  let enrollment = await Enrollment.findOne({ student: student._id, course: payment.course });
  if (!enrollment) {
    enrollment = await Enrollment.create({
      student: student._id,
      course: payment.course,
      batch: payment.batch || null,
      payment: payment._id,
      status: 'Active',
    });
  } else {
    enrollment.payment = payment._id;
    if (payment.batch) enrollment.batch = payment.batch;
    await enrollment.save();
  }

  await Progress.findOneAndUpdate(
    { student: student._id, course: payment.course },
    { $setOnInsert: { completedLessons: [], progressPercent: 0 } },
    { upsert: true },
  );

  // 4. Cohort seat (only once per student per batch).
  if (payment.batch) {
    const batch = await Batch.findById(payment.batch);
    if (batch) {
      const alreadySeated = (batch.enrolledStudents || []).some(
        (row) => String(row.email || '').toLowerCase() === payment.email,
      );
      if (!alreadySeated) {
        batch.enrolledStudents.push({
          studentName: student.name,
          email: student.email,
          phone: student.phone,
          feePaid: payment.amount,
          totalFee: payment.originalPrice || payment.amount,
          paymentStatus: payment.tier === 'deposit' ? 'Partial' : 'Paid',
          invoiceId: payment.invoiceNumber,
        });
        await batch.save();
      }
    }
  }

  // 5. Audit trail.
  await AuditLog.create({
    actor: student._id,
    actorName: student.name,
    actorRole: student.role,
    action: 'PAYMENT_VERIFIED_BY_WEBHOOK',
    entity: 'Payment',
    entityId: payment._id.toString(),
    details: `Stripe confirmed ${payment.currency} ${payment.amount} for ${payment.courseTitle} (${payment.tier}). Invoice #${payment.invoiceNumber}`,
  }).catch(() => {});

  // 6. Customer + internal emails (failures never block the enrollment).
  const loginUrl = buildLoginUrl(clientUrl);
  const receiptPayload = {
    payment: payment.toObject(),
    studentName: student.name,
    loginUrl,
  };

  sendPaymentReceiptEmail(receiptPayload).catch((err) =>
    console.error('[Email] receipt failed:', err.message),
  );
  if (tempPassword) {
    sendEnrollmentCredentialsEmail({
      payment: payment.toObject(),
      tempPassword,
      loginUrl,
    }).catch((err) => console.error('[Email] credentials failed:', err.message));
  }
  sendAdminPaymentAlert(payment.toObject()).catch((err) =>
    console.error('[Email] admin alert failed:', err.message),
  );

  return {
    payment,
    student,
    enrollment,
    isNewStudent: Boolean(tempPassword),
    credentialsEmailSentTo: tempPassword ? payment.email : null,
  };
};

const markPaymentFailed = async (payment, reason, status = 'Failed') => {
  payment.status = status;
  payment.failureReason = reason;
  await payment.save();
  await AuditLog.create({
    actorName: payment.studentName,
    actorRole: 'STUDENT',
    action: 'PAYMENT_FAILED',
    entity: 'Payment',
    entityId: payment._id.toString(),
    details: `Stripe reported ${reason} for invoice #${payment.invoiceNumber}`,
  }).catch(() => {});
};

// @desc    Stripe webhook — the ONLY path that can confirm a payment
// @route   POST /api/payments/webhook
// @access  Public (verified by signature)
const handleStripeWebhook = async (req, res) => {
  const startedAt = Date.now();
  const record = (entry) =>
    recordWebhookEvent({ ...entry, durationMs: Date.now() - startedAt }).catch(() => {});

  if (!isStripeConfigured() || !isWebhookConfigured()) {
    return res.status(503).json({ success: false, message: 'Payment gateway is not configured.' });
  }

  let event;
  try {
    event = gateway.verifyWebhookSignature(req.rawBody, req.headers['stripe-signature']);
  } catch (error) {
    console.warn(`[Stripe Webhook] Rejected: ${error.message}`);
    // Recorded as `rejected`: this is how a wrong signing secret or a stranger
    // poking the endpoint shows up in the admin's webhook health panel.
    await record({
      status: 'rejected',
      httpStatus: 400,
      signatureValid: false,
      message: `Signature verification failed: ${error.message}`,
      type: '(unverified request)',
    });
    return res.status(400).json({ success: false, message: `Webhook signature verification failed: ${error.message}` });
  }

  const clientUrl = gateway.resolveClientUrl(req);

  try {
    const session = event.data?.object || {};
    const paymentId = session.metadata?.paymentId || session.client_reference_id;
    const payment = paymentId ? await Payment.findById(paymentId) : null;
    const base = {
      eventId: event.id,
      type: event.type,
      sessionId: session.id || '',
      payment,
      amount: session.amount_total != null ? session.amount_total / 100 : null,
    };

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        if (!payment) {
          console.warn(`[Stripe Webhook] No payment matched session ${session.id}`);
          await record({ ...base, status: 'unmatched', message: 'No payment record matched this session id.' });
          break;
        }
        // Card payments are settled instantly; anything not actually paid waits.
        if (session.payment_status && session.payment_status !== 'paid') {
          console.log(`[Stripe Webhook] ${session.id} not paid yet (${session.payment_status}) — awaiting settlement.`);
          await record({ ...base, status: 'pending', message: `Stripe reported payment_status=${session.payment_status}.` });
          break;
        }
        if (payment.status === 'Paid') {
          console.log(`[Stripe Webhook] Payment ${payment._id} already settled — skipping.`);
          await record({ ...base, status: 'duplicate', message: 'Payment was already settled; nothing changed.' });
          break;
        }
        const claimed = await claimEvent(payment._id, event.id);
        if (!claimed) {
          console.log(`[Stripe Webhook] Event ${event.id} already processed — skipping.`);
          await record({ ...base, status: 'duplicate', message: `Event ${event.id} was already processed.` });
          break;
        }
        const result = await fulfillPaidCheckout({ payment: claimed, session, clientUrl });
        console.log(
          `[Stripe Webhook] ✅ Enrollment confirmed for ${result.payment.email} — invoice ${result.payment.invoiceNumber}, ${result.payment.currency} ${result.payment.amount}`,
        );
        await record({
          ...base,
          payment: result.payment,
          status: 'processed',
          message: `Enrollment confirmed for ${result.payment.email} (invoice ${result.payment.invoiceNumber}).`,
        });
        break;
      }

      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired':
      case 'payment_intent.payment_failed': {
        if (!payment) {
          await record({ ...base, status: 'unmatched', message: 'No payment record matched this session id.' });
          break;
        }
        if (payment.status === 'Paid') {
          // never downgrade a settled payment
          await record({ ...base, status: 'ignored', message: 'Payment is already settled — not downgraded.' });
          break;
        }
        const reason =
          event.type === 'checkout.session.expired'
            ? 'Checkout session expired before payment was completed'
            : event.data?.object?.last_payment_error?.message || 'Payment attempt failed';
        await markPaymentFailed(
          payment,
          reason,
          event.type === 'checkout.session.expired' ? 'Expired' : 'Failed',
        );
        console.log(`[Stripe Webhook] Payment ${payment._id} marked ${payment.status}: ${reason}`);
        await record({ ...base, status: 'processed', message: `Payment marked ${payment.status}: ${reason}` });
        break;
      }

      default:
        // Unhandled but still acknowledged, so Stripe stops retrying.
        await record({ ...base, status: 'ignored', message: 'Event type is not used by this platform.' });
        break;
    }

    // Always acknowledge a verified event so Stripe does not retry forever.
    return res.status(200).json({ received: true });
  } catch (error) {
    // 500 tells Stripe to retry — the claim guard keeps that safe.
    console.error(`[Stripe Webhook] Handler error: ${error.message}`);
    await record({
      eventId: event.id,
      type: event.type,
      status: 'failed',
      httpStatus: 500,
      message: `Handler error: ${error.message}`,
      sessionId: event.data?.object?.id || '',
    });
    return res.status(500).json({ success: false, message: 'Webhook processing failed.' });
  }
};

/**
 * Ask Stripe what really happened to one Pending order and settle it if the money
 * is there.
 *
 * Two callers need exactly this: the public success screen (a webhook can be
 * seconds late) and the admin's "re-check" button in the webhook health panel
 * (when a delivery was lost). Both must take the same idempotency guard, which is
 * why the logic lives here instead of in either controller.
 */
const reconcilePendingPayment = async (payment, req) => {
  if (!payment) return { settled: false, reason: 'no-payment' };
  if (payment.status === 'Paid') return { settled: false, reason: 'already-paid' };
  if (!isStripeConfigured()) return { settled: false, reason: 'gateway-off' };
  if (!payment.checkoutSessionId) return { settled: false, reason: 'no-session' };

  const session = await gateway.retrieveCheckoutSession(payment.checkoutSessionId);
  const stripeStatus = session?.payment_status || session?.status || 'unknown';

  if (!session || stripeStatus !== 'paid') {
    return { settled: false, reason: 'not-paid', stripeStatus };
  }

  // `pending→paid` paths share the claim guard with the webhook, so a late webhook
  // arriving after an admin re-check can never enroll the student twice.
  const claimed = (await claimEvent(payment._id, `reconcile:${session.id}`)) || payment;
  const result = await fulfillPaidCheckout({
    payment: claimed,
    session,
    clientUrl: gateway.resolveClientUrl(req),
  });

  return { settled: true, stripeStatus, result };
};

// @desc    Poll the result of a checkout session (used by the success screen)
// @route   GET /api/payments/checkout-status/:sessionId
// @access  Public (session id is unguessable and scoped to one order)
const getCheckoutStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const payment = await Payment.findOne({ checkoutSessionId: sessionId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Checkout session not found.' });
    }

    // If Stripe already took the money but the webhook is still in flight,
    // reconcile from Stripe directly so the customer is never left hanging.
    if (payment.status === 'Pending' && isStripeConfigured()) {
      await reconcilePendingPayment(payment, req).catch((error) =>
        console.warn(`[Checkout Status] Reconcile skipped: ${error.message}`),
      );
    }

    const fresh = await Payment.findById(payment._id);
    return res.status(200).json({
      success: true,
      status: fresh.status,
      paid: fresh.status === 'Paid',
      payment: {
        invoiceNumber: fresh.invoiceNumber,
        courseTitle: fresh.courseTitle,
        studentName: fresh.studentName,
        email: fresh.email,
        amount: fresh.amount,
        currency: fresh.currency,
        tier: fresh.tier,
        transactionId: fresh.transactionId,
        paymentDate: fresh.paidAt || fresh.paymentDate,
      },
      credentialsEmailSentTo: fresh.status === 'Paid' ? fresh.email : null,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Webhook delivery health — did Stripe call us, and what did we do?
// @route   GET /api/payments/webhook-events
// @access  Private (Admin, SETTINGS_VIEW)
const getWebhookHealth = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const { status } = req.query;
    const query = status && status !== 'All' ? { status } : {};

    const [events, countsByStatus, lastProcessed, lastFailure] = await Promise.all([
      WebhookEvent.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      WebhookEvent.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      WebhookEvent.findOne({ status: 'processed' }).sort({ createdAt: -1 }).lean(),
      WebhookEvent.findOne({ status: { $in: ['failed', 'rejected'] } }).sort({ createdAt: -1 }).lean(),
    ]);

    const counts = countsByStatus.reduce((acc, row) => ({ ...acc, [row._id]: row.n }), {});

    // Orders the panel can act on: still Pending long after checkout started, so
    // a lost webhook delivery is likely rather than an abandoned cart.
    const staleCutoff = new Date(Date.now() - 30 * 60 * 1000);
    const stuck = await Payment.find({
      status: 'Pending',
      checkoutSessionId: { $ne: '' },
      createdAt: { $lt: staleCutoff },
    })
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      events,
      summary: {
        counts,
        total: countsByStatus.reduce((sum, row) => sum + row.n, 0),
        lastEventAt: events[0]?.createdAt || null,
        lastProcessedAt: lastProcessed?.createdAt || null,
        lastFailure: lastFailure
          ? { status: lastFailure.status, at: lastFailure.createdAt, message: lastFailure.message || '' }
          : null,
        rejectedAttempts: counts.rejected || 0,
        failedDeliveries: counts.failed || 0,
      },
      stuck,
      gateway: getPaymentStatus(),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Re-check one Pending order against Stripe and settle it if it was paid
// @route   POST /api/payments/:id/reconcile
// @access  Private (Admin, SETTINGS_EDIT)
const reconcilePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    if (payment.status === 'Paid') {
      return res.status(200).json({
        success: true,
        settled: false,
        alreadySettled: true,
        message: `Invoice #${payment.invoiceNumber} is already settled — nothing to re-check.`,
        payment,
      });
    }
    if (!isStripeConfigured()) {
      return res.status(503).json({
        success: false,
        code: 'PAYMENTS_NOT_CONFIGURED',
        message: 'Stripe is not configured, so there is nothing to re-check against.',
      });
    }
    if (!payment.checkoutSessionId) {
      return res.status(400).json({
        success: false,
        code: 'NO_SESSION',
        message: 'This record has no Stripe checkout session (manual or legacy entry), so it cannot be re-checked.',
        payment,
      });
    }

    let outcome;
    try {
      outcome = await reconcilePendingPayment(payment, req);
    } catch (error) {
      await recordWebhookEvent({
        status: 'failed',
        httpStatus: 502,
        message: `Manual re-check failed: ${error.message}`,
        payment,
        type: '(admin re-check)',
        sessionId: payment.checkoutSessionId,
      }).catch(() => {});
      return res.status(502).json({
        success: false,
        message: 'Stripe could not be reached for this order. Please try again in a moment.',
      });
    }

    const fresh = await Payment.findById(payment._id);

    if (outcome.settled) {
      await recordWebhookEvent({
        status: 'processed',
        httpStatus: 200,
        message: `Settled by admin re-check (Stripe reported ${outcome.stripeStatus}).`,
        payment: fresh,
        type: '(admin re-check)',
        sessionId: payment.checkoutSessionId,
      }).catch(() => {});
      await AuditLog.create({
        actor: req.user?._id,
        actorName: req.user?.name || 'Admin',
        actorRole: req.user?.role || 'ADMIN',
        action: 'PAYMENT_RECONCILED_BY_ADMIN',
        entity: 'Payment',
        entityId: fresh._id.toString(),
        details: `Invoice #${fresh.invoiceNumber} settled from a manual Stripe re-check by ${req.user?.email || 'admin'} (${fresh.currency} ${fresh.amount}).`,
      }).catch(() => {});
      return res.status(200).json({
        success: true,
        settled: true,
        message: `Payment confirmed by Stripe — invoice #${fresh.invoiceNumber} is now Paid and the student's access is active.`,
        payment: fresh,
      });
    }

    const reasons = {
      'already-paid': 'This order is already settled.',
      'gateway-off': 'Stripe is not configured.',
      'no-session': 'No Stripe checkout session is attached to this record.',
      'no-payment': 'Payment not found.',
    };
    const message = outcome.reason === 'not-paid'
      ? `Stripe has not received the money for this order yet (status: ${outcome.stripeStatus}). Nothing was changed.`
      : reasons[outcome.reason] || 'Nothing to re-check.';

    return res.status(200).json({
      success: true,
      settled: false,
      stripeStatus: outcome.stripeStatus || null,
      message,
      payment: fresh,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private (Admin)
const getAllPayments = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { studentName: searchRegex(search) },
        { email: searchRegex(search) },
        { transactionId: searchRegex(search) },
        { invoiceNumber: searchRegex(search) },
        { courseTitle: searchRegex(search) },
      ];
    }

    // Populate the account so the admin sees who actually owns the receipt
    // (name / email / phone) instead of a bare id or "guest checkout".
    const payments = await Payment.find(query)
      .populate('student', 'name email phone studentDetails.enrollmentNumber')
      .sort({ createdAt: -1 });
    const totalRevenue = payments.reduce(
      (acc, curr) => (curr.status === 'Paid' ? acc + curr.amount : acc),
      0,
    );

    return res.status(200).json({
      success: true,
      payments,
      totalRevenue,
      count: payments.length,
      gateway: getPaymentStatus(),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get logged-in student's payment receipts
// @route   GET /api/payments/my-payments
// @access  Private (Student)
const getMyPayments = async (req, res) => {
  try {
    // Match on the linked account AND on the receipt email: checkouts taken
    // before the account existed were saved without the student reference, and
    // those receipts must not disappear from the buyer's own history.
    const email = String(req.user?.email || '').toLowerCase().trim();
    const query = email
      ? { $or: [{ student: req.user._id }, { email }] }
      : { student: req.user._id };
    const payments = await Payment.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, payments });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Printable invoice data (owner or staff only)
// @route   GET /api/payments/invoice/:invoiceNumber
// @access  Private
const getInvoiceDetails = async (req, res) => {
  try {
    const payment = await Payment.findOne({ invoiceNumber: req.params.invoiceNumber })
      .populate('course', 'title slug duration')
      .populate('batch', 'name startDate');

    if (!payment) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const user = req.user;
    const role = (user?.role || '').toUpperCase();
    const isStaff = ['SUPERADMIN', 'ADMIN', 'COUNSELOR'].includes(role);
    const isOwner =
      (payment.student && String(payment.student) === String(user?._id)) ||
      (payment.email && user?.email && payment.email === String(user.email).toLowerCase());

    if (!isStaff && !isOwner) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this invoice.' });
    }

    return res.status(200).json({ success: true, invoice: payment });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  quoteOrder,
  createCheckoutSession,
  handleStripeWebhook,
  getCheckoutStatus,
  getAllPayments,
  getMyPayments,
  getInvoiceDetails,
  getWebhookHealth,
  reconcilePayment,
  fulfillPaidCheckout,
  __test__: { recordWebhookEvent, reconcilePendingPayment, WEBHOOK_EVENT_RETENTION },
};
