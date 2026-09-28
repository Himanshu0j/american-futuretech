#!/usr/bin/env node
/**
 * American FutureTech — DEPLOY provenance check.
 *
 * Every other verify:* suite answers "is the code in this repo correct?". This
 * one answers a different question: "did the commit I just pushed actually reach
 * the two live deployments?" Vercel keeping the previous bundle, or Render
 * failing to rebuild, is invisible from a browser — the site loads either way.
 *
 * How each side reports its revision:
 *   - Vercel : client/vite.config.js stamps the built index.html with
 *              <meta name="x-aft-commit"> (from VERCEL_GIT_COMMIT_SHA).
 *   - Render : /api/health reports `build.commit` (from RENDER_GIT_COMMIT).
 *
 * Both are compared against this checkout's HEAD. On top of the revision match
 * the script also exercises behaviour that only the current code produces (the
 * reservation allowlist), so a deploy that reports the right SHA while still
 * running a stale process is caught too.
 *
 * Usage:
 *   npm run verify:deploy
 *   EXPECTED_COMMIT=<sha> npm run verify:deploy          # audit a rollback
 *   EXPECT_DEPOSIT_OPTIONS=99,499 npm run verify:deploy   # if the menu changes
 *   SITE_URL=http://localhost:5273 API_URL=http://localhost:5050 npm run verify:deploy
 *
 * Exit code is 0 only when both deployments are serving the expected commit.
 */

const path = require('path');
const { execSync } = require('node:child_process');

const SITE = (process.env.SITE_URL || 'https://american-futuretech.vercel.app').replace(/\/+$/, '');
const API = (process.env.API_URL || 'https://american-futuretech-api.onrender.com').replace(/\/+$/, '');
const ROOT = path.join(__dirname, '..');

/** The reservation amounts server/utils/pricing.js is allowed to honour. */
const DEPOSIT_OPTIONS = (process.env.EXPECT_DEPOSIT_OPTIONS || '99,499')
  .split(',')
  .map((value) => Number(String(value).trim()))
  .filter((value) => Number.isFinite(value) && value > 0);
const HONOURED_DEPOSIT = DEPOSIT_OPTIONS.length ? Math.max(...DEPOSIT_OPTIONS) : 499;
// One more than the largest allowed amount can never itself be on the menu, so
// it is a safe "off-menu" probe without hardcoding a rejection value.
const OFF_MENU_DEPOSIT = HONOURED_DEPOSIT + 1;

