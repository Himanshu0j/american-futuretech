/**
 * Live browser audit — real Chrome, four widths, three roles.
 *
 *   npm run audit:browser                                   # local stack
 *   LB_BASE=https://american-futuretech.vercel.app ...      # production
 *
 * The accessibility audit answers "is this page usable with a screen reader".
 * This one answers the questions a client actually hits in week one:
 *
 *   • does every route render (not silently bounce to the homepage)?
 *   • did any API request fail on a page a visitor can see?
 *   • are there console errors, broken images, or dead weight?
 *   • does anything overflow horizontally across the phone, tablet and desk
 *     widths the client's visitors actually use?
 *   • can an admin actually create and delete a record through the UI?
 *
 * Evidence (screenshots + a JSON report) is written to %TEMP%/aft-lb-*.
 * Credentials come from the environment and are never printed.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

module.paths.push(path.join(__dirname, '..', 'node_modules'));
const puppeteer = require('puppeteer-core');

const BASE = (process.env.LB_BASE || 'http://localhost:5273').replace(/\/$/, '');
const CHROME =
  process.env.CHROME_PATH ||
  ['C:/Program Files/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));

// Every width the handover promises to have checked: small phones, large
// phones, both tablet orientations, small laptops and full desktop monitors.
const WIDTHS = [320, 375, 390, 414, 768, 1024, 1280, 1440, 1920];
// Roles to sweep. Production cannot be swept with a session (the rotated admin
// credential is deliberately not in this workspace), so `LB_ROLES=public` runs
// the visitor-facing surface instead of reporting 30 fake "wrong route" errors.
const ROLES = (process.env.LB_ROLES || 'public,student,admin').split(',').map((s) => s.trim()).filter(Boolean);
// Guard probe: with no session at all, protected pages must bounce to a login
// screen and must not pull protected data from the API.
const GUARD_PROBE = process.env.LB_GUARD === '1';
const GUARD_TARGETS = [
  { path: '/admin/dashboard', allowed: ['/admin/login', '/'] },
  { path: '/admin/users', allowed: ['/admin/login', '/'] },
  { path: '/admin/payments', allowed: ['/admin/login', '/'] },
  { path: '/student/dashboard', allowed: ['/student/login', '/'] },
  { path: '/student/certificates', allowed: ['/student/login', '/'] },
];
// Any 200 from these while unauthenticated would be a real exposure. Note that
// `GET /api/settings` itself is public by design (it carries the CMS content the
// public pages render), so only the protected sub-resources are listed.
const PROTECTED_API = /\/api\/(auth\/users|auth\/me|students|payments|leads|coupons|settings\/(audit-logs|payment-gateway)|analytics|support\/admin|lms\/(dashboard|my-courses|certificates))/;
const SHOT_DIR = path.join(os.tmpdir(), 'aft-lb-shots');
const REPORT = path.join(os.tmpdir(), 'aft-lb-report.json');

const ADMIN = {
  email: process.env.LB_EMAIL || 'admin@americanfuturetech.com',
  password: process.env.LB_PASSWORD || '',
};
const STUDENT = {
  email: process.env.LB_STUDENT_EMAIL || 'student@americanfuturetech.com',
  password: process.env.LB_STUDENT_PASSWORD || ADMIN.password,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Visit protected pages with NO session and prove they do not leak.
 * A client asking "can someone just open /admin/users?" deserves a real answer,
 * not a code review.
 */
