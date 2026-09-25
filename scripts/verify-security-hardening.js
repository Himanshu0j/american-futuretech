/**
 * Security hardening regression suite.
 *
 *   npm run verify:security
 *
 * Everything the other suites do not cover: hostile input on the public auth
 * surface, search-filter injection / ReDoS, Stripe key separation and payment
 * forgery attempts, cross-student invoice & support-ticket access, and JWT
 * invalidation after a password change.
 *
 * Boots a real API process against a throwaway database with TEST-ONLY Stripe
 * credentials, so no live money and no live data is ever involved.
 */

const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5607;
const BASE = `http://127.0.0.1:${PORT}`;
const DB_NAME = `aft_sectest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const ADMIN_EMAIL = 'admin@americanfuturetech.com';
// Must satisfy the platform password policy — the seeder refuses anything that
// fails it, including a password containing "admin" (the account's email).
const ADMIN_PASSWORD = 'Hardening-QA-2026!x7';
const SECRET_KEY = 'sk_test_hardening_only_9f2a4c6e8b1d3f5a';
const WEBHOOK_SECRET = `whsec_${crypto.randomBytes(16).toString('hex')}`;

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => console.log(`\n${'─'.repeat(64)}\n${title}\n${'─'.repeat(64)}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (method, url, { token, body, rawBody, contentType } = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      ...(rawBody ? { 'Content-Type': contentType || 'application/json' } : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(rawBody ? { body: rawBody } : body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (error) { json = null; }
  return { status: res.status, text, json };
};

const run = async () => {
  console.log(`\nBooting API on port ${PORT} against ${DB_NAME}\n`);

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI,
      NODE_ENV: 'production',
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
      JWT_SECRET: 'security_hardening_secret_long_enough_000001',
      STRIPE_SECRET_KEY: SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
      CLIENT_URL: 'http://localhost:5173',
      NOTIFICATION_EMAIL: 'verify@example.com',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  server.stdout.on('data', (c) => { serverLog += c.toString(); });
  server.stderr.on('data', (c) => { serverLog += c.toString(); });

  const shutdown = async () => {
    server.kill();
    await sleep(700);
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
    for (let attempt = 0; attempt < 45; attempt += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch (error) { /* booting */ }
      await sleep(1200);
    }
    check('API boots against a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    let adminToken = '';
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { adminToken = res.json.token; break; }
      await sleep(1200);
    }
    check('Admin can sign in', Boolean(adminToken));
    if (!adminToken) throw new Error('could not authenticate');

    // ══════════════════════════════════════════════════════════════════════
    section('1. Hostile input on the public auth surface');

    const injections = [
      { email: { $gt: '' }, password: { $gt: '' } },
      { email: { $ne: null }, password: 'x' },
      { email: ADMIN_EMAIL, password: { $ne: null } },
      { email: [ADMIN_EMAIL], password: 'x' },
      { email: { $regex: '.*' }, password: { $regex: '.*' } },
    ];
    let injectionSafe = true;
    for (const payload of injections) {
      const res = await request('POST', '/api/auth/login', { body: payload });
      const issuedToken = Boolean(res.json?.token);
      const serverError = res.status >= 500;
      if (issuedToken || serverError) {
        injectionSafe = false;
        console.log(`      ⚠ ${JSON.stringify(payload).slice(0, 60)} → HTTP ${res.status}${issuedToken ? ' TOKEN!' : ''}`);
      }
    }
    check('Mongo query operators in the login body are rejected cleanly (no token, no 5xx)', injectionSafe);

    const malformed = await request('POST', '/api/auth/login', { rawBody: 'not json at all' });
    check('Malformed JSON is a 400, not a 500', malformed.status === 400, `HTTP ${malformed.status}`);

    const truncated = await request('POST', '/api/auth/login', { rawBody: '{"email":"a@b.com"' });
    check('Truncated JSON is a 400, not a 500', truncated.status === 400, `HTTP ${truncated.status}`);

    const oversized = await request('POST', '/api/auth/login', {
      rawBody: JSON.stringify({ email: `${'a'.repeat(2_000_000)}@x.com`, password: 'x' }),
    });
    check('An oversized body is a 413, not a 500', oversized.status === 413, `HTTP ${oversized.status}`);

    const xssPayload = { email: '<script>alert(1)</script>@x.com', password: '<img src=x onerror=alert(1)>' };
    const xss = await request('POST', '/api/auth/login', { body: xssPayload });
    check(
      'A script payload is never echoed back in the response',
      !xss.text.includes('<script>') && !xss.text.includes('onerror='),
      `HTTP ${xss.status}`,
    );

    check(
      'Production error responses carry no stack trace',
      !/"stack":\s*"[^"]/.test(malformed.text) && !/"stack":\s*"[^"]/.test(oversized.text),
    );

    // ══════════════════════════════════════════════════════════════════════
    section('2. Search filters are literal, bounded and cheap');

    const { escapeRegex, searchRegex, MAX_SEARCH_LENGTH } = require(path.join(__dirname, '..', 'server', 'utils', 'search'));
    check('escapeRegex neutralises regex metacharacters', escapeRegex('(a+)+$') === '\\(a\\+\\)\\+\\$', escapeRegex('(a+)+$'));
    check('escapeRegex leaves ordinary text untouched', escapeRegex('Data Science') === 'Data Science');
    check(
      'searchRegex bounds the input length',
      searchRegex('x'.repeat(5000)).$regex.length === MAX_SEARCH_LENGTH,
      `${searchRegex('x'.repeat(5000)).$regex.length} chars`,
    );
    check('searchRegex ignores non-string input instead of treating it as a query', searchRegex({ $gt: '' }).$regex === '');

    // A literal "C++" search must actually match a title containing "C++".
    const BlogPost = require(path.join(__dirname, '..', 'server', 'models', 'BlogPost'));
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    await BlogPost.create({
      title: 'Modern C++ & Node.js (Part 2)',
      slug: `modern-cpp-verify-${Date.now()}`,
      excerpt: 'Literal-search fixture.',
      content: 'Fixture content for the literal search regression.',
      isPublished: true,
    });
    await mongoose.disconnect();

    const literal = await request('GET', `/api/content/blogs?search=${encodeURIComponent('C++')}`);
    check(
      'A literal "C++" search finds the article (metacharacters are not treated as regex)',
      literal.status === 200 && (literal.json?.blogs || []).some((b) => b.title.includes('C++')),
      `HTTP ${literal.status}`,
    );

    const pathologicalStart = Date.now();
    const pathological = await request('GET', `/api/content/blogs?search=${encodeURIComponent('(a+)+$')}`);
    const pathologicalMs = Date.now() - pathologicalStart;
    check(
      'A hostile search pattern cannot hang the API',
      pathological.status === 200 && pathologicalMs < 3000,
      `HTTP ${pathological.status} in ${pathologicalMs}ms`,
    );

    const paymentsSearch = await request('GET', `/api/payments?search=${encodeURIComponent('(a+)+$')}`, { token: adminToken });
    check('The same guard covers the admin payment search', paymentsSearch.status === 200, `HTTP ${paymentsSearch.status}`);

    // ══════════════════════════════════════════════════════════════════════
    section('3. Stripe: key separation, mode honesty and forgery attempts');

    const health = await request('GET', '/api/health');
    check('A test secret key is reported as TEST mode, never LIVE', health.json?.payments?.mode === 'test', `mode=${health.json?.payments?.mode}`);
    check('Health reports the gateway as configured with a webhook', health.json?.payments?.configured === true && health.json?.payments?.webhookConfigured === true);
    check('Health never contains the secret key', !health.text.includes(SECRET_KEY));

    const gatewayStatus = await request('GET', '/api/settings/payment-gateway', { token: adminToken });
    check('Admin gateway status loads', gatewayStatus.status === 200, `HTTP ${gatewayStatus.status}`);
    check('Admin gateway status never contains the secret key', !gatewayStatus.text.includes(SECRET_KEY));
    check('Admin gateway status never contains the webhook secret', !gatewayStatus.text.includes(WEBHOOK_SECRET));
    check('Admin sees only a "configured" flag plus a hint', gatewayStatus.json?.gateway?.secretKeyConfigured === true && typeof gatewayStatus.json?.gateway?.secretKeyHint === 'string');

    const publicSettings = await request('GET', '/api/settings');
    check('Public settings never contain the secret key', !publicSettings.text.includes(SECRET_KEY) && !publicSettings.text.includes(WEBHOOK_SECRET));

    const paymentList = await request('GET', '/api/payments', { token: adminToken });
    check('The payment list never contains the secret key', !paymentList.text.includes(SECRET_KEY));

    // Price forgery: a client-supplied amount must be ignored.
    const courses = await request('GET', '/api/courses');
    const courseId = (courses.json?.courses || [])[0]?._id;
    check('A course exists to test pricing against', Boolean(courseId));
    if (courseId) {
      const forged = await request('POST', '/api/payments/quote', {
        body: { courseId, tier: 'full', amount: 1, price: 1, discountAmount: 99999, total: 1 },
      });
      const quoted = forged.json?.quote?.amount;
      check(
        'A forged amount in the request body is ignored (server computes the price)',
        forged.status === 200 && quoted !== 1 && quoted > 1,
        `quoted=${quoted}`,
      );
    }

    // No endpoint may settle a payment.
    const Payment = require(path.join(__dirname, '..', 'server', 'models', 'Payment'));
    const Course = require(path.join(__dirname, '..', 'server', 'models', 'Course'));
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const dbCourse = await Course.findOne();
    const pendingPayment = await Payment.create({
      studentName: 'Forgery Probe',
      email: `forgery.${Date.now()}@example.com`,
      course: dbCourse._id,
      courseTitle: dbCourse.title,
      tier: 'full',
      amount: 1899,
      originalPrice: 2499,
      currency: 'USD',
      status: 'Pending',
      transactionId: `PEND-${Date.now()}`,
      invoiceNumber: `INV-SEC-${Math.floor(Math.random() * 1e6)}`,
      checkoutSessionId: `cs_test_${crypto.randomBytes(6).toString('hex')}`,
    });
    await mongoose.disconnect();

    for (const [method, url] of [
      ['PUT', `/api/payments/${pendingPayment._id}`],
      ['PATCH', `/api/payments/${pendingPayment._id}`],
      ['POST', `/api/payments/${pendingPayment._id}/mark-paid`],
      ['POST', `/api/payments/${pendingPayment._id}/confirm`],
      ['POST', '/api/payments/confirm'],
    ]) {
      const res = await request(method, url, { token: adminToken, body: { status: 'Paid', amount: 1899 } });
      const unsettled = !(res.status >= 200 && res.status < 300);
      check(`${method} ${url.replace(String(pendingPayment._id), ':id')} cannot settle a payment`, unsettled, `HTTP ${res.status}`);
    }

    const afterForgery = await request('GET', `/api/payments/checkout-status/${pendingPayment.checkoutSessionId}`);
    check(
      'Polling checkout status cannot turn a Pending payment Paid',
      afterForgery.status === 200 && afterForgery.json?.paid === false && afterForgery.json?.status === 'Pending',
      `status=${afterForgery.json?.status}`,
    );

    const unsigned = await request('POST', '/api/payments/webhook', { rawBody: JSON.stringify({ id: 'evt_forged', type: 'checkout.session.completed' }) });
    check('An unsigned webhook is rejected', unsigned.status === 400, `HTTP ${unsigned.status}`);

    const wrongSecretPayload = JSON.stringify({ id: 'evt_forged', type: 'checkout.session.completed' });
    const wrongSig = require(path.join(__dirname, '..', 'server', 'node_modules', 'stripe')).webhooks.generateTestHeaderString({
      payload: wrongSecretPayload,
      secret: 'whsec_not_the_configured_secret',
    });
    const wrongSecret = await request('POST', '/api/payments/webhook', {
      rawBody: wrongSecretPayload,
      contentType: 'application/json',
    });
    const forgedWithHeader = await fetch(`${BASE}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': wrongSig },
      body: wrongSecretPayload,
    });
    check('A webhook signed with the wrong secret is rejected', forgedWithHeader.status === 400, `HTTP ${forgedWithHeader.status} (unsigned: ${wrongSecret.status})`);

    // ══════════════════════════════════════════════════════════════════════
    section('4. Cross-student access (invoices and support tickets)');

    const User = require(path.join(__dirname, '..', 'server', 'models', 'User'));
    const password = 'Student-Isolation-2026!x';
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const studentA = await User.create({ name: 'Isolation Student A', email: `iso.a.${Date.now()}@example.com`, password, role: 'STUDENT', isActive: true });
    const studentB = await User.create({ name: 'Isolation Student B', email: `iso.b.${Date.now()}@example.com`, password, role: 'STUDENT', isActive: true });
    const invoiceA = await Payment.create({
      student: studentA._id, studentName: studentA.name, email: studentA.email, course: dbCourse._id,
      courseTitle: dbCourse.title, tier: 'full', amount: 1899, currency: 'USD', status: 'Paid',
      transactionId: `TX-A-${Date.now()}`, invoiceNumber: `INV-A-${Math.floor(Math.random() * 1e6)}`,
    });
    const invoiceB = await Payment.create({
      student: studentB._id, studentName: studentB.name, email: studentB.email, course: dbCourse._id,
      courseTitle: dbCourse.title, tier: 'full', amount: 1899, currency: 'USD', status: 'Paid',
      transactionId: `TX-B-${Date.now()}`, invoiceNumber: `INV-B-${Math.floor(Math.random() * 1e6)}`,
    });
    await mongoose.disconnect();

    const loginAs = async (email) => {
      const res = await request('POST', '/api/auth/login', { body: { email, password } });
      return res.json?.token || '';
    };
    const tokenA = await loginAs(studentA.email);
    const tokenB = await loginAs(studentB.email);
    check('Both isolation students can sign in', Boolean(tokenA) && Boolean(tokenB));

    const foreignInvoice = await request('GET', `/api/payments/invoice/${invoiceB.invoiceNumber}`, { token: tokenA });
    check("Student A cannot read Student B's invoice (IDOR)", foreignInvoice.status === 403, `HTTP ${foreignInvoice.status}`);

    const ownInvoice = await request('GET', `/api/payments/invoice/${invoiceA.invoiceNumber}`, { token: tokenA });
    check('Student A can read their own invoice', ownInvoice.status === 200, `HTTP ${ownInvoice.status}`);

    const anonInvoice = await request('GET', `/api/payments/invoice/${invoiceA.invoiceNumber}`);
    check('An anonymous caller cannot read any invoice', anonInvoice.status === 401 || anonInvoice.status === 403, `HTTP ${anonInvoice.status}`);

    const myPayments = await request('GET', '/api/payments/my-payments', { token: tokenA });
    check(
      "Student A's receipt list contains only their own payment",
      myPayments.status === 200
        && (myPayments.json?.payments || []).length === 1
        && myPayments.json.payments[0].invoiceNumber === invoiceA.invoiceNumber,
      `${(myPayments.json?.payments || []).length} receipt(s)`,
    );

    const adminTickets = await request('GET', '/api/support/admin/tickets', { token: tokenA });
    check('A student cannot list every support ticket', adminTickets.status === 403, `HTTP ${adminTickets.status}`);

    const createdTicket = await request('POST', '/api/support/tickets', {
      token: tokenA,
      body: { subject: 'Isolation fixture ticket', message: 'Created by the security suite.', category: 'General' },
    });
    const ticketId = createdTicket.json?.ticket?._id || createdTicket.json?.ticket?.id;
    check('Student A can open their own ticket', createdTicket.status === 201 && Boolean(ticketId), `HTTP ${createdTicket.status}`);

    if (ticketId) {
      const foreignReply = await request('POST', `/api/support/tickets/${ticketId}/reply`, { token: tokenB, body: { message: 'Should not be allowed.' } });
      check("Student B cannot reply on Student A's ticket", foreignReply.status === 403, `HTTP ${foreignReply.status}`);

      const bTickets = await request('GET', '/api/support/my-tickets', { token: tokenB });
      check(
        "Student B's ticket list does not include Student A's ticket",
        bTickets.status === 200 && !(bTickets.json?.tickets || []).some((t) => String(t._id) === String(ticketId)),
        `${(bTickets.json?.tickets || []).length} ticket(s)`,
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    section('5. JWT invalidation after a credential rotation');

    const rotate = await new Promise((resolve) => {
      const child = spawn(
        process.execPath,
        [path.join(__dirname, 'rotate-admin-credentials.js'), '--email', ADMIN_EMAIL],
        { env: { ...process.env, MONGODB_URI: MONGO_URI }, stdio: ['ignore', 'pipe', 'pipe'] },
      );
      let out = '';
      child.stdout.on('data', (c) => { out += c.toString(); });
      child.stderr.on('data', (c) => { out += c.toString(); });
      child.on('close', (code) => resolve({ code, out }));
    });
    const newPassword = (rotate.out.match(/New password:\s*(\S+)/) || [])[1];
    check('The rotation script issued a new password', Boolean(newPassword));

    const tokenAfterRotation = await request('GET', '/api/auth/me', { token: adminToken });
    check('A token issued before the rotation stops working', tokenAfterRotation.status === 401, `HTTP ${tokenAfterRotation.status}`);

    const oldPasswordLogin = await request('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    check('The old password no longer authenticates', oldPasswordLogin.status === 401, `HTTP ${oldPasswordLogin.status}`);

    const newPasswordLogin = newPassword
      ? await request('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: newPassword } })
      : { status: 0 };
    check('The new password authenticates', newPasswordLogin.status === 200, `HTTP ${newPasswordLogin.status}`);

    // ══════════════════════════════════════════════════════════════════════
    section('6. Unknown API routes answer JSON, never Express HTML');

    // A verb that does not exist on a real path, a bogus sub-path and a typo'd
    // collection: all must come back in the API's own shape so a client can
    // tell "you called the wrong thing" apart from "the server broke".
    const unknownRoutes = [
      ['PATCH', '/api/students/admin/000000000000000000000000'],
      ['GET', '/api/does-not-exist'],
      ['POST', '/api/curriculum/nope'],
      ['DELETE', '/api/coupons/not-an-id/nope'],
    ];
    for (const [method, url] of unknownRoutes) {
      // fetch refuses a body on GET/HEAD, so only send one where it makes sense.
      const res = await request(method, url, { token: adminToken, ...(method === 'GET' || method === 'HEAD' ? {} : { body: {} }) });
      const isJson = /application\/json/.test(res.text) || (res.json !== null && typeof res.json === 'object');
      check(
        `${method} ${url} → 404 JSON (not HTML)`,
        res.status === 404 && isJson && !/<html/i.test(res.text),
        `HTTP ${res.status}${isJson ? '' : ' non-JSON'} ${res.text.slice(0, 60)}`,
      );
    }

    // The catch-all must not have swallowed anything real.
    const stillLive = await request('GET', '/api/courses');
    check('A legitimate API route still answers normally', stillLive.status === 200 && Boolean(stillLive.json?.courses),
      `HTTP ${stillLive.status}`);

    // ══════════════════════════════════════════════════════════════════════
    section('7. CORS origin allowlist');

    // The API used to reflect any Origin (`origin: true`). Every check below
    // fails against that old behaviour, so this section is the regression.
    const corsConfig = require(path.join(__dirname, '..', 'server', 'config', 'cors'));
    const { getAllowedOrigins, isOriginAllowed, buildCorsOptions, __resetForTests } = corsConfig;
    const CANONICAL = 'https://american-futuretech.vercel.app';
    const UNEXPECTED = 'https://evil.example.com';
    const withConfig = (env, fn) => {
      const saved = {};
      for (const [key, value] of Object.entries(env)) {
        saved[key] = process.env[key];
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
      __resetForTests();
      try {
        return fn();
      } finally {
        for (const [key, value] of Object.entries(saved)) {
          if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
        __resetForTests();
      }
    };

    withConfig({ NODE_ENV: 'production', CLIENT_URL: 'https://american-futuretech.vercel.app' }, () => {
      const allowed = getAllowedOrigins();
      check('Production allowlist contains the canonical frontend origin', allowed.includes(CANONICAL), allowed.join(', '));
      check(
        'Production allowlist keeps the project\'s configured custom domains',
        allowed.includes('https://americanfuturetech.com') && allowed.includes('https://www.americanfuturetech.com'),
      );
      check('Production allowlist has no localhost origin', allowed.every((o) => !/localhost|127\.0\.0\.1/.test(o)), allowed.join(', '));
      check('Production allowlist is never a wildcard', allowed.every((o) => o !== '*'), allowed.join(', '));
      check('An unexpected origin is refused in production', isOriginAllowed(UNEXPECTED) === false);
      check('A local dev port is refused in production', isOriginAllowed('http://127.0.0.1:5273') === false);
      check('A request with no Origin is not cross-origin and is allowed', isOriginAllowed(undefined) === true);
    });

    withConfig({ NODE_ENV: 'production', CLIENT_URL: 'https://staging.american-futuretech.example' }, () => {
      check(
        'A non-local CLIENT_URL is honoured in production',
        isOriginAllowed('https://staging.american-futuretech.example') === true,
        getAllowedOrigins().join(', '),
      );
    });

    withConfig({ NODE_ENV: 'production', CLIENT_URL: 'http://localhost:5173' }, () => {
      check(
        'A localhost CLIENT_URL is ignored in production',
        isOriginAllowed('http://localhost:5173') === false,
        getAllowedOrigins().join(', '),
      );
    });

    withConfig({ NODE_ENV: 'development', CLIENT_URL: 'http://localhost:5173' }, () => {
      check('The local dev origin is allowed in development', isOriginAllowed('http://localhost:5173') === true);
      check('A non-standard local dev port is allowed in development', isOriginAllowed('http://127.0.0.1:5273') === true);
      check('An unexpected origin is still refused in development', isOriginAllowed(UNEXPECTED) === false);
      check('Development allows unprompted tooling too (no Origin)', isOriginAllowed(undefined) === true);
    });

    // ── Over the wire, against the real production-configured server ──────
    const probe = (method, pathname, headers = {}) => new Promise((resolve, reject) => {
      const req = http.request(
        { method, hostname: '127.0.0.1', port: PORT, path: pathname, headers },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        },
      );
      req.on('error', reject);
      req.end();
    });

    const preflight = await probe('OPTIONS', '/api/auth/login', {
      Origin: CANONICAL,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization',
    });
    check(
      'Preflight from the canonical origin is approved',
      preflight.status === 204 && preflight.headers['access-control-allow-origin'] === CANONICAL,
      `HTTP ${preflight.status} ACAO=${preflight.headers['access-control-allow-origin']}`,
    );
    check(
      'Preflight advertises credentials without a wildcard origin',
      preflight.headers['access-control-allow-credentials'] === 'true' && preflight.headers['access-control-allow-origin'] !== '*',
    );
    check(
      'Preflight advertises the methods and headers the app uses',
      /PATCH/.test(preflight.headers['access-control-allow-methods'] || '')
        && /Authorization/.test(preflight.headers['access-control-allow-headers'] || ''),
      `${preflight.headers['access-control-allow-methods']} | ${preflight.headers['access-control-allow-headers']}`,
    );

    const allowedRead = await probe('GET', '/api/courses', { Origin: CANONICAL });
    check(
      'An allowed origin is reflected exactly (never "*") on a real response',
      allowedRead.status === 200
        && allowedRead.headers['access-control-allow-origin'] === CANONICAL
        && allowedRead.headers['access-control-allow-credentials'] === 'true',
      `HTTP ${allowedRead.status} ACAO=${allowedRead.headers['access-control-allow-origin']}`,
    );

    const refusedRead = await probe('GET', '/api/courses', { Origin: UNEXPECTED });
    check(
      'An unexpected origin gets no CORS grant on a real response',
      refusedRead.headers['access-control-allow-origin'] === undefined,
      `ACAO=${refusedRead.headers['access-control-allow-origin']}`,
    );

    const refusedPreflight = await probe('OPTIONS', '/api/leads', {
      Origin: UNEXPECTED,
      'Access-Control-Request-Method': 'POST',
    });
    check(
      'An unexpected origin is never approved at preflight',
      refusedPreflight.headers['access-control-allow-origin'] === undefined,
      `HTTP ${refusedPreflight.status} ACAO=${refusedPreflight.headers['access-control-allow-origin']}`,
    );

    const noOrigin = await probe('GET', '/api/courses');
    check(
      'Same-origin / rewrite / tooling traffic (no Origin) still works',
      noOrigin.status === 200 && noOrigin.headers['access-control-allow-origin'] === undefined,
      `HTTP ${noOrigin.status}`,
    );

    // ── The development-mode branch, through the real middleware ──────────
    const express = require('express');
    const cors = require('cors');
    const devApp = express();
    let devServer = null;
    const savedNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    __resetForTests();
    devApp.use(cors(buildCorsOptions()));
    devApp.get('/api/ping', (req, res) => res.json({ ok: true }));
    await new Promise((resolve) => { devServer = devApp.listen(0, '127.0.0.1', resolve); });
    const devPort = devServer.address().port;
    try {
      const devProbe = (method, pathname, headers = {}) => new Promise((resolve, reject) => {
        const req = http.request({ method, hostname: '127.0.0.1', port: devPort, path: pathname, headers }, (res) => {
          res.on('data', () => {});
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
        });
        req.on('error', reject);
        req.end();
      });
      const devPreflight = await devProbe('OPTIONS', '/api/ping', {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      });
      check(
        'In development the local dev origin is approved over the wire',
        devPreflight.status === 204 && devPreflight.headers['access-control-allow-origin'] === 'http://localhost:5173',
        `HTTP ${devPreflight.status} ACAO=${devPreflight.headers['access-control-allow-origin']}`,
      );
      const devRefused = await devProbe('GET', '/api/ping', { Origin: UNEXPECTED });
      check(
        'In development an unexpected origin is still refused',
        devRefused.headers['access-control-allow-origin'] === undefined,
        `ACAO=${devRefused.headers['access-control-allow-origin']}`,
      );
    } finally {
      if (devServer) await new Promise((resolve) => devServer.close(resolve));
      if (savedNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = savedNodeEnv;
      __resetForTests();
    }

    // ══════════════════════════════════════════════════════════════════════
    section('8. A malformed id is a caller mistake, never a schema leak');

    // Section 5 rotated the admin password, which deliberately invalidates every
    // token issued before it — including the one the earlier sections used.
    const freshLogin = newPassword
      ? await request('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: newPassword } })
      : { status: 0 };
    const freshToken = freshLogin.json?.token || '';
    check('An admin session can be re-established after the rotation', Boolean(freshToken), `HTTP ${freshLogin.status}`);

    // The public apply form used to hand targetCourse straight to
    // Course.findById, so `targetCourse: "nonsense"` came back as a mongoose
    // CastError naming the model and the schema path.
    const castProbe = await request('POST', '/api/leads/apply', {
      body: {
        fullName: 'Cast Probe',
        email: `cast-probe-${Date.now()}@example.com`,
        phone: '+1 555 0142',
        targetCourse: 'not-an-object-id',
      },
    });
    const castText = JSON.stringify(castProbe.json || {});
    check('A malformed targetCourse is a 400', castProbe.status === 400, `HTTP ${castProbe.status}`);
    check(
      'A malformed targetCourse returns VALIDATION_ERROR',
      castProbe.json?.code === 'VALIDATION_ERROR' && castProbe.json?.success === false,
      castText.slice(0, 90),
    );
    check(
      'A malformed targetCourse names no model, path or driver text',
      !/cast|objectid|mongoose|"model"|at path|node_modules|\.[.\\/]server/i.test(castText),
      castText.slice(0, 110),
    );

    // Well-formed but nonexistent: a dangling reference must not be stored.
    const ghostCourse = await request('POST', '/api/leads/apply', {
      body: {
        fullName: 'Ghost Course Probe',
        email: `ghost-course-${Date.now()}@example.com`,
        phone: '+1 555 0143',
        targetCourse: '000000000000000000000000',
      },
    });
    check(
      'A course id that does not exist is refused cleanly',
      ghostCourse.status === 400 && ghostCourse.json?.code === 'VALIDATION_ERROR'
        && !/cast|mongoose|objectid/i.test(JSON.stringify(ghostCourse.json || {})),
      `HTTP ${ghostCourse.status}`,
    );

    // The happy paths must keep working: no course at all, and a real course.
    const courseCreate = await request('POST', '/api/courses', {
      token: freshToken,
      body: {
        title: `Security Contract Course ${Date.now()}`,
        category: 'Data Science',
        duration: '4 Weeks',
        pricing: { originalPrice: 1200, discountedPrice: 999 },
      },
    });
    const contractCourseId = courseCreate.json?.course?._id;
    // Without a real id the "real course" check below would pass on the
    // no-course path, which is exactly the kind of vacuous green this suite
    // exists to prevent.
    check('A fixture course exists to apply against', Boolean(contractCourseId), `HTTP ${courseCreate.status}`);

    const noCourse = await request('POST', '/api/leads/apply', {
      body: {
        fullName: 'No Course Probe',
        email: `no-course-${Date.now()}@example.com`,
        phone: '+1 555 0144',
      },
    });
    check('Applying without a target course still succeeds', noCourse.status === 201, `HTTP ${noCourse.status}`);

    const realCourse = await request('POST', '/api/leads/apply', {
      body: {
        fullName: 'Real Course Probe',
        email: `real-course-${Date.now()}@example.com`,
        phone: '+1 555 0145',
        targetCourse: contractCourseId,
      },
    });
    check('Applying against a real course still succeeds', realCourse.status === 201, `HTTP ${realCourse.status}`);
    if (realCourse.json?.leadId && freshToken) {
      const stored = await request('GET', `/api/leads/${realCourse.json.leadId}`, { token: freshToken });
      check(
        'The stored lead keeps the course the applicant picked',
        String(stored.json?.lead?.targetCourse?._id || stored.json?.lead?.targetCourse) === String(contractCourseId),
        `HTTP ${stored.status}`,
      );
    }

    // Every admin route that takes an :id gets the same treatment, because the
    // mapping lives in the shared error helpers rather than in one controller.
    const badLeadId = await request('GET', '/api/leads/not-an-id', { token: freshToken });
    const badLeadText = JSON.stringify(badLeadId.json || {});
    check(
      'A malformed lead id is a 400 with no mongoose text',
      badLeadId.status === 400 && badLeadId.json?.code === 'VALIDATION_ERROR'
        && !/cast|mongoose|objectid|"model"|node_modules/i.test(badLeadText),
      `HTTP ${badLeadId.status} ${badLeadText.slice(0, 80)}`,
    );

    const notFoundLead = await request('GET', '/api/leads/000000000000000000000000', { token: freshToken });
    check(
      'A well-formed id that matches no row is still a plain 404',
      notFoundLead.status === 404 && !/cast|mongoose/i.test(JSON.stringify(notFoundLead.json || {})),
      `HTTP ${notFoundLead.status}`,
    );

    // Clean up the fixture course so the throwaway database can be dropped clean.
    if (contractCourseId) {
      const removedCourse = await request('DELETE', `/api/courses/${contractCourseId}`, { token: freshToken });
      check('The fixture course is removed again', removedCourse.status === 200, `HTTP ${removedCourse.status}`);
    }

    // ══════════════════════════════════════════════════════════════════════
    check('The server never logged a Stripe secret', !serverLog.includes(SECRET_KEY));
  } finally {
    await shutdown();
  }

  const passed = results.filter((r) => r.passed).length;
  console.log(`\n${passed}/${results.length} checks passed\n`);
  process.exit(passed === results.length ? 0 : 1);
};

run().catch(async (error) => {
  console.error(`\nSuite crashed: ${error.message}\n`);
  process.exit(1);
});
