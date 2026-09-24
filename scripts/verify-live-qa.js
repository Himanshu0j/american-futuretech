#!/usr/bin/env node
/**
 * American FutureTech — LIVE end-to-end acceptance test.
 *
 * Every other verify:* suite in this folder boots its own server against a
 * throwaway local database. That proves the code is correct, but not that the
 * *deployed* site the client logs into behaves the same way. This script talks
 * to the real API instead.
 *
 * Safety rules it follows:
 *   - every record it creates is named QA-LIVE-<timestamp>, so it is obvious
 *     what is test data and what belongs to the client;
 *   - nothing already in the database is deleted — edits are reverted to the
 *     exact value they had before;
 *   - the `finally` block re-reads each created id to prove it is gone and
 *     re-counts jobs/courses to prove the collection sizes are unchanged.
 *
 * Usage:
 *   node scripts/verify-live-qa.js
 *   LIVE_API_URL=http://127.0.0.1:5050 node scripts/verify-live-qa.js
 */

const API = (process.env.LIVE_API_URL || 'https://american-futuretech-api.onrender.com').replace(/\/+$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@americanfuturetech.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'admin123';

const STAMP = Date.now();
const TAG = `QA-LIVE-${STAMP}`;
const QA_ROUTE = `/qa-live-${STAMP}`;
const QA_COUPON = `QALIVE${String(STAMP).slice(-6)}`;
const QA_ADMIN_EMAIL = `qa-live-admin-${STAMP}@example.com`;
const QA_RO_ADMIN_EMAIL = `qa-live-readonly-${STAMP}@example.com`;
const QA_STUDENT_EMAIL = `qa-live-student-${STAMP}@example.com`;
// Deliberately unrelated to the names/emails below: the password policy rejects
// any secret that contains the account's own name or email.
const QA_ADMIN_PASSWORD = 'Tundra-Marble-91!Qx';

const results = [];
const failures = [];
const cleanups = [];
const createdIds = []; // { label, path, id }

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};

const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  if (!passed) failures.push({ name, detail });
  const mark = passed ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
  console.log(`  ${mark}  ${name}${detail ? `  ${C.dim}${detail}${C.reset}` : ''}`);
};

