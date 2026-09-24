/**
 * Deployed-database verification.
 *
 *   node scripts/verify-db.js                          # checks the live API
 *   node scripts/verify-db.js http://localhost:5000    # checks any deployment
 *   API_BASE=https://... node scripts/verify-db.js     # same, via env
 *
 * Answers the one question the admin panel cannot: WILL CONTENT SURVIVE A
 * RESTART? On an ephemeral in-memory database every redeploy wipes courses,
 * curriculum and everything the client typed, which is why admin edits looked
 * like they "did not save".
 *
 * Exits non-zero while the database is still ephemeral, so this can gate a
 * deploy instead of being a report nobody reads.
 */

const DEFAULT_BASE = 'https://american-futuretech-api.onrender.com';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const warn = (name, detail = '') => {
  results.push({ name, passed: true, detail, warn: true });
  console.log(`  ⚠️  ${name}${detail ? ` — ${detail}` : ''}`);
};

const base = (process.argv[2] || process.env.API_BASE || DEFAULT_BASE).replace(/\/+$/, '');

const run = async () => {
  console.log(`\nChecking deployment: ${base}\n`);

  let health;
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) {
      check('API responds to /api/health', false, `status=${res.status}`);
      return;
    }
    health = await res.json();
  } catch (err) {
    check('API responds to /api/health', false, err.message);
    console.log('\n  The host may be cold-starting. Wait a minute and run again.');
    return;
  }

  check('API responds to /api/health', true, `status=${health.status}`);

  // ── The decisive check ────────────────────────────────────────────────
  const db = health.database || {};
  const persistent = db.mode === 'external' && db.ephemeral === false;

  check(
    'Database is persistent (content survives a restart)',
    persistent,
    persistent ? `mode=${db.mode} host=${db.host}` : `mode=${db.mode} — data is WIPED on every restart`
  );
  check('MONGODB_URI is configured in the deployment env', db.uriConfigured === true);
  check('Database connection is live', db.connected === true, `database=${db.database || 'n/a'}`);

  // ── Degradation guard: stops a missing/typo'd URI from silently wiping data
  if (persistent && !db.persistedRequired) {
    warn(
      'Persistence is not locked in yet',
      'set REQUIRE_PERSISTENT_DB=true so the API refuses to boot on a temporary database instead of quietly losing admin content'
    );
  } else if (db.persistedRequired) {
    check('Persistence is locked in', true, 'REQUIRE_PERSISTENT_DB=true — a temporary database can no longer boot');
  }

  // ── Supporting config, reported so nothing is discovered in a live demo ─
  const auth = health.auth || {};
  if (auth.warning) {
    warn('Auth config needs attention', auth.warning);
  } else {
    check('Auth secret is configured', true, auth.source ? `source=${auth.source}` : '');
  }

  const payments = health.payments || {};
  if (payments.ready) {
    check('Stripe is configured and ready', true, `mode=${payments.mode} source=${payments.source}`);
  } else {
    warn(
      'Stripe is not configured',
      payments.warning || 'checkout falls back to a manual admissions enquiry — no fake success'
    );
  }

  if (Array.isArray(health.warnings) && health.warnings.length) {
    console.log('\n  Deployment warnings:');
    health.warnings.forEach((w) => console.log(`   • ${w}`));
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'─'.repeat(64)}`);
  if (persistent) {
    console.log('RESULT: content is stored in a real database — admin edits persist ✅');
    if (!db.persistedRequired) {
      console.log('\nLast step (recommended): add REQUIRE_PERSISTENT_DB=true to the deployment');
      console.log('env. Until then a missing or mistyped MONGODB_URI at some future deploy');
      console.log('would silently move this service onto a temporary database.');
    }
  } else {
    console.log(`RESULT: ${failed.length} check(s) failed — THIS DEPLOYMENT LOSES DATA ON RESTART ❌`);
    console.log('\nFix: MongoDB Atlas (free M0) → copy the connection string, then on the');
    console.log('host add MONGODB_URI as an environment variable and redeploy.');
    console.log('Set SEED_ADMIN_PASSWORD in the same step, or the fresh database will');
    console.log('seed a random admin password and the current one stops working.');
  }
  console.log(`${'─'.repeat(64)}\n`);

  if (!persistent) process.exitCode = 1;
};

run();
