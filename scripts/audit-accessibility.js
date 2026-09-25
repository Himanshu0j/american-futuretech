/**
 * Real-browser accessibility audit (Chrome + axe-core).
 *
 *   npm run audit:a11y                       # local dev stack (http://localhost:5273)
 *   A11Y_BASE=https://american-futuretech.vercel.app npm run audit:a11y
 *
 * Why this exists: contrast and unlabelled-control problems are invisible in the
 * source — they only exist once the CSS is applied. This drives real Chrome over
 * every public page and every admin module, injects axe-core (WCAG 2.0/2.1 A+AA)
 * and fails on anything serious.
 *
 * axe-core is loaded from a local cache when present (A11Y_AXE_PATH) and only
 * downloaded if it is missing, so the audit works offline once primed.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

module.paths.push(path.join(__dirname, '..', 'node_modules'));
const puppeteer = require('puppeteer-core');

const BASE = (process.env.A11Y_BASE || 'http://localhost:5273').replace(/\/$/, '');
const AXE_URL = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
const AXE_PATH = process.env.A11Y_AXE_PATH || path.join(os.tmpdir(), 'axe.min.js');
const CHROME =
  process.env.CHROME_PATH ||
  ['C:/Program Files/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));

/**
 * Public pages every visitor can reach.
 *
 * These must be the routes the router actually declares (see client/src/App.jsx)
 * and the ones the navbar/footer actually link to. A made-up path is worse than
 * no test at all: App.jsx ends with `<Route path="*" element={<Navigate to="/" />}>`,
 * so a typo here silently renders the homepage and reports a green pass for a
 * page that does not exist. The `expected` path below is asserted after load, so
 * that class of mistake can never come back quietly.
 *
 * Data-driven routes (course / job / blog detail) have their slug or id resolved
 * from the API at run time, because those are seeded per database and differ
 * between local and production.
 */
const PUBLIC_ROUTES = [
  ['home', '/'],
  ['courses', '/courses'],
  ['course-detail', '/courses/__FIRST_COURSE__'],
  ['jobs', '/jobs'],
  ['job-detail', '/jobs/__FIRST_JOB__'],
  ['blog', '/blog'],
  ['blog-detail', '/blog/__FIRST_BLOG__'],
  ['certification-ai', '/certifications/ai-certification'],
  ['certification-data-science', '/certifications/data-science-certification'],
  ['certificate-registry', '/certificate/AFT-CERT-AI9821'],
  ['about', '/about'],
  ['career-support', '/career-support'],
  ['success-stories', '/success-stories'],
  ['contact', '/contact'],
  ['faq', '/faq'],
  ['checkout', '/checkout'],
  ['privacy', '/privacy'],
  ['refund-policy', '/refund-policy'],
  ['cookie-policy', '/cookie-policy'],
  ['terms', '/terms'],
  ['student-login', '/student/login'],
  ['student-register', '/student/register'],
];

/** Placeholders replaced from the live API so detail pages really exist. */
const resolvePlaceholders = async () => {
  const first = async (url, pick) => {
    try {
      const res = await fetch(`${BASE}${url}`);
      const json = await res.json();
      const list = json.courses || json.jobs || json.blogs || json.data || [];
      const value = list.length ? pick(list[0]) : '';
      return value || '';
    } catch (error) {
      return '';
    }
  };
  return {
    __FIRST_COURSE__: await first('/api/courses', (c) => c.slug),
    __FIRST_JOB__: await first('/api/jobs?limit=1', (j) => j.slug || j._id),
    __FIRST_BLOG__: await first('/api/content/blogs', (b) => b.slug),
  };
};

