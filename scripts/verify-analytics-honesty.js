/**
 * Dashboard analytics honesty test.
 *
 *   node scripts/verify-analytics-honesty.js
 *
 * Why this exists: the executive dashboard used to present invented business
 * data as if it were measured. Specifically it
 *
 *   - labelled every course that was not Data Science as "Cyber Security"
 *     (`c.title.includes('Data Science') ? 'Data Science + AI' : 'Cyber Security'`),
 *   - reported `leadCount || 1`, so a programme with zero leads claimed one,
 *   - drew a "Landing Visits" bar of `totalLeads * 14 + 1250`, and
 *   - produced a seven-day flow from arithmetic on today's count.
 *
 * A client reading those numbers would make decisions on fiction. This suite
 * boots the real API against a throwaway database, plants leads with known
 * courses, statuses and timestamps, and asserts that every figure the dashboard
 * shows can be traced back to a stored document.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5211;
const BASE = `http://127.0.0.1:${PORT}`;
const SEED_ADMIN_PASSWORD = 'Analytics-Honesty-2026!q';
const DB_NAME = `aft_analytics_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
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
  try { json = await res.json(); } catch (error) { json = null; }
  return { status: res.status, json };
};

/** Local midnight, matching how the controller buckets its days. */
const dayStart = (daysAgo = 0) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

/** A timestamp safely inside a given day, so bucket boundaries are unambiguous. */
const midday = (daysAgo) => new Date(dayStart(daysAgo).getTime() + 12 * 60 * 60 * 1000);

