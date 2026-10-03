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

// Port 5199 is the Vite dev server's home; the suite must not fight it for the
// port (a stale dev server made this suite report "server never became
// reachable" while the API itself was fine). Overridable for local runs.
const PORT = Number(process.env.VERIFY_PORT) || 5399;
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

    // 8b. A full CMS publish must fit in the request body.
    //
    //     SettingsCMS used to post the WHOLE /api/settings response back —
    //     including the inline editor's text/image overrides, which are the
    //     biggest part of the document and are saved by their own endpoint. Once
    //     the site's overrides grew, the request crossed the API's body limit and
    //     every admin tab answered 413 "request entity too large": the client
    //     reported "admin se kuch bhi update nahi ho raha" while the API itself
    //     was healthy. The CMS now sends only the sections it owns, and the body
    //     limit is explicit — this check locks both in.
    const bigOverrides = {};
    const bigImages = {};
    for (let i = 0; i < 12; i += 1) {
      bigOverrides[`/bulk-${i}`] = {};
      bigImages[`/bulk-${i}`] = {};
      for (let j = 0; j < 60; j += 1) {
        bigOverrides[`/bulk-${i}`][`main0>section${j}>h1#t0`] = {
          original: 'Original wording '.repeat(4),
          value: 'Edited wording '.repeat(8),
        };
        bigImages[`/bulk-${i}`][`main0>img${j}`] = { original: `/a-${j}.png`, value: `/b-${j}.png` };
      }
    }
    let bulkAccepted = 0;
    for (let i = 0; i < 12; i += 1) {
      const bulkEditor = await request('PUT', '/api/settings/site-editor', {
        token,
        body: { route: `/bulk-${i}`, text: bigOverrides[`/bulk-${i}`], images: bigImages[`/bulk-${i}`] },
      });
      if (bulkEditor.status === 200) bulkAccepted += 1;
    }
    check('Large editor payloads are accepted page after page', bulkAccepted === 12, `${bulkAccepted}/12 routes`);

    // Read as the admin: the anonymous reply deliberately omits the editor maps
    // that make the full document big, and this check is about the stored size.
    const stored = await request('GET', '/api/settings', { token });
    const fullDoc = stored.json?.settings || {};
    const fullDocSize = Buffer.byteLength(JSON.stringify(fullDoc));
    const cmsOnly = { ...fullDoc };
    delete cmsOnly.textOverrides;
    delete cmsOnly.imageOverrides;
    delete cmsOnly.paymentGateway;
    delete cmsOnly._id;
    delete cmsOnly.__v;
    delete cmsOnly.createdAt;
    delete cmsOnly.updatedAt;
    const cmsOnlySize = Buffer.byteLength(JSON.stringify(cmsOnly));
    check('A realistic settings document is bigger than a CMS save needs to be',
      fullDocSize > 100 * 1024, `${(fullDocSize / 1024).toFixed(1)} kB total`);
    const bigSave = await request('PUT', '/api/settings', { token, body: cmsOnly });
    check('The CMS-shaped save (no overrides/gateway/system fields) is accepted',
      bigSave.status === 200 && bigSave.json?.success === true,
      `status ${bigSave.status} (${(cmsOnlySize / 1024).toFixed(1)} kB)`);
    const afterBig = await request('GET', '/api/settings', { token });
    check('The bulk editor page survived the CMS save',
      Object.keys(afterBig.json?.settings?.textOverrides?.['/bulk-0'] || {}).length === 60,
      `${Object.keys(afterBig.json?.settings?.textOverrides?.['/bulk-0'] || {}).length} entries`);

    /*
     * 8c. What a VISITOR downloads must stay lean.
     *
     * The stored document is ~150 kB with the editor maps; the anonymous reply
     * omits them, because no public page reads them (the overlay fetches one
     * route at a time). This is what made every page view heavy — and a payload
     * that big was also what used to overflow the request limit on save.
     */
    const anonDoc = await request('GET', '/api/settings');
    const anonSettings = anonDoc.json?.settings || {};
    const anonSize = Buffer.byteLength(JSON.stringify(anonSettings));
    check('Anonymous settings reply omits the editor override maps',
      !('textOverrides' in anonSettings) && !('imageOverrides' in anonSettings));
    check('Anonymous settings reply stays well under the stored document size',
      anonSize < 80 * 1024 && anonSize < fullDocSize - 60 * 1024,
      `${(anonSize / 1024).toFixed(1)} kB vs ${(fullDocSize / 1024).toFixed(1)} kB stored`);

    for (let i = 0; i < 12; i += 1) {
      await request('DELETE', `/api/settings/site-editor?route=${encodeURIComponent(`/bulk-${i}`)}`, { token });
    }

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

    // 11. Team & Alliances tab. A nested sub-document (`sisterCompany`,
    //     `pedagogy`, `careerSupport`, `footer`) saves perfectly, but the old
    //     schema check read only `schema.paths` — which never holds nested keys —
    //     and reported "These fields were NOT saved" over the whole tab. The
    //     admin believed the save was broken while the roster, sister-company
    //     copy and footer had all been written.
    const teamPayload = {
      admissionNotice: 'Spring 2026 Admissions Open',
      leadership: [{
        name: 'Contract Test Leader', role: 'Faculty Lead', badge: 'Leadership',
        experience: '5 Years', bio: 'Contract test bio', skills: ['Python'], order: 1, active: true,
      }],
      sisterCompany: {
        enabled: true, eyebrow: 'Sister Staffing Company', name: 'Contract Staffing Inc.',
        badge: 'Sister Company', tagline: 'Tagline', location: 'Branchburg, NJ',
        headline: 'Sister headline', description: 'Sister description', website: 'https://example.com',
        stats: { shortlistHours: '24h', shortlistLabel: 'Shortlists', vetted: '99%', vettedLabel: 'Vetted', placement: 'Direct', placementLabel: 'Placement' },
        services: [{ title: 'IT Staffing', desc: 'Recruitment' }],
      },
      pedagogy: {
        enabled: true, eyebrow: 'Pedagogy', title: 'Build-First', description: 'Hands-on',
        handsOnPercent: 70, theoryPercent: 30,
        pillars: [{ title: 'Capstones', desc: 'Real projects', icon: 'Terminal' }],
        stats: [{ value: '2,000+', label: 'Students' }],
      },
      careerSupport: {
        title: 'Six Pillars', subtitle: 'Career support',
        transparency: { title: 'What it means', description: 'Honest scope', whatWeProvide: ['Resumes'], studentAccountability: ['Practice'] },
        stages: [{ stage: 'STAGE 01', title: 'Resume', tagline: 'Optimisation', points: ['ATS'], icon: 'FileText' }],
      },
      footer: {
        enabled: true, logo: '/images/logo-horizontal-white.webp', logoWidth: 160,
        description: 'Footer description', badgeText: 'Charter', copyrightText: '© 2026 AFT',
        hiringStrip: { enabled: true, text: 'Alumni at leading companies' },
        cta: { enabled: true, label: 'Contact Admissions', url: '/contact' },
        columns: [{ title: 'Company', order: 1, active: true, links: [{ label: 'About Us', url: '/about', order: 1 }] }],
        legalLinks: [{ label: 'Privacy Policy', url: '/privacy', order: 1 }],
      },
      // Header Menu CMS: the client's most frequent request is swapping a
      // top-bar label (CERTIFICATIONS → SUCCESS STORIES). The menu must persist
      // label, link, placement, order and the programs-dropdown flag.
      headerMenu: [
        { label: 'HOME', path: '/', placement: 'main', order: 1, active: true },
        { label: 'LIVE JOBS', path: '/jobs', placement: 'main', order: 2, active: true },
        { label: 'CAREER PROGRAMS', path: '/courses', placement: 'main', order: 3, active: true, hasDropdown: true },
        { label: 'SUCCESS STORIES', path: '/success-stories', placement: 'main', order: 4, active: true },
        { label: 'HIDDEN TEST LINK', path: '/hidden-test', placement: 'main', order: 5, active: false },
        { label: 'Privacy Policy', path: '/privacy', placement: 'more', order: 1, active: true },
      ],
      textOverrides: { '/privacy': { 'main>h1#0': { original: 'Privacy', value: 'Privacy Policy', updatedAt: new Date().toISOString() } } },
      imageOverrides: { '/about': { 'main>img#0': { original: '/a.png', value: '/b.png', updatedAt: new Date().toISOString() } } },
    };
    const teamSave = await request('PUT', '/api/settings', { token, body: teamPayload });
    const teamIgnored = teamSave.json?.ignoredPaths || [];
    check('Team & Alliances tab reports NO ignored fields (the red banner is gone)',
      teamSave.status === 200 && teamIgnored.length === 0,
      `ignoredPaths: ${JSON.stringify(teamIgnored)}`);

    // Read as the admin: this block asserts the override maps were persisted,
    // and those are deliberately absent from the anonymous reply.
    const teamAfter = await request('GET', '/api/settings', { token });
    const savedSettings = teamAfter.json?.settings || {};
    check('Leadership roster persists and is served to the About page',
      savedSettings.leadership?.[0]?.name === 'Contract Test Leader',
      `name ${savedSettings.leadership?.[0]?.name}`);
    check('Sister company block persists',
      savedSettings.sisterCompany?.name === 'Contract Staffing Inc.' && savedSettings.sisterCompany?.stats?.shortlistHours === '24h');
    check('Pedagogy block persists',
      savedSettings.pedagogy?.title === 'Build-First' && savedSettings.pedagogy?.pillars?.length === 1);
    check('Career support block persists',
      savedSettings.careerSupport?.transparency?.description === 'Honest scope' && savedSettings.careerSupport?.stages?.length === 1);
    check('Footer columns and legal links persist',
      savedSettings.footer?.columns?.[0]?.links?.[0]?.label === 'About Us' && savedSettings.footer?.legalLinks?.length === 1);
    check('Header menu persists labels, order, placement and visibility',
      savedSettings.headerMenu?.length === 6
      && savedSettings.headerMenu?.[3]?.label === 'SUCCESS STORIES'
      && savedSettings.headerMenu?.[3]?.path === '/success-stories'
      && savedSettings.headerMenu?.[2]?.hasDropdown === true
      && savedSettings.headerMenu?.[4]?.active === false
      && savedSettings.headerMenu?.[5]?.placement === 'more');
    check('Admission notice persists',
      savedSettings.admissionNotice === 'Spring 2026 Admissions Open',
      `got "${savedSettings.admissionNotice}"`);
    check('Site-editor override maps are still accepted without warnings',
      Boolean(savedSettings.textOverrides?.['/privacy']) && Boolean(savedSettings.imageOverrides?.['/about']));

    // 12. Per-course page blocks: card image, "Tools Covered" grid and the
    //     course's own capstone cards. Every course used to render the same
    //     hard-coded Data Science tool grid and the same capstone projects.
    const perCourse = await request('POST', '/api/courses', {
      token,
      body: {
        title: `Contract Per-Course Blocks ${Date.now()}`,
        category: 'Cyber Governance & Legal Tech',
        duration: '4 Months',
        pricing: { basePrice: 4999, discountedPrice: 4499 },
        thumbnail: '/uploads/contract-card.png',
        toolsTitle: 'Governance, Risk and Compliance (GRC) with AI Program',
        toolsSubtitle: 'Governance, audit and AI-risk tooling',
        tools: [
          { name: 'NIST CSF', icon: '/images/tools/nist.svg' },
          { name: 'ISO 27001', icon: '' },
        ],
        capstoneProjects: [
          { tag: 'GRC', title: 'Audit an enterprise AI stack', desc: 'Map controls to NIST CSF', stack: ['NIST', 'ISO'], color: 'from-indigo-500 to-blue-500' },
        ],
      },
    });
    const perCourseDoc = perCourse.json?.course;
    check('Course create keeps the card image',
      perCourseDoc?.thumbnail === '/uploads/contract-card.png',
      `thumbnail ${perCourseDoc?.thumbnail}`);
    check('Course create keeps the per-course tools grid',
      perCourseDoc?.tools?.length === 2 && perCourseDoc?.tools?.[0]?.name === 'NIST CSF',
      `tools ${perCourseDoc?.tools?.length}`);
    check('Course create keeps the per-course tools heading',
      perCourseDoc?.toolsTitle === 'Governance, Risk and Compliance (GRC) with AI Program' &&
      perCourseDoc?.toolsSubtitle === 'Governance, audit and AI-risk tooling');
    check('Course create keeps the per-course capstone cards',
      perCourseDoc?.capstoneProjects?.length === 1 && perCourseDoc?.capstoneProjects?.[0]?.stack?.length === 2,
      `capstones ${perCourseDoc?.capstoneProjects?.length}`);

    const perCoursePublic = await request('GET', `/api/courses/${perCourseDoc?.slug}`);
    const publicDoc = perCoursePublic.json?.course || perCoursePublic.json?.data;
    check('The public course endpoint serves the course-specific blocks',
      publicDoc?.tools?.length === 2 && publicDoc?.capstoneProjects?.[0]?.title === 'Audit an enterprise AI stack' &&
      publicDoc?.thumbnail === '/uploads/contract-card.png');

    // 13. Free Preview must be the admin's tick, not an automatic badge. The
    //     seeder stamps "preview" on the first lesson of module 1 and nothing in
    //     the composer could ever take it off again.
    const previewModule = await request('PUT', `/api/courses/${perCourseDoc?._id}`, {
      token,
      body: {
        curriculum: [{
          moduleTitle: 'Module with a comma, inside its title',
          hours: 30,
          lessons: [
            { title: 'First lesson with a preview', isPreview: true },
            { title: 'Second lesson without one', isPreview: false },
          ],
        }],
      },
    });
    const previewCurriculum = await request('GET', `/api/curriculum/courses/${perCourseDoc?._id}`);
    const previewLessons = previewCurriculum.json?.modules?.[0]?.lessons || [];
    check('Lessons are created from the composer lesson rows',
      previewModule.status === 200 && previewLessons.length === 2,
      `lessons ${previewLessons.length}`);
    check('A comma inside a module title no longer invents extra lessons',
      previewCurriculum.json?.modules?.[0]?.title === 'Module with a comma, inside its title',
      `title "${previewCurriculum.json?.modules?.[0]?.title}"`);
    check('Free Preview is only on the ticked lesson',
      previewLessons[0]?.isPreview === true && previewLessons[1]?.isPreview === false,
      JSON.stringify(previewLessons.map((l) => l.isPreview)));

    const firstLessonId = previewLessons[0]?._id;
    await request('PUT', `/api/courses/${perCourseDoc?._id}`, {
      token,
      body: {
        curriculum: [{
          moduleTitle: 'Module with a comma, inside its title',
          hours: 30,
          lessons: [
            { _id: firstLessonId, title: 'First lesson with a preview', isPreview: false },
            { title: 'Second lesson without one', isPreview: true },
          ],
        }],
      },
    });
    const afterPreviewToggle = await request('GET', `/api/curriculum/courses/${perCourseDoc?._id}`);
    const toggledLessons = afterPreviewToggle.json?.modules?.[0]?.lessons || [];
    check('The Free Preview tick can be removed and moved to another lesson',
      toggledLessons[0]?.isPreview === false && toggledLessons[1]?.isPreview === true,
      JSON.stringify(toggledLessons.map((l) => l.isPreview)));

    // 14. The bulk topics box now separates on a full stop, so commas inside a
    //     lesson title survive the round-trip.
    await request('PUT', `/api/courses/${perCourseDoc?._id}`, {
      token,
      body: { curriculum: [{ moduleTitle: 'Dot separated module', topics: 'First lesson. Second lesson with 2.0 in it' }] },
    });
    const dotCurriculum = await request('GET', `/api/curriculum/courses/${perCourseDoc?._id}`);
    const dotLessons = dotCurriculum.json?.modules?.[0]?.lessons || [];
    check('A full stop separates topics into lessons',
      dotLessons.length === 2, `lessons ${dotLessons.length}`);
    check('A decimal version number is not split in half',
      dotLessons[1]?.title === 'Second lesson with 2.0 in it',
      `title "${dotLessons[1]?.title}"`);

    // 15. Deleting a course takes its curriculum with it (no orphan modules).
    const deletedCourseId = perCourseDoc?._id;
    const deleteRes = await request('DELETE', `/api/courses/${deletedCourseId}`, { token });
    const afterDelete = await request('GET', '/api/courses/admin/all', { token });
    check('Delete course removes it from the CMS list',
      deleteRes.status === 200 && !(afterDelete.json?.courses || []).some((c) => String(c._id) === String(deletedCourseId)));

    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const orphanModules = await mongoose.connection.db
      .collection('modules')
      .countDocuments({ course: new mongoose.Types.ObjectId(String(deletedCourseId)) });
    const orphanLessons = await mongoose.connection.db
      .collection('lessons')
      .countDocuments({ course: new mongoose.Types.ObjectId(String(deletedCourseId)) });
    await mongoose.disconnect();
    check('Deleting a course deletes its modules and lessons too',
      orphanModules === 0 && orphanLessons === 0, `modules ${orphanModules} / lessons ${orphanLessons}`);

    // 16. Legacy corrupt tool rows must heal on read. An older release cast a
    //     tool name string into a sub-document, so every existing course stores
    //     `{ 0: 'V', 1: 'a', ... }` instead of `{ name: 'Vanta' }`. That made
    //     every course fall back to the shared Data Science grid. The model now
    //     rebuilds the name when it serialises, on both the public and CMS paths.
    const legacyCreate = await request('POST', '/api/courses', {
      token,
      body: { title: `Legacy Corrupt Tools ${Date.now()}`, category: 'Legacy' },
    });
    const legacyDoc = legacyCreate.json?.course;
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    await mongoose.connection.db.collection('courses').updateOne(
      { _id: new mongoose.Types.ObjectId(String(legacyDoc?._id)) },
      {
        $set: {
          tools: [
            { 0: 'V', 1: 'a', 2: 'n', 3: 't', 4: 'a', icon: '' },
            { 0: 'D', 1: 'o', 2: 'c', 3: 'k', 4: 'e', 5: 'r', icon: '' },
          ],
        },
      }
    );
    await mongoose.disconnect();

    const healedPublic = await request('GET', `/api/courses/${legacyDoc?.slug}`);
    const healedTools = healedPublic.json?.course?.tools || [];
    check('Legacy corrupt tool rows are healed on the public course endpoint',
      healedTools.length === 2 && healedTools[0]?.name === 'Vanta' && healedTools[1]?.name === 'Docker',
      JSON.stringify(healedTools));

    const healedAdmin = await request('GET', '/api/courses/admin/all', { token });
    const healedAdminDoc = (healedAdmin.json?.courses || []).find((c) => String(c._id) === String(legacyDoc?._id));
    check('Legacy corrupt tool rows are healed in the CMS course list too',
      healedAdminDoc?.tools?.[0]?.name === 'Vanta',
      JSON.stringify(healedAdminDoc?.tools));
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
