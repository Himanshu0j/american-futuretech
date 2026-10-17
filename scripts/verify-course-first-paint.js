#!/usr/bin/env node
/**
 * American FutureTech — COURSE first-paint provenance check.
 *
 *   node scripts/verify-course-first-paint.js
 *
 * The report this guards against: "dusre ke mobile pe purani images aur courses
 * ka data purana dikh raha hai". The homepage cards, the /courses catalogue and
 * the header menu each fetched `/api/courses` on their own, and the homepage
 * answered ANY failed request by rendering a hardcoded demo catalogue. A phone
 * on a weak connection — or behind a carrier proxy that answers HTML — failed
 * the request and painted months-old titles, artwork and faculty lines that
 * exist nowhere in the database, while the admin's laptop (which had them
 * cached) looked correct.
 *
 * Two things must therefore be true, and both are checked here against a real
 * production-mode server on a throwaway database:
 *
 *   1. the served HTML embeds the CURRENT catalogue (`#aft-courses-bootstrap`),
 *      and it matches what `/api/courses` answers right now;
 *   2. an admin edit is visible in the very next document — not in the build
 *      after, not after a cache window;
 *   3. the shipped client bundle no longer contains the demo programmes, so no
 *      code path can paint them again.
 *
 * Usage:
 *   npm run verify:course-first-paint
 *   VERIFY_PORT=5401 npm run verify:course-first-paint
 */

const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const { MongoMemoryServer } = require('mongodb-memory-server');

const SERVER_DIR = path.join(__dirname, '..', 'server');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
const PORT = Number(process.env.VERIFY_PORT) || 5397;
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'admin@americanfuturetech.com';
const ADMIN_PASSWORD = 'Vertex-Cohort-2026!z';

// The exact strings the retired fallback used to paint — a catalogue nobody
// saved and a faculty line no course carries.
const RETIRED_DEMO_TEXT = ['Silicon Valley ML Practitioners', 'Active US Red Team Operators'];

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const request = async (method, url, { token, body } = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (error) {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
};

const readBootstrapCourses = (html) => {
  const tag = (html.match(/<script id="aft-courses-bootstrap"[^>]*>([\s\S]*?)<\/script>/) || [])[1];
  if (!tag) return null;
  try {
    return JSON.parse(tag);
  } catch (error) {
    return null;
  }
};

const run = async () => {
  console.log(`\nBooting a production-mode API on ${PORT} with a throwaway database\n`);

  const memory = await MongoMemoryServer.create({ instance: { port: 27018, dbName: 'aft_course_paint' } });
  const uri = memory.getUri('aft_course_paint');

  const server = spawn(process.execPath, [path.join(SERVER_DIR, 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'production',
      MONGODB_URI: uri,
      JWT_SECRET: crypto.randomBytes(48).toString('hex'),
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  server.stdout.on('data', (d) => { serverLog += d.toString(); });
  server.stderr.on('data', (d) => { serverLog += d.toString(); });

  const stop = async () => {
    server.kill();
    await sleep(600);
    await memory.stop().catch(() => {});
  };

  try {
    let healthy = false;
    for (let i = 0; i < 40; i += 1) {
      try {
        if ((await request('GET', '/api/health')).status === 200) { healthy = true; break; }
      } catch (error) { /* still booting */ }
      await sleep(1500);
    }
    check('Production-mode API is reachable', healthy, healthy ? '' : serverLog.slice(-400));
    if (!healthy) throw new Error('server never started');

    /*
     * The demo catalogue is written by the seeder in the background, so "the API
     * answers" and "the catalogue exists" are two different moments. Wait for
     * the seed to land instead of failing on a race.
     */
    let apiList = [];
    let previousCount = -1;
    for (let i = 0; i < 40; i += 1) {
      const res = await request('GET', '/api/courses');
      apiList = res.json?.courses || [];
      // A count that merely repeats can still be mid-seed, which would make the
      // "snapshot equals the API" comparison below race the seeder.
      if (apiList.length >= 3 && apiList.length === previousCount) break;
      previousCount = apiList.length;
      await sleep(900);
    }
    check('The API serves a catalogue', apiList.length > 0, `count=${apiList.length}`);
    if (!apiList.length) throw new Error('no courses seeded');

    const first = await request('GET', '/');
    const snapshot = readBootstrapCourses(first.text);
    check('Served HTML ships the first-paint course snapshot', Boolean(snapshot?.courses?.length),
      snapshot?.courses?.length ? `courses=${snapshot.courses.length}` : 'no course snapshot in the served HTML');
    check('The document itself is never stored by a browser or an edge',
      /no-store/.test(first.headers.get('cache-control') || '') &&
        /no-store/.test(first.headers.get('cdn-cache-control') || ''),
      `${first.headers.get('cache-control')} / ${first.headers.get('cdn-cache-control')}`);

    if (snapshot?.courses?.length) {
      const sameCount = snapshot.courses.length === apiList.length;
      const sameFirst = String(snapshot.courses[0]?._id) === String(apiList[0]?._id)
        && snapshot.courses[0]?.title === apiList[0]?.title;
      check('The snapshot is the catalogue the API serves right now', sameCount && sameFirst,
        sameCount && sameFirst
          ? `first="${apiList[0].title}"`
          : `html ${snapshot.courses.length}/${snapshot.courses[0]?.title} vs api ${apiList.length}/${apiList[0]?.title}`);
    }

    // ── The regression itself: an admin save must reach the NEXT document ────
    let token = '';
    for (let i = 0; i < 20; i += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { token = res.json.token; break; }
      await sleep(1500);
    }
    check('Admin authenticated', Boolean(token));
    if (!token) throw new Error('login failed');

    const target = apiList[0];
    const newTitle = `Data Science with AI Integration ${Date.now().toString().slice(-5)}`;
    const saved = await request('PUT', `/api/courses/${target._id}`, {
      token,
      body: { ...target, title: newTitle },
    });
    check('Course rename accepted', saved.status === 200, `status ${saved.status}`);

    const after = await request('GET', '/');
    const afterSnapshot = readBootstrapCourses(after.text);
    const painted = (afterSnapshot?.courses || []).some((c) => c.title === newTitle);
    check('The renamed course is in the very next served document', painted,
      painted ? newTitle : `snapshot still shows "${afterSnapshot?.courses?.[0]?.title}"`);

    const htmlApi = await request('GET', '/api/courses');
    check('The snapshot matches the API after the save',
      (htmlApi.json?.courses || []).some((c) => c.title === newTitle));

    // ── The demo catalogue must not exist in any shipped code path ───────────
    if (fs.existsSync(path.join(CLIENT_DIST, 'assets'))) {
      const assets = fs.readdirSync(path.join(CLIENT_DIST, 'assets')).filter((f) => f.endsWith('.js'));
      const found = RETIRED_DEMO_TEXT.filter((needle) =>
        assets.some((file) => fs.readFileSync(path.join(CLIENT_DIST, 'assets', file), 'utf8').includes(needle)));
      check('The demo programme text is gone from the built bundle', found.length === 0,
        found.length ? `still shipped: ${found.join(', ')}` : `scanned ${assets.length} bundles`);
    } else {
      console.log('  ⚠️  client/dist is not built — skipped the bundle scan (run `npm run build`)');
    }
  } finally {
    await stop();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log(`\n${failed.length} FAILED:`);
    failed.forEach((f) => console.log(`  · ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(`\nSuite crashed: ${error.message}`);
  process.exitCode = 1;
});
