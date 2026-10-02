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
const {
  isStripeConfigured,
  isWebhookConfigured,
  getPaymentStatus,
  getCurrency,
  eligibleInstallmentMethods,
  installmentMethodLabel,
} = require('../config/payments');
const { searchRegex } = require('../utils/search');
const { sendError } = require('../utils/apiError');
const {
  sendPaymentReceiptEmail,
  sendEnrollmentCredentialsEmail,
  sendAdminPaymentAlert,
} = require('../utils/emailService');
// Reached as a namespace on purpose: the verification suite swaps the watchdog
// alert's transport, which only works if this is resolved at call time.
const emailService = require('../utils/emailService');

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

// ─────────────────────────────────────────────────────────────────────────────
// Admin live smoke test
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One real charge, refunded immediately, used to prove the whole payment
 * pipeline on the live account: Checkout → signed webhook → refund.
 *
 * Safety rails, in order of importance:
 *   1. The amount is fixed HERE — one unit of the gateway currency ($1.00 for
 *      USD) — and is never read from the request body, so no caller can scale it.
 *   2. The caller must echo a typed confirmation token, so a stray retry or a
 *      curious curl can never charge a card.
 *   3. Stripe keeps its processing fee on a refunded charge, so a smoke test is
 *      not free: a cooldown, a daily cap and an "unresolved test" lock keep an
 *      accidental click-fest from burning money.
 *   4. The refund is idempotent (stored refund id + idempotency key), so webhook
 *      retries, panel polls and manual retries can race harmlessly.
 */
const SMOKE_TEST_AMOUNT_MINOR = 100;
const SMOKE_TEST_CONFIRMATION = 'charge-and-refund-1';
const SMOKE_TEST_COOLDOWN_MS = 10 * 60 * 1000;
const SMOKE_TEST_DAILY_LIMIT = 3;
const SMOKE_TEST_CHECKOUT_WINDOW_MS = 30 * 60 * 1000;

// Watchdog rails: let the webhook go first, close out abandoned checkouts a
// little after Stripe's own 30-minute session expiry, and work in small batches
// so one pass can never become a stampede.
const SMOKE_TEST_WATCHDOG_GRACE_MS = 90 * 1000;
const SMOKE_TEST_WATCHDOG_EXPIRE_MS = 35 * 60 * 1000;
const SMOKE_TEST_WATCHDOG_BATCH = 25;

const generateSmokeInvoiceNumber = () =>
  `SMOKE-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

const generateSmokeReference = () =>
  `SMOKE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

/**
 * Put the smoke test's money back on the card.
 *
 * Idempotent by design: an existing refund id short-circuits, and the Stripe
 * call carries an idempotency key derived from the payment, so the webhook, the
 * panel's poll and an admin clicking "refund now" can all race without ever
 * moving money twice.
 */