const guardProbe = async (browser, report) => {
  console.log(`\n${'─'.repeat(74)}\nUNAUTHENTICATED ROUTE GUARD\n${'─'.repeat(74)}`);
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const exposed = [];
  page.on('response', (res) => {
    if (res.status() === 200 && PROTECTED_API.test(res.url())) {
      exposed.push(`${res.status()} ${res.url().replace(BASE, '').slice(0, 90)}`);
    }
  });
  const results = [];
  for (const target of GUARD_TARGETS) {
    await page.setViewport({ width: 1280, height: 900 });
    let landed = 'navigation-error';
    try {
      await page.goto(`${BASE}${target.path}`, { waitUntil: 'networkidle2', timeout: 45000 });
      await sleep(1200);
      landed = await page.evaluate(() => location.pathname);
    } catch (error) {
      landed = `error: ${error.message.slice(0, 60)}`;
    }
    const ok = target.allowed.some((allowed) => landed === allowed || landed.startsWith(allowed));
    results.push({ target: target.path, landed, ok });
    console.log(`  ${ok ? '✅' : '❌'} ${target.path.padEnd(24)} → ${landed}`);
  }
  if (exposed.length) {
    console.log(`  ❌ protected API answered 200 without a session:`);
    for (const e of [...new Set(exposed)]) console.log(`       • ${e}`);
  } else {
    console.log(`  ✅ no protected API endpoint answered 200 without a session`);
  }
  await context.close();
  report.guard = { results, exposed: [...new Set(exposed)] };
};


/**
 * Console noise that is not a defect. React's dev-only notices are excluded
 * because this runs against the Vite dev server; production builds strip them.
 * Everything else is reported verbatim so nothing can hide in a filter.
 */
