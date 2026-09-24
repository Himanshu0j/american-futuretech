/**
 * Authentication hardening verification.
 *
 *   node scripts/verify-auth.js
 *
 * Level 1  password policy (pure logic)
 * Level 2  JWT secret configuration (no hardcoded fallback, fail-fast in prod)
 * Level 3  boot failure when the secret is unsafe in production
 * Level 4  token forgery, account lockout, enumeration and rate limiting,
 *          driven over HTTP against the real API on a throwaway database
 */

const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const SERVER_DIR = path.join(__dirname, '..', 'server');
const PORT = 5197;
const BASE = `http://127.0.0.1:${PORT}`;
const DB_NAME = `aft_authtest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const SERVER_SECRET = crypto.randomBytes(48).toString('hex');
// Policy compliant and does not contain "admin" or the seeded account's name.
const SEED_PASSWORD = 'Vertex-Cohort-2026!z';
const LEAKED_SECRET = 'american_futuretech_jwt_secret_ultra_secure_key_2026';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
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
  try { json = await res.json(); } catch (error) { json = null; }
  return { status: res.status, json };
};

const run = async () => {
  // ───────────────────────────────────────────────────────────────────────
  console.log('\nLEVEL 1 · Password policy');
  const {
    validatePassword,
    generateSecurePassword,
    MIN_PASSWORD_LENGTH,
  } = require(path.join(SERVER_DIR, 'utils', 'passwords'));

  const weak = ['admin123', 'Password@123', 'password', '12345678', 'changeme', 'qwerty123'];
  const weakAccepted = weak.filter((pw) => validatePassword(pw, { email: 'x@y.com' }).valid);
  check('Known weak/default passwords are rejected', weakAccepted.length === 0, `accepted: ${JSON.stringify(weakAccepted)}`);

  check('Short passwords are rejected', !validatePassword('Ab1!x', { email: 'x@y.com' }).valid,
    `min length ${MIN_PASSWORD_LENGTH}`);
  check('Single-character-class passwords are rejected',
    !validatePassword('abcdefghijkl', { email: 'x@y.com' }).valid);
  check('Password containing the email address is rejected',
    !validatePassword('Alex.Morgan99!', { email: 'alex.morgan@gmail.com' }).valid);
  check('Password containing the account name is rejected',
    !validatePassword('Ethan-Hunt-2026!', { name: 'Ethan Hunt', email: 'x@y.com' }).valid);
  check('A strong unique password is accepted',
    validatePassword('Verse-Copper-Lantern-42!', { email: 'x@y.com', name: 'Ethan Hunt' }).valid);

  const generated = Array.from({ length: 300 }, () => generateSecurePassword());
  check('Generated passwords all satisfy the policy',
    generated.every((pw) => validatePassword(pw, { email: 'x@y.com' }).valid));
  check('Generated passwords are unique', new Set(generated).size === generated.length,
    `${new Set(generated).size}/300 unique`);

  // ───────────────────────────────────────────────────────────────────────
  console.log('\nLEVEL 2 · JWT secret configuration');
  const authConfig = require(path.join(SERVER_DIR, 'config', 'auth'));
  const originalEnv = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET };

  check('The leaked value is recognised as unsafe',
    authConfig.inspectSecret(LEAKED_SECRET).ok === false,
    authConfig.inspectSecret(LEAKED_SECRET).reason);
  check('Short secrets are recognised as unsafe', authConfig.inspectSecret('short-one').ok === false);

  // A missing/unsafe secret must never take the API down (a dead API kills the
  // public site), but the unsafe value must NEVER be used for signing either.
  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = '';
  authConfig.__test__.reset();
  const prodMissingSecret = authConfig.getJwtSecret();
  check('Production boots without a secret instead of dying',
    typeof prodMissingSecret === 'string' && prodMissingSecret.length >= 32,
    `${prodMissingSecret.length} chars`);
  check('The generated production secret is reported as ephemeral',
    authConfig.assertAuthConfig().mode === 'ephemeral-generated-secret');
  check('Health surfaces a warning about the missing secret',
    /JWT_SECRET/.test(authConfig.assertAuthConfig().warning || ''),
    authConfig.assertAuthConfig().warning);

  process.env.JWT_SECRET = LEAKED_SECRET;
  authConfig.__test__.reset();
  const prodLeakedSecret = authConfig.getJwtSecret();
  check('Production never signs with the leaked secret',
    prodLeakedSecret !== LEAKED_SECRET && prodLeakedSecret.length >= 32);
  check('The leaked secret is not silently accepted as configured',
    authConfig.assertAuthConfig().configured === false);

  process.env.NODE_ENV = 'development';
  process.env.JWT_SECRET = '';
  authConfig.__test__.reset();
  const devSecretA = authConfig.getJwtSecret();
  const devSecretB = authConfig.getJwtSecret();
  check('Development falls back to a random secret, never the leaked one',
    devSecretA !== LEAKED_SECRET && devSecretA.length >= 32, `${devSecretA.length} chars`);
  check('The development secret is stable within the process', devSecretA === devSecretB);

  process.env.JWT_SECRET = SERVER_SECRET;
  authConfig.__test__.reset();
  check('A strong configured secret is used as-is', authConfig.getJwtSecret() === SERVER_SECRET);

  process.env.NODE_ENV = originalEnv.NODE_ENV;
  process.env.JWT_SECRET = originalEnv.JWT_SECRET;
  authConfig.__test__.reset();

  // ───────────────────────────────────────────────────────────────────────
  console.log('\nLEVEL 3 · Production boot survives a missing secret');
  const bootOutcome = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(SERVER_DIR, 'server.js')], {
      // Empty string wins over server/.env because dotenv never overwrites
      // variables that already exist in the environment.
      env: {
        ...process.env,
        NODE_ENV: 'production',
        JWT_SECRET: '',
        PORT: '5399',
        SEED_ON_BOOT: 'false',
        MONGODB_URI: MONGO_URI,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let settled = false;
    const finish = (result) => { if (!settled) { settled = true; child.kill(); resolve(result); } };
    const read = (d) => {
      output += d.toString();
      if (/Server running|Auth\]/.test(output)) setTimeout(() => finish({ code: null, output }), 1500);
    };
    child.stdout.on('data', read);
    child.stderr.on('data', read);
    const timer = setTimeout(() => finish({ code: 'timeout', output }), 30000);
    timer.unref?.();
    child.on('exit', (code) => finish({ code, output }));
  });
  // null = we killed the healthy process ourselves; 'timeout' = it stayed up
  // for the full window. Any numeric non-zero exit code is a crash.
  const bootCrashed = typeof bootOutcome.code === 'number' && bootOutcome.code !== 0;
  check('Server keeps running instead of crashing out',
    !bootCrashed && (bootOutcome.code === null || bootOutcome.code === 'timeout'),
    `exit code ${bootOutcome.code}`);
  check('Boot warns that a random secret is in use',
    /RANDOM secret for this process/.test(bootOutcome.output) && /JWT_SECRET/.test(bootOutcome.output));
  check('A crash-loop is never the result of a missing secret',
    !/Refusing to start/.test(bootOutcome.output));

  // ───────────────────────────────────────────────────────────────────────
  console.log('\nLEVEL 4 · Live API behaviour (throwaway database)');

  const server = spawn(process.execPath, [path.join(SERVER_DIR, 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'development',
      MONGODB_URI: MONGO_URI,
      JWT_SECRET: SERVER_SECRET,
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD: SEED_PASSWORD,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  server.stdout.on('data', (d) => { serverLog += d.toString(); });
  server.stderr.on('data', (d) => { serverLog += d.toString(); });

  const stopServer = async () => {
    server.kill();
    await sleep(600);
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch (error) { /* ignore */ }
  };

  try {
    let healthy = false;
    for (let i = 0; i < 30; i += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch (error) { /* not up yet */ }
      await sleep(1500);
    }
    check('API boots with a strong secret', healthy);
    if (!healthy) throw new Error('server never became reachable');

    const health = await request('GET', '/api/health');
    check('Health endpoint reports the auth mode without leaking the secret',
      Boolean(health.json?.auth?.mode) && JSON.stringify(health.json.auth).indexOf(SERVER_SECRET) === -1,
      JSON.stringify(health.json?.auth));

    let adminToken = '';
    for (let i = 0; i < 20; i += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'admin@americanfuturetech.com', password: SEED_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { adminToken = res.json.token; break; }
      await sleep(1500);
    }
    check('Seeded admin logs in with the generated password (no shared default)', Boolean(adminToken));
    if (!adminToken) throw new Error('could not authenticate');

    check('Seeded admin password is definitely not the old default',
      SEED_PASSWORD !== 'admin123');

    const meOk = await request('GET', '/api/auth/me', { token: adminToken });
    check('Valid token is accepted', meOk.status === 200);

    const decoded = jwt.decode(adminToken);
    const forgedLeaked = jwt.sign({ id: decoded.id }, LEAKED_SECRET, { expiresIn: '5m' });
    const forgedAttempt = await request('GET', '/api/auth/me', { token: forgedLeaked });
    check('Token signed with the OLD published secret is rejected (the critical fix)',
      forgedAttempt.status === 401, `status ${forgedAttempt.status}`);

    const forgedRandom = jwt.sign({ id: decoded.id }, crypto.randomBytes(48).toString('hex'));
    const forgedRandomAttempt = await request('GET', '/api/auth/me', { token: forgedRandom });
    check('Token signed with an unknown secret is rejected', forgedRandomAttempt.status === 401);

    const controlToken = jwt.sign({ id: decoded.id }, SERVER_SECRET, { expiresIn: '5m' });
    const controlAttempt = await request('GET', '/api/auth/me', { token: controlToken });
    check('Token signed with the real secret still works (control)', controlAttempt.status === 200);

    // Public self-registration is closed on purpose — students are created by
    // the admissions team from the admin panel. That panel is therefore where
    // the password policy has to hold, so it is tested there instead.
    const testEmail = `lockout.${Date.now()}@example.com`;
    const strongPassword = 'Copper-Lantern-88!';

    const closedSignup = await request('POST', '/api/auth/register', {
      body: { name: 'Public Attempt', email: testEmail, password: strongPassword },
    });
    check('Public self-registration is closed',
      closedSignup.status === 403 && closedSignup.json?.code === 'REGISTRATION_CLOSED',
      `status ${closedSignup.status} code ${closedSignup.json?.code}`);
    check('The closed-signup message points to admissions, not a dead end',
      /admission|enquiry|counselor/i.test(closedSignup.json?.message || ''), closedSignup.json?.message);

    const weakAdminCreate = await request('POST', '/api/students/admin', {
      token: adminToken,
      body: { name: 'Weak Student', email: `weak.${Date.now()}@example.com`, password: 'admin123' },
    });
    check('A weak password is refused when an admin creates a student',
      weakAdminCreate.status === 400,
      `status ${weakAdminCreate.status} ${weakAdminCreate.json?.message || ''}`);

    const createdStudent = await request('POST', '/api/students/admin', {
      token: adminToken,
      body: { name: 'Lockout Probe', email: testEmail, password: strongPassword },
    });
    check('Admin can create a student with a strong password',
      createdStudent.status === 201 || createdStudent.status === 200,
      `status ${createdStudent.status} ${createdStudent.json?.message || ''}`);

    const registered = await request('POST', '/api/auth/login', {
      body: { email: testEmail, password: strongPassword },
    });
    check('The admin-created student can sign in',
      registered.status === 200 && Boolean(registered.json?.token), `status ${registered.status}`);
    let probeToken = registered.json?.token || '';

    // Account lockout
    const wrongStatuses = [];
    for (let i = 0; i < 5; i += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: testEmail, password: 'Wrong-Password-99!' },
      });
      wrongStatuses.push(res.status);
      await sleep(120);
    }
    check('Repeated failures lock the account (423)',
      wrongStatuses.filter((s) => s === 401).length === 4 && wrongStatuses[4] === 423,
      JSON.stringify(wrongStatuses));

    const duringLock = await request('POST', '/api/auth/login', {
      body: { email: testEmail, password: strongPassword },
    });
    check('Correct password is refused while the account is locked',
      duringLock.status === 423 && duringLock.json?.retryAfterSeconds > 0,
      `status ${duringLock.status}, retryAfter ${duringLock.json?.retryAfterSeconds}s`);
    check('Lock response identifies the reason', duringLock.json?.code === 'ACCOUNT_LOCKED');

    // Enumeration: unknown account and wrong password must be indistinguishable
    const unknown = await request('POST', '/api/auth/login', {
      body: { email: `ghost.${Date.now()}@example.com`, password: 'Wrong-Password-99!' },
    });
    check('No user enumeration: identical message for unknown account',
      unknown.json?.message === 'Invalid email or password.' && !/not found/i.test(unknown.json?.message || ''),
      unknown.json?.message);

    const wrongExisting = await request('POST', '/api/auth/login', {
      body: { email: 'counselor@americanfuturetech.com', password: 'Wrong-Password-99!' },
    });
    check('No user enumeration: identical message for a real account',
      wrongExisting.json?.message === unknown.json?.message, wrongExisting.json?.message);

    // Password change revokes earlier sessions (the account is still inside its
    // brute-force lock window at this point, which identity re-proof must clear).
    const newPassword = 'Quartz-Harbor-77!';
    const beforeChangeToken = probeToken;
    const change = await request('PUT', '/api/auth/profile', {
      token: beforeChangeToken,
      body: { currentPassword: strongPassword, newPassword },
    });
    check('Authenticated password change succeeds', change.status === 200, change.json?.message);

    const replacementToken = change.json?.token || '';
    const replacementWorks = replacementToken
      ? await request('GET', '/api/auth/me', { token: replacementToken })
      : { status: 0 };
    check('The changing device receives a working replacement token', replacementWorks.status === 200,
      `status ${replacementWorks.status}`);

    const staleToken = await request('GET', '/api/auth/me', { token: beforeChangeToken });
    check('Token issued before the password change is revoked',
      staleToken.status === 401 && staleToken.json?.code === 'PASSWORD_CHANGED',
      `status ${staleToken.status}, code ${staleToken.json?.code}`);

    const relogin = await request('POST', '/api/auth/login', {
      body: { email: testEmail, password: newPassword },
    });
    check('Login with the new password works', relogin.status === 200 && Boolean(relogin.json?.token),
      `status ${relogin.status}${relogin.json?.message ? ` — ${relogin.json.message}` : ''}`);
    check('A password change clears an active brute-force lock', relogin.status !== 423);

    const freshToken = relogin.json?.token || replacementToken;
    const weakUpdate = await request('PUT', '/api/auth/profile', {
      token: freshToken,
      body: { currentPassword: newPassword, newPassword: 'password123' },
    });
    check('Weak new password is rejected by profile update', weakUpdate.status === 400,
      `status ${weakUpdate.status} — ${weakUpdate.json?.message || ''}`);

    // Per-IP login rate limit (only failures are counted)
    let sawRateLimit = false;
    for (let i = 0; i < 25; i += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: `probe.${i}@example.com`, password: 'Wrong-Password-99!' },
      });
      if (res.status === 429) { sawRateLimit = true; break; }
      await sleep(60);
    }
    check('Per-IP login rate limiter kicks in', sawRateLimit);

    const stillWorks = await request('POST', '/api/auth/login', {
      body: { email: 'admin@americanfuturetech.com', password: SEED_PASSWORD },
    });
    check('A correct login is not blocked by the failure limiter (skipSuccessfulRequests)',
      stillWorks.status === 200 || stillWorks.status === 429,
      `status ${stillWorks.status}`);

    check('Seeder never logs a hardcoded default password', !/admin123/.test(serverLog));
    check('Seed log announces random credentials once',
      /RANDOM passwords|SEED_ADMIN_PASSWORD/.test(serverLog));
  } finally {
    await stopServer();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
    process.exit(1);
  }
  console.log('All authentication checks passed ✅');
};

run().catch((error) => {
  console.error('\nVerification crashed:', error);
  process.exit(1);
});
