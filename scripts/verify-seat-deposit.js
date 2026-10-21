/**
 * Seat-deposit consistency — contract test.
 *
 *   npm run verify:deposit
 *
 * The client reported that the CAREER PROGRAMS mega-menu printed one deposit
 * amount on the home page and another on the Live Jobs page. The cause was not
 * a wrong number: the amount was typed into the markup wherever it appeared
 * ("$99 Deposit" here, "Reserve Seat — $99" there), so no single value owned it
 * and nothing tied the labels to the amount checkout would charge.
 *
 * This suite proves both halves of the fix:
 *
 *   1. the server has ONE authority (Settings → depositPriceUSD), it is exposed
 *      to the public settings reply, and the reservation quote follows it — with
 *      an off-menu value falling back to $99 instead of charging it,
 *   2. every public surface that prints a deposit reads the shared client helper
 *      (client/src/lib/seatDeposit.js) instead of its own literal, so the header
 *      menu on any page, the home page cards, the catalogue and the hero can
 *      never disagree.
 *
 * Boots the API against a throwaway local MongoDB and cleans up after itself.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5333;
const BASE = `http://127.0.0.1:${PORT}`;
const SEED_ADMIN_PASSWORD = 'Vertex-Seat-Deposit-Check-2026!z';
const DB_NAME = `aft_deposittest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  OK ' : '  FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => {
  console.log(`\n${'-'.repeat(68)}\n${title}\n${'-'.repeat(68)}`);
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

const readSource = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

/**
 * Source with comments removed.
 *
 * The prose above these labels quotes the broken amounts ("Reserve with $499
 * $99"), and a literal-amount check that reads comments fails on its own
 * explanation of the bug it guards against.
 */
const readCode = (rel) => readSource(rel)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n')
  .map((line) => (/^\s*(\/\/|\*)/.test(line) ? '' : line))
  .join('\n');

