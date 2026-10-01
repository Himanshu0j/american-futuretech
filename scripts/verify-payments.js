/**
 * Payments verification suite.
 *
 *   node scripts/verify-payments.js
 *
 * Level 1  pure pricing/coupon/temp-password logic (no DB, no network)
 * Level 2  Stripe webhook signature enforcement (local HMAC, no network)
 * Level 3  full settlement through the webhook handler against a throwaway
 *          local MongoDB database (dropped at the end)
 * Level 4  admin-panel setup contract (key/mode alignment, webhook checklist)
 *
 * Any real Stripe keys already present in server/.env are ignored — the script
 * forces test-only dummy credentials so it can never touch live money.
 */

const path = require('path');
const crypto = require('crypto');

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
  const callController = async (fn, { params = {}, body = {}, user = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', role: 'ADMIN', name: 'Verify Admin', email: 'verify-admin@example.com' } } = {}) => {
    const captured = { statusCode: 200, body: null };
    const res = {
      status(code) { captured.statusCode = code; return this; },
      json(body) { captured.body = body; return this; },
    };
    await fn({ params, body, user, query: {}, headers: {} }, res);
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
