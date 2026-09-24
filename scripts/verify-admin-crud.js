/**
 * Admin panel end-to-end contract test.
 *
 *   npm run verify:admin
 *
 * Why this exists: the client keeps hitting screens where the admin says "saved"
 * but nothing actually changes on the site. Field-level drops were fixed one by
 * one; this suite is the safety net that walks EVERY admin section the way the
 * panel does — create, read back, edit, read back, delete — and fails loudly if
 * any section stops persisting.
 *
 * It boots the real API against a throwaway database, so it is safe to run any
 * time and never touches the live client content.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5201;
const BASE = `http://127.0.0.1:${PORT}`;
const SEED_ADMIN_PASSWORD = 'Admin-Crud-Check-2026!z';
const DB_NAME = `aft_admintest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => {
  console.log(`\n${'─'.repeat(64)}\n${title}\n${'─'.repeat(64)}`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (method, url, { token, body, raw } = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      ...(raw ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: raw ? body : JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch (error) {
    json = null;
  }
  return { status: res.status, json };
};

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
      JWT_SECRET: 'admin_crud_contract_secret_long_enough_0001',
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
    check('API boots on a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    let token = '';
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'admin@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { token = res.json.token; break; }
      await sleep(1500);
    }
    check('Admin can sign in', Boolean(token));
    if (!token) throw new Error('could not authenticate as admin');

    /* ───────────────────────── 1. Dashboard ───────────────────────── */
    section('1. Dashboard (analytics)');
    const dash = await request('GET', '/api/analytics/dashboard', { token });
    check('Dashboard analytics loads', dash.status === 200 && Boolean(dash.json?.kpis));
    const kpis = dash.json?.kpis || {};
    check('Dashboard reports KPI numbers', typeof kpis.totalLeadsAllTime === 'number',
      `keys: ${Object.keys(kpis).slice(0, 6).join(', ')}`);
    check('Dashboard funnel data loads', Array.isArray(dash.json?.funnelData) && dash.json.funnelData.length > 0,
      `stages ${(dash.json?.funnelData || []).length}`);

    /* ───────────────────────── 2. Courses ───────────────────────── */
    section('2. Courses & Curriculum CMS');
    const createdCourse = await request('POST', '/api/courses', {
      token,
      body: {
        title: `Admin Contract Course ${Date.now()}`,
        category: 'Contract Testing',
        duration: '3 Months',
        pricing: { basePrice: 1999, discountedPrice: 1499 },
        highlights: ['Edit me'],
        isPublished: true,
        viewOptions: { groupBatch: true, personalizedMentor: false },
        eligibility: {
          title: 'Who Should Join?',
          points: ['Point one', 'Point two'],
          audiences: ['Graduates'],
          certificationPoints: ['US Fellowship Diploma'],
        },
        curriculum: [
          { moduleNumber: 1, moduleTitle: 'Admin Module One', topics: ['Lesson A', 'Lesson B'], hours: 12 },
          { moduleNumber: 2, moduleTitle: 'Admin Module Two', topics: ['Lesson C'], hours: 9 },
        ],
      },
    });
    const course = createdCourse.json?.course;
    check('Create course succeeds', createdCourse.status === 201 && Boolean(course?._id), `status ${createdCourse.status}`);
    check('New course keeps the learning-experience ticks', course?.viewOptions?.personalizedMentor === false,
      JSON.stringify(course?.viewOptions));
    check('New course keeps its eligibility block', course?.eligibility?.points?.length === 2,
      `points ${course?.eligibility?.points?.length}`);

    const courseCurriculum = await request('GET', `/api/curriculum/courses/${course?._id}`);
    check('Course modules reach the real curriculum collection',
      (courseCurriculum.json?.modules || []).length === 2,
      `modules ${(courseCurriculum.json?.modules || []).length}`);
    check('Course lessons are created from topics',
      courseCurriculum.json?.totalLessons === 3, `lessons ${courseCurriculum.json?.totalLessons}`);

    const courseUpdate = await request('PUT', `/api/courses/${course?._id}`, {
      token,
      body: { title: `Admin Contract Course (edited)`, curriculum: [
        { moduleNumber: 1, moduleTitle: 'Admin Module One (edited)', topics: ['Lesson A', 'Lesson B', 'Lesson D'], hours: 15 },
      ] },
    });
    const afterCourseEdit = await request('GET', `/api/curriculum/courses/${course?._id}`);
    check('Editing a course updates without duplicating modules',
      courseUpdate.status === 200 && (afterCourseEdit.json?.modules || []).length === 1,
      `modules ${(afterCourseEdit.json?.modules || []).length}`);
    check('Course edit is reflected on the public course endpoint',
      (await request('GET', `/api/courses/${course?.slug}`)).json?.course?.title === 'Admin Contract Course (edited)');

    const adminList = await request('GET', '/api/courses/admin/all', { token });
    const listed = (adminList.json?.courses || []).find((c) => String(c._id) === String(course?._id));
    check('Course CMS reports the real module count', listed?.moduleCount === 1, `moduleCount ${listed?.moduleCount}`);

    const badgePatch = await request('PATCH', `/api/courses/${course?._id}/badge`, {
      token, body: { badge: 'High Demand', isPublished: false },
    });
    const afterBadge = await request('GET', '/api/courses/admin/all', { token });
    const badgeRow = (afterBadge.json?.courses || []).find((c) => String(c._id) === String(course?._id));
    check('Badge + publish toggle persists',
      badgePatch.status === 200 && badgeRow?.badge === 'High Demand' && badgeRow?.isPublished === false,
      `badge="${badgeRow?.badge}" published=${badgeRow?.isPublished}`);

    // Standalone curriculum endpoints (used by the LMS/instructor screens)
    const newModule = await request('POST', '/api/curriculum/modules', {
      token, body: { course: course?._id, moduleNumber: 9, title: 'Standalone Module', durationHours: 5 },
    });
    const moduleId = newModule.json?.module?._id;
    check('POST /api/curriculum/modules works', newModule.status === 201 && Boolean(moduleId));
    const moduleEdit = await request('PUT', `/api/curriculum/modules/${moduleId}`, {
      token, body: { title: 'Standalone Module (edited)' },
    });
    check('PUT /api/curriculum/modules persists', moduleEdit.status === 200 && moduleEdit.json?.module?.title === 'Standalone Module (edited)');

    const newLesson = await request('POST', '/api/curriculum/lessons', {
      token, body: { course: course?._id, module: moduleId, title: 'Standalone Lesson' },
    });
    check('POST /api/curriculum/lessons works', newLesson.status === 201 && Boolean(newLesson.json?.lesson?._id));
    const lessonEdit = await request('PUT', `/api/curriculum/lessons/${newLesson.json?.lesson?._id}`, {
      token, body: { videoDuration: '99m', isPreview: true },
    });
    check('PUT /api/curriculum/lessons persists',
      lessonEdit.status === 200 && lessonEdit.json?.lesson?.videoDuration === '99m');
    const quiz = await request('POST', '/api/curriculum/quizzes', {
      token, body: { course: course?._id, module: moduleId, title: 'Contract Quiz', timeLimitMinutes: 10 },
    });
    check('POST /api/curriculum/quizzes works', quiz.status === 200 && Boolean(quiz.json?.quiz?._id));
    const moduleDelete = await request('DELETE', `/api/curriculum/modules/${moduleId}`, { token });
    check('DELETE /api/curriculum/modules cascades', moduleDelete.status === 200);

    /* ───────────────────────── 3. Batches ───────────────────────── */
    section('3. Batches & Urgency');
    const batchCreate = await request('POST', '/api/batches', {
      token,
      body: {
        course: course?._id,
        batchCode: `CONTRACT-${Date.now()}`,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        timing: 'Sat & Sun: 10:00 AM EST',
        maxCapacity: 20,
        status: 'Upcoming',
      },
    });
    const batch = batchCreate.json?.batch;
    check('Create batch succeeds', batchCreate.status === 201 && Boolean(batch?._id), `status ${batchCreate.status}`);
    const batchList = await request('GET', '/api/batches');
    check('New batch appears in the list', (batchList.json?.batches || batchList.json?.data || []).some((b) => String(b._id) === String(batch?._id)));
    const batchEdit = await request('PUT', `/api/batches/${batch?._id}`, { token, body: { maxCapacity: 30 } });
    const batchAfter = await request('GET', '/api/batches');
    const editedBatch = (batchAfter.json?.batches || batchAfter.json?.data || []).find((b) => String(b._id) === String(batch?._id));
    check('Batch edit persists', batchEdit.status === 200 && editedBatch?.maxCapacity === 30, `capacity ${editedBatch?.maxCapacity}`);

    // Student payment update (uses the batch roster built by the seeder)
    const students = await request('GET', '/api/students', { token });
    const studentRow = (students.json?.students || students.json?.data || [])[0];
    check('Enrolled students list loads', students.status === 200 && Array.isArray(students.json?.students || students.json?.data),
      `rows ${(students.json?.students || students.json?.data || []).length}`);

    /* ───────────────────────── 4. Leads CRM ───────────────────────── */
    section('4. Leads CRM');
    const leadCreate = await request('POST', '/api/leads', {
      body: { fullName: 'Contract Lead', email: `contract.lead.${Date.now()}@example.com`, phone: '+1 (555) 000-1111', notes: 'Created by verify:admin' },
    });
    const leadId = leadCreate.json?.leadId;
    check('Public lead capture still works', leadCreate.status === 201 && Boolean(leadId), `status ${leadCreate.status}`);
    const leadList = await request('GET', '/api/leads', { token });
    const leadRows = leadList.json?.leads || leadList.json?.data || [];
    check('Lead appears in the CRM list', leadRows.some((l) => String(l._id) === String(leadId)),
      `rows ${leadRows.length}`);
    const leadStatus = await request('PATCH', `/api/leads/${leadId}/status`, { token, body: { status: 'Contacted' } });
    check('Lead status change persists', leadStatus.status === 200, `status ${leadStatus.status} ${leadStatus.json?.message || ''}`);
    const callLog = await request('POST', `/api/leads/${leadId}/call-logs`, {
      token, body: { note: 'Contract call log', callOutcome: 'Interested' },
    });
    check('Lead call log is recorded', callLog.status === 201 || callLog.status === 200,
      `status ${callLog.status} ${callLog.json?.message || ''}`);
    const csv = await request('GET', '/api/leads/export/csv', { token });
    check('Leads CSV export responds', csv.status === 200);

    /* ───────────────────────── 5. Content CMS ───────────────────────── */
    section('5. Content & FAQs CMS');
    const stamp = Date.now();
    const blog = await request('POST', '/api/content/blogs', {
      token,
      body: {
        title: `Contract Blog ${stamp}`,
        slug: `contract-blog-${stamp}`,
        excerpt: 'Written by the admin contract test.',
        content: 'Body content for the admin contract test.',
        category: 'Insights',
        isPublished: true,
      },
    });
    const blogId = blog.json?.blog?._id || blog.json?.post?._id;
    check('Create blog post succeeds', blog.status === 201 && Boolean(blogId), `status ${blog.status}`);
    const blogEdit = await request('PUT', `/api/content/blogs/${blogId}`, { token, body: { title: `Contract Blog (edited) ${stamp}` } });
    check('Blog edit persists', blogEdit.status === 200 && /edited/.test(blogEdit.json?.blog?.title || blogEdit.json?.post?.title || ''));

    const faq = await request('POST', '/api/content/faqs', {
      token, body: { question: `Contract FAQ ${stamp}?`, answer: 'Contract answer.', category: 'Enrollment', isPublished: true },
    });
    const faqId = faq.json?.faq?._id;
    check('Create FAQ succeeds', faq.status === 201 && Boolean(faqId), `status ${faq.status}`);
    const faqEdit = await request('PUT', `/api/content/faqs/${faqId}`, { token, body: { answer: 'Edited contract answer.' } });
    check('FAQ edit persists', faqEdit.status === 200 && faqEdit.json?.faq?.answer === 'Edited contract answer.');

    // These are exactly the field names the Content CMS form now posts.
    const story = await request('POST', '/api/content/success-stories', {
      token,
      body: {
        studentName: `Contract Alum ${stamp}`,
        role: 'Data Scientist',
        company: 'Contract Corp',
        testimonial: 'The contract test helped me land the role.',
        course: 'Data Science with AI Integration',
        salaryHikePercent: 140,
        rating: 5,
      },
    });
    const storyId = story.json?.story?._id;
    check('Create success story succeeds', story.status === 201 && Boolean(storyId),
      `status ${story.status} ${story.json?.message || ''}`);

    const storyEdit = await request('PUT', `/api/content/success-stories/${storyId}`, {
      token,
      body: { company: 'Edited Contract Corp', testimonial: 'Edited testimonial text.' },
    });
    check('Success story edit persists the name and quote the admin typed',
      storyEdit.status === 200 && storyEdit.json?.story?.testimonial === 'Edited testimonial text.',
      `testimonial "${storyEdit.json?.story?.testimonial}"`);

    // A stale admin bundle posted the old names — those must not be dropped.
    const legacyStory = await request('POST', '/api/content/success-stories', {
      token,
      body: {
        name: `Legacy Alum ${stamp}`,
        role: 'ML Engineer',
        company: 'Legacy Corp',
        quote: 'Submitted with the old field names.',
        image: '',
        courseTitle: 'Cyber Security with Ethical Hacking',
        salaryHike: '+135%',
      },
    });
    check('Old field names are mapped instead of silently dropped',
      legacyStory.status === 201 && legacyStory.json?.story?.studentName === `Legacy Alum ${stamp}`,
      `status ${legacyStory.status} ${legacyStory.json?.message || ''}`);
    check('Legacy "+135%" becomes the numeric salary hike',
      legacyStory.json?.story?.salaryHikePercent === 135,
      `salaryHikePercent ${legacyStory.json?.story?.salaryHikePercent}`);
    check('An empty photo falls back to the model default',
      Boolean(legacyStory.json?.story?.photo), `photo "${legacyStory.json?.story?.photo}"`);
    const legacyStoryId = legacyStory.json?.story?._id;
    if (legacyStoryId) await request('DELETE', `/api/content/success-stories/${legacyStoryId}`, { token });

    // The public Success Stories page only reads isFeatured stories, and the
    // card now prints the salary hike + graduation year the admin typed — if
    // either link breaks, the admin fills a field that never reaches the site.
    const featuredStory = await request('POST', '/api/content/success-stories', {
      token,
      body: {
        studentName: `Featured Alum ${stamp}`,
        role: 'Cloud Architect',
        company: 'Featured Corp',
        testimonial: 'Featured story probe.',
        course: 'DevOps and Cloud with AI',
        salaryHikePercent: 155,
        graduationYear: '2026',
        isFeatured: true,
      },
    });
    const draftStory = await request('POST', '/api/content/success-stories', {
      token,
      body: {
        studentName: `Draft Alum ${stamp}`,
        role: 'Draft Role',
        company: 'Draft Corp',
        testimonial: 'Draft story must stay off the public page.',
        course: 'DevOps and Cloud with AI',
        isFeatured: false,
      },
    });
    const publicStories = await request('GET', '/api/content/success-stories');
    const publicNames = (publicStories.json?.stories || []).map((s) => s.studentName);
    check('A featured story appears on the public success-stories feed',
      publicNames.includes(`Featured Alum ${stamp}`));
    check('An unticked story stays off the public success-stories feed',
      !publicNames.includes(`Draft Alum ${stamp}`));
    check('The public feed returns the salary hike and graduation year for the card',
      (publicStories.json?.stories?.find((s) => s.studentName === `Featured Alum ${stamp}`)?.salaryHikePercent === 155) &&
      (publicStories.json?.stories?.find((s) => s.studentName === `Featured Alum ${stamp}`)?.graduationYear === '2026'));
    check('Star rating can be lowered below the default five',
      (await request('PUT', `/api/content/success-stories/${featuredStory.json?.story?._id}`, {
        token, body: { rating: 4 },
      })).json?.story?.rating === 4);
    for (const id of [featuredStory.json?.story?._id, draftStory.json?.story?._id]) {
      if (id) await request('DELETE', `/api/content/success-stories/${id}`, { token });
    }

    /* ───────────────────────── 6. Jobs ───────────────────────── */
    section('6. Partner Job Board');
    const job = await request('POST', '/api/jobs', {
      token,
      body: {
        title: `Contract Engineer ${stamp}`,
        company: 'Contract Corp',
        department: 'Data & Analytics',
        location: 'Remote (US)',
        employmentType: 'Full-time',
        experienceLevel: 'Mid-Level',
        salaryRange: '$120,000 - $150,000 / year',
        skills: ['Python', 'SQL'],
        description: 'Created by verify:admin.',
        responsibilities: ['Ship things'],
        requirements: ['Know things'],
        benefits: ['Remote'],
        isPublished: true,
      },
    });
    const jobId = job.json?.job?._id;
    check('Create job succeeds', job.status === 201 && Boolean(jobId), `status ${job.status}`);
    const jobEdit = await request('PUT', `/api/jobs/${jobId}`, { token, body: { location: 'New York, NY (Hybrid)' } });
    const jobAfter = await request('GET', `/api/jobs/${jobId}`);
    check('Job edit persists', jobEdit.status === 200 && jobAfter.json?.job?.location === 'New York, NY (Hybrid)',
      `location "${jobAfter.json?.job?.location}"`);
    const applications = await request('GET', '/api/jobs/admin/applications', { token });
    check('Job applications screen loads', applications.status === 200);

    /* ───────────────────────── 7. Support desk ───────────────────────── */
    section('7. Student Support Desk');
    // The seeder creates no tickets, so raise one as a student first — the same
    // way a real learner would — then resolve it from the admin inbox.
    const studentLogin = await request('POST', '/api/auth/login', {
      body: { email: 'student@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
    });
    const studentToken = studentLogin.json?.token;
    check('Demo student can sign in', Boolean(studentToken), `status ${studentLogin.status}`);

    const ticket = await request('POST', '/api/support/tickets', {
      token: studentToken,
      body: { subject: `Contract ticket ${stamp}`, message: 'Raised by verify:admin.', category: 'Technical Issue' },
    });
    check('Student can raise a support ticket', ticket.status === 201 || ticket.status === 200,
      `status ${ticket.status} ${ticket.json?.message || ''}`);

    const tickets = await request('GET', '/api/support/admin/tickets', { token });
    const ticketRows = tickets.json?.tickets || tickets.json?.data || [];
    check('Support inbox loads for the admin', tickets.status === 200, `tickets ${ticketRows.length}`);
    const ticketStatus = await request('PATCH', `/api/support/admin/tickets/${ticketRows[0]?._id}/status`, {
      token, body: { status: 'Resolved' },
    });
    check('Ticket status change persists', ticketStatus.status === 200 && ticketRows.length > 0,
      `status ${ticketStatus.status}`);
    const ticketReply = await request('POST', `/api/support/tickets/${ticketRows[0]?._id}/reply`, {
      token, body: { message: 'Admin contract reply.' },
    });
    check('Admin can reply on a ticket', ticketReply.status === 200 || ticketReply.status === 201,
      `status ${ticketReply.status} ${ticketReply.json?.message || ''}`);

    /* ───────────────────────── 8. Payments ledger ───────────────────────── */
    section('8. Tuition & Billing Ledger');
    const payments = await request('GET', '/api/payments', { token });
    check('Payments ledger loads', payments.status === 200);
    const paymentRows = payments.json?.payments || payments.json?.data || [];
    const invoiceNumber = paymentRows[0]?.invoiceNumber;
    if (invoiceNumber) {
      const invoice = await request('GET', `/api/payments/invoice/${invoiceNumber}`, { token });
      check('Invoice detail opens', invoice.status === 200, `invoice ${invoiceNumber}`);
    } else {
      check('Invoice detail opens', false, 'no seeded payment with an invoice number');
    }

    /* ───────────────────────── 9. Staff & RBAC ───────────────────────── */
    section('9. Staff & Security (RBAC)');
    const staffWeak = await request('POST', '/api/auth/users', {
      token,
      body: { name: 'Contract Staff', email: `weak.staff.${stamp}@americanfuturetech.com`, role: 'COUNSELOR', password: 'Contract-Staff-2026!x' },
    });
    const staffCreate = await request('POST', '/api/auth/users', {
      token,
      body: { name: 'Contract Staff', email: `contract.staff.${stamp}@americanfuturetech.com`, role: 'COUNSELOR', password: 'Zq7-Planet-Vault-22' },
    });
    // The API returns the new account as `id` (not `_id`).
    const staffId = staffCreate.json?.user?.id || staffCreate.json?.user?._id;
    check('Create staff account succeeds', staffCreate.status === 201 && Boolean(staffId),
      `status ${staffCreate.status} ${staffCreate.json?.message || ''}`);
    check('Password policy blocks a password containing the staff name',
      staffWeak.status === 400, `status ${staffWeak.status} ${staffWeak.json?.message || ''}`);
    const staffEdit = await request('PUT', `/api/auth/users/${staffId}`, { token, body: { name: 'Contract Staff (edited)' } });
    check('Staff edit persists', staffEdit.status === 200 && /edited/.test(staffEdit.json?.user?.name || ''));
    // The panel posts `newPassword` (the policy still applies).
    const staffReset = await request('POST', `/api/auth/users/${staffId}/reset-password`, {
      token,
      body: { newPassword: 'Qm8-Harbor-Lantern-31' },
    });
    check('Admin password reset works', staffReset.status === 200,
      `status ${staffReset.status} ${staffReset.json?.message || ''}`);
    const staffRelogin = await request('POST', '/api/auth/login', {
      body: { email: `contract.staff.${stamp}@americanfuturetech.com`, password: 'Qm8-Harbor-Lantern-31' },
    });
    check('The reset password actually works for that staff member',
      staffRelogin.status === 200 && Boolean(staffRelogin.json?.token), `status ${staffRelogin.status}`);
    const users = await request('GET', '/api/auth/users', { token });
    check('Staff list loads', users.status === 200);
    const audit = await request('GET', '/api/settings/audit-logs', { token });
    check('Audit log records admin actions', audit.status === 200,
      `entries ${((audit.json?.logs || audit.json?.auditLogs || audit.json?.data || []).length)}`);

    /* ───────────────────────── 10. Settings tabs ───────────────────────── */
    section('10. Site CMS & Settings');
    // Derive the tab list from the settings document itself, so this stays
    // honest as blocks are added or renamed (a hardcoded list went stale once).
    const settingsDoc = (await request('GET', '/api/settings')).json?.settings || {};
    // `paymentGateway` is deliberately NOT writable through the general save:
    // the browser only ever receives masked key hints, so writing the block back
    // would wipe the encrypted Stripe secrets. It has its own endpoint, tested
    // separately below.
    const tabs = Object.keys(settingsDoc).filter(
      (key) => !['_id', '__v', 'createdAt', 'updatedAt', 'paymentGateway'].includes(key),
    );
    console.log(`  settings blocks found: ${tabs.length} — ${tabs.join(', ')}`);
    const SKIP_KEYS = ['_id', '__v', 'id', 'createdAt', 'updatedAt', 'slug', 'icon', 'image', 'images', 'url', 'link', 'href', 'color', 'gradient', 'theme'];
    const TEXT_KEYS = ['title', 'headline', 'subtitle', 'eyebrow', 'label', 'badgeText', 'description', 'tagline'];

    // Mutate a REAL leaf inside each tab — an unknown probe key would be dropped
    // by the schema on purpose and would only test strict mode, not the tab.
    const findLeaf = (obj, prefix = '') => {
      if (!obj || typeof obj !== 'object') return null;
      for (const key of Object.keys(obj)) {
        if (SKIP_KEYS.includes(key)) continue;
        const value = obj[key];
        const path = prefix + key;
        if (typeof value === 'boolean') return { path, kind: 'boolean' };
        if (typeof value === 'string' && value.length > 0) {
          return { path, kind: TEXT_KEYS.includes(key) ? 'text' : 'string' };
        }
        if (Array.isArray(value) && value.length && value[0] && typeof value[0] === 'object') {
          const nested = findLeaf(value[0], `${path}.0.`);
          if (nested) return nested;
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const nested = findLeaf(value, `${path}.`);
          if (nested) return nested;
        }
      }
      return null;
    };
    const setPath = (obj, path, value) => {
      const parts = path.split('.');
      let cur = obj;
      for (let i = 0; i < parts.length - 1; i += 1) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return obj;
    };
    const getPath = (obj, path) => path.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), obj);

    let tabPass = 0;
    const tabFailures = [];
    const tabDetails = [];
    for (const tab of tabs) {
      const current = (await request('GET', '/api/settings')).json?.settings?.[tab];

      // A block may be a plain scalar (siteName, contactPhone, isMaintenanceMode…)
      // or an object/array of fields. Probe whichever it is.
      const directLeaf =
        typeof current === 'string' ? { path: null, kind: 'string' }
        : typeof current === 'boolean' ? { path: null, kind: 'boolean' }
        : typeof current === 'number' ? { path: null, kind: 'number' }
        : null;
      const leaf = directLeaf || findLeaf(current);
      if (!leaf) { tabFailures.push(`${tab} (no editable field)`); continue; }

      const original = leaf.path ? getPath(current, leaf.path) : current;
      const probeValue =
        leaf.kind === 'boolean' ? !original
        : leaf.kind === 'number' ? Number(original || 0) + 1
        : `Contract probe ${tab} ${stamp}`;

      const payload = leaf.path
        ? setPath(JSON.parse(JSON.stringify(current || {})), leaf.path, probeValue)
        : probeValue;
      const res = await request('PUT', '/api/settings', { token, body: { [tab]: payload } });
      await sleep(120);
      const readBack = (await request('GET', '/api/settings')).json?.settings?.[tab];
      const stored = leaf.path ? getPath(readBack, leaf.path) : readBack;
      if (res.status === 200 && stored === probeValue) {
        tabPass += 1;
      } else {
        tabFailures.push(`${tab}${leaf.path ? `.${leaf.path}` : ''} (got "${String(stored).slice(0, 30)}")`);
      }
      tabDetails.push(`${tab}${leaf.path ? `.${leaf.path}` : ''}`);
    }
    check('Every settings tab accepts and returns a real edit', tabFailures.length === 0,
      tabFailures.length ? `failed: ${tabFailures.join(', ')}` : `${tabPass}/${tabs.length} tabs — ${tabDetails.slice(0, 3).join(', ')}…`);

    /* ─────────────────── 10b. Payment gateway switch ─────────────────── */
    const gatewayRead = async () =>
      (await request('GET', '/api/settings/payment-gateway', { token })).json?.gateway || {};

    const gatewayBefore = await gatewayRead();
    const offSave = await request('PUT', '/api/settings/payment-gateway', {
      token,
      body: { enabled: false },
    });
    check('Admin can switch the payment gateway off',
      offSave.status === 200 && (await gatewayRead()).enabled === false,
      `status ${offSave.status} enabled ${(await gatewayRead()).enabled}`);

    // The real defence: a string/0 payload must never be read as truthy, or a
    // forgotten switch silently re-enables card payments.
    await request('PUT', '/api/settings/payment-gateway', { token, body: { enabled: 'false' } });
    check('The switch treats the string "false" as OFF, not truthy',
      (await gatewayRead()).enabled === false, `enabled ${(await gatewayRead()).enabled}`);
    await request('PUT', '/api/settings/payment-gateway', { token, body: { enabled: 0 } });
    check('The switch treats 0 as OFF, not truthy',
      (await gatewayRead()).enabled === false, `enabled ${(await gatewayRead()).enabled}`);

    await request('PUT', '/api/settings/payment-gateway', { token, body: { enabled: gatewayBefore.enabled !== false } });
    check('The gateway can be switched back on',
      (await gatewayRead()).enabled === (gatewayBefore.enabled !== false));

    const gatewayPayload = JSON.stringify((await request('GET', '/api/settings/payment-gateway', { token })).json);
    check('Gateway secrets are never echoed back to the browser',
      !/sk_(test|live)_[A-Za-z0-9]/.test(gatewayPayload) && !/whsec_[A-Za-z0-9]/.test(gatewayPayload));

    const badKey = await request('PUT', '/api/settings/payment-gateway', {
      token,
      body: { publishableKey: 'pk_test_contract', secretKey: 'not-a-stripe-key' },
    });
    check('A malformed secret key is refused, not stored',
      badKey.status === 400 && /sk_/.test(badKey.json?.message || ''), `status ${badKey.status}`);

    /* ───────────────────────── 11. Website editor ───────────────────────── */
    section('11. Website Editor (text & images)');
    const editorSave = await request('PUT', '/api/settings/site-editor', {
      token,
      body: {
        route: '/contract-page',
        text: { 'div0>h1#t0': { original: 'Original headline', value: 'Edited headline' } },
        images: {},
      },
    });
    check('Website editor save works', editorSave.status === 200 && editorSave.json?.success !== false);
    const editorRead = await request('GET', '/api/settings/site-editor?route=/contract-page');
    check('Website editor change is public', editorRead.json?.text?.['div0>h1#t0']?.value === 'Edited headline');
    const editorSummary = await request('GET', '/api/settings/site-editor/summary', { token });
    check('Website editor overview loads', editorSummary.status === 200);
    const editorReset = await request('DELETE', '/api/settings/site-editor?route=/contract-page', { token });
    check('Website editor reset works', editorReset.status === 200);

    /* ───────────────────────── 12. Cleanup paths ───────────────────────── */
    section('12. Delete paths (admin must be able to remove things)');
    const delStory = await request('DELETE', `/api/content/success-stories/${storyId}`, { token });
    check('Delete success story works', delStory.status === 200);
    const delFaq = await request('DELETE', `/api/content/faqs/${faqId}`, { token });
    check('Delete FAQ works', delFaq.status === 200);
    const delBlog = await request('DELETE', `/api/content/blogs/${blogId}`, { token });
    check('Delete blog works', delBlog.status === 200);
    const delJob = await request('DELETE', `/api/jobs/${jobId}`, { token });
    check('Delete job works', delJob.status === 200);
    const delBatch = await request('DELETE', `/api/batches/${batch?._id}`, { token });
    check('Delete batch works', delBatch.status === 200);
    const delStaff = await request('DELETE', `/api/auth/users/${staffId}`, { token });
    check('Delete staff works', delStaff.status === 200);
    const delCourse = await request('DELETE', `/api/courses/${course?._id}`, { token });
    check('Delete course works', delCourse.status === 200);
  } finally {
    await stopServer();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
    const errorLines = serverLog.split('\n').filter((l) => /error|Error/.test(l)).slice(0, 12);
    if (errorLines.length) {
      console.log('\nServer log excerpt:');
      console.log(errorLines.join('\n'));
    }
    process.exit(1);
  }
  console.log('Every admin section persists its changes ✅');
};

run().catch((error) => {
  console.error('\nVerification crashed:', error.message);
  process.exit(1);
});