const run = async () => {
  console.log(`\nBooting API on port ${PORT} against ${DB_NAME}`);

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI,
      NODE_ENV: 'development',
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD,
      JWT_SECRET: 'seat_deposit_contract_secret_long_enough_01',
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
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch (error) { /* not up yet */ }
      await sleep(1200);
    }
    check('API boots on a throwaway database', healthy);
    if (!healthy) throw new Error(`server never became reachable\n${serverLog.slice(-2000)}`);

    section('1. The admin owns the deposit, and the public site can read it');

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

    // The seeder writes the demo catalogue in the background.
    let courseId = '';
    let previous = -1;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const res = await request('GET', '/api/courses');
      const list = res.json?.courses || [];
      if (list.length && list.length === previous) { courseId = String(list[0]._id); break; }
      previous = list.length;
      await sleep(900);
    }
    check('The public feed has a program to quote', Boolean(courseId));
    if (!courseId) throw new Error('catalogue never settled');

    const fresh = await request('GET', '/api/settings');
    check('The public settings reply carries depositPriceUSD (the one number the UI reads)',
      Number.isFinite(Number(fresh.json?.settings?.depositPriceUSD)),
      `depositPriceUSD=${fresh.json?.settings?.depositPriceUSD}`);

    const quoteAt = async (body) => {
      const res = await request('POST', '/api/payments/quote', {
        body: { courseId, tier: 'deposit', ...body },
      });
      return Number(res.json?.quote?.amount);
    };

    const defaultQuote = await quoteAt({});
    check('The reservation quote uses the saved deposit', defaultQuote === 99, `$${defaultQuote}`);

    section('2. Changing it moves the quote — and the reply the menu reads');

    const setDeposit = async (value) => {
      const res = await request('PUT', '/api/settings', { token, body: { depositPriceUSD: value } });
      return res.status;
    };

    const saved499 = await setDeposit(499);
    check('An admin can set the deposit to $499', saved499 === 200, `HTTP ${saved499}`);
    const public499 = await request('GET', '/api/settings');
    check('The public settings follow immediately (no stale 30 s cache)',
      Number(public499.json?.settings?.depositPriceUSD) === 499,
      `depositPriceUSD=${public499.json?.settings?.depositPriceUSD}`);
    const quote499 = await quoteAt({});
    check('Checkout then charges the $499 deposit', quote499 === 499, `$${quote499}`);

    const savedOffMenu = await setDeposit(149);
    check('An off-menu deposit can be saved', savedOffMenu === 200, `HTTP ${savedOffMenu}`);
    const quoteOffMenu = await quoteAt({});
    check('An off-menu deposit is never charged (falls back to $99)', quoteOffMenu === 99, `$${quoteOffMenu}`);

    const restored = await setDeposit(99);
    check('The admin can put it back to $99', restored === 200, `HTTP ${restored}`);
    const quoteRestored = await quoteAt({});
    check('The restored deposit is charged again', quoteRestored === 99, `$${quoteRestored}`);

    section('2b. A single program can carry its own reservation fee');

    // The client's four-month tracks (CISSP, AI Product Manager, GRC) quote a
    // $499 seat reservation while every other program keeps the $99 default, so
    // the fee has to live on the course. This drives the real admin route and
    // the real quote endpoint — the browser can only print what they agree on.
    const publicFeed = await request('GET', '/api/courses');
    const courseDoc = (publicFeed.json?.courses || []).find((c) => String(c._id) === courseId);
    const saveFee = await request('PUT', `/api/courses/${courseId}`, {
      token,
      body: { pricing: { ...(courseDoc?.pricing || {}), reservationFee: 499 } },
    });
    check('Admin → Courses can save a $499 fee on one program',
      saveFee.status === 200 && Number(saveFee.json?.course?.pricing?.reservationFee) === 499,
      `HTTP ${saveFee.status}`);

    const feedAfterFee = await request('GET', '/api/courses');
    const listed = (feedAfterFee.json?.courses || []).find((c) => String(c._id) === courseId);
    check('The public feed carries the fee, so the cards and the menu can print it',
      Number(listed?.pricing?.reservationFee) === 499, 'pricing.reservationFee=499');

    const courseQuote = await quoteAt({});
    check('An unrequested deposit follows the program fee, not the $99 site default',
      courseQuote === 499, `$${courseQuote}`);

    const explicit99 = await quoteAt({ depositAmount: 99 });
    check('An explicit $99 reservation is still accepted (the course page offers both)',
      explicit99 === 99, `$${explicit99}`);

    section('3. One helper, used by every surface that prints a deposit');

    const helper = readSource('client/src/lib/seatDeposit.js');
    check('The helper owns the allowed amounts', helper.includes('SEAT_DEPOSIT_OPTIONS')
      && helper.includes('99') && helper.includes('499'));
    check('A missing or off-menu value resolves to the $99 fallback',
      helper.includes('FALLBACK_SEAT_DEPOSIT') && helper.includes('includes(configured)'));
    check('A course can override the site default with its own fee',
      helper.includes('resolveCourseSeatDeposit')
      && helper.includes('pricing?.reservationFee')
      && /perCourse/.test(helper),
      'course fee wins over the site default');

    // The four-month programs (CISSP, AI Product Manager, GRC) reserve at $499
    // while the rest keep the site default, so the fee has to live on the
    // course — and the checkout must preselect it, not the global number.
    const courseModel = readSource('server/models/Course.js');
    check('The Course schema stores a per-program reservation fee',
      courseModel.includes('reservationFee'), 'pricing.reservationFee');
    const serverPricing = readSource('server/utils/pricing.js');
    check('The server prices an unrequested deposit from the course first',
      serverPricing.includes('resolveCourseReserveAmount')
      && /perCourse[\s\S]{0,120}depositPriceUSD/.test(serverPricing),
      'course → settings → $99');
    const checkout = readSource('client/src/pages/CheckoutPage.jsx');
    check('Checkout preselects the program\'s own fee',
      checkout.includes('resolveSeatDeposit(settings, course)'),
      'a $499 card cannot open a $99 checkout');
    const coursesCms = readSource('client/src/admin/CoursesCMS.jsx');
    check('Admin → Courses can edit the reservation fee',
      coursesCms.includes('reservationFee') && coursesCms.includes('Reservation fee'),
      'per-course control, so the fee is editable without a deploy');

    const surfaces = {
      'the header mega-menu (every page)': 'client/src/components/Navbar.jsx',
      'the home page program cards': 'client/src/components/CourseSection.jsx',
      'the /courses catalogue': 'client/src/pages/CoursesPage.jsx',
      'the hero ledger': 'client/src/components/Hero.jsx',
      'the placement roadmap (home + Live Jobs)': 'client/src/components/PlacementRoadmap.jsx',
      'the closing CTA strip': 'client/src/components/CallToAction.jsx',
    };

    for (const [label, file] of Object.entries(surfaces)) {
      const source = readSource(file);
      const code = readCode(file);
      // The menu prints a per-program badge, so it reads `seatDepositLabel`
      // (which resolves the course's own fee first) instead of
      // `formatSeatDeposit`; every other surface still formats one amount.
      const usesHelper = source.includes("from '../lib/seatDeposit'")
        && (source.includes('formatSeatDeposit') || source.includes('seatDepositLabel'));
      check(`${label} reads the shared deposit helper`, usesHelper);
      const typedIn = /\$\d+\s*Deposit|Reserve (Seat|with)?\s*—?\s*\$\d+/.test(code);
      check(`${label} no longer types a deposit amount into the markup`, !typedIn);
    }

    // The catalogue can now mix $99 and $499 reservations, so the header quotes
    // the lowest fee (through the same helper) and every row prints ITS OWN
    // course fee. Both must come from seatDeposit.js — never a literal.
    const navbarSource = readSource('client/src/components/Navbar.jsx');
    check('The menu header quotes the catalogue floor through the helper',
      navbarSource.includes('Deposits from {depositFrom}')
      && navbarSource.includes('lowestSeatDeposit'),
      'header + rows resolve through seatDeposit.js');
    check('Each menu row prints its own program\'s reservation fee',
      navbarSource.includes('{seatDepositLabel(settings, prog)}'),
      'per-course badge, not one catalogue-wide number');

    section('4. A saved inline edit can no longer outrank the setting');

    // The live home page showed $499 in the menu while Live Jobs showed $99 for
    // the same menu: the amount had been edited in the inline editor, and a
    // saved edit outranks the coded value. Derived text is now locked.
    const engine = readSource('client/src/lib/siteOverrides.js');
    check('The override engine knows about derived (locked) text',
      engine.includes('isLockedText') && engine.includes("dataset.noEdit === 'true'"));
    check('Locked text is never handed to the editor or painted over by the applier',
      engine.includes('!isLockedText(node)') && engine.includes('resolvedKeys.add(lockedKey)'),
      'skipped + its saved key stays resolved, so the orphan pass cannot move it');
    check('The menu marks the header line and every row badge as derived',
      (navbarSource.match(/data-no-edit="true"/g) || []).length >= 2,
      `${(navbarSource.match(/data-no-edit="true"/g) || []).length} locked node(s)`);

    // "Reserve with {depositAmount}" is TWO text nodes. A saved edit keyed to
    // the old single node then landed on the fragment and the live cards read
    // "Reserve with $499 $99". A template string keeps one node, and the lock
    // stops any stored edit touching it at all.
    const depositLabels = {
      'home program cards': 'client/src/components/CourseSection.jsx',
      '/courses cards': 'client/src/pages/CoursesPage.jsx',
      'hero ledger': 'client/src/components/Hero.jsx',
      'closing CTA strip': 'client/src/components/CallToAction.jsx',
      'placement roadmap': 'client/src/components/PlacementRoadmap.jsx',
    };

    for (const [label, file] of Object.entries(depositLabels)) {
      const code = readCode(file);
      const locked = (code.match(/data-no-edit="true"/g) || []).length;
      // `${depositAmount}` is one node; `{depositAmount}` next to a word splits
      // the label into fragments that a stored edit can corrupt.
      const splitLabel = /(^|[^$])\{\s*depositAmount\s*\}/.test(code);
      check(`${label}: deposit labels are locked and kept in one text node`,
        locked >= 1 && !splitLabel,
        `${locked} locked node(s), split label=${splitLabel}`);
    }
  } finally {
    await stopServer();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'-'.repeat(68)}`);
  console.log(`  ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('  FAILED:');
    failed.forEach((f) => console.log(`   • ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
    console.log(`${'-'.repeat(68)}\n`);
    process.exitCode = 1;
    return;
  }
  console.log('  Seat deposit is one number on every page. ✅');
  console.log(`${'-'.repeat(68)}\n`);
};

run().catch((error) => {
  console.error(`\nSuite aborted: ${error.message}`);
  process.exitCode = 1;
});
