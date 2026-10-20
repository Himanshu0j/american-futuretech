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

    section('3. One helper, used by every surface that prints a deposit');

    const helper = readSource('client/src/lib/seatDeposit.js');
    check('The helper owns the allowed amounts', helper.includes('SEAT_DEPOSIT_OPTIONS')
      && helper.includes('99') && helper.includes('499'));
    check('A missing or off-menu value resolves to the $99 fallback',
      helper.includes('FALLBACK_SEAT_DEPOSIT') && helper.includes('includes(configured)'));

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
      const usesHelper = source.includes("from '../lib/seatDeposit'") && source.includes('formatSeatDeposit');
      check(`${label} reads the shared deposit helper`, usesHelper);
      const typedIn = /\$\d+\s*Deposit|Reserve (Seat|with)?\s*—?\s*\$\d+/.test(source);
      check(`${label} no longer types a deposit amount into the markup`, !typedIn);
    }

    const navbarSource = readSource('client/src/components/Navbar.jsx');
    check('The menu header and each row print the SAME figure',
      navbarSource.includes('All with {depositAmount} Deposit')
      && navbarSource.includes('{depositBadge}'),
      'header + row badges share one value');

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
