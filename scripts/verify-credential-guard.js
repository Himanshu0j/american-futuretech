/**
 * Credential-hardening contract test.
 *
 *   npm run verify:credentials
 *
 * The live site once shipped a shared demo password ("admin123") that was also
 * readable on a public login page. Three things must stay true forever after:
 *
 *   1. A weak SEED_ADMIN_PASSWORD is REFUSED on a persistent database — it can
 *      never be re-created there, so a database reset cannot undo a rotation.
 *   2. A strong SEED_ADMIN_PASSWORD still works, so the documented escape hatch
 *      (pinning credentials on a throwaway database) is not broken.
 *   3. `npm run seed` refuses to wipe a database that is not throwaway, and
 *      deletes nothing when it refuses.
 *
 * Runs entirely against throwaway databases on the local test engine.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const LEAKED = 'admin123';
const STRONG = 'Zq7-verify-Strong-Seed-Pass!';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => {
  console.log(`\n${'─'.repeat(64)}\n${title}\n${'─'.repeat(64)}`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uriFor = (label) => `mongodb://127.0.0.1:27018/aft_credguard_${label}_${Date.now()}`;

const request = async (base, method, url, { body } = {}) => {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try { json = await res.json(); } catch (error) { json = null; }
  return { status: res.status, json };
};

const bootApi = async (port, uri, seedPassword) => {
  const env = {
    ...process.env,
    PORT: String(port),
    MONGODB_URI: uri,
    NODE_ENV: 'development',
    JWT_SECRET: 'credential_guard_secret_long_enough_00001',
  };
  if (seedPassword === null) delete env.SEED_ADMIN_PASSWORD;
  else env.SEED_ADMIN_PASSWORD = seedPassword;

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (chunk) => { log += chunk.toString(); });
  server.stderr.on('data', (chunk) => { log += chunk.toString(); });

  const base = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    try {
      const res = await request(base, 'GET', '/api/health');
      if (res.status === 200) return { server, base, log: () => log };
    } catch (error) { /* not ready */ }
    await sleep(1200);
  }
  return { server, base, log: () => log };
};

const waitForSeed = async (base, log, expect) => {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (expect.test(log())) return true;
    const res = await request(base, 'POST', '/api/auth/login', {
      body: { email: 'admin@americanfuturetech.com', password: LEAKED },
    });
    if (res.status === 200 || res.status === 401) {
      // Seeding has written the account once a login is answerable at all.
      if (expect.test(log())) return true;
    }
    await sleep(1200);
  }
  return expect.test(log());
};

const login = (base, password) => request(base, 'POST', '/api/auth/login', {
  body: { email: 'admin@americanfuturetech.com', password },
});

const runSeedScript = (uri, extraArgs = []) => new Promise((resolve) => {
  const child = spawn(
    process.execPath,
    [path.join(__dirname, '..', 'server', 'seed.js'), ...extraArgs],
    {
      env: { ...process.env, MONGODB_URI: uri, JWT_SECRET: 'credential_guard_secret_long_enough_00001' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let out = '';
  child.stdout.on('data', (c) => { out += c.toString(); });
  child.stderr.on('data', (c) => { out += c.toString(); });
  child.on('close', (code) => resolve({ code, out }));
  setTimeout(() => { child.kill(); resolve({ code: -1, out: out + '\n[timed out]' }); }, 60000);
});

const run = async () => {
  const cleanup = [];

  // ── 1. Weak seed password is refused on a persistent database ────────────
  section('1. A published default can never be seeded onto a persistent database');
  const uriA = uriFor('weak');
  const a = await bootApi(5601, uriA, LEAKED);
  cleanup.push({ server: a.server, uri: uriA });

  await waitForSeed(a.base, a.log, /REFUSED|RANDOM passwords/);
  check(
    'boot log refuses the weak SEED_ADMIN_PASSWORD',
    /REFUSED/.test(a.log()),
    (a.log().match(/🚨 \[Seed\] SEED_ADMIN_PASSWORD was REFUSED[^\n]*/) || ['(no refusal line)'])[0].slice(0, 90),
  );

  const weakLogin = await login(a.base, LEAKED);
  check('the published default does NOT authenticate', weakLogin.status === 401, `HTTP ${weakLogin.status}`);

  const generated = (a.log().match(/SUPERADMIN\s+admin@americanfuturetech\.com\s+\/ (\S+)/) || [])[1];
  check('a random password was generated instead and printed once', Boolean(generated));

  if (generated) {
    const strongLogin = await login(a.base, generated);
    check('the generated password authenticates', strongLogin.status === 200, `HTTP ${strongLogin.status}`);
  }

  // ── 2. The documented escape hatch still works ───────────────────────────
  section('2. A strong SEED_ADMIN_PASSWORD is still honoured (ephemeral escape hatch)');
  const uriB = uriFor('strong');
  const b = await bootApi(5602, uriB, STRONG);
  cleanup.push({ server: b.server, uri: uriB });

  await waitForSeed(b.base, b.log, /Demo accounts created with SEED_ADMIN_PASSWORD/);
  check('no refusal for a policy-compliant seed password', !/REFUSED/.test(b.log()));

  let strongOk = { status: 0 };
  for (let attempt = 0; attempt < 30; attempt += 1) {
    strongOk = await login(b.base, STRONG);
    if (strongOk.status === 200) break;
    await sleep(1200);
  }
  check('the configured strong password authenticates', strongOk.status === 200, `HTTP ${strongOk.status}`);

  // ── 3. The destructive seeder refuses a non-throwaway database ───────────
  section('3. `npm run seed` cannot silently wipe a real database');
  const before = await mongoose.connect(uriB, { serverSelectionTimeoutMS: 8000 });
  const usersBefore = await mongoose.connection.db.collection('users').countDocuments();
  await mongoose.disconnect();

  const blocked = await runSeedScript(uriB);
  check('seed.js exits non-zero without the explicit opt-in', blocked.code !== 0, `exit ${blocked.code}`);
  check(
    'seed.js explains why it refused',
    /Refusing to run/.test(blocked.out) && /--yes-destroy-data/.test(blocked.out),
  );

  await mongoose.connect(uriB, { serverSelectionTimeoutMS: 8000 });
  const usersAfter = await mongoose.connection.db.collection('users').countDocuments();
  await mongoose.disconnect();
  check(
    'nothing was deleted while refusing',
    usersAfter === usersBefore && usersAfter > 0,
    `${usersBefore} → ${usersAfter} users`,
  );

  const stillWorks = await login(b.base, STRONG);
  check('the refusal left the running app fully functional', stillWorks.status === 200, `HTTP ${stillWorks.status}`);

  // ── Cleanup ─────────────────────────────────────────────────────────────
  for (const item of cleanup) {
    item.server.kill();
    await sleep(500);
    try {
      await mongoose.connect(item.uri, { serverSelectionTimeoutMS: 5000 });
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch (error) {
      console.log(`  (cleanup note: ${error.message})`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  console.log(`\n${passed}/${results.length} checks passed\n`);
  process.exit(passed === results.length ? 0 : 1);
};

run().catch(async (error) => {
  console.error(`\nSuite crashed: ${error.message}\n`);
  process.exit(1);
});