const git = (args) => {
  try {
    return execSync(`git ${args}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch (error) {
    return '';
  }
};

const EXPECTED = (process.env.EXPECTED_COMMIT || git('rev-parse HEAD')).trim();
const EXPECTED_BRANCH = git('rev-parse --abbrev-ref HEAD');

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const results = [];
const failures = [];

const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  if (!passed) failures.push({ name, detail });
  const mark = passed ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
  console.log(`  ${mark}  ${name}${detail ? `  ${C.dim}${detail}${C.reset}` : ''}`);
};

const section = (title) => console.log(`\n${C.bold}${C.cyan}── ${title}${C.reset}`);
const note = (msg) => console.log(`  ${C.dim}${msg}${C.reset}`);
const warn = (msg) => console.log(`  ${C.yellow}!${C.reset} ${msg}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const short = (sha) => (sha ? String(sha).trim().slice(0, 8) : '(none)');

/**
 * True when both refer to the same revision. Allows a short SHA (Vercel can be
 * configured with a length other than 40) against a full one, but never matches
 * on fewer than 7 characters.
 */
const shaMatch = (a, b) => {
  const x = String(a || '').trim().toLowerCase();
  const y = String(b || '').trim().toLowerCase();
  if (!x || !y) return false;
  const len = Math.min(x.length, y.length);
  return len >= 7 && x.slice(0, len) === y.slice(0, len);
};

/**
 * Render's free tier sleeps after ~15 idle minutes, and a 502/503 during a
 * redeploy is transient: retry transport errors and gateway statuses, but let a
 * real application answer (including a 500) through so it fails the check.
 */
const ATTEMPTS = 4;
const request = async (url, init = {}) => {
  const headers = {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    ...(init.headers || {}),
  };
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(url, { ...init, headers });
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (error) {
        /* non-JSON body */
      }
      if ([502, 503, 504].includes(res.status) && attempt < ATTEMPTS) {
        lastError = new Error(`HTTP ${res.status}`);
      } else {
        return { status: res.status, ok: res.ok, text, json };
      }
    } catch (error) {
      lastError = error;
    }
    const waitMs = 2000 * 2 ** (attempt - 1);
    note(`retrying ${url} in ${waitMs / 1000}s (${lastError?.message})`);
    await sleep(waitMs);
  }
  throw new Error(`${url} failed after ${ATTEMPTS} attempts: ${lastError?.message}`);
};

/** Reads a <meta name> tag regardless of attribute order or self-closing form. */
const readMeta = (html, name) => {
  if (!html) return '';
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]*name=["']${escaped}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${escaped}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
};

const run = async () => {
  console.log(`\n${C.bold}American FutureTech — deploy provenance check${C.reset}`);
  console.log(`${C.dim}site : ${SITE}`);
  console.log(`api  : ${API}`);
  console.log(
    `head : ${short(EXPECTED)}${EXPECTED_BRANCH ? ` on ${EXPECTED_BRANCH}` : ''}${
      process.env.EXPECTED_COMMIT ? ' (EXPECTED_COMMIT)' : ''
    }${C.reset}`,
  );

  // ── 0. What are we expecting? ──────────────────────────────────────────────
  section('0. Expected revision');
  check('This checkout resolves to a commit', /^[0-9a-f]{7,40}$/i.test(EXPECTED), short(EXPECTED));

  // ── 1. Vercel ─────────────────────────────────────────────────────────────
  section('1. Vercel — front-end build');
  let html = '';
  try {
    const res = await request(`${SITE}/`);
    html = res.text;
    check('Site root answers', res.status === 200, `status=${res.status}`);
  } catch (error) {
    check('Site root answers', false, error.message);
  }
  check('Served page is the app shell', /id="root"/.test(html));

  const stampCommit = readMeta(html, 'x-aft-commit');
  const stampBranch = readMeta(html, 'x-aft-branch');
  const stampAt = readMeta(html, 'x-aft-built-at');

  check(
    'Build reports a commit stamp',
    Boolean(stampCommit) && stampCommit !== 'unknown',
    stampCommit && stampCommit !== 'unknown'
      ? short(stampCommit)
      : 'no x-aft-commit meta — this build predates the stamp; redeploy to enable verification',
  );
  if (stampCommit && stampCommit !== 'unknown') {
    check('Vercel serves the expected commit', shaMatch(stampCommit, EXPECTED), `${short(stampCommit)} vs ${short(EXPECTED)}`);
  }
  if (stampBranch && stampBranch !== 'unknown') note(`built from branch ${stampBranch}`);
  if (stampAt) {
    const builtAt = new Date(stampAt);
    note(`built at ${Number.isNaN(builtAt.getTime()) ? stampAt : builtAt.toISOString()}`);
  }

  const entryChunk = (html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];
  check('Served HTML references an entry bundle', Boolean(entryChunk), entryChunk || 'no /assets/index-*.js reference');
  if (entryChunk) {
    try {
      const res = await request(`${SITE}${entryChunk}`);
      check('Entry bundle downloads', res.status === 200 && res.text.length > 1000, `status=${res.status} bytes=${res.text.length}`);
    } catch (error) {
      check('Entry bundle downloads', false, error.message);
    }
  }

  // ── 2. Render ─────────────────────────────────────────────────────────────
  section('2. Render — API');
  let health = null;
  for (let attempt = 0; attempt < 12 && !health; attempt += 1) {
    try {
      const res = await request(`${API}/api/health`);
      if (res.status === 200 && res.json) health = res.json;
    } catch (error) {
      /* cold start */
    }
    if (!health) await sleep(4000);
  }
  check('Live API answers /api/health', Boolean(health), health ? '' : 'no response after ~48s — free-tier cold start, or the service is down');

  if (health) {
    check('API status is online', health.status === 'online', `status=${health.status}`);
    const db = health.database || health.db || {};
    check('Database is connected', db.connected === true, `connected=${db.connected} mode=${db.mode}`);

    const apiCommit = health.build && health.build.commit;
    check(
      'API reports a commit',
      Boolean(apiCommit),
      apiCommit ? short(apiCommit) : 'no build.commit in /api/health — this deploy predates the report; redeploy to enable verification',
    );
    if (apiCommit) {
      check('Render serves the expected commit', shaMatch(apiCommit, EXPECTED), `${short(apiCommit)} vs ${short(EXPECTED)}`);
    }
    note(`uptime ${health.uptimeSeconds}s · payments ${health.payments?.mode || 'unknown'}`);
    if (typeof health.uptimeSeconds === 'number' && health.uptimeSeconds < 60) {
      note('uptime is under a minute — this looks like a very recent restart');
    }
  }

  // ── 3. Behaviour — the running code, not just a matching label ────────────
  section('3. Live behaviour (proves the current code is what is running)');
  try {
    const res = await request(`${SITE}/api/health`);
    check('Vercel proxies /api to the API', res.status === 200 && res.json?.status === 'online', `status=${res.status}`);
  } catch (error) {
    check('Vercel proxies /api to the API', false, error.message);
  }

  let courseId = '';
  try {
    const res = await request(`${API}/api/courses`);
    const list = res.json?.courses || res.json?.data?.courses || res.json?.data || [];
    const first = Array.isArray(list) ? list[0] : null;
    courseId = first ? first._id || first.id || '' : '';
    check('Course catalogue is readable', Boolean(courseId), courseId ? `first=${courseId}` : 'no courses returned');
  } catch (error) {
    check('Course catalogue is readable', false, error.message);
  }

  if (courseId) {
    const quote = async (depositAmount) => {
      const res = await request(`${API}/api/payments/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, tier: 'standard', depositAmount }),
      });
      return res.json?.quote?.amount ?? res.json?.amount ?? null;
    };

    let defaultDeposit = null;
    try {
      defaultDeposit = await quote(0);
      check('Reservation quote responds', Number.isFinite(Number(defaultDeposit)), `default=${defaultDeposit}`);
    } catch (error) {
      check('Reservation quote responds', false, error.message);
    }

    try {
      const honoured = await quote(HONOURED_DEPOSIT);
      check(
        `Reservation honours the $${HONOURED_DEPOSIT} option`,
        Number(honoured) === HONOURED_DEPOSIT,
        `amount=${honoured}`,
      );
    } catch (error) {
      check(`Reservation honours the $${HONOURED_DEPOSIT} option`, false, error.message);
    }

    try {
      const off = await quote(OFF_MENU_DEPOSIT);
      check(
        'Off-menu deposit is not honoured (falls back to the default)',
        Number(off) === Number(defaultDeposit) && Number(off) !== OFF_MENU_DEPOSIT,
        `off-menu=${off} default=${defaultDeposit}`,
      );
    } catch (error) {
      check('Off-menu deposit is not honoured (falls back to the default)', false, error.message);
    }
  } else {
    warn('skipping reservation checks — no course id to quote against');
  }
};

const report = () => {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`\n${C.bold}════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}DEPLOY PROVENANCE RESULT${C.reset}`);
  console.log(`${C.bold}════════════════════════════════════════════${C.reset}`);
  console.log(`  checks : ${results.length}`);
  console.log(`  passed : ${C.green}${passed}${C.reset}`);
  console.log(`  failed : ${failed === 0 ? C.green : C.red}${failed}${C.reset}`);
  if (failed) {
    console.log(`\n${C.red}${C.bold}FAILURES${C.reset}`);
    for (const f of failures) {
      console.log(`  ${C.red}✗${C.reset} ${f.name}${f.detail ? `  ${C.dim}${f.detail}${C.reset}` : ''}`);
    }
    console.log(
      `\n${C.dim}A revision mismatch means the deploy did not ship: check the Vercel deployment\nlog and the Render event log for the pushed commit, then redeploy.${C.reset}`,
    );
  } else {
    console.log(`\n${C.green}Both deployments are serving ${C.bold}${short(EXPECTED)}${C.reset}${C.green}.${C.reset}`);
  }
  return failed;
};

(async () => {
  let failed = 1;
  try {
    await run();
    failed = report();
  } catch (error) {
    console.log(`\n${C.red}${C.bold}ABORTED:${C.reset} ${error.message}`);
    failed = report() || 1;
  }
  process.exit(failed ? 1 : 0);
})();
