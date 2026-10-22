#!/usr/bin/env node
/**
 * Checkout price display — real-browser regression test.
 *
 *   npm run verify:checkout-browser
 *
 * The bug this pins (reproduced on the live build in 2 of 4 loads): opening
 * `/checkout?courseId=<a $499 program>` quoted $99 on first paint and $499 once
 * the program's own reservation fee arrived. Both requests were in flight at
 * once, so a slow $99 answer could land last and repaint the summary and the pay
 * button as $99 while the selected deposit — the amount the server would charge
 * — was $499.
 *
 * `verify:quote-race` proves the ordering gate and the page's contract in
 * source. This suite proves the thing a customer actually sees, in the built
 * bundle, with the two responses forced out of order:
 *
 *   1. a $499 program must read $499 even when its $99 quote answers LAST;
 *   2. the same page must still read $99 when the visitor picks the $99 seat.
 *
 * No database, no server and no payment: the built client is served from
 * `client/dist` and `/api/*` is answered by this script. Nothing leaves the
 * machine, and no checkout is ever created.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

module.paths.push(path.join(__dirname, '..', 'node_modules'));
const puppeteer = require('puppeteer-core');

/** Overridable so this suite can be pointed at an older build (see the README note). */
const DIST = path.resolve(process.env.CHECKOUT_DIST || path.join(__dirname, '..', 'client', 'dist'));
const CHROME =
  process.env.CHROME_PATH ||
  ['C:/Program Files/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed });
  console.log(`${passed ? '  OK ' : '  FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/** How long each stubbed quote takes, keyed by the requested deposit. */
const QUOTE_DELAY_MS = { 99: 1200, 499: 60 };

const COURSE_499 = {
  _id: 'stub-course-499',
  title: 'AI Product Manager (Stub)',
  slug: 'ai-product-manager',
  duration: '4 Months',
  isPublished: true,
  pricing: { basePrice: 2499, discountedPrice: 2499, reservationFee: 499 },
};

const SETTINGS = {
  depositPriceUSD: 99,
  payments: { configured: true },
  personalizedLearning: { price: 5499 },
  checkout: {},
};

/** Answer an intercepted request with JSON, the way the API would. */
const json = (request, body) => request.respond({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

/** `client/dist` with the SPA fallback the real server uses. */
const startStaticServer = () => new Promise((resolve) => {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.resolve(path.join(DIST, urlPath));
    if (file !== DIST && !file.startsWith(DIST + path.sep)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const ext = path.extname(file).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.json': 'application/json',
        '.xml': 'application/xml; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8',
        '.woff2': 'font/woff2',
      };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
      return;
    }
    // SPA fallback, exactly like server.js in production.
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(DIST, 'index.html')).pipe(res);
  });
  server.listen(0, '127.0.0.1', () => resolve(server));
});

const main = async () => {
  if (!CHROME) {
    console.error('Chrome was not found. Set CHROME_PATH to a Chrome/Chromium executable.');
    process.exit(2);
  }
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('client/dist is missing — run the client build first.');
    process.exit(2);
  }

  const server = await startStaticServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const quoteRequests = [];
  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: 'new',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
      protocolTimeout: 120000,
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin !== base) { request.abort(); return; }

      const route = url.pathname;
      if (!route.startsWith('/api/')) { request.continue(); return; }

      if (route === '/api/settings') {
        json(request, { success: true, settings: SETTINGS });
        return;
      }
      if (route === '/api/courses') {
        json(request, { success: true, courses: [COURSE_499], count: 1 });
        return;
      }
      if (route === '/api/payments/quote' && request.method() === 'POST') {
        let body = {};
        try { body = JSON.parse(request.postData() || '{}'); } catch (e) { /* keep {} */ }
        const asked = Number(body.depositAmount) === 99 ? 99 : 499;
        quoteRequests.push(asked);
        const payload = {
          quote: {
            tier: body.tier || 'deposit',
            amount: asked,
            originalPrice: asked,
            discountAmount: 0,
            couponApplied: false,
            label: `Cohort Seat Reservation Deposit ($${asked.toLocaleString('en-US')})`,
            currency: 'USD',
            courseTitle: COURSE_499.title,
            courseDuration: COURSE_499.duration,
          },
          payments: { configured: true },
          installments: { available: false, methods: [] },
        };
        setTimeout(() => {
          try { json(request, payload); } catch (e) { /* page moved on */ }
        }, QUOTE_DELAY_MS[asked] || 60);
        return;
      }
      // Anything else the shell asks for (nav, footer content) is simply empty.
      json(request, { success: true });
    });

    const submitText = () => page.$eval('button[type="submit"]', (el) => el.textContent.replace(/\s+/g, ' ').trim());
    const summaryText = () => page.evaluate(() => {
      const label = [...document.querySelectorAll('span')].find((el) => el.textContent.trim() === 'Total Due Now');
      const row = label ? label.parentElement : null;
      return row ? row.textContent.replace(/\s+/g, ' ').trim() : '';
    });

    console.log(`\n${'-'.repeat(70)}\n1. A $499 program with the $99 answer forced to arrive last\n${'-'.repeat(70)}`);
    await page.goto(`${base}/checkout?courseId=${COURSE_499._id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    // Long enough for both stubbed quotes (1.2 s and 60 ms) to have landed.
    await new Promise((r) => setTimeout(r, 4000));

    const paidRequests = quoteRequests.slice();
    check('Both quotes were requested (first paint, then the program fee)',
      paidRequests.includes(99) && paidRequests.includes(499),
      `requested=${paidRequests.join(',')}`);
    const button499 = await submitText();
    check('The pay button still reads $499 after the slow $99 quote arrives',
      button499.includes('$499') && !button499.includes('$99'), button499);
    const summary499 = await summaryText();
    check('Total Due Now reads $499', summary499.includes('$499') && !summary499.includes('$99'), summary499);
    const label499 = await page.evaluate(() => document.body.innerText.includes('Cohort Seat Reservation Deposit ($499)'));
    check('The breakdown names the $499 seat deposit', label499);
    const pressed499 = await page.$eval('button[aria-pressed="true"]', (el) => el.textContent.replace(/\s+/g, ' ').trim());
    check('The $499 option is the selected one', pressed499.includes('$499'), pressed499);

    console.log(`\n${'-'.repeat(70)}\n2. The visitor deliberately picks the $99 seat\n${'-'.repeat(70)}`);
    const seat99 = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button[aria-pressed]')]
        .find((el) => el.textContent.includes('$99')));
    check('A $99 seat option exists', Boolean(await seat99.jsonValue()));
    await seat99.click();
    await new Promise((r) => setTimeout(r, 3500));
    const button99 = await submitText();
    check('The pay button reads $99 for the $99 selection', button99.includes('$99') && !button99.includes('$499'), button99);
    const summary99 = await summaryText();
    check('Total Due Now reads $99', summary99.includes('$99') && !summary99.includes('$499'), summary99);

    check('No uncaught page errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 160));
  } catch (error) {
    // Say what the page was showing, so a failure here is diagnosable without
    // re-running the suite by hand.
    let visible = '';
    try {
      visible = (await page.evaluate(() => document.body.innerText)) || '';
    } catch (e) { /* page gone */ }
    check('Browser suite completed', false, `${error.message} — page said: ${visible.replace(/\s+/g, ' ').slice(0, 180)}`);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.error('Checkout shows a deposit the customer did not select.');
    process.exit(1);
  }
  console.log('Checkout price display follows the selected deposit in a real browser.');
};

main();
