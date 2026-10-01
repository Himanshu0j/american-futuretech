/**
 * Payments verification suite.
 *
 *   node scripts/verify-payments.js
 *
 * Level 1  pure pricing/coupon/temp-password logic (no DB, no network)
 * Level 2  Stripe webhook signature enforcement (local HMAC, no network)
 * Level 3  full settlement through the webhook handler against a throwaway
 *          local MongoDB database (dropped at the end), including the admin's
 *          live smoke test: fixed amount, typed confirmation, cost guards,
 *          settle-then-refund with an idempotent refund, and the guarantee
 *          that a smoke charge never creates a student or counts as revenue
 * Level 4  admin-panel setup contract (key/mode alignment, webhook checklist,
 *          smoke-test route gating and cost rails)
 *
 * Any real Stripe keys already present in server/.env are ignored — the script
 * forces test-only dummy credentials so it can never touch live money.
 */

const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Server dependencies live in server/node_modules — make them resolvable from
// this root-level script without duplicating the packages.
module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

process.env.STRIPE_SECRET_KEY = 'sk_test_verification_only_000000000000';
process.env.STRIPE_WEBHOOK_SECRET = `whsec_${crypto.randomBytes(16).toString('hex')}`;
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.NOTIFICATION_EMAIL = 'verify@example.com';
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;

const TEST_DB = `mongodb://127.0.0.1:27018/aft_paytest_${Date.now()}`;

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const section = (title) => console.log(`\n${title}`);

