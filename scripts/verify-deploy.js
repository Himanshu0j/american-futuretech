#!/usr/bin/env node
/**
 * American FutureTech — DEPLOY provenance check.
 *
 * Every other verify:* suite answers "is the code in this repo correct?". This
 * one answers a different question: "did the commit I just pushed actually reach
 * the live deployment?" A host that keeps serving the previous build is
 * invisible from a browser — the site loads either way.
 *
 * How the two halves report their revision:
 *   - website : client/vite.config.js stamps the built index.html with
 *               <meta name="x-aft-commit">.
 *   - API     : /api/health reports `build.commit`.
 *
 * Both are compared against this checkout's HEAD. On top of the revision match
 * the script also exercises behaviour that only the current code produces (the
 * reservation allowlist), so a deploy that reports the right SHA while still
 * running a stale process is caught too.
 *
 * A push is not a deploy. The host rebuilds after it, and a slow build makes
 * "just pushed" and "deployed" look identical
 * from the outside. This script therefore waits: it polls until each live
 * revision reports HEAD, and if the budget runs out it prints an alert naming
 * what is behind, which files in that half of the repo have not shipped, and how
 * to redeploy it.
 *
 * Usage:
 *   npm run verify:deploy
 *   npm run verify:deploy -- --no-wait                    # single pass, no polling
 *   DEPLOY_WAIT_SECONDS=900 npm run verify:deploy         # longer wait budget
 *   DEPLOY_POLL_SECONDS=30 npm run verify:deploy          # poll less often
 *   EXPECTED_COMMIT=<sha> npm run verify:deploy           # audit a rollback
 *   EXPECT_DEPOSIT_OPTIONS=99,499,2499,4499 npm run verify:deploy   # if the menu changes
 *   SITE_URL=http://localhost:5273 API_URL=http://localhost:5050 npm run verify:deploy
 *
 * Exit code is 0 only when both deployments are serving the expected commit.
 */

const path = require('path');
const { execSync } = require('node:child_process');

// The client retired the Vercel website and the Render API: one Hostinger app
// serves the site and the API on the main domain, so both default to it.
const SITE = (process.env.SITE_URL || 'https://americanfuturetechllc.com').replace(/\/+$/, '');
const API = (process.env.API_URL || 'https://americanfuturetechllc.com').replace(/\/+$/, '');
const ROOT = path.join(__dirname, '..');

/** The reservation amounts server/utils/pricing.js is allowed to honour. */
const DEPOSIT_OPTIONS = (process.env.EXPECT_DEPOSIT_OPTIONS || '99,499,2499,4499')
  .split(',')
  .map((value) => Number(String(value).trim()))
  .filter((value) => Number.isFinite(value) && value > 0);
const HONOURED_DEPOSIT = DEPOSIT_OPTIONS.length ? Math.max(...DEPOSIT_OPTIONS) : 4499;
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

const isLoopback = (url) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(url);

/**
 * How long to keep polling for a deploy that has not landed yet.
 *
 * Default is to wait, because the common case for running this is "I just
 * pushed". Waiting is skipped when EXPECTED_COMMIT names a revision to audit —
 * checking a rollback is not a "wait for my push" situation — and shortened
 * against a local stack, where a preview rebuilds in seconds rather than the
 * minutes a production build takes.
 */
const readWaitSeconds = () => {
  if (process.argv.includes('--no-wait')) return 0;
  const flag = process.argv.find((arg) => arg.startsWith('--wait='));
  const explicit = Number(flag ? flag.split('=')[1] : process.env.DEPLOY_WAIT_SECONDS);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  if (process.env.EXPECTED_COMMIT) return 0;
  return isLoopback(SITE) || isLoopback(API) ? 60 : 600;
};