const refundSmokeTestPayment = async (payment, { actorName = 'System' } = {}) => {
  if (!payment?.smokeTest) return { refunded: false, reason: 'not-a-smoke-test' };
  if (payment.refundId) return { refunded: true, reason: 'already-refunded', refundId: payment.refundId };
  if (!isStripeConfigured()) return { refunded: false, reason: 'gateway-off' };
  if (!payment.stripePaymentIntentId) return { refunded: false, reason: 'no-charge-yet' };

  const amountMinor =
    payment.amount != null ? Math.round(payment.amount * 100) : SMOKE_TEST_AMOUNT_MINOR;

  let refund;
  try {
    refund = await gateway.refundPaymentIntent({
      paymentIntentId: payment.stripePaymentIntentId,
      amountMinor,
      idempotencyKey: `smoke-refund-${payment._id}`,
      metadata: {
        paymentId: String(payment._id),
        invoiceNumber: payment.invoiceNumber,
        smokeTest: 'true',
      },
    });
  } catch (error) {
    console.error(`[Smoke Test] Refund failed for invoice ${payment.invoiceNumber}: ${error.message}`);
    await AuditLog.create({
      actorName,
      actorRole: 'ADMIN',
      action: 'PAYMENT_SMOKE_TEST_REFUND_FAILED',
      entity: 'Payment',
      entityId: payment._id.toString(),
      details: `Refund attempt failed for live smoke test invoice #${payment.invoiceNumber}: ${error.message}`,
    }).catch(() => {});
    return { refunded: false, reason: 'refund-failed', error: error.message };
  }

  payment.refundId = refund.id || '';
  payment.refundAmount = refund.amount != null ? refund.amount / 100 : amountMinor / 100;
  payment.refundedAt = new Date();
  payment.status = 'Refunded';
  await payment.save();

  await AuditLog.create({
    actorName,
    actorRole: 'ADMIN',
    action: 'PAYMENT_SMOKE_TEST_REFUNDED',
    entity: 'Payment',
    entityId: payment._id.toString(),
    details: `Live smoke test charge of ${payment.currency} ${payment.refundAmount} refunded (refund ${refund.id}, invoice #${payment.invoiceNumber}). Stripe keeps its processing fee on a refunded charge.`,
  }).catch(() => {});

  return { refunded: true, reason: 'refunded', refundId: refund.id, amount: payment.refundAmount };
};

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

    // The instalment methods (Klarna, Afterpay) this exact amount qualifies for,
    // so the checkout page can advertise them next to the card instead of the
    // student only discovering them on Stripe's page.
    const installmentMethods = eligibleInstallmentMethods(quote.amount);

    return res.status(200).json({
      success: true,
      quote: {
        ...quote,
        courseId: course._id,
        courseTitle: course.title,
        courseDuration: course.duration,
      },
      installments: {
        available: gatewaySettings.enabled !== false && isStripeConfigured(),
        methods: installmentMethods.map(({ id, label, blurb, maxAmount }) => ({
          id,
          label,
          blurb,
          maxAmount,
        })),
        note: installmentMethods.length
          ? 'Pay in instalments with Klarna or Afterpay — choose it on the Stripe payment page.'
          : '',
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
    let installmentMethods = [];
    try {
      const clientUrl = gateway.resolveClientUrl(req);
      ({ session, installmentMethods } = await gateway.createCheckoutSession({
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
      details: `Stripe Checkout Session ${session.id} opened for ${course.title} (${quote.tier}) — ${quote.currency} ${quote.amount}${installmentMethods.length ? ` · instalments offered: ${installmentMethods.map((method) => method.label).join(', ')}` : ''}`,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      requiresRedirect: true,
      sessionUrl: session.url,
      sessionId: session.id,
      paymentId: payment._id,
      invoiceNumber: payment.invoiceNumber,
      quote: { ...quote, courseTitle: course.title },
      installments: installmentMethods.map(({ id, label, blurb }) => ({ id, label, blurb })),
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

const dataOf = (session) => {
  const offered = (session.payment_method_types || []).filter(Boolean);
  return {
    paymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || '',
    // A session lists every method we OFFERED, so one entry is the only case where
    // it also names the method that was used. With instalments on offer the list is
    // "card, klarna, afterpay_clearpay" for every order — the exact method is read
    // from the payment intent after settlement (resolveSettledMethod, best-effort),
    // so the fallback here stays honest rather than showing all three as if paid.
    method: offered.length === 1 ? offered[0] : '',
    offeredMethods: offered,
    amountTotal: session.amount_total != null ? session.amount_total / 100 : null,
  };
};

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

  // A smoke test proves the exact production settlement path — same signature
  // check, same claim guard, same Pending → Paid transition — but it is not a
  // sale, so it stops here: no student account, no enrollment, no coupon and no
  // emails, and the charge is refunded right away (with a retry in the panel if
  // Stripe refuses the refund at this instant).
  if (payment.smokeTest) {
    payment.status = 'Paid';
    payment.paidAt = new Date();
    payment.paymentDate = new Date();
    payment.paymentMethod = `Stripe Checkout (${gatewayData.method}) — live smoke test`;
    payment.stripePaymentIntentId = gatewayData.paymentIntentId;
    payment.transactionId = gatewayData.paymentIntentId || session.id;
    payment.failureReason = '';
    if (gatewayData.amountTotal != null) payment.amount = gatewayData.amountTotal;
    await payment.save();

    await AuditLog.create({
      actorName: payment.studentName,
      actorRole: 'ADMIN',
      action: 'PAYMENT_SMOKE_TEST_SETTLED',
      entity: 'Payment',
      entityId: payment._id.toString(),
      details: `Live smoke test charge of ${payment.currency} ${payment.amount} settled (payment intent ${payment.stripePaymentIntentId || 'n/a'}, invoice #${payment.invoiceNumber}). No enrollment was created; the charge is refunded automatically.`,
    }).catch(() => {});

    const refund = await refundSmokeTestPayment(payment, {
      actorName: 'Stripe webhook (automatic)',
    });
    const fresh = await Payment.findById(payment._id);

    return {
      payment: fresh,
      student: null,
      enrollment: null,
      isNewStudent: false,
      credentialsEmailSentTo: null,
      smokeTest: true,
      refund,
    };
  }

  // 1. Settle the payment record.
  payment.status = 'Paid';
  payment.paidAt = new Date();
  payment.paymentDate = new Date();
  payment.paymentMethod = gatewayData.method
    ? `Stripe Checkout (${installmentMethodLabel(gatewayData.method)})`
    : 'Stripe Checkout (secure hosted page)';
  payment.stripePaymentIntentId = gatewayData.paymentIntentId;
  payment.transactionId = gatewayData.paymentIntentId || session.id;
  payment.failureReason = '';
  if (gatewayData.amountTotal != null) payment.amount = gatewayData.amountTotal;
  await payment.save();

  // 1a. Name the method the student really paid with — "Klarna" on an instalment
  //     plan, "Card" on a card. Deliberately fire-and-forget: the enrollment below
  //     is already safe to grant, so a slow or failed Stripe read must never hold
  //     up a paying student; the ledger just keeps the plainer label.
  gateway
    .resolveSettledMethod(session)
    .then(async (settledMethod) => {
      if (!settledMethod) return;
      const label = `Stripe Checkout (${installmentMethodLabel(settledMethod)})`;
      if (payment.paymentMethod === label) return;
      await Payment.updateOne({ _id: payment._id }, { $set: { paymentMethod: label } });
    })
    .catch(() => {});

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
        // Refunded counts as settled too: a smoke test refunds itself, and a
        // retried event must never flip a refunded row back to Paid.
        if (payment.status === 'Paid' || payment.status === 'Refunded') {
          const state = payment.status === 'Refunded' ? 'refunded' : 'settled';
          console.log(`[Stripe Webhook] Payment ${payment._id} already ${state} — skipping.`);
          await record({ ...base, status: 'duplicate', message: `Payment was already ${state}; nothing changed.` });
          break;
        }
        const claimed = await claimEvent(payment._id, event.id);
        if (!claimed) {
          console.log(`[Stripe Webhook] Event ${event.id} already processed — skipping.`);
          await record({ ...base, status: 'duplicate', message: `Event ${event.id} was already processed.` });
          break;
        }
        const result = await fulfillPaidCheckout({ payment: claimed, session, clientUrl });
        if (result.smokeTest) {
          console.log(
            `[Stripe Webhook] 🧪 Live smoke test settled for ${result.payment.email} — invoice ${result.payment.invoiceNumber}, ${result.payment.currency} ${result.payment.amount}${result.refund?.refunded ? ' (refunded)' : ' (refund pending)'}`,
          );
          await record({
            ...base,
            payment: result.payment,
            status: 'processed',
            message: result.refund?.refunded
              ? `Live smoke test charge settled and refunded (invoice ${result.payment.invoiceNumber}, refund ${result.refund.refundId}).`
              : `Live smoke test charge settled; the refund still has to be issued (invoice ${result.payment.invoiceNumber}).`,
          });
          break;
        }
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
        if (payment.status === 'Paid' || payment.status === 'Refunded') {
          // never downgrade a settled (or already refunded) payment
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
    // `sessionStatus` is what separates "paid nothing yet" (still `open`) from
    // "instalment plan approved, money settling" (`complete` but `unpaid`, how
    // Klarna and Afterpay report until async_payment_succeeded arrives).
    return { settled: false, reason: 'not-paid', stripeStatus, sessionStatus: session?.status || 'unknown' };
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
    let reconcile = null;
    if (payment.status === 'Pending' && isStripeConfigured()) {
      reconcile = await reconcilePendingPayment(payment, req).catch((error) => {
        console.warn(`[Checkout Status] Reconcile skipped: ${error.message}`);
        return null;
      });
    }

    const fresh = await Payment.findById(payment._id);

    // Delayed-notification instalments: the student comes back from Klarna/Afterpay
    // while the money is still settling, so the screen can say "your instalment plan
    // is being confirmed" instead of a generic spinner that ends in a vague error.
    const settlementPending = Boolean(
      fresh.status === 'Pending'
        && reconcile?.sessionStatus === 'complete'
        && reconcile?.stripeStatus
        && reconcile.stripeStatus !== 'paid',
    );

    return res.status(200).json({
      success: true,
      status: fresh.status,
      paid: fresh.status === 'Paid',
      settlementPending,
      paymentMethod: fresh.paymentMethod || '',
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
      // A smoke test belongs to the admin, not to a student waiting for access.
      smokeTest: { $ne: true },
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

// @desc    Start one real, tiny live charge (refunded immediately) to prove the pipeline
// @route   POST /api/payments/smoke-test
// @access  Private (Admin, SETTINGS_EDIT)
const startSmokeTest = async (req, res) => {
  try {
    // 1. Explicit, typed confirmation. This endpoint moves real money, so a
    //    retried request or a curious curl must not be able to charge anyone.
    if (req.body?.confirm !== SMOKE_TEST_CONFIRMATION) {
      return res.status(400).json({
        success: false,
        code: 'CONFIRMATION_REQUIRED',
        message: 'This button charges a real card. Send the confirmation token to proceed.',
      });
    }

    if (!isStripeConfigured() || !isWebhookConfigured()) {
      return res.status(503).json({
        success: false,
        code: 'PAYMENTS_NOT_CONFIGURED',
        message:
          'Add both the secret key and the webhook signing secret first — a charge that cannot be verified is worse than no test.',
        payments: getPaymentStatus(),
      });
    }

    // 2. An abandoned checkout never blocks the next attempt: after its 30
    //    minute window it is closed out, exactly as the expiry webhook would.
    await Payment.updateMany(
      {
        smokeTest: true,
        status: 'Pending',
        createdAt: { $lt: new Date(Date.now() - SMOKE_TEST_CHECKOUT_WINDOW_MS) },
      },
      {
        $set: {
          status: 'Expired',
          failureReason: 'Checkout page was never completed (abandoned live smoke test).',
        },
      },
    );

    // 3. Never two live tests at once: an unresolved one may still hold money.
    const open = await Payment.findOne({
      smokeTest: true,
      $or: [
        { status: 'Paid' }, // charged, refund still outstanding
        {
          status: 'Pending',
          createdAt: { $gte: new Date(Date.now() - SMOKE_TEST_CHECKOUT_WINDOW_MS) },
        },
      ],
    }).sort({ createdAt: -1 });

    if (open) {
      return res.status(409).json({
        success: false,
        code: 'SMOKE_TEST_IN_PROGRESS',
        message:
          open.status === 'Paid'
            ? `The previous smoke test is charged but not refunded yet (invoice #${open.invoiceNumber}). Refund it before starting another.`
            : `A smoke test is already waiting for its card entry (invoice #${open.invoiceNumber}). Finish it, or let it expire, before starting another.`,
        smokeTestId: open._id,
        sessionUrl: open.checkoutSessionUrl || '',
      });
    }

    // 4. Cost guard: Stripe keeps its processing fee on a refunded charge, so a
    //    smoke test is real money out. A short cooldown plus a small daily cap
    //    keeps an accidental click-fest from burning the client's balance.
    const [last, todayCount] = await Promise.all([
      Payment.findOne({ smokeTest: true }).sort({ createdAt: -1 }).select('createdAt').lean(),
      Payment.countDocuments({
        smokeTest: true,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    if (last) {
      const sinceLast = Date.now() - new Date(last.createdAt).getTime();
      if (sinceLast < SMOKE_TEST_COOLDOWN_MS) {
        const waitMinutes = Math.max(1, Math.ceil((SMOKE_TEST_COOLDOWN_MS - sinceLast) / 60000));
        return res.status(429).json({
          success: false,
          code: 'SMOKE_TEST_COOLDOWN',
          message: `A smoke test was started a moment ago. Try again in about ${waitMinutes} minute(s).`,
        });
      }
    }

    if (todayCount >= SMOKE_TEST_DAILY_LIMIT) {
      return res.status(429).json({
        success: false,
        code: 'SMOKE_TEST_DAILY_LIMIT',
        message: `The daily limit of ${SMOKE_TEST_DAILY_LIMIT} smoke tests is reached. Each one is a real charge — try again tomorrow.`,
      });
    }

    // 5. The Payment row is what the webhook will settle. `course` is required
    //    by the schema, so it points at any existing program; the title and the
    //    invoice prefix make it unmistakable in every log and export.
    const course = await Course.findOne().sort({ createdAt: 1 }).select('_id title').lean();
    if (!course) {
      return res.status(400).json({
        success: false,
        code: 'NO_COURSE',
        message: 'Add at least one program before running a payment smoke test.',
      });
    }

    const currency = getCurrency().toUpperCase();
    const amount = SMOKE_TEST_AMOUNT_MINOR / 100;

    const payment = await Payment.create({
      // The admin is not a student, so no student account is linked; the email
      // records who ran the test and the title says what it is.
      studentName: `${req.user?.name || 'Admin'} (live smoke test)`,
      email: String(req.user?.email || '').toLowerCase(),
      phone: '',
      course: course._id,
      courseTitle: `Live smoke test — not a sale (${currency} ${amount.toFixed(2)})`,
      tier: 'full',
      amount,
      originalPrice: amount,
      discountAmount: 0,
      currency,
      status: 'Pending',
      transactionId: generateSmokeReference(),
      invoiceNumber: generateSmokeInvoiceNumber(),
      paymentMethod: 'Live smoke test (Stripe Checkout)',
      provider: 'stripe',
      smokeTest: true,
    });

    // 6. Hosted Stripe Checkout — identical PCI posture to a real order: the
    //    owner's card is typed on Stripe's page and never reaches this server.
    let session;
    try {
      session = await gateway.createSmokeTestSession({
        payment,
        amountMinor: SMOKE_TEST_AMOUNT_MINOR,
        currency,
        clientUrl: gateway.resolveClientUrl(req),
        adminName: req.user?.name || req.user?.email || 'Admin',
      });
    } catch (stripeError) {
      payment.status = 'Failed';
      payment.failureReason = `Smoke test session creation failed: ${stripeError.message}`;
      await payment.save();
      return res.status(502).json({
        success: false,
        code: 'SMOKE_TEST_SESSION_FAILED',
        message: `Stripe refused to open the test Checkout page: ${stripeError.message}`,
      });
    }

    payment.checkoutSessionId = session.id;
    payment.checkoutSessionUrl = session.url || '';
    await payment.save();

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'PAYMENT_SMOKE_TEST_STARTED',
      entity: 'Payment',
      entityId: payment._id.toString(),
      details: `Live smoke test started by ${req.user?.email || 'admin'} — a real ${currency} ${amount.toFixed(2)} charge on the live account, to be refunded as soon as Stripe confirms it. Session ${session.id}.`,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `Pay ${currency} ${amount.toFixed(2)} with a real card on the Stripe page that just opened — it is refunded the moment the charge is confirmed.`,
      smokeTest: {
        id: payment._id,
        invoiceNumber: payment.invoiceNumber,
        sessionId: session.id,
        sessionUrl: session.url || '',
        amount,
        currency,
        mode: getPaymentStatus().mode,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Progress of one live smoke test: charge → webhook → refund
// @route   GET /api/payments/smoke-test/:id
// @access  Private (Admin, SETTINGS_EDIT)
const getSmokeTestStatus = async (req, res) => {
  try {
    let payment = await Payment.findById(req.params.id);
    if (!payment || !payment.smokeTest) {
      return res.status(404).json({ success: false, message: 'Smoke test not found.' });
    }

    // A webhook can be seconds late — or lost entirely, which is one of the
    // things this test exists to reveal. Ask Stripe directly, through the same
    // guarded reconciliation the public success screen uses.
    if (payment.status === 'Pending' && payment.checkoutSessionId && isStripeConfigured()) {
      await reconcilePendingPayment(payment, req).catch((error) =>
        console.warn(`[Smoke Test] Reconcile skipped: ${error.message}`),
      );
      payment = await Payment.findById(payment._id);
    }

    const deliveries = await WebhookEvent.find({ payment: payment._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Which path settled the charge? A real Stripe event id is proof the signed
    // webhook was delivered; `reconcile:` means we had to recover the order
    // ourselves, so the webhook endpoint needs a look.
    const settledByWebhook = (payment.webhookEventIds || []).some(
      (id) => !String(id).startsWith('reconcile:'),
    );

    const steps = [
      { id: 'session', label: 'Stripe Checkout page created', done: Boolean(payment.checkoutSessionId) },
      { id: 'charge', label: 'Card charged on the account', done: Boolean(payment.paidAt) },
      { id: 'webhook', label: 'Signed webhook settled the charge', done: settledByWebhook },
      { id: 'refund', label: 'Charge refunded', done: Boolean(payment.refundId) },
    ];

    return res.status(200).json({
      success: true,
      smokeTest: {
        id: payment._id,
        invoiceNumber: payment.invoiceNumber,
        status: payment.status,
        currency: payment.currency,
        amount: payment.amount,
        mode: getPaymentStatus().mode,
        sessionId: payment.checkoutSessionId,
        sessionUrl: payment.checkoutSessionUrl,
        paymentIntentId: payment.stripePaymentIntentId,
        chargedAt: payment.paidAt || null,
        refundId: payment.refundId || '',
        refundAmount: payment.refundAmount ?? null,
        refundedAt: payment.refundedAt || null,
        needsRefund: payment.status === 'Paid' && !payment.refundId,
        failureReason: payment.failureReason || '',
        startedAt: payment.createdAt,
        settledByWebhook,
        webhookDeliveries: deliveries.map((row) => ({
          status: row.status,
          type: row.type,
          eventId: row.eventId,
          message: row.message,
          at: row.createdAt,
        })),
        steps,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Issue (or retry) the smoke test's refund
// @route   POST /api/payments/smoke-test/:id/refund
// @access  Private (Admin, SETTINGS_EDIT)
const refundSmokeTest = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment || !payment.smokeTest) {
      return res.status(404).json({ success: false, message: 'Smoke test not found.' });
    }
    if (!payment.paidAt || !payment.stripePaymentIntentId) {
      return res.status(400).json({
        success: false,
        code: 'NOT_CHARGED',
        message: 'This smoke test has no settled charge, so there is nothing to refund.',
      });
    }

    const outcome = await refundSmokeTestPayment(payment, {
      actorName: `${req.user?.name || 'Admin'} (${req.user?.email || 'admin'})`,
    });
    const fresh = await Payment.findById(payment._id);

    if (outcome.reason === 'already-refunded') {
      return res.status(200).json({
        success: true,
        refunded: true,
        alreadyRefunded: true,
        message: `Invoice #${fresh.invoiceNumber} was already refunded (refund ${fresh.refundId}).`,
        smokeTestId: fresh._id,
      });
    }

    if (!outcome.refunded) {
      return res.status(502).json({
        success: false,
        code: 'REFUND_FAILED',
        message: `Stripe could not refund this charge yet (${outcome.error || outcome.reason}). The money is still on the card — try again in a moment.`,
      });
    }

    return res.status(200).json({
      success: true,
      refunded: true,
      message: `Refund issued — ${fresh.currency} ${fresh.refundAmount} is on its way back to the card (refund ${fresh.refundId}).`,
      smokeTestId: fresh._id,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Smoke-test watchdog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tell the owner, once, that a smoke-test charge had to be recovered because no
 * signed webhook arrived.
 *
 * The money is already back on the card by the time this runs, so the alert is
 * about the endpoint, not the charge: a webhook that quietly stopped being
 * delivered would otherwise stay invisible until a real student paid and got no
 * access. A repeating alert would only train everyone to ignore it.
 */
const notifyMissingWebhook = async (payment, { stripeStatus } = {}) => {
  if (!payment || payment.watchdogNotifiedAt) return false;

  await Payment.updateOne({ _id: payment._id }, { $set: { watchdogNotifiedAt: new Date() } });
  payment.watchdogNotifiedAt = new Date();

  await AuditLog.create({
    actorName: 'Smoke test watchdog',
    actorRole: 'ADMIN',
    action: 'PAYMENT_SMOKE_TEST_WEBHOOK_MISSING',
    entity: 'Payment',
    entityId: payment._id.toString(),
    details: `No signed webhook arrived for smoke test invoice #${payment.invoiceNumber}; the charge was recovered from Stripe (${stripeStatus || 'paid'}) and refunded. Check the webhook endpoint in Stripe.`,
  }).catch(() => {});

  // A missing delivery is exactly what the Webhook health panel must not hide,
  // so it is recorded as a failure with the reason spelled out.
  await recordWebhookEvent({
    status: 'failed',
    httpStatus: 200,
    type: '(smoke-test watchdog)',
    message: `No signed webhook arrived for smoke test invoice #${payment.invoiceNumber}. The charge was recovered from Stripe and refunded — check this endpoint's recent deliveries in Stripe.`,
    payment,
    sessionId: payment.checkoutSessionId,
    amount: payment.amount,
  }).catch(() => {});

  // Fire-and-forget: the refund has already happened, so a mail failure must
  // never make the watchdog look broken.
  emailService
    .sendSmokeTestWatchdogAlert({
      payment: typeof payment.toObject === 'function' ? payment.toObject() : payment,
      stripeStatus,
    })
    .catch((error) => console.error(`[Smoke Test Watchdog] alert email failed: ${error.message}`));

  return true;
};

/**
 * Did the money actually move — and if it did, was it put back?
 *
 * A smoke test is refunded the instant Stripe's webhook settles it, which needs
 * two things to hold: the webhook must arrive, and the refund call must succeed.
 * Both can fail transiently, and either failure leaves a real charge on the card
 * with nobody watching, because the retry lived only in the admin panel.
 *
 * This pass closes both holes from the server, with no browser involved:
 *
 *   · Pending, but Stripe says paid  → the webhook never arrived: settle through
 *     the same reconciliation the admin's Re-check uses (which refunds it in the
 *     same breath) and alert the owner by email.
 *   · Paid, refund outstanding       → retry the refund, idempotently.
 *   · Pending long past its checkout window, Stripe says unpaid → close it out.
 *
 * Only rows flagged `smokeTest` are ever considered: a real order is never
 * auto-enrolled here, because granting a student access stays a human decision.
 */
const recoverStrandedSmokeTests = async ({ now = Date.now() } = {}) => {
  const summary = { checked: 0, recovered: 0, refunded: 0, expired: 0, alerts: 0, errors: 0 };

  if (!isStripeConfigured()) return { ...summary, skipped: 'gateway-off' };

  const rows = await Payment.find({
    smokeTest: true,
    $or: [
      // Charged, but the money was never put back.
      { status: 'Paid', refundId: '' },
      // Waiting for a webhook that may never come.
      {
        status: 'Pending',
        checkoutSessionId: { $ne: '' },
        createdAt: { $lt: new Date(now - SMOKE_TEST_WATCHDOG_GRACE_MS) },
      },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(SMOKE_TEST_WATCHDOG_BATCH);

  for (const payment of rows) {
    summary.checked += 1;
    try {
      if (payment.status === 'Paid') {
        // Only the refund is outstanding. `refundSmokeTestPayment` short-circuits
        // on a stored refund id and carries an idempotency key, so racing the
        // webhook's own attempt can never refund twice.
        const outcome = await refundSmokeTestPayment(payment, {
          actorName: 'Smoke test watchdog (automatic refund retry)',
        });
        if (outcome.refunded) {
          summary.refunded += 1;
          await recordWebhookEvent({
            status: 'processed',
            httpStatus: 200,
            type: '(smoke-test watchdog)',
            message: `Refund retried and issued for smoke test invoice #${payment.invoiceNumber}${payment.refundId ? ` (refund ${payment.refundId})` : ''}.`,
            payment,
            sessionId: payment.checkoutSessionId,
            amount: payment.amount,
          }).catch(() => {});
        }
        continue;
      }

      // Still Pending: ask Stripe what really happened, through the same guarded
      // reconciliation the public success screen and the admin Re-check share.
      const outcome = await reconcilePendingPayment(payment, { headers: {} });
      if (outcome.settled) {
        const fresh = await Payment.findById(payment._id);
        summary.recovered += 1;
        // Settling a smoke test refunds it in the same breath, so the money is
        // already back unless that refund call itself failed (retried next pass).
        if (fresh?.refundId) summary.refunded += 1;
        if (await notifyMissingWebhook(fresh, { stripeStatus: outcome.stripeStatus })) summary.alerts += 1;
        continue;
      }

      // Never paid and well past the checkout window: close it out, so it cannot
      // sit on the admin's list forever.
      if (now - new Date(payment.createdAt).getTime() > SMOKE_TEST_WATCHDOG_EXPIRE_MS) {
        await Payment.updateOne(
          { _id: payment._id, status: 'Pending' },
          {
            $set: {
              status: 'Expired',
              failureReason: 'Checkout page was never completed (closed out by the smoke-test watchdog).',
            },
          },
        );
        summary.expired += 1;
      }
    } catch (error) {
      summary.errors += 1;
      console.error(`[Smoke Test Watchdog] invoice ${payment.invoiceNumber}: ${error.message}`);
    }
  }

  return summary;
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private (Admin)
const getAllPayments = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    // Smoke tests are real charges but not sales: they stay out of the ledger
    // and the revenue total unless an admin explicitly asks for them.
    const includeSmokeTests = req.query.includeSmokeTests === 'true';
    if (!includeSmokeTests) query.smokeTest = { $ne: true };
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
      (acc, curr) => (curr.status === 'Paid' && !curr.smokeTest ? acc + curr.amount : acc),
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
  startSmokeTest,
  getSmokeTestStatus,
  refundSmokeTest,
  recoverStrandedSmokeTests,
  __test__: {
    recordWebhookEvent,
    reconcilePendingPayment,
    refundSmokeTestPayment,
    WEBHOOK_EVENT_RETENTION,
    SMOKE_TEST_AMOUNT_MINOR,
    SMOKE_TEST_CONFIRMATION,
    SMOKE_TEST_COOLDOWN_MS,
    SMOKE_TEST_DAILY_LIMIT,
    SMOKE_TEST_CHECKOUT_WINDOW_MS,
    SMOKE_TEST_WATCHDOG_GRACE_MS,
    SMOKE_TEST_WATCHDOG_EXPIRE_MS,
    SMOKE_TEST_WATCHDOG_BATCH,
  },
};