const run = async () => {
  // ───────────────────────────────────────────────────────────────────────
  section('LEVEL 1 · Pricing, vouchers and temporary passwords');
  const { buildQuote, applyCoupon, generateTempPassword } = require(path.join(__dirname, '..', 'server', 'utils', 'pricing'));

  const course = {
    _id: 'course1',
    title: 'Data Science & AI',
    slug: 'data-science-ai',
    duration: '6 Months',
    pricing: { basePrice: 2499, discountedPrice: 1899 },
  };
  const settings = {
    depositPriceUSD: 99,
    personalizedLearning: { price: 5499, originalPrice: 6999 },
  };

  const deposit = buildQuote({ course, tier: 'deposit', settings });
  check('Deposit tier charges the admin deposit price', deposit.amount === 99, `got ${deposit.amount}`);
  check('Deposit tier reports its label', deposit.label.includes('Deposit'));

  const full = buildQuote({ course, tier: 'full', settings });
  check('Full tuition uses the course discounted price', full.amount === 1899, `got ${full.amount}`);
  check('Full tuition keeps the list price as anchor', full.originalPrice === 2499, `got ${full.originalPrice}`);

  const personalized = buildQuote({ course, tier: 'personalized', settings });
  check('Personalized track uses its own independent fee', personalized.amount === 5499, `got ${personalized.amount}`);

  const unknownTier = buildQuote({ course, tier: 'hacker-tier', settings });
  check('Unknown tier safely falls back to deposit', unknownTier.amount === 99, `got ${unknownTier.amount}`);

  const percent = applyCoupon(1899, 'FUTURETECH10');
  check('10% voucher applies the right discount', percent.discountAmount === 190 && percent.amount === 1709,
    `discount ${percent.discountAmount}, total ${percent.amount}`);

  const fixed = applyCoupon(99, 'AI2026');
  check('$50 voucher applies fully when the balance allows it', fixed.amount === 49 && fixed.discountAmount === 50,
    `total ${fixed.amount}, discount ${fixed.discountAmount}`);

  const floored = applyCoupon(55, 'TECH50');
  check('Discount is capped so the charge never drops under the floor', floored.amount === 10 && floored.discountAmount === 45,
    `total ${floored.amount}, discount ${floored.discountAmount}`);

  const bogus = applyCoupon(1899, 'NOTACODE');
  check('Unknown voucher is ignored (no crash, no discount)', bogus.amount === 1899 && bogus.discountAmount === 0);

  const forged = buildQuote({ course, tier: 'full', couponCode: 'FUTURETECH10', settings });
  check('Quote = base minus voucher, computed server-side', forged.amount === 1709, `got ${forged.amount}`);

  const passwords = new Set();
  let passwordShapeOk = true;
  for (let i = 0; i < 500; i += 1) {
    const pw = generateTempPassword();
    passwords.add(pw);
    if (!(pw.length >= 10 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw))) {
      passwordShapeOk = false;
    }
  }
  check('Temporary passwords meet the strength shape', passwordShapeOk);
  check('Temporary passwords are unique across 500 runs', passwords.size === 500, `${passwords.size} unique`);
  check('Temporary password is never the old shared default', ![...passwords].includes('Password@123'));

  // ───────────────────────────────────────────────────────────────────────
  section('LEVEL 2 · Stripe webhook signature enforcement');
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const gateway = require(path.join(__dirname, '..', 'server', 'utils', 'paymentGateway'));

  const samplePayload = JSON.stringify({ id: 'evt_sample', type: 'checkout.session.completed' });

  let rejectedUnsigned = false;
  try {
    gateway.verifyWebhookSignature(Buffer.from(samplePayload), undefined);
  } catch (error) {
    rejectedUnsigned = true;
  }
  check('Missing signature is rejected', rejectedUnsigned);

  let rejectedForged = false;
  try {
    gateway.verifyWebhookSignature(
      Buffer.from(samplePayload),
      stripe.webhooks.generateTestHeaderString({ payload: samplePayload, secret: 'whsec_wrong_secret' }),
    );
  } catch (error) {
    rejectedForged = true;
  }
  check('Signature from a different secret is rejected', rejectedForged);

  let tamperedRejected = false;
  try {
    const validHeader = stripe.webhooks.generateTestHeaderString({
      payload: samplePayload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
    gateway.verifyWebhookSignature(Buffer.from(samplePayload.replace('evt_sample', 'evt_tampered')), validHeader);
  } catch (error) {
    tamperedRejected = true;
  }
  check('Tampered payload fails verification', tamperedRejected);

  const validEvent = gateway.verifyWebhookSignature(
    Buffer.from(samplePayload),
    stripe.webhooks.generateTestHeaderString({ payload: samplePayload, secret: process.env.STRIPE_WEBHOOK_SECRET }),
  );
  check('Correctly signed payload is accepted', validEvent.id === 'evt_sample');

  // ───────────────────────────────────────────────────────────────────────
  section('LEVEL 3 · End-to-end settlement (throwaway local database)');
  await mongoose.connect(TEST_DB, { serverSelectionTimeoutMS: 6000 });
  check('Connected to throwaway database', mongoose.connection.readyState === 1, TEST_DB.split('/').pop());

  const Course = require(path.join(__dirname, '..', 'server', 'models', 'Course'));
  const Payment = require(path.join(__dirname, '..', 'server', 'models', 'Payment'));
  const WebhookEvent = require(path.join(__dirname, '..', 'server', 'models', 'WebhookEvent'));
  const User = require(path.join(__dirname, '..', 'server', 'models', 'User'));
  const Enrollment = require(path.join(__dirname, '..', 'server', 'models', 'Enrollment'));
  const Progress = require(path.join(__dirname, '..', 'server', 'models', 'Progress'));
  const controller = require(path.join(__dirname, '..', 'server', 'controllers', 'paymentController'));

  const dbCourse = await Course.create({
    title: 'Cyber Security Fellowship',
    slug: `cyber-verify-${Date.now()}`,
    pricing: { basePrice: 2499, discountedPrice: 1899 },
  });

  const makePendingPayment = (overrides = {}) =>
    Payment.create({
      studentName: 'Verification Student',
      email: `verify.${Date.now()}.${Math.floor(Math.random() * 1e5)}@example.com`,
      phone: '+1 555 0100',
      course: dbCourse._id,
      courseTitle: dbCourse.title,
      tier: 'full',
      amount: 1899,
      originalPrice: 2499,
      currency: 'USD',
      status: 'Pending',
      transactionId: `PEND-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
      invoiceNumber: `INV-TEST-${Math.floor(Math.random() * 1e6)}`,
      checkoutSessionId: `cs_test_${crypto.randomBytes(6).toString('hex')}`,
      ...overrides,
    });

  const deliverWebhook = async (payload, secret = process.env.STRIPE_WEBHOOK_SECRET) => {
    const raw = JSON.stringify(payload);
    const signature = new Stripe(process.env.STRIPE_SECRET_KEY).webhooks.generateTestHeaderString({
      payload: raw,
      secret,
    });
    const captured = { statusCode: 200, body: null };
    const res = {
      status(code) { captured.statusCode = code; return this; },
      json(body) { captured.body = body; return this; },
    };
    const req = { rawBody: Buffer.from(raw), headers: { 'stripe-signature': signature, origin: 'http://localhost:5173' } };
    await controller.handleStripeWebhook(req, res);
    return captured;
  };

  /** Call an admin controller directly and capture what it answered. */
  const callController = async (fn, { params = {}, body = {}, query = {}, user = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', role: 'ADMIN', name: 'Verify Admin', email: 'verify-admin@example.com' } } = {}) => {
    const captured = { statusCode: 200, body: null };
    const res = {
      status(code) { captured.statusCode = code; return this; },
      json(body) { captured.body = body; return this; },
    };
    await fn({ params, body, user, query, headers: {} }, res);
    return captured;
  };

  const pending = await makePendingPayment();
  const paidEvent = {
    id: `evt_paid_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: pending.checkoutSessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        payment_intent: 'pi_verification_0001',
        payment_method_types: ['card'],
        amount_total: 189900,
        metadata: { paymentId: String(pending._id), courseId: String(dbCourse._id), tier: 'full' },
      },
    },
  };

  const firstDelivery = await deliverWebhook(paidEvent);
  check('Signed webhook is acknowledged with 200', firstDelivery.statusCode === 200 && firstDelivery.body?.received === true);

  const settled = await Payment.findById(pending._id);
  check('Payment is marked Paid only via the webhook', settled.status === 'Paid');
  check('Settlement stores the Stripe payment intent id', settled.stripePaymentIntentId === 'pi_verification_0001');
  check('Settlement records a paid timestamp', Boolean(settled.paidAt));
  check('Charged amount comes from Stripe (cents → dollars)', settled.amount === 1899, `got ${settled.amount}`);

  const student = await User.findOne({ email: pending.email }).select('+password');
  check('Student account is created on settlement', Boolean(student));
  const defaultStillWorks = student ? await bcrypt.compare('Password@123', student.password) : true;
  check('Old shared default password no longer grants access', defaultStillWorks === false);
  const enrollment = await Enrollment.findOne({ student: student?._id, course: dbCourse._id });
  check('Enrollment is created after settlement', Boolean(enrollment) && enrollment.status === 'Active');
  const progress = await Progress.findOne({ student: student?._id, course: dbCourse._id });
  check('Progress record is initialized', Boolean(progress) && progress.progressPercent === 0);
  // The receipt must belong to the account, otherwise the buyer's own
  // "My Payments" page (and the admin's student column) stays empty forever.
  check(
    'Settlement links the receipt to the student account',
    String(settled.student || '') === String(student?._id),
    `payment.student=${settled.student || 'unset'}`,
  );
  const ownReceipts = await Payment.find({ email: pending.email });
  check('Receipt is reachable from the buyer email', ownReceipts.length === 1, `${ownReceipts.length} receipts`);

  // Retried delivery of the exact same event
  const replay = await deliverWebhook(paidEvent);
  const replayUsers = await User.countDocuments({ email: pending.email });
  const replayEnrollments = await Enrollment.countDocuments({ student: student?._id, course: dbCourse._id });
  check('Replayed event is still acknowledged', replay.statusCode === 200);
  check('Replayed event cannot double-enroll the student', replayUsers === 1 && replayEnrollments === 1,
    `users ${replayUsers}, enrollments ${replayEnrollments}`);

  // A second, distinct event for an already-settled payment
  await deliverWebhook({ ...paidEvent, id: `${paidEvent.id}_second` });
  const afterSecond = await Enrollment.countDocuments({ student: student?._id, course: dbCourse._id });
  check('A later duplicate event leaves exactly one enrollment', afterSecond === 1, `${afterSecond} enrollments`);

  // Expiry must never claw back a settled payment
  await deliverWebhook({ ...paidEvent, id: `${paidEvent.id}_expired`, type: 'checkout.session.expired' });
  const stillPaid = await Payment.findById(pending._id);
  check('A late expiry event cannot downgrade a paid enrollment', stillPaid.status === 'Paid');

  // A genuinely failed attempt
  const failedPending = await makePendingPayment({ tier: 'deposit', amount: 99 });
  await deliverWebhook({
    id: `evt_failed_${Date.now()}`,
    type: 'checkout.session.async_payment_failed',
    data: {
      object: {
        id: failedPending.checkoutSessionId,
        object: 'checkout.session',
        last_payment_error: { message: 'Your card was declined.' },
        metadata: { paymentId: String(failedPending._id) },
      },
    },
  });
  const failed = await Payment.findById(failedPending._id);
  check('Failed payment is recorded as Failed with a reason', failed.status === 'Failed' && failed.failureReason.length > 0,
    failed.failureReason);
  const failedUser = await User.findOne({ email: failedPending.email });
  check('Failed payment grants no student account', failedUser === null);

  // ── Webhook delivery log (the admin's webhook health panel reads this) ───
  await new Promise((resolve) => setTimeout(resolve, 150)); // writes are fire-and-forget

  const settledLog = await WebhookEvent.findOne({ status: 'processed', payment: pending._id }).lean();
  check('A settled delivery is logged against the payment',
    Boolean(settledLog) && settledLog.invoiceNumber === settled.invoiceNumber,
    settledLog ? `invoice ${settledLog.invoiceNumber}` : 'no processed row');
  check('The delivery log keeps the event id and type',
    Boolean(settledLog?.eventId) && settledLog?.type === 'checkout.session.completed',
    `${settledLog?.type} / ${settledLog?.eventId}`);
  check('The delivery log records how long the handler took',
    typeof settledLog?.durationMs === 'number' && settledLog.durationMs >= 0,
    `${settledLog?.durationMs}ms`);

  const duplicateLog = await WebhookEvent.countDocuments({ status: 'duplicate' });
  check('Stripe retries are logged as duplicates, not as second payments', duplicateLog >= 1, `${duplicateLog} duplicate row(s)`);

  const failedLog = await WebhookEvent.findOne({ status: 'processed', invoiceNumber: failedPending.invoiceNumber }).lean();
  check('A declined payment is logged with its reason',
    Boolean(failedLog?.message) && /declined/i.test(failedLog.message), failedLog?.message);

  // ── Admin re-check ("this student paid but has no access") ──────────────
  const reconcileGuards = [];
  const freshPending = await makePendingPayment({ checkoutSessionId: '' });
  const noSession = await callController(controller.reconcilePayment, { params: { id: String(freshPending._id) } });
  reconcileGuards.push(['no Stripe session → 400 NO_SESSION', noSession.statusCode === 400 && noSession.body?.code === 'NO_SESSION']);

  const alreadyPaid = await callController(controller.reconcilePayment, { params: { id: String(pending._id) } });
  reconcileGuards.push(['an already settled order reports it instead of re-running',
    alreadyPaid.statusCode === 200 && alreadyPaid.body?.alreadySettled === true]);

  const missing = await callController(controller.reconcilePayment, { params: { id: '000000000000000000000000' } });
  reconcileGuards.push(['an unknown payment id is a clean 404', missing.statusCode === 404]);

  for (const [name, passed] of reconcileGuards) check(`Re-check guard: ${name}`, passed);
  check('A re-check never grants access without a paid Stripe session',
    (await Payment.findById(freshPending._id)).status === 'Pending');
  check('The reconciliation helper is shared with the public success screen',
    typeof controller.__test__?.reconcilePendingPayment === 'function');
  check('The delivery log is bounded by a retention limit',
    controller.__test__?.WEBHOOK_EVENT_RETENTION === 500, String(controller.__test__?.WEBHOOK_EVENT_RETENTION));

  // Forged signature must never settle anything
  const untouched = await makePendingPayment();
  const forgedDelivery = await deliverWebhook(
    {
      id: `evt_forged_${Date.now()}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: untouched.checkoutSessionId,
          payment_status: 'paid',
          payment_intent: 'pi_forged',
          amount_total: 100,
          metadata: { paymentId: String(untouched._id) },
        },
      },
    },
    'whsec_attacker_guess',
  );
  const untouchedAfter = await Payment.findById(untouched._id);
  check('Forged webhook is rejected with 400', forgedDelivery.statusCode === 400);
  check('Forged webhook leaves the payment Pending', untouchedAfter.status === 'Pending');

  // ── What the admin's webhook health panel will actually show ────────────
  await new Promise((resolve) => setTimeout(resolve, 200)); // writes are fire-and-forget
  const rejectedLog = await WebhookEvent.findOne({ status: 'rejected', signatureValid: false }).lean();
  check('A forged signature is logged as a rejected attempt', Boolean(rejectedLog), rejectedLog?.message?.slice(0, 60));
  check('...and it is recorded as HTTP 400 with no payment attached',
    rejectedLog?.httpStatus === 400 && !rejectedLog?.payment, `http=${rejectedLog?.httpStatus}`);
  check('A rejected row never stores the raw payload',
    !/whsec_|sk_(test|live)_/.test(JSON.stringify(rejectedLog || {})), 'only routing facts are kept');

  // A verifiable event for a session we never created
  await deliverWebhook({
    id: `evt_unmatched_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_never_created',
        payment_status: 'paid',
        payment_intent: 'pi_ghost',
        amount_total: 500,
        metadata: { paymentId: '000000000000000000000000' },
      },
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 200));
  const unmatchedLog = await WebhookEvent.findOne({ status: 'unmatched' }).lean();
  check('An event that matches no order is logged as unmatched', Boolean(unmatchedLog), unmatchedLog?.message);

  const health = await callController(controller.getWebhookHealth, { params: {}, query: {} });
  check('Admin webhook health answers with the delivery log',
    health.statusCode === 200 && Array.isArray(health.body?.events) && health.body.events.length > 0,
    `${health.body?.events?.length} event(s)`);
  check('...with a summary the panel can render',
    typeof health.body?.summary?.counts === 'object' && health.body.summary.lastEventAt != null,
    JSON.stringify(health.body?.summary?.counts || {}));
  check('...and it surfaces failed/rejected deliveries for follow-up',
    health.body?.summary?.failedDeliveries === 0 && health.body?.summary?.rejectedAttempts >= 1,
    `failed=${health.body?.summary?.failedDeliveries} rejected=${health.body?.summary?.rejectedAttempts}`);
  check('The health payload carries no secret material',
    !/sk_(test|live)_|whsec_[A-Za-z0-9]{6,}/.test(JSON.stringify(health.body)), 'routing facts only');
  // A Pending order older than the window must surface as "stuck" — that list is
  // the admin's recovery path, so it cannot silently stay empty. `createdAt` is
  // immutable through Mongoose, so backdate it on the raw collection.
  const stuckFixture = await makePendingPayment();
  await Payment.collection.updateOne(
    { _id: stuckFixture._id },
    { $set: { createdAt: new Date(Date.now() - 45 * 60 * 1000) } },
  );
  const healthWithStuck = await callController(controller.getWebhookHealth, { params: {}, query: {} });
  const stuckIds = (healthWithStuck.body?.stuck || []).map((row) => String(row._id));
  check('An old Pending order shows up as stuck for the admin to re-check',
    stuckIds.includes(String(stuckFixture._id)), `${stuckIds.length} stale pending order(s)`);
  check('A freshly created Pending order is NOT flagged as stuck',
    !stuckIds.includes(String(freshPending._id)), 'only orders older than 30 minutes');

  // ── Admin live smoke test: one real charge, refunded immediately ─────────
  // Everything below runs with the Stripe calls stubbed, because the suite must
  // never be able to touch real money. What is verified is our own contract:
  // fixed amount, typed confirmation, cost guards, settle-then-refund, and the
  // promise that a smoke charge never creates a student or counts as revenue.
  const gatewayUtil = require(path.join(__dirname, '..', 'server', 'utils', 'paymentGateway'));
  const AuditLog = require(path.join(__dirname, '..', 'server', 'models', 'AuditLog'));
  const smokeTest = controller.__test__;
  const SMOKE_CONFIRM = smokeTest.SMOKE_TEST_CONFIRMATION;

  const smokeGuards = [];

  // A stray request (a retry, a curious curl) must never charge a card.
  const unconfirmed = await callController(controller.startSmokeTest, { body: {} });
  smokeGuards.push([
    'no typed confirmation → the charge cannot start',
    unconfirmed.statusCode === 400 && unconfirmed.body?.code === 'CONFIRMATION_REQUIRED',
  ]);

  // A charge that cannot be signature-verified is worse than no test at all.
  const secretBefore = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = '';
  const noWebhook = await callController(controller.startSmokeTest, { body: { confirm: SMOKE_CONFIRM } });
  process.env.STRIPE_WEBHOOK_SECRET = secretBefore;
  smokeGuards.push([
    'without a webhook secret nothing is charged',
    noWebhook.statusCode === 503 && noWebhook.body?.code === 'PAYMENTS_NOT_CONFIGURED',
  ]);

  // Refund-helper guards. Each one must return BEFORE any Stripe call.
  const notSmokePayment = await smokeTest.refundSmokeTestPayment({ smokeTest: false });
  const uncharged = await smokeTest.refundSmokeTestPayment({ smokeTest: true, stripePaymentIntentId: '' });
  const refundedTwice = await smokeTest.refundSmokeTestPayment({
    smokeTest: true,
    stripePaymentIntentId: 'pi_smoke_x',
    refundId: 're_done',
  });
  smokeGuards.push(['an ordinary order can never be refunded through this path',
    notSmokePayment.refunded === false && notSmokePayment.reason === 'not-a-smoke-test']);
  smokeGuards.push(['refunding before the charge settles is refused',
    uncharged.refunded === false && uncharged.reason === 'no-charge-yet']);
  smokeGuards.push(['an already refunded charge is never refunded again',
    refundedTwice.refunded === true && refundedTwice.reason === 'already-refunded']);
  for (const [name, passed] of smokeGuards) check(`Smoke test guard: ${name}`, passed);

  // Start a run with session creation stubbed (this suite never hits Stripe).
  const refundCalls = [];
  const originalCreateSmokeSession = gatewayUtil.createSmokeTestSession;
  const originalRefundIntent = gatewayUtil.refundPaymentIntent;
  gatewayUtil.createSmokeTestSession = async ({ payment }) => ({
    id: `cs_test_smoke_${Date.now()}`,
    url: `https://checkout.stripe.com/c/pay/${payment._id}`,
  });
  // First let the refund fail, so we can prove an outstanding charge is tracked
  // and the panel is told to retry — the one failure mode that costs money.
  gatewayUtil.refundPaymentIntent = async () => {
    throw new Error('Refund API temporarily unavailable');
  };

  const started = await callController(controller.startSmokeTest, {
    body: { confirm: SMOKE_CONFIRM, amount: 999999, currency: 'EUR' },
  });
  const smokeRow = await Payment.findById(started.body?.smokeTest?.id);
  check('Smoke test opens a real Checkout session with the server-fixed amount',
    started.statusCode === 200 && smokeRow?.amount === 1 && smokeRow?.smokeTest === true,
    `amount ${smokeRow?.amount}`);
  check('A forged amount or currency in the body is ignored',
    smokeRow?.amount === 1 && smokeRow?.currency === 'USD', `${smokeRow?.currency} ${smokeRow?.amount}`);
  check('The charge is capped at one unit of the gateway currency on the server',
    smokeTest.SMOKE_TEST_AMOUNT_MINOR === 100, `${smokeTest.SMOKE_TEST_AMOUNT_MINOR} minor units`);
  check('Starting a run is written to the audit trail',
    Boolean(await AuditLog.findOne({ action: 'PAYMENT_SMOKE_TEST_STARTED', entityId: String(smokeRow._id) })));

  // Money may still be in flight: a second live test must not start.
  const secondStart = await callController(controller.startSmokeTest, { body: { confirm: SMOKE_CONFIRM } });
  check('A second run is refused while the first one is unresolved',
    secondStart.statusCode === 409 && secondStart.body?.code === 'SMOKE_TEST_IN_PROGRESS');
  check('The refused run creates no extra payment row',
    (await Payment.countDocuments({ smokeTest: true })) === 1);

  // A stale smoke session must never be mistaken for a student's stuck order.
  await Payment.collection.updateOne(
    { _id: smokeRow._id },
    { $set: { createdAt: new Date(Date.now() - 45 * 60 * 1000) } },
  );
  const healthWithSmoke = await callController(controller.getWebhookHealth, { params: {}, query: {} });
  check('A smoke test never appears in the stuck-order list',
    !(healthWithSmoke.body?.stuck || []).some((row) => String(row._id) === String(smokeRow._id)));

  // Settle it through the production webhook path, exactly like a real order.
  await deliverWebhook({
    id: `evt_smoke_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: smokeRow.checkoutSessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        payment_intent: 'pi_smoke_verify_0001',
        payment_method_types: ['card'],
        amount_total: 100,
        metadata: { paymentId: String(smokeRow._id), smokeTest: 'true' },
      },
    },
  });
  const smokeSettled = await Payment.findById(smokeRow._id);
  check('Smoke charge is settled by the signed webhook like a real order',
    smokeSettled.status === 'Paid' && smokeSettled.stripePaymentIntentId === 'pi_smoke_verify_0001');
  check('A smoke charge never creates a student account',
    (await User.countDocuments({ email: smokeRow.email })) === 0);
  check('A smoke charge never creates an enrollment',
    (await Enrollment.countDocuments({ payment: smokeRow._id })) === 0);
  check('A failed refund leaves the charge visible as outstanding',
    smokeSettled.refundId === ''
      && Boolean(await AuditLog.findOne({ action: 'PAYMENT_SMOKE_TEST_REFUND_FAILED' })),
    `refundId "${smokeSettled.refundId}"`);

  const ledger = await callController(controller.getAllPayments, { params: {}, query: {} });
  const ledgerWithSmoke = await callController(controller.getAllPayments, {
    params: {},
    query: { includeSmokeTests: 'true' },
  });
  const listedIds = (ledger.body?.payments || []).map((row) => String(row._id));
  const listedWithSmoke = (ledgerWithSmoke.body?.payments || []).map((row) => String(row._id));
  check('A smoke test is hidden from the admin ledger',
    !listedIds.includes(String(smokeRow._id)), `${listedIds.length} ledger row(s)`);
  check('...but an admin can ask for it explicitly',
    listedWithSmoke.includes(String(smokeRow._id)));
  check('...and its charge is never counted as revenue',
    ledgerWithSmoke.body?.totalRevenue === ledger.body?.totalRevenue,
    `revenue ${ledgerWithSmoke.body?.totalRevenue} vs ${ledger.body?.totalRevenue}`);

  const smokeStatus = await callController(controller.getSmokeTestStatus, { params: { id: String(smokeRow._id) } });
  check('The status endpoint reports what actually happened',
    smokeStatus.statusCode === 200
      && smokeStatus.body?.smokeTest?.chargedAt
      && smokeStatus.body?.smokeTest?.refundId === ''
      && smokeStatus.body?.smokeTest?.needsRefund === true);
  check('The status endpoint proves the signed webhook settled the charge',
    smokeStatus.body?.smokeTest?.settledByWebhook === true,
    JSON.stringify((smokeStatus.body?.smokeTest?.webhookDeliveries || []).map((row) => row.status)));
  check('...and it never leaks key material',
    !/sk_(test|live)_|whsec_[A-Za-z0-9]{6,}/.test(JSON.stringify(smokeStatus.body)), 'routing facts only');

  // A charge recovered by the re-check path (webhook never arrived) must be
  // reported as such, so a broken endpoint is visible instead of a silent pass.
  const recoveredSmoke = await Payment.create({
    studentName: 'Verify Admin (live smoke test)',
    email: `smoke.recovered.${Date.now()}@example.com`,
    course: dbCourse._id,
    courseTitle: 'Live smoke test — not a sale (USD 1.00)',
    tier: 'full',
    amount: 1,
    currency: 'USD',
    status: 'Paid',
    transactionId: `SMOKE-${Date.now()}-7777`,
    invoiceNumber: `SMOKE-TEST-${Math.floor(Math.random() * 1e6)}`,
    paymentMethod: 'Live smoke test (Stripe Checkout)',
    provider: 'stripe',
    smokeTest: true,
    paidAt: new Date(),
    stripePaymentIntentId: 'pi_smoke_recovered',
    webhookEventIds: ['reconcile:cs_smoke_recovered'],
  });
  const recoveredStatus = await callController(controller.getSmokeTestStatus, {
    params: { id: String(recoveredSmoke._id) },
  });
  check('A charge recovered without a webhook is reported as webhook-missing',
    recoveredStatus.body?.smokeTest?.settledByWebhook === false
      && recoveredStatus.body?.smokeTest?.needsRefund === true);
  // Close this fixture out so the unresolved-charge lock is not tripped by it,
  // and age it past the cooldown so the cost-rail checks below are isolated.
  await Payment.updateOne(
    { _id: recoveredSmoke._id },
    { $set: { status: 'Refunded', refundId: 're_smoke_recovered', refundAmount: 1, refundedAt: new Date() } },
  );
  await Payment.collection.updateOne(
    { _id: recoveredSmoke._id },
    { $set: { createdAt: new Date(Date.now() - 45 * 60 * 1000) } },
  );

  // Now let the refund succeed and prove it is single-shot.
  gatewayUtil.refundPaymentIntent = async ({ paymentIntentId, amountMinor, idempotencyKey }) => {
    refundCalls.push({ paymentIntentId, amountMinor, idempotencyKey });
    return { id: 're_smoke_verify', amount: amountMinor, payment_intent: paymentIntentId };
  };

  const refunded = await callController(controller.refundSmokeTest, { params: { id: String(smokeRow._id) } });
  const smokeRefunded = await Payment.findById(smokeRow._id);
  check('The refund is issued and stored on the payment',
    refunded.statusCode === 200 && refunded.body?.refunded === true
      && smokeRefunded.status === 'Refunded' && smokeRefunded.refundId === 're_smoke_verify');
  check('The refund amount matches the charge (no partial silence)',
    smokeRefunded.refundAmount === 1 && refundCalls[0]?.amountMinor === 100,
    `${smokeRefunded.refundAmount} / ${refundCalls[0]?.amountMinor} minor`);
  check('The refund carries an idempotency key derived from the payment',
    refundCalls[0]?.idempotencyKey === `smoke-refund-${smokeRow._id}`, refundCalls[0]?.idempotencyKey);
  check('Refunding is written to the audit trail',
    Boolean(await AuditLog.findOne({ action: 'PAYMENT_SMOKE_TEST_REFUNDED', entityId: String(smokeRow._id) })));

  const refundAgain = await callController(controller.refundSmokeTest, { params: { id: String(smokeRow._id) } });
  check('A retried refund never moves money twice',
    refundAgain.statusCode === 200 && refundAgain.body?.alreadyRefunded === true
      && refundCalls.length === 1,
    `${refundCalls.length} Stripe refund call(s)`);

  // A retried settlement event must not flip a refunded row back to Paid.
  await deliverWebhook({
    id: `evt_smoke_retry_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: smokeRow.checkoutSessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        payment_intent: 'pi_smoke_verify_0001',
        amount_total: 100,
        metadata: { paymentId: String(smokeRow._id), smokeTest: 'true' },
      },
    },
  });
  const smokeStillRefunded = await Payment.findById(smokeRow._id);
  check('A retried webhook cannot un-refund a smoke test',
    smokeStillRefunded.status === 'Refunded' && smokeStillRefunded.refundId === 're_smoke_verify');

  const doneStatus = await callController(controller.getSmokeTestStatus, { params: { id: String(smokeRow._id) } });
  check('Every step of the run reports done once refunded',
    (doneStatus.body?.smokeTest?.steps || []).length === 4
      && doneStatus.body.smokeTest.steps.every((step) => step.done === true),
    JSON.stringify((doneStatus.body?.smokeTest?.steps || []).map((step) => `${step.id}:${step.done}`)));

  // Cost rails: a smoke test is not free (Stripe keeps its fee on a refund), so
  // a click-fest is bounded in time as well as by the unresolved-run lock.
  const backdateSmoke = (id, minutes) =>
    Payment.collection.updateOne(
      { _id: id },
      { $set: { createdAt: new Date(Date.now() - minutes * 60 * 1000) } },
    );

  await backdateSmoke(smokeRow._id, 2);
  const tooSoon = await callController(controller.startSmokeTest, { body: { confirm: SMOKE_CONFIRM } });
  check('A run started moments ago is on cooldown',
    tooSoon.statusCode === 429 && tooSoon.body?.code === 'SMOKE_TEST_COOLDOWN');

  await backdateSmoke(smokeRow._id, 45);
  for (const n of [1, 2]) {
    const extra = await Payment.create({
      studentName: `Verify Admin (live smoke test ${n})`,
      email: `smoke.limit.${n}.${Date.now()}@example.com`,
      course: dbCourse._id,
      courseTitle: 'Live smoke test — not a sale (USD 1.00)',
      tier: 'full',
      amount: 1,
      currency: 'USD',
      status: 'Refunded',
      transactionId: `SMOKE-LIMIT-${n}-${Date.now()}`,
      invoiceNumber: `SMOKE-LIMIT-${n}-${Math.floor(Math.random() * 1e6)}`,
      provider: 'stripe',
      smokeTest: true,
      paidAt: new Date(),
      stripePaymentIntentId: `pi_smoke_limit_${n}`,
      refundId: `re_smoke_limit_${n}`,
      refundedAt: new Date(),
    });
    await backdateSmoke(extra._id, 45);
  }
  const capped = await callController(controller.startSmokeTest, { body: { confirm: SMOKE_CONFIRM } });
  check('The daily cap stops a click-fest from burning real money',
    capped.statusCode === 429 && capped.body?.code === 'SMOKE_TEST_DAILY_LIMIT',
    `${smokeTest.SMOKE_TEST_DAILY_LIMIT}/day allowed`);

  await Payment.collection.updateMany(
    { smokeTest: true },
    { $set: { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
  );
  const released = await callController(controller.startSmokeTest, { body: { confirm: SMOKE_CONFIRM } });
  check('The rails release the next day (a resolved run never locks the feature out)',
    released.statusCode === 200 && released.body?.smokeTest?.amount === 1,
    `${released.statusCode}`);

  gatewayUtil.createSmokeTestSession = originalCreateSmokeSession;
  gatewayUtil.refundPaymentIntent = originalRefundIntent;

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

  // ───────────────────────────────────────────────────────────────────────
  section('LEVEL 4 · Gateway setup guardrails (admin panel contract)');
  const {
    alignModeWithSecret,
    REQUIRED_WEBHOOK_EVENTS,
    WEBHOOK_PATH,
  } = require(path.join(__dirname, '..', 'server', 'config', 'payments'));

  const liveIntoTest = alignModeWithSecret({ mode: 'test', secretKey: 'sk_live_example' });
  check('Pasting a live key switches the gateway to LIVE on its own',
    liveIntoTest.mode === 'live' && liveIntoTest.changed === true,
    `mode ${liveIntoTest.mode}`);
  check('...and the admin is told about the switch', Boolean(liveIntoTest.notice));

  const testIntoLive = alignModeWithSecret({ mode: 'live', secretKey: 'sk_test_example' });
  check('Pasting a test key can never leave the gateway charging live cards',
    testIntoLive.mode === 'test' && testIntoLive.changed === true,
    `mode ${testIntoLive.mode}`);

  const matching = alignModeWithSecret({ mode: 'live', secretKey: 'sk_live_example' });
  check('A matching key leaves the chosen mode untouched',
    matching.mode === 'live' && matching.changed === false && matching.notice === null);

  const emptyKey = alignModeWithSecret({ mode: 'test', secretKey: '' });
  check('An empty key never fabricates a mode change', emptyKey.changed === false && emptyKey.mode === 'test');

  check('Webhook URL path is the documented one', WEBHOOK_PATH === '/api/payments/webhook', WEBHOOK_PATH);

  // The webhook URL is handed to Stripe, so a wrong scheme/host silently breaks
  // every settlement. Render terminates TLS in front of the API, where
  // req.protocol alone reports "http".
  const { __test__: settingsTest } = require(path.join(__dirname, '..', 'server', 'controllers', 'settingsController'));
  const fakeReq = (headers = {}) => ({ headers, protocol: 'http', get: (name) => headers.host || '' });

  const proxied = settingsTest.publicApiOrigin(
    fakeReq({ host: 'american-futuretech-api.onrender.com', 'x-forwarded-proto': 'https' }),
  );
  check('A proxied production request yields an https API origin',
    proxied === 'https://american-futuretech-api.onrender.com', proxied);

  const noForwardedProto = settingsTest.publicApiOrigin(fakeReq({ host: 'example.onrender.com' }));
  check('Without a forwarded proto a public host is still assumed https',
    noForwardedProto === 'https://example.onrender.com', noForwardedProto);

  const local = settingsTest.publicApiOrigin(fakeReq({ host: '127.0.0.1:5050' }));
  check('A local host keeps http (no bogus TLS assumption in dev)',
    local === 'http://127.0.0.1:5050', local);

  process.env.PUBLIC_API_URL = 'https://api.example.com/';
  const overridden = settingsTest.publicApiOrigin(fakeReq({ host: 'something-else' }));
  delete process.env.PUBLIC_API_URL;
  check('PUBLIC_API_URL overrides the derived origin (trailing slash trimmed)',
    overridden === 'https://api.example.com', overridden);

  const setupShape = settingsTest.buildGatewaySetup({
    gateway: { enabled: true, mode: 'live', secretKeyEncrypted: 'v1:x', webhookSecretEncrypted: 'v1:y' },
    payments: { ready: true },
    req: fakeReq({ host: 'api.example.com' }),
  });
  check('A fully configured gateway reports all three setup steps done',
    setupShape.steps.every((step) => step.done === true) && setupShape.ready === true);
  check('The setup block tells the admin it is LIVE, not TEST', setupShape.live === true && setupShape.modeLabel.startsWith('LIVE'),
    setupShape.modeLabel);
  check('The setup block never carries secret material',
    !JSON.stringify(setupShape).includes('v1:'), 'only booleans/labels are returned');

  // Reporting regression: Stripe's Account object has no livemode field, so
  // accounts.retrieve() on a real sk_live_ key left it undefined and the panel
  // stamped "TEST" next to the live key's own hint. The key prefix must decide.
  check('A live key with an account object that has no livemode still reports live',
    settingsTest.keyEnvironment({ secretKey: 'sk_live_51Example', account: { id: 'acct_x', country: 'US', default_currency: 'usd' } }) === 'live');
  check('A restricted live key (rk_live_) also reports live',
    settingsTest.keyEnvironment({ secretKey: 'rk_live_51Example' }) === 'live');
  check('A test key still reports test',
    settingsTest.keyEnvironment({ secretKey: 'sk_test_51Example', account: { id: 'acct_x' } }) === 'test');
  check('An unknown key with no account info fails safe to test',
    settingsTest.keyEnvironment({ secretKey: 'weird_key' }) === 'test');
  check('account.livemode:true is still honoured as a fallback',
    settingsTest.keyEnvironment({ secretKey: 'weird_key', account: { livemode: true } }) === 'live');
  check('All five settlement events are required by the setup panel',
    REQUIRED_WEBHOOK_EVENTS.length === 5
      && REQUIRED_WEBHOOK_EVENTS.includes('checkout.session.completed')
      && REQUIRED_WEBHOOK_EVENTS.includes('checkout.session.expired')
      && REQUIRED_WEBHOOK_EVENTS.includes('payment_intent.payment_failed'),
    REQUIRED_WEBHOOK_EVENTS.join(', '));

  // ── Live smoke test: the money-moving rails must stay in the code ────────
  const smokeContract = require(path.join(__dirname, '..', 'server', 'controllers', 'paymentController')).__test__;
  check('Smoke-test amount is fixed on the server at one unit of currency',
    smokeContract.SMOKE_TEST_AMOUNT_MINOR === 100, `${smokeContract.SMOKE_TEST_AMOUNT_MINOR} minor units`);
  check('Smoke-test confirmation token is a real gate, not a boolean',
    typeof smokeContract.SMOKE_TEST_CONFIRMATION === 'string'
      && smokeContract.SMOKE_TEST_CONFIRMATION.length >= 12);
  check('Smoke-test cost rails exist (cooldown, daily cap, checkout window)',
    smokeContract.SMOKE_TEST_COOLDOWN_MS >= 5 * 60 * 1000
      && smokeContract.SMOKE_TEST_DAILY_LIMIT >= 1 && smokeContract.SMOKE_TEST_DAILY_LIMIT <= 5
      && smokeContract.SMOKE_TEST_CHECKOUT_WINDOW_MS >= 15 * 60 * 1000,
    `${smokeContract.SMOKE_TEST_COOLDOWN_MS / 60000}min cooldown, ${smokeContract.SMOKE_TEST_DAILY_LIMIT}/day`);

  const paymentControllerSource = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'controllers', 'paymentController.js'),
    'utf8',
  );
  check('The refund call carries an idempotency key derived from the payment',
    paymentControllerSource.includes('idempotencyKey: `smoke-refund-${payment._id}`'));
  check('A refunded smoke test is terminal for retried webhooks',
    /payment\.status === 'Paid' \|\| payment\.status === 'Refunded'/.test(paymentControllerSource));
  check('Smoke rows are excluded from the ledger and the revenue total',
    paymentControllerSource.includes('query.smokeTest = { $ne: true }')
      && paymentControllerSource.includes("curr.status === 'Paid' && !curr.smokeTest"));
  check('The smoke settlement stops before creating a student or enrollment',
    /if \(payment\.smokeTest\) \{[\s\S]{0,2000}?return \{\n\s+payment: fresh,\n\s+student: null,\n\s+enrollment: null,/.test(
      paymentControllerSource,
    ));

  const paymentRoutesSource = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'routes', 'paymentRoutes.js'),
    'utf8',
  );
  const smokeRouteBlocks = paymentRoutesSource
    .split('router.')
    .filter((block) => block.includes("'/smoke-test"));
  check('Every smoke-test route is admin-gated with the WRITE permission',
    smokeRouteBlocks.length === 3
      && smokeRouteBlocks.every(
        (block) => block.includes('protect') && block.includes("'SETTINGS_EDIT'"),
      ),
    `${smokeRouteBlocks.length} route block(s)`);

  // ───────────────────────────────────────────────────────────────────────
  const failedChecks = results.filter((r) => !r.passed);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`RESULT: ${results.length - failedChecks.length}/${results.length} checks passed`);
  if (failedChecks.length) {
    console.log('FAILED:');
    failedChecks.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
    process.exit(1);
  }
  console.log('All payment checks passed ✅');
};

run().catch(async (error) => {
  console.error('\nVerification crashed:', error);
  try { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
