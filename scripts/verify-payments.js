/**
 * Payments verification suite.
 *
 *   node scripts/verify-payments.js
 *
 * Level 1  pure pricing/coupon/temp-password logic (no DB, no network)
 * Level 2  Stripe webhook signature enforcement (local HMAC, no network)
 * Level 3  full settlement through the webhook handler against a throwaway
 *          local MongoDB database (dropped at the end)
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

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

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
