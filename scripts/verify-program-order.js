/**
 * Program order (Admin → Courses → Site Order) — end-to-end contract test.
 *
 *   npm run verify:program-order
 *
 * The client asked to decide which program shows first on the site ("pehle Data
 * Science, fir Cyber, Personalized last") and complained that the header menu was
 * listing programs in a strange order — the $99-deposit programs sitting between
 * the $499 ones. Ordering therefore cannot be a hardcoded list inside one page:
 * it has to be one admin-owned sequence that the homepage section, the /courses
 * catalogue AND the header's CAREER PROGRAMS mega-menu all read.
 *
 * Three things have to hold for that promise to be true, and each is checked here
 * against a real booted API and a throwaway database:
 *
 *   1. every list the server hands out is already in the admin's sequence, and the
 *      sequence is writable — but only by an admin holding COURSES_EDIT, with a
 *      bad list refused instead of half-applied,
 *   2. saving a new order is visible IMMEDIATELY (the public feed is cached for
 *      30 s, so without an invalidation the admin reorders and sees nothing),
 *   3. the three client surfaces share ONE comparator, and the two card layouts
 *      draw the artwork the same way (the client's "image cut ho raha hai" report
 *      about the homepage card, next to the catalogue card that fits).
 *
 * Boots the API against a throwaway local MongoDB and cleans up after itself.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5222;
const BASE = `http://127.0.0.1:${PORT}`;
const SEED_ADMIN_PASSWORD = 'Vertex-Program-Order-Check-2026!z';
const DB_NAME = `aft_ordertest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  OK ' : '  FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => {
  console.log(`
${'-'.repeat(68)}
${title}
${'-'.repeat(68)}`);
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
const ids = (courses) => courses.map((c) => String(c._id));
const slugs = (courses) => courses.map((c) => c.slug);
const sameOrder = (a, b) => slugs(a).join(',') === slugs(b).join(',');

const run = async () => {
  console.log(`
Booting API on port ${PORT} against ${DB_NAME}`);

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI,
      NODE_ENV: 'development',
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD,
      JWT_SECRET: 'program_order_contract_secret_long_enough_0001',
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

    section('1. Every list the server hands out is already sequenced');
    check('API boots on a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    let token = '';
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'admin@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { token = res.json.token; break; }
      await sleep(1200);
    }
    check('Admin can sign in (reordering needs an editor)', Boolean(token));
    if (!token) throw new Error('could not authenticate as admin');

    // The seeder writes the demo catalogue in the background: wait for it to
    // settle before reading the feed, or the sequence is a moving target. It is
    // not enough for the count to repeat once — a count of 1 repeated while the
    // seeder was still running failed this suite on the very next line — so the
    // wait ends only at a stable catalogue of the three programs it needs.
    let feed = [];
    let previous = -1;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const res = await request('GET', '/api/courses');
      feed = res.json?.courses || [];
      if (feed.length >= 3 && feed.length === previous) break;
      previous = feed.length;
      await sleep(900);
    }
    check('The public feed lists the seeded programs', feed.length >= 3, `${feed.length} program(s)`);
    if (feed.length < 3) throw new Error('need at least three programs to test a sequence');

    check('Every program carries a numeric display order',
      feed.every((c) => Number.isFinite(Number(c.displayOrder))),
      `orders: ${feed.map((c) => c.displayOrder).join(', ')}`);

    const ascending = feed.every((c, i) => i === 0
      || Number(feed[i - 1].displayOrder) < Number(c.displayOrder)
      || (Number(feed[i - 1].displayOrder) === Number(c.displayOrder)
        && Date.parse(feed[i - 1].createdAt) <= Date.parse(c.createdAt)));
    check('The feed is served in ascending display order', ascending,
      `feed: ${slugs(feed).join(' then ')}`);

    const adminList = await request('GET', '/api/courses/admin/all', { token });
    const adminCourses = adminList.json?.courses || [];
    check('The admin table reads in the same order as the site', sameOrder(adminCourses, feed),
      `${adminCourses.length} row(s)`);

    // ── Guards first: the sequence is not a public write ────────────────────
    section('2. Who may reorder, and what a bad list does');
    const anon = await request('PATCH', '/api/courses/reorder', { body: { order: ids(feed) } });
    check('A signed-out caller cannot reorder programs', anon.status === 401, `HTTP ${anon.status}`);

    let studentToken = '';
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'student@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { studentToken = res.json.token; break; }
      await sleep(900);
    }
    if (studentToken) {
      const student = await request('PATCH', '/api/courses/reorder', {
        token: studentToken, body: { order: [...ids(feed)].reverse() },
      });
      check('A student cannot reorder programs', student.status === 403, `HTTP ${student.status}`);
    } else {
      check('A student cannot reorder programs', false, 'student demo account did not sign in (seeder race)');
    }

    const emptyList = await request('PATCH', '/api/courses/reorder', { token, body: { order: [] } });
    check('An empty list is refused (no silent wipe of the sequence)', emptyList.status === 400,
      `HTTP ${emptyList.status}`);

    const duplicated = await request('PATCH', '/api/courses/reorder', {
      token, body: { order: [ids(feed)[0], ids(feed)[0], ...ids(feed).slice(1)] },
    });
    check('A list with the same program twice is refused', duplicated.status === 400,
      `HTTP ${duplicated.status}`);

    const ghost = await request('PATCH', '/api/courses/reorder', {
      token, body: { order: [...ids(feed), '000000000000000000000000'] },
    });
    check('A list naming a deleted program is refused', ghost.status === 400, `HTTP ${ghost.status}`);

    const afterGuards = await request('GET', '/api/courses');
    check('Nothing was written by the refused attempts', sameOrder(afterGuards.json?.courses || [], feed),
      'feed unchanged');

    // ── The real write ──────────────────────────────────────────────────────
    section('3. The admin reverses the sequence and the whole site follows');
    const originalOrder = ids(feed);
    const reversedFeed = [...feed].reverse();
    const saved = await request('PATCH', '/api/courses/reorder', { token, body: { order: ids(reversedFeed) } });
    check('The admin can save a new program order', saved.status === 200, `HTTP ${saved.status}`);
    check('The response echoes the saved sequence', sameOrder(saved.json?.courses || [], reversedFeed));

    const ordered = saved.json?.courses || [];
    check('The saved order is numbered 1 to N with no gaps or ties',
      ordered.length === feed.length && ordered.every((c, i) => Number(c.displayOrder) === i + 1),
      `orders: ${ordered.map((c) => c.displayOrder).join(', ')}`);

    // The 30 s public cache is the trap: no invalidation on write and the client
    // reorders, reloads, and sees the old sequence for half a minute.
    const feedAfter = await request('GET', '/api/courses');
    check('The public feed follows the new order immediately (cache invalidated)',
      sameOrder(feedAfter.json?.courses || [], reversedFeed),
      `feed: ${slugs(feedAfter.json?.courses || []).join(' then ')}`);

    const detail = await request('GET', `/api/courses/${feed[0].slug}`);
    check('Reordering never rewrites a program title or duration',
      detail.json?.course?.title === feed[0].title && detail.json?.course?.duration === feed[0].duration,
      `${detail.json?.course?.title} — ${detail.json?.course?.duration}`);

    // A partial list (what a stale browser tab would send) may not drop a
    // program: anything left out keeps its relative place, after the sent ones.
    const partialIds = originalOrder.slice(0, originalOrder.length - 1);
    const partial = await request('PATCH', '/api/courses/reorder', { token, body: { order: partialIds } });
    check('A partial list is accepted', partial.status === 200, `HTTP ${partial.status}`);
    const partialSlugs = slugs(partial.json?.courses || []);
    check('The program missing from that list keeps its place (moved last, never dropped)',
      partialSlugs.length === feed.length && partialSlugs[partialSlugs.length - 1] === feed[feed.length - 1].slug,
      `feed: ${partialSlugs.join(' then ')}`);

    const restored = await request('PATCH', '/api/courses/reorder', { token, body: { order: originalOrder } });
    check('The admin can put the sequence back',
      restored.status === 200 && sameOrder(restored.json?.courses || [], feed));

    // ── The client halves that only a source check can see ──────────────────
    section('4. One ordering rule on the client, used by all three surfaces');
    const orderLib = readSource('client/src/lib/courseOrder.js');
    const courseSection = readSource('client/src/components/CourseSection.jsx');
    const coursesPage = readSource('client/src/pages/CoursesPage.jsx');
    const navbar = readSource('client/src/components/Navbar.jsx');
    const coursesCms = readSource('client/src/admin/CoursesCMS.jsx');
    const courseRoutes = readSource('server/routes/courseRoutes.js');

    check('The comparator lives in one module (display order, then creation order)',
      orderLib.includes('export function compareCoursesByOrder')
      && orderLib.includes('displayOrder') && orderLib.includes('createdAt'));
    /*
     * All three surfaces now read the catalogue from ONE loader, and that loader
     * is where the admin's sequence is applied. That change is deliberate: each
     * surface used to fetch `/api/courses` alone and the homepage answered a
     * failed request with hardcoded demo programmes, which is how other people's
     * phones showed a catalogue the admin had already replaced. So the checks
     * below assert the shared loader AND its ordering, instead of the three
     * separate call sites that produced the stale content.
     */
    const publicCourses = readSource('client/src/lib/publicCourses.js');
    check('The shared course loader applies the admin sequence',
      publicCourses.includes("from './courseOrder'")
      && publicCourses.includes('sortCoursesByOrder(value)'));
    check('The homepage section reads that loader, and carries no demo catalogue',
      courseSection.includes("from '../lib/publicCourses'")
      && courseSection.includes('usePublicCourses()')
      && !courseSection.includes('defaultCoursesFallback')
      && !courseSection.includes('Flagship Track'));
    check('The catalogue reads it too, and opens on the admin order',
      coursesPage.includes("from '../lib/publicCourses'")
      && coursesPage.includes("useState('featured')")
      && coursesPage.includes('<option value="featured">'));
    check('The header mega-menu reads the same list (the odd $99-between-$499 order)',
      navbar.includes("from '../lib/publicCourses'")
      && navbar.includes('usePublicCourses()'));

    section('5. Both card layouts draw the artwork the same way');
    const hasCoverClass = (src) => /className="[^"]*object-cover/.test(src);
    check('The homepage card no longer crops the artwork (the reported cut image)',
      !hasCoverClass(courseSection), 'object-cover is gone from the card image');
    check('Both cards show the whole image inside the same 4:3 frame',
      courseSection.includes('aspect-[4/3]') && courseSection.includes('object-contain object-center')
      && coursesPage.includes('aspect-[4/3]') && coursesPage.includes('object-contain object-center'));
    check('The program title block is the same light tinted box on both cards',
      courseSection.includes('border-blue-200/80 bg-gradient-to-br from-blue-50')
      && coursesPage.includes('border-blue-200/80 bg-gradient-to-br from-blue-50'));

    section('6. The admin control that writes the sequence');
    check('Admin → Courses moves programs through the reorder endpoint',
      coursesCms.includes("api.patch('/courses/reorder'")
      && coursesCms.includes('const handleMoveCourse')
      && coursesCms.includes('<ArrowUp') && coursesCms.includes('<ArrowDown'));
    check('The table shows the position number, and the editor has a position field',
      coursesCms.includes('Site Order') && coursesCms.includes('displayOrder: Number(displayOrder)'));
    check('The reorder route needs COURSES_EDIT and cannot be read as a course id',
      courseRoutes.includes("router.patch('/reorder', protect, checkPermission('COURSES_EDIT'), reorderCourses)"));

    check('No credentials or tokens leaked into the boot log',
      !serverLog.includes(SEED_ADMIN_PASSWORD) && !/eyJ[A-Za-z0-9_-]{10,}/.test(serverLog));
  } finally {
    section('Cleanup');
    await stopServer();
    console.log('  Server stopped, throwaway database dropped.');
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`
${'='.repeat(68)}
  ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  FAILED ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
    console.log(`${'='.repeat(68)}
`);
    process.exit(1);
  }
  console.log(`${'='.repeat(68)}
`);
  process.exit(0);
};

run().catch((error) => {
  console.error(`
Fatal: ${error.message}`);
  process.exit(1);
});