const run = async () => {
  console.log(`\nBooting API on port ${PORT} against ${DB_NAME}\n`);

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI,
      NODE_ENV: 'development',
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD,
      JWT_SECRET: 'analytics_contract_test_secret_long_enough_01',
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
      await sleep(1500);
    }
    check('API is reachable on a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    let token = '';
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'admin@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { token = res.json.token; break; }
      await sleep(1500);
    }
    check('Admin login works on the seeded database', Boolean(token));
    if (!token) throw new Error('could not authenticate');

    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    const leads = db.collection('leads');
    const coursesCol = db.collection('courses');

    // The demo seeder keeps writing for a while after the API starts answering,
    // so a snapshot taken too early sees a half-seeded database (worse: it makes
    // the run flaky). Wait for the row counts to stop moving before measuring.
    let lastSignature = '';
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const signature = `${await coursesCol.countDocuments()}c/${await leads.countDocuments()}l`;
      if (signature === lastSignature && Number(signature.split('c')[0]) >= 2) break;
      lastSignature = signature;
      await sleep(1500);
    }

    // The dashboard reads `Course.find()` — every course, not just the public
    // (active-only) list — so measure against the same collection.
    const courses = await coursesCol.find().sort({ createdAt: 1 }).toArray();
    check('Courses are available to measure against', courses.length >= 2, `${courses.length} courses`);
    if (courses.length < 2) throw new Error('no courses to test with');

    // Start leads from an empty collection: every number below is then fully
    // known in advance instead of being "whatever the seeder happened to add".
    const seededLeads = await leads.deleteMany({});
    check('Lead fixtures start from a known empty state', seededLeads.acknowledged === true,
      `removed ${seededLeads.deletedCount} seeded row(s)`);

    // A programme nobody applied to — the case the old `|| 1` fabricated.
    const idleCourseId = new mongoose.Types.ObjectId();
    await coursesCol.insertOne({
      _id: idleCourseId,
      title: 'Zero Interest Programme QA',
      slug: `zero-interest-qa-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [courseA, courseB] = courses;

    // Known population: 4 today, 5 yesterday, 4 three days ago, 2 nine days ago.
    const plant = [];
    const push = (daysAgo, status, targetCourse) => plant.push({
      fullName: 'Analytics QA Lead',
      email: `analytics-qa-${plant.length}@example.com`,
      phone: '+1 555 0100',
      targetCourse,
      status,
      createdAt: midday(daysAgo),
      updatedAt: midday(daysAgo),
    });

    push(0, 'New', courseA._id);
    push(0, 'New', courseA._id);
    push(0, 'Contacted', courseA._id);
    push(0, 'Lost', courseB._id);          // counts as a lead, not as an admission
    push(1, 'Enrolled', courseA._id);
    push(1, 'Enrolled', courseB._id);
    push(1, 'New', courseB._id);
    push(1, 'New', null);                  // never linked to a programme
    push(1, 'Contacted', courseA._id);
    push(3, 'Enrolled', courseA._id);
    push(3, 'New', courseB._id);
    push(3, 'New', courseB._id);
    push(3, 'Counseling Scheduled', courseA._id);
    push(9, 'New', courseA._id);           // falls in the previous week
    push(9, 'Enrolled', courseB._id);

    await leads.insertMany(plant);

    const dash = await request('GET', '/api/analytics/dashboard', { token });
    check('Dashboard analytics load', dash.status === 200 && Boolean(dash.json?.kpis), `status=${dash.status}`);
    if (dash.status !== 200) throw new Error('dashboard analytics unavailable');

    const { kpis, funnelData, courseDistribution, weeklyFlow } = dash.json;

    // ── 1. Course distribution must use real programme names ────────────────
    check('Course distribution covers every programme',
      courseDistribution.length >= courses.length + 1, `${courseDistribution.length} rows`);

    const mislabelled = courseDistribution.filter((row) => row.name !== row.fullName);
    check('No programme is given a borrowed name', mislabelled.length === 0,
      mislabelled.map((r) => `${r.fullName} shown as ${r.name}`).slice(0, 3).join('; '));

    const wronglyCyber = courseDistribution.filter((row) =>
      row.name === 'Cyber Security' && !String(row.fullName || '').toLowerCase().includes('cyber'));
    check('Non-cyber programmes are never labelled "Cyber Security"', wronglyCyber.length === 0,
      wronglyCyber.map((r) => r.fullName).slice(0, 4).join('; '));

    // ── 2. Every count must match the stored rows ───────────────────────────
    // The native driver returns a cursor here, not an array.
    const countRows = await leads.aggregate([
      { $match: { targetCourse: { $ne: null } } },
      { $group: { _id: '$targetCourse', count: { $sum: 1 } } },
    ]).toArray();
    const realCounts = new Map(countRows.map((row) => [String(row._id), row.count]));

    check('Fixture totals are the numbers the checks expect',
      kpis.totalLeadsAllTime === plant.length, `leads=${kpis.totalLeadsAllTime} planted=${plant.length}`);

    const knownCourses = [...courses, { _id: idleCourseId, title: 'Zero Interest Programme QA' }];
    const mismatches = [];
    for (const row of courseDistribution) {
      const course = knownCourses.find((c) => c.title === row.fullName);
      if (!course) { mismatches.push(`${row.fullName} is not a real course`); continue; }
      const expected = realCounts.get(String(course._id)) || 0;
      if (row.value !== expected) mismatches.push(`${row.fullName}: shown ${row.value}, stored ${expected}`);
    }
    check('Every programme count equals the stored lead count', mismatches.length === 0,
      mismatches.slice(0, 3).join('; '));

    const idleRow = courseDistribution.find((row) => row.fullName === 'Zero Interest Programme QA');
    check('A programme with no leads reports 0, not 1',
      Boolean(idleRow) && idleRow.value === 0, idleRow ? `value=${idleRow.value}` : 'row missing');

    const linkedStored = await leads.countDocuments({ targetCourse: { $ne: null } });
    const plantedLinked = plant.filter((lead) => lead.targetCourse).length;
    const distributionSum = courseDistribution.reduce((sum, row) => sum + row.value, 0);
    check('Distribution adds up to the real total of linked leads',
      distributionSum === linkedStored && distributionSum === plantedLinked,
      `shown=${distributionSum} stored=${linkedStored} planted=${plantedLinked}`);

    const linkedARow = courseDistribution.find((row) => row.fullName === courseA.title);
    const linkedBRow = courseDistribution.find((row) => row.fullName === courseB.title);
    check('The first two courses are distinct programmes', courseA.title !== courseB.title,
      `${courseA.title} / ${courseB.title}`);
    check('Programme A shows exactly its planted leads', linkedARow?.value === 8, `value=${linkedARow?.value} expected=8`);
    check('Programme B shows exactly its planted leads', linkedBRow?.value === 6, `value=${linkedBRow?.value} expected=6`);

    // ── 3. The funnel may only contain measurable stages ────────────────────
    const stages = funnelData.map((row) => row.stage);
    check('No unmeasured "Landing Visits" stage is drawn',
      !stages.some((s) => /visit/i.test(s)), stages.join(' | '));

    const inflated = funnelData.filter((row) => row.count > kpis.totalLeadsAllTime);
    check('No funnel stage exceeds the total number of leads', inflated.length === 0,
      inflated.map((r) => `${r.stage}=${r.count}`).join('; '));

    const enquiries = funnelData.find((row) => /enquir/i.test(row.stage));
    check('Funnel enquiries equals the leads total',
      enquiries?.count === kpis.totalLeadsAllTime, `enquiries=${enquiries?.count} leads=${kpis.totalLeadsAllTime}`);

    const enrolledStage = funnelData.find((row) => /enrolled/i.test(row.stage));
    check('Funnel enrolled count equals the admissions total',
      enrolledStage?.count === kpis.totalEnrolled, `funnel=${enrolledStage?.count} kpis=${kpis.totalEnrolled}`);

    // ── 4. The seven-day flow must follow the stored timestamps ─────────────
    check('Weekly flow has exactly seven days', (weeklyFlow || []).length === 7,
      `${(weeklyFlow || []).length} rows`);

    const todayLabel = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    check('Weekly flow ends today', weeklyFlow?.[6]?.date === todayLabel,
      `last day ${weeklyFlow?.[6]?.date} (expected ${todayLabel})`);
    check('Weekly flow starts six days ago', weeklyFlow?.[0]?.date === `${dayStart(6).getFullYear()}-${String(dayStart(6).getMonth() + 1).padStart(2, '0')}-${String(dayStart(6).getDate()).padStart(2, '0')}`,
      `first day ${weeklyFlow?.[0]?.date}`);

    const todayRow = weeklyFlow?.[6];
    check('Today\'s bucket matches the leads stored today', todayRow?.leads === kpis.totalLeadsToday,
      `flow=${todayRow?.leads} kpis=${kpis.totalLeadsToday}`);

    const weekTotal = (weeklyFlow || []).reduce((sum, row) => sum + row.leads, 0);
    check('Weekly flow sum matches the week-to-date figure', weekTotal === kpis.totalLeadsThisWeek,
      `flow=${weekTotal} kpis=${kpis.totalLeadsThisWeek}`);

    const lastWeek = await leads.countDocuments({ createdAt: { $gte: dayStart(13), $lt: dayStart(7) } });
    check('Last week\'s figure is a real query, not arithmetic',
      kpis.totalLeadsLastWeek === lastWeek, `reported=${kpis.totalLeadsLastWeek} stored=${lastWeek}`);

    const yesterdayStored = await leads.countDocuments({ createdAt: { $gte: dayStart(1), $lt: dayStart(0) } });
    check('Yesterday\'s figure matches the stored rows',
      kpis.totalLeadsYesterday === yesterdayStored, `reported=${kpis.totalLeadsYesterday} stored=${yesterdayStored}`);

    const enrolledStored = await leads.countDocuments({ status: 'Enrolled' });
    check('Admissions rate is derived from stored statuses',
      kpis.admissionsRate === `${((enrolledStored / kpis.totalLeadsAllTime) * 100).toFixed(1)}%`,
      `rate=${kpis.admissionsRate} enrolled=${enrolledStored} of ${kpis.totalLeadsAllTime}`);

    // ── 5. No fabricated deltas leave the server ────────────────────────────
    const payload = JSON.stringify(dash.json);
    const legacyFixtures = ['+24.5%', '+5.2%', '+18.4%', '100% On Schedule', '3.2%'];
    const leaked = legacyFixtures.filter((needle) => payload.includes(needle));
    check('None of the old hardcoded dashboard figures are served', leaked.length === 0, leaked.join(', '));

    const trendKeys = Object.keys(kpis).filter((key) => /trend|change|delta/i.test(key));
    check('The API reports counts, never invented period deltas', trendKeys.length === 0, trendKeys.join(', '));

    // ── 6. Figures the client formats must be numbers, not display strings ──
    check('Active cohorts is a real count', typeof kpis.activeBatches === 'number' && kpis.activeBatches >= 0,
      `activeBatches=${kpis.activeBatches}`);
    check('Revenue pipeline is a real sum of paid fees',
      typeof kpis.totalRevenueValue === 'number' && kpis.totalRevenueValue >= 0,
      `totalRevenueValue=${kpis.totalRevenueValue}`);

    await mongoose.disconnect();
  } finally {
    try { if (mongoose.connection.readyState === 1) await mongoose.disconnect(); } catch (error) { /* closed */ }
    await stopServer();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
    const errors = serverLog.split('\n').filter((l) => /error|Error/.test(l)).slice(0, 10);
    if (errors.length) console.log(`\nServer log excerpt:\n${errors.join('\n')}`);
    process.exit(1);
  }
  console.log('Every dashboard figure is traceable to stored data ✅');
};

run().catch(async (error) => {
  console.error('\nVerification crashed:', error.message);
  process.exit(1);
});