const BENIGN_CONSOLE = [
  /Download the React DevTools/i,
  /React does not recognize the [`'"]?%s/i,
  /is not a function.*strict mode/i,
];

const describe = (el) => {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls = (el.className || '').toString().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
  return `${tag}${id}${cls ? '.' + cls : ''}`;
};

const resolveFixtures = async () => {
  const first = async (url, pick) => {
    try {
      const res = await fetch(`${BASE}${url}`);
      const json = await res.json();
      const list = json.courses || json.jobs || json.blogs || json.data || [];
      return list.length ? pick(list[0]) || '' : '';
    } catch (error) {
      return '';
    }
  };
  return {
    COURSE: await first('/api/courses', (c) => c.slug),
    JOB: await first('/api/jobs?limit=1', (j) => j.slug || j._id),
    BLOG: await first('/api/content/blogs', (b) => b.slug),
  };
};

const buildRoutes = (fx) => {
  const publicRoutes = [
    ['home', '/'],
    ['courses', '/courses'],
    ['course-detail', fx.COURSE && `/courses/${fx.COURSE}`],
    ['jobs', '/jobs'],
    ['job-detail', fx.JOB && `/jobs/${fx.JOB}`],
    ['blog', '/blog'],
    ['blog-detail', fx.BLOG && `/blog/${fx.BLOG}`],
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
    ['admin-login', '/admin/login'],
  ];

  const studentRoutes = [
    ['student-dashboard', '/student/dashboard'],
    ['student-courses', '/student/courses'],
    ['student-certificates', '/student/certificates'],
    ['student-payments', '/student/payments'],
    ['student-support', '/student/support'],
    ['student-profile', '/student/profile'],
  ];

  const adminRoutes = [
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
  ];

  const keep = (list) => list.filter(([, route]) => route);
  return {
    public: keep(publicRoutes),
    student: keep(studentRoutes),
    admin: keep(adminRoutes),
  };
};

const login = async (creds) => {
  if (!creds.email || !creds.password) return '';
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const json = await res.json().catch(() => null);
    return json?.token || '';
  } catch (error) {
    return '';
  }
};

/** Load one route and collect everything that went wrong while it did. */
const inspect = async (page, route, width) => {
  const consoleErrors = [];
  const failedRequests = [];
  const onConsole = (msg) => {
    if (msg.type() !== 'error') return;
    const text = (msg.text() || '').slice(0, 200);
    if (BENIGN_CONSOLE.some((re) => re.test(text))) return;
    consoleErrors.push(text);
  };
  const onResponse = (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !/favicon|\.map(\?|$)/.test(url)) {
      failedRequests.push({ status, url: url.replace(BASE, '').slice(0, 160) });
    }
  };
  page.on('console', onConsole);
  page.on('response', onResponse);

  const outcome = { consoleErrors, failedRequests };
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 45000 });
  } catch (error) {
    outcome.navigationError = error.message.slice(0, 120);
  }
  await sleep(1800);

  // The tool/logo grids are `loading="lazy"`, so off-screen images may never
  // have been requested at collection time — a broken logo below the fold would
  // have been missed. Force them eager, then wait for every image to settle.
  await page.evaluate(() => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
  });
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images]
        .filter((img) => !img.complete)
        .map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))
    );
  });
  await sleep(700);

  const dom = await page.evaluate(() => {
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;
      const style = getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
    };
    const brokenImages = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
      .map((img) => ({ src: img.currentSrc || img.src, alt: img.alt || '' }))
      .slice(0, 8);

    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const culprits = [];
    if (docOverflow > 1) {
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 2 && visible(el)) {
          culprits.push({ el: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(/\s+/).slice(0, 2).join('.') : ''), right: Math.round(rect.right) });
          if (culprits.length >= 6) break;
        }
      }
    }

    return {
      path: location.pathname,
      title: document.title,
      textLength: (document.body.innerText || '').trim().length,
      brokenImages,
      docOverflow,
      culprits,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      h1: document.querySelectorAll('h1').length,
      images: document.images.length,
      buttons: document.querySelectorAll('button').length,
    };
  });

  page.off('console', onConsole);
  page.off('response', onResponse);

  const problems = [];
  if (outcome.navigationError) problems.push(`navigation: ${outcome.navigationError}`);
  if (dom.path.replace(/\/$/, '') !== route.replace(/\/$/, '') && route !== '/admin/login') {
    problems.push(`wrong route: landed on ${dom.path}`);
  }
  if (dom.textLength < 120) problems.push(`nearly empty page (${dom.textLength} chars of text)`);
  if (dom.brokenImages.length) problems.push(`${dom.brokenImages.length} broken image(s)`);
  if (dom.docOverflow > 1) problems.push(`horizontal overflow ${dom.docOverflow}px (scrollWidth ${dom.scrollWidth} at ${width}px viewport)`);
  if (outcome.failedRequests.length) problems.push(`${outcome.failedRequests.length} failed request(s)`);
  if (outcome.consoleErrors.length) problems.push(`${outcome.consoleErrors.length} console error(s)`);
  if (dom.h1 === 0) problems.push('no <h1> on the page');

  outcome.dom = dom;
  outcome.problems = problems;
  return outcome;
};

/**
 * A browser-level write-through: create a coupon, confirm the row renders, then
 * delete it. This proves the admin UI itself writes to the database — a passing
 * API test does not.
 */
const adminCrud = async (page, results) => {
  const code = `LBQA${Date.now().toString().slice(-7)}`;
  const step = { code, created: false, deleted: false, notes: [] };
  page.on('dialog', async (dialog) => {
    step.notes.push(`confirm: ${dialog.message().slice(0, 60)}`);
    await dialog.accept();
  });
  try {
    await page.goto(`${BASE}/admin/coupons`, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1500);

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /create coupon/i.test(b.innerText));
      btn?.click();
    });
    await sleep(900);

    await page.type('input[placeholder="e.g. AFT2026"]', code);
    await page.type('input[placeholder="e.g. Spring cohort campaign"]', 'Live browser audit — safe to delete');
    step.notes.push('form filled');

    // Scope to the coupon modal, not `document.querySelector('form')` — the
    // public lead-capture widget also renders a form on this page, and clicking
    // its submit button is what made the first CRUD run fail. The modal's own
    // submit button lives in the modal footer, outside the <form> element.
    const scoped = await page.evaluate(() => {
      const field = document.querySelector('input[placeholder="e.g. AFT2026"]');
      const form = field && field.closest('form');
      if (!form) return { ok: false, why: 'coupon form not found' };
      const modal = form.parentElement || form;
      const buttons = [...modal.querySelectorAll('button')].filter((b) => !b.disabled);
      const submit = buttons.find((b) => /^(create coupon|save changes)$/i.test(b.innerText.trim()));
      if (!submit) return { ok: false, why: `no submit in modal (saw: ${buttons.map((b) => b.innerText.trim()).filter(Boolean).slice(0, 6).join(' | ')})` };
      submit.click();
      return { ok: true, clicked: submit.innerText.trim() };
    });
    step.notes.push(scoped.ok ? `submitted via "${scoped.clicked}"` : `submit blocked: ${scoped.why}`);
    await sleep(2500);

    const appeared = await page.evaluate((needle) => {
      const body = document.body.innerText || '';
      return { visible: body.includes(needle), feedback: (body.match(/(Coupon[^\n]{0,80})/) || [''])[0].slice(0, 100) };
    }, code);
    step.created = appeared.visible;
    step.feedback = appeared.feedback;

    // Clean up after ourselves — the throwaway database still deserves no litter.
    // The proof has to come from the row list and the API, not from page text:
    // the success toast ("Coupon X deleted.") keeps the code on screen, which
    // made an earlier version of this check report a false failure.
    if (step.created) {
      await page.evaluate((needle) => {
        const row = [...document.querySelectorAll('tr')].find((tr) => (tr.innerText || '').includes(needle));
        const del = row && row.querySelector('button[title="Delete"]');
        del?.click();
      }, code);
      await sleep(2500);
      step.afterDelete = await page.evaluate(async (needle) => {
        const rowStillListed = [...document.querySelectorAll('tr')].some((tr) => (tr.innerText || '').includes(needle));
        let apiStillHasIt = 'unchecked';
        try {
          const token = localStorage.getItem('aft_admin_token') || localStorage.getItem('token') || '';
          const res = await fetch('/api/coupons', { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          const coupons = json?.coupons || json?.data || [];
          apiStillHasIt = coupons.some((c) => String(c.code || '').toUpperCase() === needle.toUpperCase());
        } catch (error) {
          apiStillHasIt = `error: ${error.message}`;
        }
        return { rowStillListed, apiStillHasIt };
      }, code);
      step.deleted = step.afterDelete.rowStillListed === false && step.afterDelete.apiStillHasIt === false;
    }
  } catch (error) {
    step.notes.push(`error: ${error.message.slice(0, 120)}`);
  }
  results.push(step);
};

const main = async () => {
  if (!CHROME) throw new Error('Chrome not found — set CHROME_PATH to chrome.exe');
  fs.mkdirSync(SHOT_DIR, { recursive: true });

  const fixtures = await resolveFixtures();
  const routes = buildRoutes(fixtures);
  const adminToken = await login(ADMIN);
  const studentToken = await login(STUDENT);

  console.log(`BASE ${BASE}`);
  console.log(`fixtures: course=${fixtures.COURSE || 'n/a'} job=${fixtures.JOB || 'n/a'} blog=${fixtures.BLOG || 'n/a'}`);
  console.log(`sessions: admin=${adminToken ? 'yes' : 'NO'} student=${studentToken ? 'yes' : 'NO'}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    protocolTimeout: 180000,
  });

  const report = {
    base: BASE,
    startedAt: new Date().toISOString(),
    widths: WIDTHS,
    sessions: { admin: Boolean(adminToken), student: Boolean(studentToken) },
    fixtures,
    pages: [],
    crud: [],
    totals: { loads: 0, clean: 0, withProblems: 0, failures: 0 },
  };

  const save = () => fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

  if (GUARD_PROBE) await guardProbe(browser, report);

  for (const [role, token, list] of [
    ['public', '', routes.public],
    ['student', studentToken, routes.student],
    ['admin', adminToken, routes.admin],
  ].filter(([role]) => ROLES.includes(role))) {
    console.log(`\n${'─'.repeat(74)}\n${role.toUpperCase()} ROUTES\n${'─'.repeat(74)}`);
    // One isolated context per role: a shared profile would leak the student
    // session into the admin run and make protected routes pass for the wrong
    // reason.
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    if (token) {
      await page.evaluateOnNewDocument((t) => {
        try {
          localStorage.setItem('aft_admin_token', t);
          localStorage.setItem('token', t);
        } catch (e) { /* ignore */ }
      }, token);
    }

    for (const [name, route] of list) {
      const perWidth = [];
      for (const width of WIDTHS) {
        await page.setViewport({ width, height: width <= 390 ? 780 : 900 });
        const outcome = await inspect(page, route, width);
        report.totals.loads += 1;
        perWidth.push({ width, ...outcome });

        const shot = path.join(SHOT_DIR, `${role}-${name}-${width}.png`);
        try {
          await page.screenshot({ path: shot, fullPage: false });
          outcome.screenshot = shot;
        } catch (error) {
          outcome.screenshot = `failed: ${error.message.slice(0, 60)}`;
        }
      }

      // A page counts as passing only if every width passed.
      const allProblems = perWidth.flatMap((w) => w.problems.map((p) => `${w.width}px: ${p}`));
      if (allProblems.length === 0) {
        report.totals.clean += 1;
        console.log(`  ✅ ${name.padEnd(26)} ${WIDTHS.join('/')}px`);
      } else {
        report.totals.withProblems += 1;
        console.log(`  ❌ ${name.padEnd(26)} ${allProblems.length} issue(s)`);
        for (const p of allProblems) console.log(`       • ${p}`);
      }
      report.pages.push({ role, name, route, widths: perWidth, problems: allProblems });
      save();
    }

    if (role === 'admin') {
      console.log(`\n  Admin CRUD write-through (coupons) at 1280px…`);
      await page.setViewport({ width: 1280, height: 900 });
      await adminCrud(page, report.crud);
      const crud = report.crud[0] || {};
      console.log(
        crud.created && crud.deleted
          ? `  ✅ created ${crud.code}, rendered in the table, then deleted`
          : `  ❌ create=${crud.created} delete=${crud.deleted} ${crud.notes.join(' | ')}`,
      );
      save();
    }

    await context.close();
  }

  await browser.close();

  // Aggregate the detail the summary hides.
  const failedRequests = [];
  const consoleErrors = [];
  const overflow = [];
  for (const p of report.pages) {
    for (const w of p.widths) {
      for (const r of w.failedRequests) failedRequests.push(`${p.name} @${w.width}: ${r.status} ${r.url}`);
      for (const c of w.consoleErrors) consoleErrors.push(`${p.name} @${w.width}: ${c}`);
      if (w.docOverflow > 1) overflow.push(`${p.name} @${w.width}: +${w.docOverflow}px :: ${w.culprits.map((c) => c.el).join(', ')}`);
    }
  }
  report.aggregate = {
    failedRequests: [...new Set(failedRequests)],
    consoleErrors: [...new Set(consoleErrors)],
    overflow: [...new Set(overflow)],
  };

  // An empty CRUD list means "not run" (no admin session), which is not a pass.
  const crudRan = report.crud.length > 0;
  const crudOk = crudRan && report.crud.every((c) => c.created && c.deleted);
  const guardOk = !report.guard
    || (report.guard.exposed.length === 0 && report.guard.results.every((r) => r.ok));
  report.totals.failures = report.totals.withProblems + (crudRan && !crudOk ? 1 : 0) + (guardOk ? 0 : 1);
  save();

  if (report.aggregate.failedRequests.length) {
    console.log(`\nFailed requests (${report.aggregate.failedRequests.length} unique):`);
    for (const f of report.aggregate.failedRequests) console.log(`   • ${f}`);
  }
  if (report.aggregate.consoleErrors.length) {
    console.log(`\nConsole errors (${report.aggregate.consoleErrors.length} unique):`);
    for (const c of report.aggregate.consoleErrors) console.log(`   • ${c}`);
  }

  console.log(`\n${'═'.repeat(74)}`);
  console.log(`BROWSER RESULT — page loads ${report.totals.loads} | pages clean ${report.totals.clean} | pages with issues ${report.totals.withProblems}`);
  console.log(`admin CRUD create+delete: ${crudRan ? (crudOk ? 'PASS' : 'FAIL') : 'SKIPPED (no admin session)'}`);
  if (report.guard) {
    console.log(`unauth route guard: ${guardOk ? 'PASS' : 'FAIL'} (${report.guard.results.length} protected paths, ${report.guard.exposed.length} exposed endpoint hit(s))`);
  }
  console.log(`roles swept: ${ROLES.join(', ')}`);
  console.log(`screenshots: ${SHOT_DIR}`);
  console.log(`report: ${REPORT}`);
  console.log('═'.repeat(74));

  process.exit(report.totals.failures === 0 ? 0 : 1);
};

main().catch((error) => {
  console.error(`\nBrowser audit failed to run: ${error.message}`);
  process.exit(2);
});