const WAIT_SECONDS = readWaitSeconds();
const POLL_SECONDS = Math.max(5, Number(process.env.DEPLOY_POLL_SECONDS) || 15);

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
 * True when both refer to the same revision. Allows a short SHA (a host can be
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

/** Like git(), but lets an empty answer be told apart from a failed command. */
const gitRaw = (cmdArgs) => {
  try {
    return execSync(`git ${cmdArgs}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch (error) {
    return null;
  }
};

/**
 * How far behind HEAD a live revision is, and which commits it never received.
 * Best-effort: a revision this clone has never seen (another branch, a
 * force-push) simply reports nothing rather than guessing.
 */
const describeLag = (sha) => {
  const behind = Number(gitRaw(`rev-list --count ${sha}..${EXPECTED}`));
  if (!Number.isFinite(behind) || behind <= 0) return null;
  const missing = (gitRaw(`log --oneline --no-decorate -n 3 ${sha}..${EXPECTED}`) || '')
    .split('\n')
    .filter(Boolean);
  return { behind, missing };
};

/**
 * Which files in a live deployment's half of the repo changed after it was
 * built. This is what separates "the deploy did not ship" from "only its
 * revision label is stale": with nothing changed in that scope, the running
 * code is identical and the label is all that is behind.
 */
const driftIn = (sha, scope) => gitRaw(`diff --name-only ${sha}..${EXPECTED} -- ${scope}`);

/**
 * The failure this script exists to make loud: a live deployment that has not
 * moved to the pushed commit. Says what is behind, whether its half of the repo
 * actually changed, and how to push it forward.
 */
const alertBehind = (label, liveSha, scope) => {
  console.log(`\n  ${C.red}${C.bold}⚠ ALERT — ${label} is behind main${C.reset}`);
  console.log(
    `    live ${C.bold}${short(liveSha)}${C.reset}  ${C.dim}expected${C.reset} ${short(EXPECTED)}`,
  );

  const lag = describeLag(liveSha);
  if (lag) {
    console.log(
      `    ${C.dim}${lag.behind} commit${lag.behind === 1 ? '' : 's'} not shipped: ${lag.missing.join(' | ')}${C.reset}`,
    );
  }

  const drift = driftIn(liveSha, scope);
  const files = drift === null ? null : drift.split('\n').filter(Boolean);
  if (files === null) {
    console.log(`    ${C.dim}could not compare the two revisions in this checkout${C.reset}`);
  } else if (files.length === 0) {
    console.log(
      `    ${C.green}No ${scope} file changed between them — the running code is current, only its revision label lags.${C.reset}`,
    );
  } else {
    console.log(`    ${C.red}${files.length} ${scope} file(s) have not shipped:${C.reset}`);
    for (const file of files.slice(0, 8)) console.log(`      ${file}`);
    if (files.length > 8) console.log(`      ${C.dim}…and ${files.length - 8} more${C.reset}`);
  }

  console.log(`    ${C.dim}Fix: open that service's dashboard → Manual Deploy, then re-run this check.${C.reset}`);
};

/**
 * An idle host can sleep, and a 502/503 during a redeploy is transient: retry
 * transport errors and gateway statuses, but let a
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

/** The website's revision: the stamp vite.config.js injects into the served index.html. */
const readSiteStamp = async () => {
  const res = await request(`${SITE}/`);
  return {
    html: res.text,
    status: res.status,
    commit: readMeta(res.text, 'x-aft-commit'),
    branch: readMeta(res.text, 'x-aft-branch'),
    builtAt: readMeta(res.text, 'x-aft-built-at'),
  };
};

/** The API's revision: build.commit in /api/health, retrying a cold start. */
const fetchApiHealth = async () => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const res = await request(`${API}/api/health`);
      if (res.status === 200 && res.json) return res.json;
    } catch (error) {
      /* cold start */
    }
    await sleep(4000);
  }
  return null;
};

/** One cheap health read for the polling loop — no cold-start retry budget. */
const probeApiCommit = async () => {
  try {
    const res = await request(`${API}/api/health`);
    return res.status === 200 && res.json ? res.json.build?.commit || '' : '';
  } catch (error) {
    return '';
  }
};

/**
 * Polls both deployments until each reports the pushed commit, or the wait
 * budget runs out — printing progress either way, so a long wait is never a
 * silent hang. Returns the last revision each side reported.
 */
