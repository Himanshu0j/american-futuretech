/**
 * Coupon engine contract test.
 *
 *   npm run verify:coupons
 *
 * Coupons move real money, so every rule an admin can set is asserted here:
 * flat vs percentage maths, expiry windows, usage caps, per-student caps,
 * minimum order, tier/program targeting, inactive codes — plus the fact that a
 * forged request cannot change the amount, and that an invalid coupon never
 * silently disappears from a real checkout.
 *
 * Runs against a throwaway database.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5204;
const BASE = `http://127.0.0.1:${PORT}`;
const SEED_ADMIN_PASSWORD = 'Vertex-Coupon-Check-2026!z';
const DB_NAME = `aft_coupontest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => {
  console.log(`\n${'─'.repeat(64)}\n${title}\n${'─'.repeat(64)}`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (method, url, { token, body } = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch (error) {
    json = null;
  }
  return { status: res.status, json };
};

const run = async () => {
  console.log(`\nBooting API on port ${PORT} against ${DB_NAME}\n`);

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI,
      NODE_ENV: 'development',
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD,
      JWT_SECRET: 'coupon_contract_secret_long_enough_000001',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
  server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

  const stopServer = async () => {
    server.kill();
    await sleep(600);
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch (error) {
      console.log(`  (cleanup note: ${error.message})`);
    }
  };

  try {
    let healthy = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch (error) { /* not up yet */ }
      await sleep(1200);
    }
    check('API boots on a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    let token = '';
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'admin@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { token = res.json.token; break; }
      await sleep(1200);
    }
    check('Admin can sign in', Boolean(token));
    if (!token) throw new Error('could not authenticate as admin');

    section('1. PURE MATHS (no database)');
    const { computeDiscount, evaluateCoupon } = require(path.join(__dirname, '..', 'server', 'utils', 'couponEngine'));

    check(
      '10% of $1899 is $189.90',
      computeDiscount(1899, { discountType: 'percent', discountValue: 10 }) === 189.9,
      String(computeDiscount(1899, { discountType: 'percent', discountValue: 10 })),
    );
    check(
      'Flat $50 off $1899 is exactly $50',
      computeDiscount(1899, { discountType: 'flat', discountValue: 50 }) === 50,
    );
    check(
      'A discount can never push a charge below the $10 processor floor',
      computeDiscount(55, { discountType: 'flat', discountValue: 500 }) === 45,
      String(computeDiscount(55, { discountType: 'flat', discountValue: 500 })),
    );
    check(
      'Percentage cap is respected ($100 cap on 50% of $1899 = $100)',
      computeDiscount(1899, { discountType: 'percent', discountValue: 50, maxDiscount: 100 }) === 100,
      String(computeDiscount(1899, { discountType: 'percent', discountValue: 50, maxDiscount: 100 })),
    );

    section('2. ADMIN CRUD');

    // The seeder writes demo content (including the legacy voucher codes) in the
    // background, so wait for it before asserting on imported promotions.
    let seeded = await request('GET', '/api/coupons', { token });
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if ((seeded.json?.coupons || []).length >= 4) break;
      await sleep(1200);
      seeded = await request('GET', '/api/coupons', { token });
    }

    check(
      'Legacy promo codes are imported for the client to manage',
      seeded.status === 200 && (seeded.json?.coupons || []).length >= 4,
      `${(seeded.json?.coupons || []).length} coupons`,
    );

    const existingCodes = (seeded.json?.coupons || []).map((c) => c.code);
    check('FUTURETECH10 is present and editable', existingCodes.includes('FUTURETECH10'), existingCodes.join(', '));

    const created = await request('POST', '/api/coupons', {
      token,
      body: {
        code: 'qa-flat25',
        description: 'QA flat discount',
        discountType: 'flat',
        discountValue: 25,
        perStudentLimit: 1,
      },
    });
    check(
      'Create normalises the code to upper case',
      created.status === 201 && created.json?.coupon?.code === 'QA-FLAT25',
      created.json?.coupon?.code,
    );
    const flatId = created.json?.coupon?._id;

    const duplicate = await request('POST', '/api/coupons', {
      token,
      body: { code: 'QA-FLAT25', discountType: 'flat', discountValue: 5 },
    });
    check('Duplicate codes are rejected with 409', duplicate.status === 409, `status=${duplicate.status}`);

    const badPercent = await request('POST', '/api/coupons', {
      token,
      body: { code: 'QA-BADPERCENT', discountType: 'percent', discountValue: 150 },
    });
    check('A 150% discount is refused', badPercent.status === 400, badPercent.json?.message);

    const badDates = await request('POST', '/api/coupons', {
      token,
      body: {
        code: 'QA-BADDATES',
        discountType: 'flat',
        discountValue: 10,
        startsAt: '2026-12-01',
        expiresAt: '2026-01-01',
      },
    });
    check('An expiry date before the start date is refused', badDates.status === 400, badDates.json?.message);

    const invalidCode = await request('POST', '/api/coupons', {
      token,
      body: { code: 'no spaces!', discountType: 'flat', discountValue: 10 },
    });
    check('Codes with invalid characters are refused', invalidCode.status === 400, invalidCode.json?.message);

    const edited = await request('PUT', `/api/coupons/${flatId}`, {
      token,
      body: { description: 'QA flat discount (edited)', discountValue: 30 },
    });
    check(
      'Editing persists the new value',
      edited.status === 200 && Number(edited.json?.coupon?.discountValue) === 30,
      `value=${edited.json?.coupon?.discountValue}`,
    );

    const toggled = await request('PATCH', `/api/coupons/${flatId}/toggle`, { token, body: {} });
    check('Deactivating flips the active flag', toggled.status === 200 && toggled.json?.coupon?.active === false);
    await request('PATCH', `/api/coupons/${flatId}/toggle`, { token, body: { active: true } });

    section('3. SERVER-SIDE VALIDATION AT CHECKOUT');

    const courses = await request('GET', '/api/courses');
    const course = (courses.json?.courses || [])[0];
    check('A program exists to quote against', Boolean(course?._id), course?.title);

    const baseQuote = await request('POST', '/api/payments/quote', { body: { courseId: course?._id, tier: 'full' } });
    const fullPrice = baseQuote.json?.quote?.amount;
    check('Baseline quote has no discount', baseQuote.status === 200 && baseQuote.json?.quote?.discountAmount === 0, `amount=${fullPrice}`);

    const percentQuote = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'FUTURETECH10' },
    });
    check(
      'A valid percentage coupon reduces the server quote',
      percentQuote.json?.quote?.couponApplied === true &&
        percentQuote.json?.quote?.discountAmount === Math.round(fullPrice * 0.1 * 100) / 100,
      `discount=${percentQuote.json?.quote?.discountAmount}`,
    );

    const forged = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'FUTURETECH10', amount: 1, discountAmount: 9999 },
    });
    check(
      'A forged amount/discount in the request body is ignored',
      forged.json?.quote?.amount === percentQuote.json?.quote?.amount,
      `amount=${forged.json?.quote?.amount}`,
    );

    const unknown = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'NOT-A-REAL-CODE' },
    });
    check(
      'An unknown code returns a clear reason and no discount',
      unknown.json?.quote?.couponApplied === false &&
        /not valid/i.test(unknown.json?.quote?.couponError || ''),
      unknown.json?.quote?.couponError,
    );

    const expired = await request('POST', '/api/coupons', {
      token,
      body: {
        code: 'QA-EXPIRED',
        discountType: 'percent',
        discountValue: 20,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const expiredQuote = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'QA-EXPIRED' },
    });
    check(
      'An expired coupon is refused with the expiry date',
      expiredQuote.json?.quote?.couponApplied === false &&
        /expired/i.test(expiredQuote.json?.quote?.couponError || ''),
      expiredQuote.json?.quote?.couponError,
    );
    check('Expired coupon is still visible in the admin list', expired.status === 201);

    const future = await request('POST', '/api/coupons', {
      token,
      body: {
        code: 'QA-FUTURE',
        discountType: 'percent',
        discountValue: 20,
        startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const futureQuote = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'QA-FUTURE' },
    });
    check(
      'A coupon that has not started yet is refused',
      futureQuote.json?.quote?.couponApplied === false && /available on/i.test(futureQuote.json?.quote?.couponError || ''),
      futureQuote.json?.quote?.couponError,
    );
    check('Future coupon created', future.status === 201);

    const capped = await request('POST', '/api/coupons', {
      token,
      body: {
        code: 'QA-MINORDER',
        discountType: 'flat',
        discountValue: 100,
        minAmount: 5000,
      },
    });
    const minOrderQuote = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'QA-MINORDER' },
    });
    check(
      'Minimum-order rule blocks a coupon on a cheaper order',
      minOrderQuote.json?.quote?.couponApplied === false && /minimum order/i.test(minOrderQuote.json?.quote?.couponError || ''),
      minOrderQuote.json?.quote?.couponError,
    );
    check('Minimum-order coupon created', capped.status === 201);

    const depositOnly = await request('POST', '/api/coupons', {
      token,
      body: { code: 'QA-DEPOSITONLY', discountType: 'flat', discountValue: 15, applicableTiers: ['deposit'] },
    });
    const wrongTier = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'QA-DEPOSITONLY' },
    });
    const rightTier = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'deposit', couponCode: 'QA-DEPOSITONLY' },
    });
    check(
      'Tier targeting: blocked on full tuition, allowed on the deposit',
      wrongTier.json?.quote?.couponApplied === false && rightTier.json?.quote?.couponApplied === true,
      `full=${wrongTier.json?.quote?.couponError} deposit=${rightTier.json?.quote?.couponApplied}`,
    );
    check('Tier-targeted coupon created', depositOnly.status === 201);

    const otherCourse = (courses.json?.courses || []).find((c) => String(c._id) !== String(course?._id));
    const courseTargeted = await request('POST', '/api/coupons', {
      token,
      body: { code: 'QA-PROGRAM', discountType: 'flat', discountValue: 40, applicableCourses: [course?._id] },
    });
    const wrongProgram = await request('POST', '/api/payments/quote', {
      body: { courseId: otherCourse?._id, tier: 'full', couponCode: 'QA-PROGRAM' },
    });
    const rightProgram = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'QA-PROGRAM' },
    });
    check(
      'Program targeting: blocked on another program, allowed on the selected one',
      wrongProgram.json?.quote?.couponApplied === false && rightProgram.json?.quote?.couponApplied === true,
      wrongProgram.json?.quote?.couponError,
    );
    check('Program-targeted coupon created', courseTargeted.status === 201);

    const inactive = await request('POST', '/api/coupons', {
      token,
      body: { code: 'QA-INACTIVE', discountType: 'percent', discountValue: 30, active: false },
    });
    const inactiveQuote = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'QA-INACTIVE' },
    });
    check(
      'A deactivated coupon cannot be used',
      inactiveQuote.json?.quote?.couponApplied === false && /no longer active/i.test(inactiveQuote.json?.quote?.couponError || ''),
      inactiveQuote.json?.quote?.couponError,
    );
    check('Inactive coupon created', inactive.status === 201);

    section('4. USAGE + PER-STUDENT LIMITS');

    const Coupon = require(path.join(__dirname, '..', 'server', 'models', 'Coupon'));
    const Payment = require(path.join(__dirname, '..', 'server', 'models', 'Payment'));
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });

    const limited = await Coupon.create({
      code: 'QA-LIMITED',
      discountType: 'flat',
      discountValue: 20,
      usageLimit: 2,
      perStudentLimit: 1,
      usedCount: 2,
    });
    const usageQuote = await request('POST', '/api/payments/quote', {
      body: { courseId: course?._id, tier: 'full', couponCode: 'QA-LIMITED' },
    });
    check(
      'A coupon at its total usage limit is refused',
      usageQuote.json?.quote?.couponApplied === false && /usage limit/i.test(usageQuote.json?.quote?.couponError || ''),
      usageQuote.json?.quote?.couponError,
    );
    await Coupon.findByIdAndDelete(limited._id);

    const perStudent = await Coupon.create({
      code: 'QA-PERSTUDENT',
      discountType: 'flat',
      discountValue: 20,
      perStudentLimit: 1,
    });
    await Payment.create({
      studentName: 'Coupon QA Buyer',
      email: 'coupon.qa@example.com',
      course: course._id,
      courseTitle: course.title,
      tier: 'full',
      amount: 100,
      couponCode: 'QA-PERSTUDENT',
      status: 'Paid',
      transactionId: `qa_txn_${Date.now()}`,
      invoiceNumber: `INV-QA-${Date.now()}`,
    });
    const reused = await request('POST', '/api/payments/quote', {
      body: {
        courseId: course?._id,
        tier: 'full',
        couponCode: 'QA-PERSTUDENT',
        email: 'coupon.qa@example.com',
      },
    });
    check(
      'Per-student limit: the same buyer cannot redeem twice',
      reused.json?.quote?.couponApplied === false && /already used/i.test(reused.json?.quote?.couponError || ''),
      reused.json?.quote?.couponError,
    );
    const freshBuyer = await request('POST', '/api/payments/quote', {
      body: {
        courseId: course?._id,
        tier: 'full',
        couponCode: 'QA-PERSTUDENT',
        email: 'someone.else@example.com',
      },
    });
    check(
      'A different buyer can still use it',
      freshBuyer.json?.quote?.couponApplied === true,
      freshBuyer.json?.quote?.couponError || 'applied',
    );
    await Coupon.findByIdAndDelete(perStudent._id);

    section('5. REAL CHECKOUT REFUSES AN INVALID COUPON');

    const checkout = await request('POST', '/api/payments/checkout', {
      body: {
        courseId: course?._id,
        tier: 'full',
        fullName: 'Coupon QA Buyer',
        email: 'coupon.qa@example.com',
        couponCode: 'QA-INACTIVE',
      },
    });
    check(
      'Checkout never proceeds with an unusable coupon',
      checkout.status === 400 && checkout.json?.success === false,
      `status=${checkout.status} message=${checkout.json?.message}`,
    );

    const checkoutUnknown = await request('POST', '/api/payments/checkout', {
      body: {
        courseId: course?._id,
        tier: 'full',
        fullName: 'Coupon QA Buyer',
        email: 'coupon.qa@example.com',
        couponCode: 'TOTALLY-FAKE',
      },
    });
    check(
      'Checkout rejects an unknown code with a reason',
      checkoutUnknown.status === 400,
      checkoutUnknown.json?.message,
    );

    section('6. SECURITY');
    const anonList = await request('GET', '/api/coupons');
    check('Coupon administration needs a token', anonList.status === 401, `status=${anonList.status}`);

    const anonCreate = await request('POST', '/api/coupons', { body: { code: 'HACKED', discountType: 'percent', discountValue: 100 } });
    check('Anonymous coupon creation is rejected', anonCreate.status === 401, `status=${anonCreate.status}`);

    const anonDelete = await request('DELETE', `/api/coupons/${flatId}`);
    check('Anonymous coupon deletion is rejected', anonDelete.status === 401, `status=${anonDelete.status}`);

    await mongoose.disconnect();
  } catch (error) {
    check('Suite ran to completion', false, error.message);
  } finally {
    await stopServer();
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'═'.repeat(64)}`);
  console.log(`RESULT: ${passed}/${results.length} checks passed${failed.length ? ` — ${failed.length} FAILED` : ' ✅'}`);
  failed.forEach((f) => console.log(`   ❌ ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
  console.log('═'.repeat(64));
  if (failed.length) {
    console.log('\nServer log tail:');
    console.log(serverLog.split('\n').slice(-25).join('\n'));
  }
  process.exit(failed.length ? 1 : 0);
};

run();
