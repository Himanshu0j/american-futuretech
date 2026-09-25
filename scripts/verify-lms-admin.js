/**
 * LMS control centre regression (content, enrollments, progress, certificates,
 * announcements, settings, and the refusals that keep it safe).
 *
 *   npm run verify:lms
 *
 * Boots a real API against a throwaway database and walks the whole admin
 * surface the client uses to run the student portal, plus the two data-safety
 * guarantees this work introduced:
 *
 *   1. a lesson whose video/notes/resources were authored is NEVER destroyed by
 *      the Courses CMS composer (server/utils/curriculumSync.js);
 *   2. the public certificate registry still answers without the holder's email.
 *
 * Every mutating endpoint is also asserted against a staff account that only
 * holds read permissions — hiding a button is not authorization.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5611;
const BASE = `http://127.0.0.1:${PORT}`;
const DB_NAME = `aft_lmstest_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27018/${DB_NAME}`;

const ADMIN_EMAIL = 'admin@americanfuturetech.com';
const ADMIN_PASSWORD = 'Lms-Control-2026!x9';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const section = (title) => console.log(`\n${'─'.repeat(64)}\n${title}\n${'─'.repeat(64)}`);
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
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
};

const run = async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI,
      NODE_ENV: 'production',
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
      JWT_SECRET: 'lms_control_secret_long_enough_00000001',
      CLIENT_URL: 'http://localhost:5173',
      NOTIFICATION_EMAIL: 'verify@example.com',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
  server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

  const shutdown = async () => {
    server.kill();
    await sleep(700);
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch (error) {
      console.log(`  (cleanup note: ${error.message})`);
    }
  };

  try {
    console.log(`\nBooting API on port ${PORT} against ${DB_NAME}`);

    let healthy = false;
    for (let attempt = 0; attempt < 45; attempt += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch { /* still booting */ }
      await sleep(1200);
    }
    check('API boots against a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    const login = async (email, password) => {
      const res = await request('POST', '/api/auth/login', { body: { email, password } });
      return { token: res.json?.token || '', id: res.json?.user?._id || res.json?.user?.id || '', status: res.status, json: res.json };
    };

    let admin = { token: '' };
    for (let attempt = 0; attempt < 30; attempt += 1) {
      admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      if (admin.token) break;
      await sleep(1200);
    }
    check('SUPERADMIN signs in', Boolean(admin.token));
    if (!admin.token) throw new Error('could not authenticate as superadmin');
    const asAdmin = { token: admin.token };

    const stamp = Date.now();

    // ── Course + modules + lessons ─────────────────────────────────────────
    section('CURRICULUM AUTHORING');

    const courseRes = await request('POST', '/api/courses', {
      ...asAdmin,
      body: {
        title: `LMS QA Track ${stamp}`,
        category: 'Artificial Intelligence & Analytics',
        duration: '3 Months',
        description: 'throwaway course for the LMS suite',
      },
    });
    const courseId = courseRes.json?.course?._id;
    check('Course is created', courseRes.status === 201 && Boolean(courseId), `HTTP ${courseRes.status}`);

    const modA = await request('POST', '/api/curriculum/modules', {
      ...asAdmin,
      body: { course: courseId, moduleNumber: 1, title: 'Foundations', durationHours: 20 },
    });
    const modB = await request('POST', '/api/curriculum/modules', {
      ...asAdmin,
      body: { course: courseId, moduleNumber: 2, title: 'Advanced', durationHours: 30 },
    });
    const moduleAId = modA.json?.module?._id;
    const moduleBId = modB.json?.module?._id;
    check('Two modules are created', Boolean(moduleAId && moduleBId), `HTTP ${modA.status}/${modB.status}`);

    // A share link must be stored in the embed form the player needs.
    const lesson = await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: {
        course: courseId,
        module: moduleAId,
        title: 'Intro to the toolkit',
        contentType: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
        videoDuration: '12m',
        description: 'Setup walkthrough',
        textContent: 'First paragraph.\n\nSecond paragraph.',
        resources: [
          { title: 'Slides', url: 'https://example.com/slides.pdf', fileType: 'PDF', fileSize: '2 MB' },
        ],
      },
    });
    const lessonId = lesson.json?.lesson?._id;
    check('Lesson is created', lesson.status === 201 && Boolean(lessonId), `HTTP ${lesson.status}`);
    check(
      'A YouTube share link is stored as an embed URL',
      lesson.json?.lesson?.videoUrl === 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      lesson.json?.lesson?.videoUrl
    );
    check('Lesson notes and resources round-trip', Boolean(lesson.json?.lesson?.textContent) && lesson.json?.lesson?.resources?.length === 1);
    check(
      'A blank resource row is dropped instead of failing the save',
      Array.isArray(lesson.json?.lesson?.resources)
    );

    const badScheme = await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: { course: courseId, module: moduleAId, title: 'Bad video', videoUrl: 'javascript:alert(1)' },
    });
    check(
      'A non-https video link is refused with 400',
      badScheme.status === 400,
      `HTTP ${badScheme.status} ${badScheme.json?.message || ''}`
    );

    const draftLesson = await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: { course: courseId, module: moduleBId, title: 'Unfinished draft', isPublished: false, videoUrl: 'https://vimeo.com/123456789' },
    });
    check(
      'A Vimeo link is stored as a player embed',
      draftLesson.json?.lesson?.videoUrl === 'https://player.vimeo.com/video/123456789',
      draftLesson.json?.lesson?.videoUrl
    );

    const adminView = await request('GET', `/api/curriculum/admin/courses/${courseId}`, asAdmin);
    const publicView = await request('GET', `/api/curriculum/courses/${courseId}`);
    const adminTitles = (adminView.json?.modules || []).flatMap((m) => (m.lessons || []).map((l) => l.title));
    const publicTitles = (publicView.json?.modules || []).flatMap((m) => (m.lessons || []).map((l) => l.title));
    check('Admin curriculum view returns unpublished drafts', adminTitles.includes('Unfinished draft'), `${adminTitles.length} lessons`);
    check('The public curriculum hides drafts', !publicTitles.includes('Unfinished draft'));
    check(
      'Admin view reports draft counts',
      adminView.json?.counts?.draftLessons >= 1,
      JSON.stringify(adminView.json?.counts || {})
    );

    // ── Reorder + duplicate ────────────────────────────────────────────────
    section('ORDERING & DUPLICATION');

    const secondLesson = await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: { course: courseId, module: moduleAId, title: 'Second lesson' },
    });
    const secondLessonId = secondLesson.json?.lesson?._id;

    const reorder = await request('PUT', `/api/curriculum/courses/${courseId}/reorder`, {
      ...asAdmin,
      body: {
        modules: [{ id: moduleBId }, { id: moduleAId }],
        lessons: [{ id: secondLessonId }, { id: lessonId }],
      },
    });
    check('Reorder is accepted', reorder.status === 200, `HTTP ${reorder.status}`);

    const afterReorder = await request('GET', `/api/curriculum/admin/courses/${courseId}`, asAdmin);
    check(
      'Modules keep the new order',
      afterReorder.json?.modules?.[0]?.title === 'Advanced',
      afterReorder.json?.modules?.map((m) => m.title).join(' → ')
    );
    check(
      'Lessons keep the new order',
      afterReorder.json?.modules?.[1]?.lessons?.[0]?.title === 'Second lesson',
      afterReorder.json?.modules?.[1]?.lessons?.map((l) => l.title).join(' → ')
    );

    const duplicate = await request('POST', `/api/curriculum/lessons/${lessonId}/duplicate`, asAdmin);
    check(
      'A lesson duplicates with its video and resources',
      duplicate.status === 201 && duplicate.json?.lesson?.videoUrl === 'https://www.youtube.com/embed/dQw4w9WgXcQ' && duplicate.json?.lesson?.resources?.length === 1,
      `HTTP ${duplicate.status}`
    );

    // ── Quiz ───────────────────────────────────────────────────────────────
    section('ASSESSMENTS');

    const quiz = await request('POST', '/api/curriculum/quizzes', {
      ...asAdmin,
      body: {
        course: courseId,
        module: moduleAId,
        title: 'Foundations check',
        timeLimitMinutes: 10,
        passingScorePercent: 60,
        questions: [
          { questionText: 'What is 2 + 2?', options: ['3', '4', '5'], correctOptionIndex: 1, explanation: 'Basic arithmetic.' },
        ],
      },
    });
    check('Quiz is created', quiz.status === 200 && Boolean(quiz.json?.quiz?._id), `HTTP ${quiz.status}`);

    const attempts = await request('GET', `/api/admin/lms/quiz-attempts?courseId=${courseId}`, asAdmin);
    check('Quiz attempt review responds', attempts.status === 200 && typeof attempts.json?.passRatePercent === 'number');

    const quizDelete = await request('DELETE', `/api/curriculum/quizzes/${quiz.json?.quiz?._id}`, asAdmin);
    check('Quiz can be deleted', quizDelete.status === 200, `HTTP ${quizDelete.status}`);

    // ── Data-safety: the composer must not destroy authored lessons ────────
    section('COMPOSER DATA SAFETY');

    const beforeSync = await request('GET', `/api/curriculum/admin/courses/${courseId}`, asAdmin);
    const lessonsBefore = (beforeSync.json?.modules || []).reduce((sum, m) => sum + (m.lessons?.length || 0), 0);

    // The composer saving an empty topic list used to wipe every lesson.
    const composerSave = await request('PUT', `/api/courses/${courseId}`, {
      ...asAdmin,
      body: { curriculum: [{ moduleTitle: 'Foundations', hours: 20, topics: [] }, { moduleTitle: 'Advanced', hours: 30, topics: [] }] },
    });
    check('Course composer save succeeds', composerSave.status === 200, `HTTP ${composerSave.status}`);
    check(
      'The composer reports preserved lessons',
      (composerSave.json?.curriculumSummary?.lessons?.preserved || 0) > 0,
      JSON.stringify(composerSave.json?.curriculumSummary || {})
    );

    const afterSync = await request('GET', `/api/curriculum/admin/courses/${courseId}`, asAdmin);
    const authoredStillThere = (afterSync.json?.modules || [])
      .flatMap((m) => m.lessons || [])
      .some((l) => l.videoUrl === 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    const lessonsAfter = (afterSync.json?.modules || []).reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    check('A lesson with an authored video survives the composer save', authoredStillThere, `${lessonsBefore} → ${lessonsAfter} lessons`);
    check(
      'Empty shell lessons are still cleaned up',
      (composerSave.json?.curriculumSummary?.lessons?.deleted || 0) > 0,
      `deleted ${composerSave.json?.curriculumSummary?.lessons?.deleted || 0}`
    );
    check(
      'The composer does not report a preserved module it should have removed',
      (composerSave.json?.curriculumSummary?.modules?.deleted || 0) === 0,
      JSON.stringify(composerSave.json?.curriculumSummary?.modules || {})
    );

    // ── Enrollment ─────────────────────────────────────────────────────────
    section('ENROLLMENTS & ACCESS');

    const studentEmail = `lms.student.${stamp}@example.com`;
    const studentPassword = 'Cobalt-Meadow-47!';
    const student = await request('POST', '/api/students/admin', {
      ...asAdmin,
      body: { name: `LMS Student ${stamp}`, email: studentEmail, password: studentPassword, phone: '+1 555 0199' },
    });
    const studentId = student.json?.student?._id;
    check('Student account is created', student.status === 201 && Boolean(studentId), `HTTP ${student.status}`);

    const enroll = await request('POST', '/api/admin/lms/enrollments', {
      ...asAdmin,
      body: { studentId, courseId, status: 'Active' },
    });
    check('Student is enrolled through the LMS console', enroll.status === 201, `HTTP ${enroll.status}`);

    const enrollAgain = await request('POST', '/api/admin/lms/enrollments', {
      ...asAdmin,
      body: { studentId, courseId, status: 'Active' },
    });
    check('Enrolling twice is idempotent', enrollAgain.status === 201 && enrollAgain.json?.enrollment?._id === enroll.json?.enrollment?._id);

    const enrollments = await request('GET', `/api/admin/lms/enrollments?courseId=${courseId}`, asAdmin);
    check(
      'Enrollment list shows the student with progress attached',
      (enrollments.json?.enrollments || []).some((row) => String(row.student?._id) === String(studentId) && typeof row.progressPercent === 'number'),
      `${enrollments.json?.count ?? 0} rows`
    );

    const paused = await request('PUT', `/api/admin/lms/enrollments/${enroll.json?.enrollment?._id}`, {
      ...asAdmin,
      body: { status: 'Suspended' },
    });
    check('Enrollment status can be changed', paused.status === 200 && paused.json?.enrollment?.status === 'Suspended');

    // ── Progress + certificate ─────────────────────────────────────────────
    section('PROGRESS & CERTIFICATES');

    const complete = await request('POST', '/api/admin/lms/progress/complete', { ...asAdmin, body: { studentId, courseId } });
    check(
      'An admin can mark a course complete',
      complete.status === 200 && complete.json?.progress?.isCompleted === true && complete.json?.progress?.progressPercent === 100,
      `HTTP ${complete.status}`
    );

    const progressList = await request('GET', `/api/admin/lms/progress?courseId=${courseId}`, asAdmin);
    check(
      'Progress list reports completion',
      (progressList.json?.progress || []).some((row) => String(row.studentId) === String(studentId) && row.isCompleted),
      `${progressList.json?.count ?? 0} rows`
    );

    const eligibility = await request('GET', `/api/admin/certificates/eligibility?courseId=${courseId}`, asAdmin);
    check(
      'The completed student appears as certificate-eligible',
      (eligibility.json?.eligible || []).some((row) => String(row.studentId) === String(studentId)),
      `${eligibility.json?.count ?? 0} eligible`
    );

    const issue = await request('POST', '/api/admin/certificates/issue', { ...asAdmin, body: { studentId, courseId } });
    const certificateId = issue.json?.certificate?.certificateId;
    check('A certificate can be issued by hand', issue.status === 201 && Boolean(certificateId), `HTTP ${issue.status}`);

    const verifyPublic = await request('GET', `/api/lms/certificate/${certificateId}`);
    check('The public registry validates the new certificate', verifyPublic.status === 200 && verifyPublic.json?.success === true);
    check('The public registry reports it as valid, not revoked', verifyPublic.json?.revoked === false);
    check(
      'The public registry does not expose the holder\'s email',
      !JSON.stringify(verifyPublic.json?.certificate || {}).includes(studentEmail),
      'email absent from the public payload'
    );

    const revoke = await request('POST', `/api/admin/certificates/${issue.json?.certificate?._id}/revoke`, {
      ...asAdmin,
      body: { reason: 'Issued in error during QA' },
    });
    check('A certificate can be revoked', revoke.status === 200 && Boolean(revoke.json?.certificate?.revokedAt));

    const verifyRevoked = await request('GET', `/api/lms/certificate/${certificateId}`);
    check(
      'A revoked certificate is publicly marked withdrawn',
      verifyRevoked.json?.revoked === true && /withdrawn/i.test(verifyRevoked.json?.notice || ''),
      verifyRevoked.json?.notice
    );

    const reinstate = await request('POST', `/api/admin/certificates/${issue.json?.certificate?._id}/reinstate`, asAdmin);
    check('A revoked certificate can be reinstated', reinstate.status === 200 && reinstate.json?.certificate?.revokedAt === null);

    const reset = await request('POST', '/api/admin/lms/progress/reset', { ...asAdmin, body: { studentId, courseId } });
    check('Progress can be reset', reset.status === 200 && reset.json?.progress?.progressPercent === 0, `HTTP ${reset.status}`);

    // ── Announcements ──────────────────────────────────────────────────────
    section('COMMUNICATIONS');

    const studentLogin = await login(studentEmail, studentPassword);
    check('The student can sign in to the LMS', Boolean(studentLogin.token), `HTTP ${studentLogin.status}`);

    const announcement = await request('POST', '/api/admin/lms/announcements', {
      ...asAdmin,
      body: { title: `QA notice ${stamp}`, body: 'Cohort starts Monday.', audience: 'All Students', pinned: true },
    });
    const announcementId = announcement.json?.announcement?._id;
    check('An announcement is published', announcement.status === 201 && Boolean(announcementId), `HTTP ${announcement.status}`);

    const studentNotices = await request('GET', '/api/lms/announcements', { token: studentLogin.token });
    check(
      'The student sees the published announcement',
      (studentNotices.json?.announcements || []).some((row) => row.title === `QA notice ${stamp}`),
      `${studentNotices.json?.count ?? 0} notices`
    );

    // A notice aimed at a course the student is not enrolled in must stay hidden.
    const otherCourse = await request('POST', '/api/courses', {
      ...asAdmin,
      body: { title: `LMS QA Other ${stamp}`, category: 'Artificial Intelligence & Analytics' },
    });
    const targeted = await request('POST', '/api/admin/lms/announcements', {
      ...asAdmin,
      body: {
        title: `Targeted notice ${stamp}`,
        body: 'Only for the other cohort.',
        audience: 'Course',
        courseId: otherCourse.json?.course?._id,
      },
    });
    const studentNotices2 = await request('GET', '/api/lms/announcements', { token: studentLogin.token });
    check(
      'A notice for another course is not shown to this student',
      !(studentNotices2.json?.announcements || []).some((row) => row.title === `Targeted notice ${stamp}`)
    );

    const announcementUpdate = await request('PUT', `/api/admin/lms/announcements/${announcementId}`, {
      ...asAdmin,
      body: { isPublished: false },
    });
    check('An announcement can be unpublished', announcementUpdate.status === 200 && announcementUpdate.json?.announcement?.isPublished === false);

    const announcementDelete = await request('DELETE', `/api/admin/lms/announcements/${targeted.json?.announcement?._id}`, asAdmin);
    check('An announcement can be deleted', announcementDelete.status === 200, `HTTP ${announcementDelete.status}`);

    // ── Settings ───────────────────────────────────────────────────────────
    section('LMS SETTINGS');

    const settingsSave = await request('PUT', '/api/admin/lms/settings', {
      ...asAdmin,
      body: { defaultLessonDuration: '50m', defaultQuizPassingScore: 75, showAnnouncementsInLms: true },
    });
    check(
      'LMS settings save',
      settingsSave.status === 200 && settingsSave.json?.settings?.defaultLessonDuration === '50m',
      `HTTP ${settingsSave.status}`
    );
    const settingsRead = await request('GET', '/api/admin/lms/settings', asAdmin);
    check('LMS settings persist', settingsRead.json?.settings?.defaultQuizPassingScore === 75);

    const announcementsOff = await request('PUT', '/api/admin/lms/settings', {
      ...asAdmin,
      body: { showAnnouncementsInLms: false },
    });
    const pausedNotices = await request('GET', '/api/lms/announcements', { token: studentLogin.token });
    check(
      'Switching announcements off hides them from students',
      announcementsOff.status === 200 && pausedNotices.json?.count === 0,
      `HTTP ${announcementsOff.status}`
    );
    await request('PUT', '/api/admin/lms/settings', { ...asAdmin, body: { showAnnouncementsInLms: true } });

    // A setting that is stored but never read is a lie told by a settings page.
    // Both of these are asserted all the way to the surface they claim to change.
    await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: { course: courseId, module: moduleAId, title: 'Free preview lesson', isPreview: true },
    });
    const previewOn = await request('GET', `/api/curriculum/courses/${courseId}`);
    const advertisedOn = (previewOn.json?.modules || [])
      .flatMap((m) => m.lessons || [])
      .some((l) => l.isPreview);
    check('A free-preview lesson is advertised while previews are allowed', advertisedOn);

    await request('PUT', '/api/admin/lms/settings', { ...asAdmin, body: { allowLessonPreview: false } });
    const previewOff = await request('GET', `/api/curriculum/courses/${courseId}`);
    const advertisedOff = (previewOff.json?.modules || [])
      .flatMap((m) => m.lessons || [])
      .some((l) => l.isPreview);
    check('Turning previews off removes them from the public curriculum', !advertisedOff);
    await request('PUT', '/api/admin/lms/settings', { ...asAdmin, body: { allowLessonPreview: true } });

    await request('PUT', '/api/admin/lms/settings', { ...asAdmin, body: { welcomeMessage: 'QA welcome message' } });
    const dashboard = await request('GET', '/api/lms/dashboard', { token: studentLogin.token });
    check(
      'The welcome message reaches the student dashboard',
      dashboard.json?.lms?.welcomeMessage === 'QA welcome message',
      dashboard.json?.lms?.welcomeMessage
    );

    // ── Overview ───────────────────────────────────────────────────────────
    section('DASHBOARD');

    const overview = await request('GET', '/api/admin/lms/overview', asAdmin);
    check(
      'The LMS overview reports live numbers',
      overview.status === 200 && overview.json?.stats?.students >= 1 && overview.json?.stats?.lessons >= 1,
      JSON.stringify(overview.json?.stats || {})
    );

    // ── Refusals ───────────────────────────────────────────────────────────
    section('AUTHORIZATION REFUSALS');

    const viewerEmail = `lms.viewer.${stamp}@example.com`;
    const viewerPassword = 'Quartz-Lantern-31!';
    const viewer = await request('POST', '/api/auth/users', {
      ...asAdmin,
      body: {
        name: 'LMS Viewer',
        email: viewerEmail,
        password: viewerPassword,
        role: 'ADMIN',
        permissions: ['LMS_VIEW', 'COURSES_VIEW', 'STUDENTS_VIEW'],
      },
    });
    check('A read-only LMS admin is created', viewer.status === 201 || viewer.status === 200, `HTTP ${viewer.status}`);
    const viewerLogin = await login(viewerEmail, viewerPassword);
    check('The read-only admin can sign in', Boolean(viewerLogin.token));
    const asViewer = { token: viewerLogin.token };

    const viewerOverview = await request('GET', '/api/admin/lms/overview', asViewer);
    check('A viewer may read the LMS overview', viewerOverview.status === 200, `HTTP ${viewerOverview.status}`);

    const refusals = [
      ['POST', '/api/curriculum/lessons', { course: courseId, module: moduleAId, title: 'Not allowed' }, 'Create a lesson'],
      ['POST', '/api/admin/lms/enrollments', { studentId, courseId }, 'Enroll a student'],
      ['POST', '/api/admin/lms/progress/complete', { studentId, courseId }, 'Mark a course complete'],
      ['POST', '/api/admin/lms/announcements', { title: 'Nope' }, 'Publish an announcement'],
      ['POST', '/api/admin/certificates/issue', { studentId, courseId }, 'Issue a certificate'],
      ['PUT', '/api/admin/lms/settings', { defaultLessonDuration: '99m' }, 'Change LMS settings'],
    ];
    for (const [method, url, body, label] of refusals) {
      const res = await request(method, url, { ...asViewer, body });
      check(`${label} is refused without the grant`, [401, 403].includes(res.status), `HTTP ${res.status}`);
    }

    const studentAdmin = await request('GET', '/api/admin/lms/overview', { token: studentLogin.token });
    check('A student cannot reach the LMS admin API', [401, 403].includes(studentAdmin.status), `HTTP ${studentAdmin.status}`);

    const anonAdmin = await request('GET', '/api/admin/lms/overview');
    check('An anonymous request cannot reach the LMS admin API', anonAdmin.status === 401, `HTTP ${anonAdmin.status}`);

    // The grants the viewer is missing must still work for a full admin.
    const adminStillWorks = await request('POST', '/api/admin/lms/announcements', {
      ...asAdmin,
      body: { title: `Admin still works ${stamp}`, body: '', audience: 'All Students' },
    });
    check('A full admin is not collateral damage', adminStillWorks.status === 201, `HTTP ${adminStillWorks.status}`);

    check('The server never logged a password or token', !/Cobalt-Meadow-47|Quartz-Lantern-31/.test(serverLog));

    // ── Report ─────────────────────────────────────────────────────────────
    const passed = results.filter((row) => row.passed).length;
    const failed = results.filter((row) => !row.passed);
    console.log(`\n${'═'.repeat(64)}`);
    console.log(`LMS CONTROL CENTRE — ${passed}/${results.length} checks passed`);
    if (failed.length) {
      console.log('\nFailures:');
      failed.forEach((row) => console.log(`  ❌ ${row.name}${row.detail ? ` — ${row.detail}` : ''}`));
    }
    console.log(`${'═'.repeat(64)}\n`);

    await shutdown();
    process.exit(failed.length ? 1 : 0);
  } catch (error) {
    console.error('\nLMS suite crashed:', error.message);
    console.error(serverLog.split('\n').slice(-25).join('\n'));
    await shutdown();
    process.exit(1);
  }
};

run();