const settleDeployments = async (siteCommit, apiCommit) => {
  let site = siteCommit || '';
  let api = apiCommit || '';
  const wanted = short(EXPECTED);

  if (shaMatch(site, EXPECTED) && shaMatch(api, EXPECTED)) {
    note('nothing to wait for — both already report the pushed commit');
    return { site, api };
  }
  if (WAIT_SECONDS <= 0) {
    warn('not waiting for the deploys (wait budget 0s) — single pass only');
    return { site, api };
  }

  const started = Date.now();
  const deadline = started + WAIT_SECONDS * 1000;
  console.log(
    `  ${C.dim}waiting up to ${WAIT_SECONDS}s (polling every ${POLL_SECONDS}s) for both to rebuild ${wanted}${C.reset}`,
  );

  while (Date.now() < deadline) {
    await sleep(Math.min(POLL_SECONDS * 1000, Math.max(0, deadline - Date.now())));

    const beforeSite = site;
    const beforeApi = api;
    if (!shaMatch(site, EXPECTED)) {
      try {
        site = (await readSiteStamp()).commit || site;
      } catch (error) {
        /* keep the last revision we saw and try again next tick */
      }
    }
    if (!shaMatch(api, EXPECTED)) {
      const probed = await probeApiCommit();
      if (probed) api = probed;
    }

    if (!shaMatch(beforeSite, EXPECTED) && shaMatch(site, EXPECTED)) {
      note(`website just caught up — now serving ${short(site)}`);
    }
    if (!shaMatch(beforeApi, EXPECTED) && shaMatch(api, EXPECTED)) {
      note(`API just caught up — now serving ${short(api)}`);
    }

    const elapsed = Math.round((Date.now() - started) / 1000);
    note(
      `[${elapsed}s / ${WAIT_SECONDS}s] vercel ${short(site)} ${shaMatch(site, EXPECTED) ? 'ok' : 'stale'}` +
        ` · render ${short(api)} ${shaMatch(api, EXPECTED) ? 'ok' : 'stale'}`,
    );

    if (shaMatch(site, EXPECTED) && shaMatch(api, EXPECTED)) break;
  }

  return { site, api };
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

  // ── 1. Website ────────────────────────────────────────────────────────────
  section('1. Website — front-end build');
  let stamp = { html: '', status: 0, commit: '', branch: '', builtAt: '' };
  try {
    stamp = await readSiteStamp();
    check('Site root answers', stamp.status === 200, `status=${stamp.status}`);
  } catch (error) {
    check('Site root answers', false, error.message);
  }
  const html = stamp.html;
  check('Served page is the app shell', /id="root"/.test(html));

  const stampCommit = stamp.commit;
  const stampBranch = stamp.branch;
  const stampAt = stamp.builtAt;

  check(
    'Build reports a commit stamp',
    Boolean(stampCommit) && stampCommit !== 'unknown',
    stampCommit && stampCommit !== 'unknown'
      ? short(stampCommit)
      : 'no x-aft-commit meta — this build predates the stamp; redeploy to enable verification',
  );
  // Whether it matches HEAD is asserted after the wait phase, so a deploy that
  // is still building is not reported as a deployment that failed to ship.
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

  /*
   * The FIRST paint must already carry the saved content.
   *
   * The site used to render its coded defaults — or a browser-cached copy of an
   * older reply — and only then swap in what the admin saved, so a reload showed
   * the old text for a moment and then the new one. The server now embeds the
   * current settings snapshot in the HTML it serves, which is the only way the
   * first frame can be right: the markup arrives with the text in it.
   *
   * Failing here means a reload can show the stale wording again, either because
   * the injection is gone or because the HTML is being served from a cache older
   * than the settings it should carry.
   */
  const bootstrapTag = (html.match(/<script id="aft-settings-bootstrap">([\s\S]*?)<\/script>/) || [])[1] || '';
  let snapshot = null;
  try {
    snapshot = JSON.parse(bootstrapTag.replace(/^\s*window\.__AFT_SETTINGS__\s*=\s*/, '').replace(/;?\s*$/, ''));
  } catch (error) {
    snapshot = null;
  }
  check('Served HTML ships the first-paint settings snapshot', Boolean(snapshot?.settings),
    snapshot?.settings ? '' : 'no window.__AFT_SETTINGS__ in the served HTML');

  if (snapshot?.settings) {
    try {
      const settingsRes = await request(`${API}/api/settings`);
      const apiText = settingsRes.json?.settings?.announcementBanner?.text || '';
      const htmlText = snapshot.settings.announcementBanner?.text || '';
      check('First-paint snapshot matches what the API serves right now',
        Boolean(apiText) && apiText === htmlText,
        apiText === htmlText
          ? `"${apiText.slice(0, 48)}"`
          : `html "${htmlText.slice(0, 48)}" vs api "${apiText.slice(0, 48)}"`);
    } catch (error) {
      check('First-paint snapshot matches what the API serves right now', false, error.message);
    }
  }

  // ── 2. API ────────────────────────────────────────────────────────────────
  section('2. API');
  const health = await fetchApiHealth();
  check('Live API answers /api/health', Boolean(health), health ? '' : 'no response after ~48s — free-tier cold start, or the service is down');

  let apiCommit = '';
  if (health) {
    check('API status is online', health.status === 'online', `status=${health.status}`);
    const db = health.database || health.db || {};
    check('Database is connected', db.connected === true, `connected=${db.connected} mode=${db.mode}`);

    apiCommit = (health.build && health.build.commit) || '';
    check(
      'API reports a commit',
      Boolean(apiCommit),
      apiCommit ? short(apiCommit) : 'no build.commit in /api/health — this deploy predates the report; redeploy to enable verification',
    );
    note(`uptime ${health.uptimeSeconds}s · payments ${health.payments?.mode || 'unknown'}`);
    if (typeof health.uptimeSeconds === 'number' && health.uptimeSeconds < 60) {
      note('uptime is under a minute — this looks like a very recent restart');
    }
  }

  // ── 3. Wait for both deployments to report the pushed commit ──────────────
  section('3. Waiting for the deploys to catch up');
  const settled = await settleDeployments(stampCommit, apiCommit);

  if (stampCommit && stampCommit !== 'unknown') {
    check(
      'Website serves the expected commit',
      shaMatch(settled.site, EXPECTED),
      `${short(settled.site)} vs ${short(EXPECTED)}`,
    );
  }
  if (apiCommit) {
    check(
      'API serves the expected commit',
      shaMatch(settled.api, EXPECTED),
      `${short(settled.api)} vs ${short(EXPECTED)}`,
    );
  }

  // The API is the half that quietly keeps serving old logic, so when it lags,
  // say what is behind — and whether its half of the repo actually changed.
  if (apiCommit && !shaMatch(settled.api, EXPECTED)) {
    alertBehind('the API', settled.api, 'server');
  }
  if (stampCommit && stampCommit !== 'unknown' && !shaMatch(settled.site, EXPECTED)) {
    alertBehind('the website', settled.site, 'client');
  }

  // ── 4. Behaviour — the running code, not just a matching label ────────────
  section('4. Live behaviour (proves the current code is what is running)');
  try {
    const res = await request(`${SITE}/api/health`);
    check('The website serves its own /api', res.status === 200 && res.json?.status === 'online', `status=${res.status}`);
  } catch (error) {
    check('The website serves its own /api', false, error.message);
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
      `\n${C.dim}${
        WAIT_SECONDS > 0
          ? `A revision mismatch means the deploy did not ship within the ${WAIT_SECONDS}s wait.`
          : 'A revision mismatch means the deploy has not shipped (this run did not wait).'
      }\nRedeploy the service named in the alert above (its dashboard → Manual Deploy), then\nre-run this check. DEPLOY_WAIT_SECONDS raises the wait for a slower build.${C.reset}`,
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
