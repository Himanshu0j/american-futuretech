/**
 * CMS field-persistence regression test.
 *
 *   node scripts/verify-cms-settings.js
 *
 * Why this exists: the admin UI could save capstone showcase cards and get a
 * 200 OK while mongoose (strict mode) silently dropped them, because
 * `capstone.projects` was never declared in the SiteSettings schema. The course
 * pages therefore kept showing their defaults and the client saw "my changes did
 * not update".
 *
 * This boots the real API against a throwaway database and drives the real
 * endpoints, so any future UI/schema mismatch fails here instead of in front of
 * the client.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}`;
const SEED_ADMIN_PASSWORD = 'Vertex-Cohort-2026!z';
const DB_NAME = `aft_cmstest_${Date.now()}`;
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
  try {
    json = await res.json();
  } catch (error) {
    json = null;
  }
  return { status: res.status, json };
};

const CAPSTONE_CARDS = [
  {
    tag: 'Machine Learning',
    title: 'US Health Care Analysis',
    desc: 'Analyze real-world U.S. healthcare data for patient outcome and cost patterns.',
    stack: ['Python', 'Pandas', 'Scikit-Learn'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    tag: 'Computer Vision',
    title: 'Emotion Recognition',
    desc: 'Deep CNN that classifies facial emotion in real time.',
    stack: ['TensorFlow', 'OpenCV'],
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    tag: 'Business Intelligence',
    title: 'Sales Forecasting Dashboard',
    desc: 'Executive BI dashboard forecasting multi-region revenue.',
    stack: ['Power BI', 'ARIMA', 'SQL'],
    color: 'from-amber-500 to-orange-500',
  },
];

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
      JWT_SECRET: 'cms_contract_test_secret_that_is_long_enough_0001',
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
    // 1. Wait for the API to answer.
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

    // 2. Wait for the seeder to create the admin account.
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

    // 3. Baseline read.
    const before = await request('GET', '/api/settings');
    const baselineProjects = before.json?.settings?.capstone?.projects;
    check('Baseline settings load', before.status === 200 && Boolean(before.json?.settings));

    // 4. Save capstone cards exactly like CoursesCMS / SettingsCMS do.
    const save = await request('PUT', '/api/settings', {
      token,
      body: { capstone: { ...(before.json?.settings?.capstone || {}), projects: CAPSTONE_CARDS } },
    });
    check('PUT /api/settings accepts the capstone payload', save.status === 200 && save.json?.success === true);
    check('Server reports no ignored fields for the capstone payload',
      Array.isArray(save.json?.ignoredPaths) && save.json.ignoredPaths.length === 0,
      `ignoredPaths: ${JSON.stringify(save.json?.ignoredPaths)}`);

    // 5. The critical assertion: a fresh GET must return the saved cards.
    const after = await request('GET', '/api/settings');
    const projects = after.json?.settings?.capstone?.projects;
    check('Capstone projects survive a re-read (the bug that bit the client)',
      Array.isArray(projects) && projects.length === CAPSTONE_CARDS.length,
      `count ${Array.isArray(projects) ? projects.length : 'MISSING'}`);
    check('Saved card titles persist',
      Array.isArray(projects) && projects[0]?.title === CAPSTONE_CARDS[0].title,
      `got "${projects?.[0]?.title}"`);
    check('Tech stack persists as an array of strings',
      Array.isArray(projects?.[0]?.stack) && projects[0].stack.length === 3,
      `stack ${JSON.stringify(projects?.[0]?.stack)}`);
    check('Gradient colour persists',
      projects?.[0]?.color === CAPSTONE_CARDS[0].color,
      `got "${projects?.[0]?.color}"`);
    check('Card order is stored', typeof projects?.[2]?.order === 'number', `order ${projects?.[2]?.order}`);
    check('Capstone section fields were not wiped by the partial update',
      Boolean(after.json?.settings?.capstone?.title) && Array.isArray(after.json?.settings?.capstone?.tools),
      `tools ${after.json?.settings?.capstone?.tools?.length}`);

    // 6. Other CMS tabs must persist too.
    const roadmapSave = await request('PUT', '/api/settings', {
      token,
      body: { roadmap: { title: 'Contract Test Roadmap' } },
    });
    const roadmapAfter = await request('GET', '/api/settings');
    check('Roadmap tab still persists', roadmapSave.status === 200 && roadmapAfter.json?.settings?.roadmap?.title === 'Contract Test Roadmap');

    const toolsSave = await request('PUT', '/api/settings', {
      token,
      body: {
        capstone: {
          ...(after.json?.settings?.capstone || {}),
          tools: [{ name: 'Contract Test Tool', category: 'Data & AI', badge: 'Test', order: 1, active: true }],
        },
      },
    });
    const toolsAfter = await request('GET', '/api/settings');
    check('Nested tool list persists', toolsSave.status === 200 && toolsAfter.json?.settings?.capstone?.tools?.[0]?.name === 'Contract Test Tool');

    // 7. Unknown fields are now reported instead of silently dropped.
    const bogus = await request('PUT', '/api/settings', {
      token,
      body: { capstone: { projects: CAPSTONE_CARDS, notARealField: 'x' }, totallyUnknownSection: { a: 1 } },
    });
    const ignored = bogus.json?.ignoredPaths || [];
    check('Unknown nested field is reported', ignored.includes('capstone.notARealField'), JSON.stringify(ignored));
    check('Unknown top-level section is reported', ignored.includes('totallyUnknownSection'), JSON.stringify(ignored));
    check('Response carries a human-readable warning', typeof bogus.json?.warning === 'string' && bogus.json.warning.length > 0);

    // 8. Badge: a bogus key must never silently reappear in the stored document.
    const finalRead = await request('GET', '/api/settings');
    check('Unknown fields are not stored', finalRead.json?.settings?.capstone?.notARealField === undefined);

    // 9. Per-course blocks must survive CREATE, not just update. The create
    //    handler copies an explicit field list, so the admin's "which ways to
    //    learn" ticks and the eligibility text were dropped for every NEW course.
    const created = await request('POST', '/api/courses', {
      token,
      body: {
        title: `Contract Test Course ${Date.now()}`,
        category: 'Data Science',
        duration: '12 Weeks',
        pricing: { originalPrice: 2999, discountedPrice: 2499 },
        viewOptions: { groupBatch: true, personalizedMentor: false },
        eligibility: {
          title: 'Who Should Join?',
          points: ['Working professionals', 'Graduates with 60%+ marks'],
          audiences: ['Graduates', 'Career Switchers'],
          certificationPoints: ['Official US Fellowship Diploma'],
        },
      },
    });
    const createdCourse = created.json?.course;
    check('Course create keeps the learning-experience ticks',
      createdCourse?.viewOptions?.groupBatch === true && createdCourse?.viewOptions?.personalizedMentor === false,
      JSON.stringify(createdCourse?.viewOptions));
    check('Course create keeps the eligibility block',
      createdCourse?.eligibility?.points?.length === 2 && createdCourse.eligibility.audiences?.length === 2,
      `points ${createdCourse?.eligibility?.points?.length} / audiences ${createdCourse?.eligibility?.audiences?.length}`);

    const updateRes = await request('PUT', `/api/courses/${createdCourse?._id}`, {
      token,
      body: { viewOptions: { groupBatch: false, personalizedMentor: true } },
    });
    const courseAfter = await request('GET', `/api/courses/${createdCourse?.slug}`);
    const seen = courseAfter.json?.course || courseAfter.json?.data;
    check('Course update flips the ticks on the public course endpoint',
      updateRes.status === 200 && seen?.viewOptions?.groupBatch === false && seen?.viewOptions?.personalizedMentor === true,
      JSON.stringify(seen?.viewOptions));
    check('Eligibility text is served to the course detail page',
      seen?.eligibility?.title === 'Who Should Join?',
      `title "${seen?.eligibility?.title}"`);

    // 10. The Curriculum Module Composer must reach the real curriculum. The
    //     composer used to write an embedded `course.curriculum` array while the
    //     course page rendered the Module/Lesson collections — so an admin could
    //     add a module, get a 200 OK, and the website never changed.
    const courseId = createdCourse?._id;
    const putCurriculum = await request('PUT', `/api/courses/${courseId}`, {
      token,
      body: {
        curriculum: [
          { moduleNumber: 1, moduleTitle: 'Contract Module One', topics: ['Alpha', 'Beta'], hours: 12 },
          { moduleNumber: 2, moduleTitle: 'Contract Module Two', topics: ['Gamma'], hours: 8 },
        ],
      },
    });
    const liveCurriculum = await request('GET', `/api/curriculum/courses/${courseId}`);
    const liveModules = liveCurriculum.json?.modules || [];
    check('Modules typed in the admin composer reach the curriculum collection',
      putCurriculum.status === 200 && liveModules.length === 2,
      `modules ${liveModules.length}`);
    check('Lessons are created from the module topics',
      liveModules[0]?.lessons?.length === 2 && liveCurriculum.json?.totalLessons === 3,
      `lessons ${liveModules[0]?.lessons?.length} / total ${liveCurriculum.json?.totalLessons}`);
    check('The response reports what the sync did',
      putCurriculum.json?.curriculumSummary?.modules?.created === 2,
      JSON.stringify(putCurriculum.json?.curriculumSummary));

    // Editing must update in place, not duplicate, and must keep lesson identity.
    const moduleOneId = liveModules[0]?._id;
    const alphaLessonId = liveModules[0]?.lessons?.find((l) => l.title === 'Alpha')?._id;
    await request('PUT', `/api/courses/${courseId}`, {
      token,
      body: {
        curriculum: [
          { _id: moduleOneId, moduleTitle: 'Contract Module One (renamed)', topics: ['Alpha'], hours: 14 },
        ],
      },
    });
    const afterEdit = await request('GET', `/api/curriculum/courses/${courseId}`);
    const editedModules = afterEdit.json?.modules || [];
    check('Editing a module updates it instead of duplicating it',
      editedModules.length === 1, `modules ${editedModules.length}`);
    check('A removed topic deletes its lesson',
      editedModules[0]?.lessons?.length === 1, `lessons ${editedModules[0]?.lessons?.length}`);
    check('A kept topic keeps the same lesson document',
      String(editedModules[0]?.lessons?.[0]?._id) === String(alphaLessonId),
      `${editedModules[0]?.lessons?.[0]?._id} vs ${alphaLessonId}`);
    check('Renamed module title and hours persist',
      editedModules[0]?.title === 'Contract Module One (renamed)' && editedModules[0]?.durationHours === 14,
      `"${editedModules[0]?.title}" / ${editedModules[0]?.durationHours}h`);

    const adminList = await request('GET', '/api/courses/admin/all', { token });
    const listedCourse = (adminList.json?.courses || []).find((c) => String(c._id) === String(courseId));
    check('Course CMS shows the real module count (was always 0 Modules)',
      listedCourse?.moduleCount === 1, `moduleCount ${listedCourse?.moduleCount}`);

    await request('PUT', `/api/courses/${courseId}`, { token, body: { curriculum: [] } });
    const cleared = await request('GET', `/api/curriculum/courses/${courseId}`);
    check('Clearing the composer clears the curriculum',
      (cleared.json?.modules || []).length === 0, `modules ${(cleared.json?.modules || []).length}`);
  } finally {
    await stopServer();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
    if (serverLog.includes('Error')) {
      console.log('\nServer log excerpt:');
      console.log(serverLog.split('\n').filter((l) => /error|Error/.test(l)).slice(0, 10).join('\n'));
    }
    process.exit(1);
  }
  console.log('All CMS persistence checks passed ✅');
};

run().catch(async (error) => {
  console.error('\nVerification crashed:', error.message);
  process.exit(1);
});