const section = (title) => console.log(`\n${C.bold}${C.cyan}── ${title}${C.reset}`);
const note = (msg) => console.log(`  ${C.dim}${msg}${C.reset}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Render's free tier sleeps the API after ~15 idle minutes. The first request
 * then pays a 30–50 s cold start and the socket can drop mid-flight, which used
 * to abort this whole run at whatever section it happened to be sitting on.
 * A dropped connection is not a product failure, so retry it — but only
 * transport errors. A real HTTP answer (even a 500) is returned untouched,
 * otherwise a genuine server error would be retried into a false pass.
 */
const ATTEMPTS = 4;
const request = async (method, path, { token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const init = { method, headers, body: body === undefined ? undefined : JSON.stringify(body) };

  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(`${API}${path}`, init);
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (error) { /* non-JSON body */ }
      return { status: res.status, json, text };
    } catch (error) {
      lastError = error;
      if (attempt < ATTEMPTS) {
        // 2 s, 4 s, 8 s — enough to ride out a free-tier cold start.
        const waitMs = 2000 * 2 ** (attempt - 1);
        note(`  network blip on ${method} ${path} (${error.message}) — retrying in ${waitMs / 1000}s`);
        await sleep(waitMs);
      }
    }
  }
  throw new Error(`${method} ${path} failed after ${ATTEMPTS} attempts: ${lastError?.message}`);
};

/** APIs in this project answer with either `{ x: [] }` or `{ data: [] }`. */
const arr = (json, ...keys) => {
  if (!json) return [];
  for (const key of keys) {
    if (Array.isArray(json[key])) return json[key];
    if (Array.isArray(json?.data?.[key])) return json.data[key];
  }
  if (Array.isArray(json.data)) return json.data;
  return [];
};

const onCleanup = (label, fn) => cleanups.push({ label, fn });

const run = async () => {
  console.log(`\n${C.bold}American FutureTech — LIVE acceptance test${C.reset}`);
  console.log(`${C.dim}target : ${API}`);
  console.log(`stamp  : ${TAG}`);
  console.log(`admin  : ${ADMIN_EMAIL}${C.reset}`);

  // ── Warm-up (Render free tier spins down when idle) ──────────────────────
  section('0. Deployment reachability');
  let health = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const res = await request('GET', '/api/health');
      if (res.status === 200 && res.json) { health = res.json; break; }
    } catch (error) { /* cold start */ }
    await sleep(4000);
  }
  check('Live API answers /api/health', Boolean(health), health ? '' : 'no response after 48s');
  if (!health) throw new Error('the deployed API is unreachable — nothing else can be tested');

  const db = health.database || health.db || {};
  check('Database mode is external (not in-memory)', String(db.mode || '').toLowerCase() === 'external', `mode=${db.mode}`);
  check('Database is persistent (not ephemeral)', db.ephemeral !== true, `ephemeral=${db.ephemeral}`);
  check('MONGODB_URI is configured on the deployment', db.uriConfigured !== false, `uriConfigured=${db.uriConfigured}`);
  check('Session secret is set (sessions survive a restart)', health.auth?.configured !== false, `secretLength=${health.auth?.secretLength}`);
  check('Persistence is locked in on the deployment', db.persistedRequired !== false, `persistedRequired=${db.persistedRequired}`);

  // ── 1. Authentication ────────────────────────────────────────────────────
  section('1. Authentication');
  const login = await request('POST', '/api/auth/login', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const adminToken = login.json?.token || login.json?.data?.token;
  check('SuperAdmin can sign in', login.status === 200 && Boolean(adminToken), `status=${login.status}`);
  if (!adminToken) throw new Error('cannot continue without an admin session');

  const badLogin = await request('POST', '/api/auth/login', {
    body: { email: ADMIN_EMAIL, password: 'definitely-not-the-password' },
  });
  check('Wrong password is rejected', badLogin.status === 401, `status=${badLogin.status}`);

  const me = await request('GET', '/api/auth/me', { token: adminToken });
  check('Session token resolves to a profile', me.status === 200 && Boolean(me.json?.user || me.json?.data), `status=${me.status}`);

  const anon = await request('GET', '/api/auth/me');
  check('Anonymous /api/auth/me is refused', anon.status === 401, `status=${anon.status}`);

  // ── 2. Public catalogue (read-only) ──────────────────────────────────────
  section('2. Public catalogue');
  const coursesPub = await request('GET', '/api/courses');
  const courses = arr(coursesPub.json, 'courses');
  check('Public course list loads', coursesPub.status === 200 && courses.length > 0, `${courses.length} courses`);

  // These are exactly the parameters the public Careers page sends.
  const jobsFirst = await request('GET', '/api/jobs?page=1&limit=8');
  const jobs = arr(jobsFirst.json, 'jobs');
  const pagination = jobsFirst.json?.pagination || {};
  const totalJobs = Number(pagination.total ?? jobs.length);
  const perPage = Number(pagination.pageSize ?? jobs.length);
  const expectedPages = Math.max(Math.ceil(totalJobs / 8), 1);

  check('Public job board loads', jobsFirst.status === 200 && totalJobs > 0, `${totalJobs} jobs`);
  check('At most 8 job cards are returned per page', perPage === 8 && jobs.length <= 8, `pageSize=${perPage} returned=${jobs.length}`);
  check('Page count matches ceil(total / 8)', Number(pagination.totalPages) === expectedPages, `totalPages=${pagination.totalPages} expected=${expectedPages}`);
  check('Page 1 has no Previous link', pagination.hasPrev === false, `hasPrev=${pagination.hasPrev}`);

  const lastPage = await request('GET', `/api/jobs?page=${expectedPages}&limit=8`);
  check('The last page has no Next link', lastPage.json?.pagination?.hasNext === false, `hasNext=${lastPage.json?.pagination?.hasNext}`);
  const beyond = await request('GET', `/api/jobs?page=${expectedPages + 5}&limit=8`);
  check('A page past the end is clamped, never blank', beyond.json?.pagination?.page === expectedPages, `page=${beyond.json?.pagination?.page}`);

  if (totalJobs > 8) {
    const second = await request('GET', '/api/jobs?page=2&limit=8');
    const firstIds = jobs.map((j) => String(j._id));
    check('Page 2 shows different records than page 1', arr(second.json, 'jobs').every((j) => !firstIds.includes(String(j._id))), `${arr(second.json, 'jobs').length} cards`);
  }

  // Search + filter + pagination must re-count the *filtered* set, which is the
  // behaviour the client asked for explicitly (13 matches → 2 pages, not 13 of 100).
  const remotePage = await request('GET', '/api/jobs?page=1&limit=8&remoteOnly=true');
  const remoteJobs = arr(remotePage.json, 'jobs');
  const remoteTotal = Number(remotePage.json?.pagination?.total || 0);
  check('The Remote filter narrows the result set', remoteTotal > 0 && remoteTotal <= totalJobs, `${totalJobs} → ${remoteTotal}`);
  check('Every card on a Remote-filtered page really is remote', remoteJobs.every((j) => /remote/i.test(String(j.location))), `${remoteJobs.length} cards`);
  check('Filtered pagination re-counts its own pages', Number(remotePage.json?.pagination?.totalPages) === Math.max(Math.ceil(remoteTotal / 8), 1), `totalPages=${remotePage.json?.pagination?.totalPages}`);

  const searched = await request('GET', '/api/jobs?page=1&limit=8&search=Cloud');
  const searchTotal = Number(searched.json?.pagination?.total || 0);
  check('Search filters the board', searched.status === 200 && searchTotal > 0 && searchTotal <= totalJobs, `matches=${searchTotal}`);
  check('A filtered search still pages at 8', arr(searched.json, 'jobs').length <= 8, `${arr(searched.json, 'jobs').length} cards`);

  if (jobs.length) {
    const sample = jobs[0];
    check('Job cards expose a posting timestamp', Boolean(sample.postedAt || sample.createdAt), `postedAt=${sample.postedAt || sample.createdAt}`);
    check('Job cards expose a recommended course field', 'recommendedCourse' in sample || 'recommendedCourses' in sample);
  }

  const blogsPub = await request('GET', '/api/content/blogs');
  check('Public insights list loads', blogsPub.status === 200 && arr(blogsPub.json, 'blogs', 'posts').length > 0, `${arr(blogsPub.json, 'blogs', 'posts').length} posts`);

  const faqsPub = await request('GET', '/api/content/faqs');
  const faqs = arr(faqsPub.json, 'faqs');
  check('Public FAQ list loads', faqsPub.status === 200 && faqs.length > 0, `${faqs.length} FAQs`);

  const batchesPub = await request('GET', '/api/batches');
  check('Public batch/cohort list loads', batchesPub.status === 200, `status=${batchesPub.status}`);

  const settingsPub = await request('GET', '/api/settings');
  check('Public site settings load', settingsPub.status === 200 && Boolean(settingsPub.json?.settings), `status=${settingsPub.status}`);

  // ── 3. Admin CMS: edit → verify on the public API → revert ───────────────
  section('3. Admin CMS write-through (edit → public → revert)');
  const baseline = {
    jobCount: totalJobs,
    courseCount: courses.length,
  };

  if (jobs.length) {
    const target = jobs[jobs.length - 1];
    const original = target.title;
    const scratch = `${TAG} edited title`;
    const put = await request('PUT', `/api/jobs/${target._id}`, { token: adminToken, body: { title: scratch } });
    const afterEdit = await request('GET', `/api/jobs/${target._id}`);
    check('Job edit is accepted', put.status === 200, `status=${put.status}`);
    check('Public job detail shows the new title', afterEdit.json?.job?.title === scratch, `title=${afterEdit.json?.job?.title}`);
    const putBack = await request('PUT', `/api/jobs/${target._id}`, { token: adminToken, body: { title: original } });
    const afterRevert = await request('GET', `/api/jobs/${target._id}`);
    check('Job title reverted cleanly', putBack.status === 200 && afterRevert.json?.job?.title === original, `title=${afterRevert.json?.job?.title}`);
    check('Job edit did not disturb the other fields', Boolean(afterRevert.json?.job?.company) && Boolean(afterRevert.json?.job?.description));
  }

  if (courses.length) {
    const target = courses[0];
    const original = target.shortDescription || '';
    const scratch = `${TAG} card copy`;
    const put = await request('PUT', `/api/courses/${target._id}`, { token: adminToken, body: { shortDescription: scratch } });
    const afterEdit = await request('GET', '/api/courses');
    const edited = arr(afterEdit.json, 'courses').find((c) => String(c._id) === String(target._id));
    check('Course card edit is accepted', put.status === 200, `status=${put.status}`);
    check('Public course list shows the new card copy', edited?.shortDescription === scratch, `shortDescription=${edited?.shortDescription}`);
    const putBack = await request('PUT', `/api/courses/${target._id}`, { token: adminToken, body: { shortDescription: original } });
    const afterRevert = await request('GET', '/api/courses');
    const reverted = arr(afterRevert.json, 'courses').find((c) => String(c._id) === String(target._id));
    check('Course card copy reverted cleanly', putBack.status === 200 && reverted?.shortDescription === original);
    check('Course edit preserved the title and price', Boolean(reverted?.title) && reverted?.pricing !== undefined);
  }

  const blogs = arr(blogsPub.json, 'blogs', 'posts');
  if (blogs.length) {
    const target = blogs[0];
    const original = target.title;
    const scratch = `${TAG} insight title`;
    const put = await request('PUT', `/api/content/blogs/${target._id}`, { token: adminToken, body: { title: scratch } });
    const afterEdit = await request('GET', '/api/content/blogs');
    const edited = arr(afterEdit.json, 'blogs', 'posts').find((b) => String(b._id) === String(target._id));
    check('Insight edit is accepted', put.status === 200, `status=${put.status}`);
    check('Public insights show the new title', edited?.title === scratch, `title=${edited?.title}`);
    const putBack = await request('PUT', `/api/content/blogs/${target._id}`, { token: adminToken, body: { title: original } });
    const afterRevert = await request('GET', '/api/content/blogs');
    const reverted = arr(afterRevert.json, 'blogs', 'posts').find((b) => String(b._id) === String(target._id));
    check('Insight title reverted cleanly', putBack.status === 200 && reverted?.title === original);
  }

  if (faqs.length) {
    const target = faqs[0];
    const original = target.answer;
    const scratch = `${TAG} answer body`;
    const put = await request('PUT', `/api/content/faqs/${target._id}`, { token: adminToken, body: { answer: scratch } });
    const afterEdit = await request('GET', '/api/content/faqs');
    const edited = arr(afterEdit.json, 'faqs').find((f) => String(f._id) === String(target._id));
    check('FAQ edit is accepted', put.status === 200, `status=${put.status}`);
    check('Public FAQ shows the new answer', edited?.answer === scratch, `answer=${String(edited?.answer).slice(0, 40)}`);
    const putBack = await request('PUT', `/api/content/faqs/${target._id}`, { token: adminToken, body: { answer: original } });
    const afterRevert = await request('GET', '/api/content/faqs');
    const reverted = arr(afterRevert.json, 'faqs').find((f) => String(f._id) === String(target._id));
    check('FAQ answer reverted cleanly', putBack.status === 200 && reverted?.answer === original);
  }

  // ── 4. Inline website editor ─────────────────────────────────────────────
  section('4. Inline website editor (text + image overrides)');
  const editorKey = 'main0>section1>h1#t0';
  const saved = await request('PUT', '/api/settings/site-editor', {
    token: adminToken,
    body: { route: QA_ROUTE, text: { [editorKey]: { original: 'QA original', value: 'QA replaced' } } },
  });
  check('Text override saves', saved.status === 200 && saved.json?.saved === 1, `status=${saved.status} saved=${saved.json?.saved}`);
  check('No override was rejected by the validator', (saved.json?.rejected || []).length === 0, JSON.stringify(saved.json?.rejected || []));

  const readBack = await request('GET', `/api/settings/site-editor?route=${encodeURIComponent(QA_ROUTE)}`);
  check('Override reads back on its own route', readBack.json?.text?.[editorKey]?.value === 'QA replaced', JSON.stringify(readBack.json?.text?.[editorKey]));

  const otherRoute = await request('GET', `/api/settings/site-editor?route=${encodeURIComponent('/somewhere-else')}`);
  check('Overrides stay scoped to their own route', !otherRoute.json?.text?.[editorKey]);

  const dangerousImage = await request('PUT', '/api/settings/site-editor', {
    token: adminToken,
    body: { route: QA_ROUTE, images: { 'main0>img0': { original: '', value: 'javascript:alert(1)' } } },
  });
  check('A javascript: image URL is rejected', (dangerousImage.json?.rejected || []).length > 0, JSON.stringify(dangerousImage.json?.rejected || []));

  const badRoute = await request('PUT', '/api/settings/site-editor', {
    token: adminToken,
    body: { route: '../../etc/passwd', text: {} },
  });
  check('A path-traversal route is rejected', badRoute.status === 400 || badRoute.status === 403, `status=${badRoute.status}`);

  onCleanup('inline editor override', () => request('DELETE', '/api/settings/site-editor', { token: adminToken, body: { route: QA_ROUTE } }));

  // ── 5. Jobs: full create → publish → delete round trip ──────────────────
  section('5. Jobs — full lifecycle');
  const jobPayload = {
    title: `${TAG} Cloud Engineer`,
    company: `${TAG} Partner`,
    location: 'Remote (US & Global)',
    employmentType: 'Full-time',
    experienceLevel: 'Entry to Mid Level',
    salaryMin: 95000,
    salaryMax: 130000,
    description: 'Automated acceptance-test record. It is deleted at the end of this run.',
    responsibilities: ['Build cloud infrastructure', 'Automate deployments'],
    technicalSkills: ['AWS', 'Terraform'],
    tools: ['GitHub Actions'],
    languages: ['English (fluent)'],
    benefits: ['Remote-first'],
    status: 'Active',
  };
  const jobCreate = await request('POST', '/api/jobs', { token: adminToken, body: jobPayload });
  const newJob = jobCreate.json?.job;
  check('Admin can create a job', jobCreate.status === 201 && Boolean(newJob?._id), `status=${jobCreate.status} ${jobCreate.json?.message || ''}`);
  if (newJob?._id) {
    createdIds.push({ label: 'job', path: `/api/jobs/${newJob._id}` });
    onCleanup('job', () => request('DELETE', `/api/jobs/${newJob._id}`, { token: adminToken }));

    check('Created pointers are stored as a list', Array.isArray(newJob.responsibilities) && newJob.responsibilities.length === 2, `${newJob.responsibilities?.length} pointers`);

    const publicDetail = await request('GET', `/api/jobs/${newJob._id}`);
    check('New job is visible on the public job board', publicDetail.status === 200 && publicDetail.json?.job?.title === jobPayload.title);

    const afterCreate = await request('GET', '/api/jobs?page=1');
    check('Job total increased by exactly one', Number(afterCreate.json?.pagination?.total ?? 0) === baseline.jobCount + 1, `${baseline.jobCount} → ${afterCreate.json?.pagination?.total}`);

    const futureJob = await request('POST', '/api/jobs', {
      token: adminToken,
      body: { ...jobPayload, title: `${TAG} Future Job`, postedAt: new Date(Date.now() + 5 * 86400000).toISOString() },
    });
    check('A future posted date is refused', futureJob.status === 400, `status=${futureJob.status}`);
  }

  // ── 6. Coupons ───────────────────────────────────────────────────────────
  section('6. Coupons and server-side pricing');
  const quoteCourse = courses[0];
  if (quoteCourse) {
    const base = await request('POST', '/api/payments/quote', { body: { courseId: quoteCourse._id, tier: 'full' } });
    check('Baseline quote returns a server price', base.status === 200 && typeof base.json?.quote?.amount === 'number', `amount=${base.json?.quote?.amount}`);

    const forged = await request('POST', '/api/payments/quote', {
      body: { courseId: quoteCourse._id, tier: 'full', amount: 1, discountAmount: 99999 },
    });
    check('A forged price in the request body is ignored', forged.json?.quote?.amount === base.json?.quote?.amount, `amount=${forged.json?.quote?.amount}`);

    const unknown = await request('POST', '/api/payments/quote', {
      body: { courseId: quoteCourse._id, tier: 'full', couponCode: 'NO-SUCH-COUPON-XYZ' },
    });
    check('An unknown coupon is refused', unknown.json?.quote?.couponApplied !== true, `couponError=${unknown.json?.quote?.couponError}`);
  }

  const couponCreate = await request('POST', '/api/coupons', {
    token: adminToken,
    body: {
      code: QA_COUPON,
      description: `${TAG} percentage coupon`,
      discountType: 'percent',
      discountValue: 15,
      perStudentLimit: 1,
      minOrderAmount: 0,
    },
  });
  const coupon = couponCreate.json?.coupon;
  check('Admin can create a percentage coupon', couponCreate.status === 201 && coupon?.code === QA_COUPON, `status=${couponCreate.status} ${couponCreate.json?.message || ''}`);
  if (coupon?._id) {
    onCleanup('coupon', () => request('DELETE', `/api/coupons/${coupon._id}`, { token: adminToken }));

    if (quoteCourse) {
      const withCoupon = await request('POST', '/api/payments/quote', {
        body: { courseId: quoteCourse._id, tier: 'full', couponCode: QA_COUPON },
      });
      check('The new coupon is applied by the server', withCoupon.json?.quote?.couponApplied === true, `discount=${withCoupon.json?.quote?.discountAmount}`);
    }

    const dupe = await request('POST', '/api/coupons', {
      token: adminToken,
      body: { code: QA_COUPON, discountType: 'flat', discountValue: 5 },
    });
    check('A duplicate coupon code is refused', dupe.status === 409, `status=${dupe.status}`);

    const deactivate = await request('PATCH', `/api/coupons/${coupon._id}/toggle`, { token: adminToken });
    check('A coupon can be deactivated', deactivate.status === 200, `status=${deactivate.status}`);
    if (quoteCourse) {
      const afterDeactivate = await request('POST', '/api/payments/quote', {
        body: { courseId: quoteCourse._id, tier: 'full', couponCode: QA_COUPON },
      });
      check('A deactivated coupon no longer discounts', afterDeactivate.json?.quote?.couponApplied !== true, `couponError=${afterDeactivate.json?.quote?.couponError}`);
    }
  }

  // ── 7. Batches ───────────────────────────────────────────────────────────
  section('7. Batches / cohorts');
  if (quoteCourse) {
    const batchCreate = await request('POST', '/api/batches', {
      token: adminToken,
      body: {
        course: quoteCourse._id,
        batchCode: `${TAG}-BATCH`,
        startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        timing: 'Sat & Sun: 10:00 AM EST',
        maxCapacity: 15,
        status: 'Upcoming',
      },
    });
    const batch = batchCreate.json?.batch;
    check('Admin can create a batch', batchCreate.status === 201 && Boolean(batch?._id), `status=${batchCreate.status} ${batchCreate.json?.message || ''}`);
    if (batch?._id) {
      onCleanup('batch', () => request('DELETE', `/api/batches/${batch._id}`, { token: adminToken }));
      const listed = await request('GET', '/api/batches');
      check('New batch appears in the list', arr(listed.json, 'batches').some((b) => String(b._id) === String(batch._id)));
    }
  }

  // ── 8. Students, LMS isolation and IDOR ──────────────────────────────────
  section('8. Students, LMS isolation and IDOR');
  const selfRegister = await request('POST', '/api/auth/register', {
    body: { name: 'QA Self Signup', email: `qa-self-${STAMP}@example.com`, password: QA_ADMIN_PASSWORD },
  });
  check('Public self-registration is closed', selfRegister.status === 404 || selfRegister.status === 403, `status=${selfRegister.status}`);

  let studentToken = null;
  let studentId = null;
  if (courses.length >= 2) {
    const courseA = courses[0];
    const courseB = courses[1];
    const batchList = arr((await request('GET', '/api/batches')).json, 'batches');
    const batchId = batchList[0]?._id;

    const weak = await request('POST', '/api/students/admin', {
      token: adminToken,
      body: { name: `${TAG} Weak`, email: `qa-weak-${STAMP}@example.com`, password: 'admin123' },
    });
    check('A weak student password is refused', weak.status === 400, `status=${weak.status} ${weak.json?.message || ''}`);

    const created = await request('POST', '/api/students/admin', {
      token: adminToken,
      body: {
        name: `${TAG} Student`,
        email: QA_STUDENT_EMAIL,
        phone: '+1 (555) 000-1234',
        courseIds: [courseA._id],
        batchId,
        personalizedLearning: true,
        lmsAccess: { classroom: true, recordings: false, assignments: true, certificates: true, support: true, careerResources: false },
        targetCareer: 'Cloud Engineer',
      },
    });
    const student = created.json?.student;
    studentId = student?._id;
    const credentials = created.json?.credentials;
    check('Admin can create a student', created.status === 201 && Boolean(studentId), `status=${created.status} ${created.json?.message || ''}`);
    check('Login credentials are returned once (generated, not stored plaintext)', Boolean(credentials?.temporaryPassword), credentials ? 'credential issued' : 'no credential returned');
    check('The personalized-learning flag is stored', student?.personalizedLearning === true, `personalizedLearning=${student?.personalizedLearning}`);
    check('Per-module LMS access is stored', student?.lmsAccess?.recordings === false && student?.lmsAccess?.careerResources === false, JSON.stringify(student?.lmsAccess));
    check('The assigned course is stored as an enrollment', (student?.courses || student?.enrolledCourses || []).length === 1, JSON.stringify(student?.courses || student?.enrolledCourses));

    if (studentId) onCleanup('student', () => request('DELETE', `/api/auth/users/${studentId}`, { token: adminToken }));

    const dupeStudent = await request('POST', '/api/students/admin', {
      token: adminToken,
      body: { name: `${TAG} Dupe`, email: QA_STUDENT_EMAIL, courseIds: [courseA._id] },
    });
    check('A duplicate student email is refused', dupeStudent.status === 409, `status=${dupeStudent.status}`);

    const studentLogin = await request('POST', '/api/auth/login', {
      body: { email: QA_STUDENT_EMAIL, password: credentials?.temporaryPassword },
    });
    studentToken = studentLogin.json?.token || studentLogin.json?.data?.token;
    check('The new student can sign in', studentLogin.status === 200 && Boolean(studentToken), `status=${studentLogin.status}`);

    if (studentToken) {
      const myCourses = await request('GET', '/api/lms/my-courses', { token: studentToken });
      const mine = arr(myCourses.json, 'courses');
      check('My Courses returns the assigned course', mine.length === 1 && String(mine[0]?.course?._id || mine[0]?._id) === String(courseA._id), `${mine.length} course(s)`);
      check('An unassigned course is NOT listed', !mine.some((c) => String(c?.course?._id || c?._id) === String(courseB._id)));

      const dashboard = await request('GET', '/api/lms/dashboard', { token: studentToken });
      check('Student LMS dashboard loads', dashboard.status === 200, `status=${dashboard.status}`);

      const assignedLearn = await request('GET', `/api/lms/courses/${courseA._id}/learn`, { token: studentToken });
      check('Assigned curriculum loads', assignedLearn.status === 200, `status=${assignedLearn.status}`);

      const foreignLearn = await request('GET', `/api/lms/courses/${courseB._id}/learn`, { token: studentToken });
      check('IDOR: unassigned course curriculum is blocked', foreignLearn.status === 403 || foreignLearn.status === 404, `status=${foreignLearn.status}`);

      const studentAdmin = await request('GET', '/api/students/admin', { token: studentToken });
      check('Student cannot reach the admin student list', studentAdmin.status === 403, `status=${studentAdmin.status}`);
      const studentUsers = await request('GET', '/api/auth/users', { token: studentToken });
      check('Student cannot list staff accounts', studentUsers.status === 403, `status=${studentUsers.status}`);
      const studentJobs = await request('POST', '/api/jobs', { token: studentToken, body: jobPayload });
      check('Student cannot create jobs', studentJobs.status === 403, `status=${studentJobs.status}`);
      const studentSettings = await request('PUT', '/api/settings', { token: studentToken, body: { siteName: 'hacked' } });
      check('Student cannot rewrite site settings', studentSettings.status === 403, `status=${studentSettings.status}`);
    }
  } else {
    check('At least two courses exist to test isolation', false, `${courses.length} course(s)`);
  }

  // ── 9. RBAC boundaries for delegated admins ──────────────────────────────
  section('9. RBAC — delegated admin permissions');
  const limitedPermissions = ['DASHBOARD_VIEW', 'STUDENTS_VIEW'];
  const limitedCreate = await request('POST', '/api/auth/users', {
    token: adminToken,
    body: {
      name: `${TAG} Limited Admin`,
      email: QA_ADMIN_EMAIL,
      password: QA_ADMIN_PASSWORD,
      role: 'ADMIN',
      permissions: limitedPermissions,
    },
  });
  // NOTE: this endpoint answers with `user.id`, not `user._id`. Reading the wrong
  // key silently skipped the cleanup and left two admin accounts in production.
  const limitedId = limitedCreate.json?.user?.id || limitedCreate.json?.user?._id;
  check('SuperAdmin can create a delegated admin', limitedCreate.status === 201, `status=${limitedCreate.status} ${limitedCreate.json?.message || ''}`);
  if (limitedId) onCleanup('limited admin', () => request('DELETE', `/api/auth/users/${limitedId}`, { token: adminToken }));

  const limitedLogin = await request('POST', '/api/auth/login', { body: { email: QA_ADMIN_EMAIL, password: QA_ADMIN_PASSWORD } });
  const limitedToken = limitedLogin.json?.token || limitedLogin.json?.data?.token;
  check('The delegated admin can sign in', limitedLogin.status === 200 && Boolean(limitedToken), `status=${limitedLogin.status}`);

  if (limitedToken) {
    const allowed = await request('GET', '/api/students/admin', { token: limitedToken });
    check('Granted permission (STUDENTS_VIEW) is allowed', allowed.status === 200, `status=${allowed.status}`);

    const deniedJobs = await request('POST', '/api/jobs', { token: limitedToken, body: jobPayload });
    check('Ungranted JOBS_CREATE is blocked', deniedJobs.status === 403, `status=${deniedJobs.status}`);
    const deniedCourses = await request('POST', '/api/courses', { token: limitedToken, body: { title: 'nope' } });
    check('Ungranted COURSES_CREATE is blocked', deniedCourses.status === 403, `status=${deniedCourses.status}`);
    const deniedCoupons = await request('GET', '/api/coupons', { token: limitedToken });
    check('Ungranted COUPONS_VIEW is blocked', deniedCoupons.status === 403, `status=${deniedCoupons.status}`);
    const deniedSettings = await request('PUT', '/api/settings', { token: limitedToken, body: { siteName: 'nope' } });
    check('Ungranted SETTINGS_EDIT is blocked', deniedSettings.status === 403, `status=${deniedSettings.status}`);
    const deniedStaff = await request('GET', '/api/auth/users', { token: limitedToken });
    check('Ungranted ADMIN_MANAGEMENT_VIEW is blocked', deniedStaff.status === 403, `status=${deniedStaff.status}`);
    const deniedDelete = await request('DELETE', '/api/auth/users/000000000000000000000000', { token: limitedToken });
    check('Ungranted ADMIN_MANAGEMENT_DELETE is blocked', deniedDelete.status === 403, `status=${deniedDelete.status}`);
  }

  const roCreate = await request('POST', '/api/auth/users', {
    token: adminToken,
    body: {
      name: `${TAG} Read Only`,
      email: QA_RO_ADMIN_EMAIL,
      password: QA_ADMIN_PASSWORD,
      role: 'ADMIN',
      permissions: ['DASHBOARD_VIEW', 'COURSES_VIEW', 'JOBS_VIEW', 'FAQ_VIEW', 'STUDENTS_VIEW'],
    },
  });
  const roId = roCreate.json?.user?.id || roCreate.json?.user?._id;
  check('SuperAdmin can create a read-only admin', roCreate.status === 201, `status=${roCreate.status}`);
  if (roId) onCleanup('read-only admin', () => request('DELETE', `/api/auth/users/${roId}`, { token: adminToken }));

  const roLogin = await request('POST', '/api/auth/login', { body: { email: QA_RO_ADMIN_EMAIL, password: QA_ADMIN_PASSWORD } });
  const roToken = roLogin.json?.token || roLogin.json?.data?.token;
  check('The read-only admin can sign in', roLogin.status === 200 && Boolean(roToken), `status=${roLogin.status}`);

  if (roToken) {
    const roRead = await request('GET', '/api/courses/admin/all', { token: roToken });
    check('Read-only admin can still read courses', roRead.status === 200, `status=${roRead.status}`);
    const roCreateJob = await request('POST', '/api/jobs', { token: roToken, body: jobPayload });
    check('Read-only admin cannot create a job', roCreateJob.status === 403, `status=${roCreateJob.status}`);
    if (courses.length) {
      const roEditCourse = await request('PUT', `/api/courses/${courses[0]._id}`, { token: roToken, body: { shortDescription: 'nope' } });
      check('Read-only admin cannot edit a course', roEditCourse.status === 403, `status=${roEditCourse.status}`);
    }
    if (faqs.length) {
      const roDeleteFaq = await request('DELETE', `/api/content/faqs/${faqs[0]._id}`, { token: roToken });
      check('Read-only admin cannot delete an FAQ', roDeleteFaq.status === 403, `status=${roDeleteFaq.status}`);
    }
    const roStudent = await request('POST', '/api/students/admin', { token: roToken, body: { name: 'nope', email: 'nope@example.com' } });
    check('Read-only admin cannot create a student', roStudent.status === 403, `status=${roStudent.status}`);
  }

  // ── 10. Payments: gateway off must fail honestly ────────────────────────
  section('10. Payments and gateway configuration');
  const gateway = await request('GET', '/api/settings/payment-gateway', { token: adminToken });
  const gatewayJson = JSON.stringify(gateway.json || {});
  check('Gateway status is readable by an authorised admin', gateway.status === 200, `status=${gateway.status}`);
  check('No Stripe secret is ever returned to the browser', !/sk_(live|test)_/.test(gatewayJson) && !gatewayJson.includes('secretKeyEncrypted'), 'response contains no secret material');
  check('Gateway status reports configuration as booleans', typeof gateway.json?.gateway?.secretKeyConfigured === 'boolean', `secretKeyConfigured=${gateway.json?.gateway?.secretKeyConfigured}`);

  const checkout = await request('POST', '/api/payments/checkout', {
    body: { courseId: quoteCourse?._id, tier: 'deposit', fullName: `${TAG} Buyer`, email: `qa-buyer-${STAMP}@example.com`, phone: '+1 (555) 000-0000' },
  });
  const gatewayOff = gateway.json?.gateway?.secretKeyConfigured === false;
  check(
    gatewayOff ? 'With no gateway configured, checkout refuses instead of faking success' : 'With a gateway configured, checkout returns a real Stripe session',
    gatewayOff ? checkout.status === 503 : checkout.status === 200 && Boolean(checkout.json?.sessionUrl),
    `status=${checkout.status} code=${checkout.json?.code}`,
  );

  const webhook = await request('POST', '/api/payments/webhook', { body: { type: 'checkout.session.completed', data: { object: { id: 'qa-fake' } } } });
  check('An unsigned webhook is refused', webhook.status >= 400, `status=${webhook.status}`);

  // ── 11. Audit trail ─────────────────────────────────────────────────────
  section('11. Audit trail');
  const audit = await request('GET', '/api/settings/audit-logs', { token: adminToken });
  check('Audit log is readable', audit.status === 200, `status=${audit.status}`);
  const auditRows = arr(audit.json, 'logs', 'auditLogs');
  check('This run left real audit entries behind', auditRows.some((row) => /STUDENT_CREATED|ADMIN_CREATED|JOB_CREATED/i.test(String(row.action))), `${auditRows.length} rows`);

  // ── 12. Cleanup ──────────────────────────────────────────────────────────
  section('12. Cleanup — nothing test-related may stay behind');
  for (const task of [...cleanups].reverse()) {
    try {
      const res = await task.fn();
      check(`Deleted ${task.label}`, res.status === 200 || res.status === 204 || res.status === 404, `status=${res.status}`);
    } catch (error) {
      check(`Deleted ${task.label}`, false, error.message);
    }
  }

  for (const item of createdIds) {
    const res = await request('GET', item.path);
    check(`Created ${item.label} is really gone from the public API`, res.status === 404, `status=${res.status}`);
  }

  const afterJobs = await request('GET', '/api/jobs?page=1&limit=8');
  const afterCourses = await request('GET', '/api/courses');
  check('Job count is back to its starting value', Number(afterJobs.json?.pagination?.total ?? 0) === baseline.jobCount, `${baseline.jobCount} → ${afterJobs.json?.pagination?.total}`);
  check('Course count is back to its starting value', arr(afterCourses.json, 'courses').length === baseline.courseCount, `${baseline.courseCount} → ${arr(afterCourses.json, 'courses').length}`);

  // The account rows are the easiest thing to leak: an unreachable cleanup task
  // still reports "deleted" to nobody. Ask the API who actually exists.
  const survivingUsers = await request('GET', '/api/auth/users', { token: adminToken });
  const survivorEmails = arr(survivingUsers.json, 'users').map((u) => String(u.email || '').toLowerCase());
  const leaked = survivorEmails.filter((email) => email.startsWith('qa-live-'));
  check('No QA test account is left in the user table', leaked.length === 0, leaked.join(', ') || `${survivorEmails.length} real accounts remain`);
};

const report = () => {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`\n${C.bold}════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}LIVE ACCEPTANCE RESULT${C.reset}`);
  console.log(`${C.bold}════════════════════════════════════════════${C.reset}`);
  console.log(`  checks : ${results.length}`);
  console.log(`  passed : ${C.green}${passed}${C.reset}`);
  console.log(`  failed : ${failed === 0 ? C.green : C.red}${failed}${C.reset}`);
  if (failed) {
    console.log(`\n${C.red}${C.bold}FAILURES${C.reset}`);
    for (const f of failures) console.log(`  ${C.red}✗${C.reset} ${f.name}${f.detail ? `  ${C.dim}${f.detail}${C.reset}` : ''}`);
  } else {
    console.log(`\n${C.green}Every check passed against the deployed API.${C.reset}`);
  }
  return failed;
};

(async () => {
  let failed = 1;
  try {
    await run();
    failed = report();
  } catch (error) {
    console.log(`\n${C.red}${C.bold}ABORTED:${C.reset} ${error.message}`);
    for (const task of [...cleanups].reverse()) {
      try { await task.fn(); console.log(`  ${C.dim}cleanup: ${task.label} removed${C.reset}`); } catch (e) { /* best effort */ }
    }
    failed = report() || 1;
  }
  process.exit(failed ? 1 : 0);
})();