/** Admin modules, behind the staff session. */
const ADMIN_ROUTES = [
  ['admin-dashboard', '/admin/dashboard'],
  ['admin-leads', '/admin/leads'],
  ['admin-courses', '/admin/courses'],
  ['admin-batches', '/admin/batches'],
  ['admin-students', '/admin/students'],
  ['admin-payments', '/admin/payments'],
  ['admin-coupons', '/admin/coupons'],
  ['admin-footer', '/admin/footer'],
  ['admin-jobs', '/admin/jobs'],
  ['admin-content', '/admin/content'],
  ['admin-support', '/admin/support'],
  ['admin-settings', '/admin/settings'],
  ['admin-website-editor', '/admin/website-editor'],
  ['admin-guide', '/admin/guide'],
  ['admin-users', '/admin/users'],
  ['admin-lms', '/admin/lms'],
  ['admin-lms-curriculum', '/admin/lms/curriculum'],
  ['admin-lms-quizzes', '/admin/lms/quizzes'],
  ['admin-lms-enrollments', '/admin/lms/enrollments'],
  ['admin-lms-progress', '/admin/lms/progress'],
  ['admin-lms-certificates', '/admin/lms/certificates'],
  ['admin-lms-communications', '/admin/lms/communications'],
  ['admin-lms-settings', '/admin/lms/settings'],
  ['admin-login', '/admin/login'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ensureAxe = async () => {
  if (fs.existsSync(AXE_PATH) && fs.statSync(AXE_PATH).size > 100000) return AXE_PATH;
  console.log('  (axe-core cache missing — downloading once)');
  const res = await fetch(AXE_URL);
  if (!res.ok) throw new Error(`could not fetch axe-core: HTTP ${res.status}`);
  fs.writeFileSync(AXE_PATH, Buffer.from(await res.arrayBuffer()));
  return AXE_PATH;
};

const run = async () => {
  if (!CHROME) throw new Error('Chrome not found — set CHROME_PATH to chrome.exe');
  const axeSource = fs.readFileSync(await ensureAxe(), 'utf8');

  // Build the route table, then refuse to test anything we could not resolve.
  const fixtures = await resolvePlaceholders();
  const routes = (list) => list
    .map(([name, route]) => [name, route.replace(/__[A-Z_]+__/g, (token) => fixtures[token] || '')])
    .filter(([name, route]) => {
      if (!/__/.test(route)) return true;
      console.log(`  ⚠️  ${name} skipped — cannot resolve ${route} on this database`);
      return false;
    });
  const PUBLIC = routes(PUBLIC_ROUTES);
  const ADMIN = routes(ADMIN_ROUTES);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    // The heaviest admin screens take a while for axe to walk in one call.
    protocolTimeout: 180000,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Sign in against the API so the admin modules render their real state.
  let token = '';
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.A11Y_EMAIL || 'admin@americanfuturetech.com',
        password: process.env.A11Y_PASSWORD || '',
      }),
    });
    const json = await res.json().catch(() => null);
    token = json?.token || '';
  } catch (error) {
    /* public pages still auditable without a session */
  }
  if (token) {
    await page.evaluateOnNewDocument((t) => {
      // Both keys: the shared api client reads `aft_admin_token` first, while a
      // few panels still read `token` — writing only one made those pages fire a
      // spurious 401 that buried real console errors.
      try {
        window.localStorage.setItem('aft_admin_token', t);
        window.localStorage.setItem('token', t);
      } catch (e) { /* ignore */ }
    }, token);
  } else {
    console.log('  ⚠️  No staff session — admin modules will redirect to the login page.');
  }

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`${msg.text()}`.slice(0, 160));
  });

  const totals = { checks: 0, passed: 0, failed: 0 };
  const failing = [];

  const sweep = async (routes, label) => {
    console.log(`\n${'─'.repeat(72)}\n${label}\n${'─'.repeat(72)}`);
    for (const [name, route] of routes) {
      const url = `${BASE}${route}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      } catch (error) {
        console.log(`  ⚠️  ${name.padEnd(24)} navigation problem: ${error.message.slice(0, 60)}`);
      }
      await sleep(2200); // let lazy chunks mount and fonts settle

      // A wildcard route would otherwise turn a typo'd/removed path into a green
      // pass: the homepage renders and axe finds nothing. Assert where we landed.
      const landedPath = await page.evaluate(() => location.pathname.replace(/\/$/, '') || '/');
      const wantedPath = route.split('?')[0].replace(/\/$/, '') || '/';
      const wrongPage = landedPath !== wantedPath && route !== '/admin/login';
      if (wrongPage) {
        totals.checks += 1;
        totals.failed += 1;
        console.log(`  ❌ ${name} — landed on ${landedPath || '/'} instead of ${wantedPath} (route missing or protected)`);
        failing.push({ page: name, route, violations: [{ id: 'wrong-route', impact: 'critical', help: `expected ${wantedPath}, got ${landedPath || '/'}`, count: 1, sample: [] }] });
        continue;
      }

      const result = await page.evaluate(async (source) => {
        if (!window.axe) {
          // eslint-disable-next-line no-eval
          window.eval(source);
        }
        const res = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          resultTypes: ['violations'],
        });
        const advisory = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['best-practice'] },
          resultTypes: ['violations'],
        });
        return {
          title: document.title,
          advisory: advisory.violations.map((v) => ({ id: v.id, count: v.nodes.length })),
          violations: res.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            count: v.nodes.length,
            sample: v.nodes.slice(0, 2).map((n) => ({
              target: n.target.join(' '),
              html: (n.html || '').slice(0, 140),
              summary: n.failureSummary ? n.failureSummary.split('\n')[1]?.trim().slice(0, 140) : '',
            })),
          })),
        };
      }, axeSource);

      // A silent redirect to /admin/login would make an admin module look clean.
      if (label.startsWith('ADMIN') && token && route !== '/admin/login') {
        const landed = await page.evaluate(() => ({
          url: location.pathname,
          loginScreen: /Staff Authentication/i.test(document.body.innerText || ''),
        }));
        if (landed.loginScreen || landed.url.includes('/admin/login')) {
          console.log(`  ⚠️  ${name} — bounced to the login screen (session not accepted)`);
        }
      }

      const real = result.violations;
      totals.checks += 1;
      if (real.length === 0) {
        totals.passed += 1;
        const note = result.advisory.length
          ? ` (advisory: ${result.advisory.map((a) => `${a.id}×${a.count}`).join(', ')})`
          : '';
        console.log(`  ✅ ${name}${note}`);
      } else {
        totals.failed += 1;
        const nodeCount = real.reduce((n, v) => n + v.count, 0);
        console.log(`  ❌ ${name} — ${real.length} rule(s), ${nodeCount} node(s)`);
        for (const v of real) {
          console.log(`       • ${v.id} [${v.impact}] ×${v.count} — ${v.help}`);
          for (const s of v.sample) console.log(`           ${s.target} :: ${s.html}`);
        }
        failing.push({ page: name, route, violations: real });
      }
    }
  };

  await sweep(PUBLIC, 'PUBLIC PAGES');
  await sweep(ADMIN, token ? 'ADMIN MODULES (signed in)' : 'ADMIN MODULES (no session — expect redirects)');

  await browser.close();

  if (consoleErrors.length) {
    console.log(`\nConsole errors seen: ${consoleErrors.length}`);
    for (const e of [...new Set(consoleErrors)].slice(0, 12)) console.log(`   - ${e}`);
  }

  const outPath = path.join(os.tmpdir(), 'aft-a11y-report.json');
  fs.writeFileSync(outPath, JSON.stringify({ base: BASE, totals, failing, consoleErrors }, null, 2));

  console.log(`\n${'═'.repeat(72)}`);
  console.log(`A11Y RESULT — pages audited ${totals.checks} | clean ${totals.passed} | failing ${totals.failed}`);
  console.log(`report: ${outPath}`);
  console.log('═'.repeat(72));

  process.exit(totals.failed === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error(`\nAudit failed to run: ${error.message}`);
  process.exit(2);
});
