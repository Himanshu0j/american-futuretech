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

    // A leak does not have to be the exact address: any email-shaped key would
    // publish it the moment the schema grows a field.
    const publicText = JSON.stringify(verifyPublic.json || {});
    check(
      'The public registry payload carries no email field and no address',
      !/"email"/i.test(publicText) && !/@/.test(publicText),
      publicText.slice(0, 110)
    );

    // Proof the response is an allow-list, not the database document: the schema
    // also holds the revoking staff member and an internal reason note.
    const PUBLIC_COURSE_KEYS = ['title', 'duration', 'category'];
    const PUBLIC_STUDENT_KEYS = ['name', 'avatar'];
    const PUBLIC_CERT_KEYS = [
      'certificateId', 'studentName', 'student', 'courseTitle', 'course', 'grade',
      'accreditationBody', 'issueDate', 'verificationUrl', 'revokedAt', 'isSample', 'status',
    ];
    const certKeys = Object.keys(verifyPublic.json?.certificate || {});
    check(
      'The public certificate is an allow-list of verification fields only',
      certKeys.length > 0 && certKeys.every((key) => PUBLIC_CERT_KEYS.includes(key))
        && Object.keys(verifyPublic.json?.certificate?.student || {}).every((key) => PUBLIC_STUDENT_KEYS.includes(key))
        && Object.keys(verifyPublic.json?.certificate?.course || {}).every((key) => PUBLIC_COURSE_KEYS.includes(key)),
      certKeys.join(', ')
    );
    check(
      'The public registry reports a machine-readable status',
      verifyPublic.json?.status === 'valid' && verifyPublic.json?.certificate?.status === 'valid',
      String(verifyPublic.json?.status)
    );

    const adminRegister = await request('GET', '/api/admin/certificates', asAdmin);
    const adminRow = (adminRegister.json?.certificates || []).find((row) => row.certificateId === certificateId) || {};
    check(
      'The admin register still shows the holder email administrators work with',
      adminRow.studentEmail === studentEmail,
      adminRow.studentEmail || 'missing'
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

    // Revocation writes a staff identity and a reason onto the document. The
    // public page must say the credential was withdrawn, never who withdrew it
    // or the internal note explaining why.
    const revokedText = JSON.stringify(verifyRevoked.json || {});
    check(
      'A withdrawal publishes neither the staff member nor the internal reason',
      !/revokedBy|revokedReason/i.test(revokedText) && !revokedText.includes('Issued in error during QA'),
      'staff identity and reason note withheld'
    );
    check(
      'A still-valid certificate keeps the same allow-list after revocation',
      Object.keys(verifyRevoked.json?.certificate || {}).every((key) => PUBLIC_CERT_KEYS.includes(key)),
      Object.keys(verifyRevoked.json?.certificate || {}).join(', ')
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

    // ══════════════════════════════════════════════════════════════════════
    section('CONTENT & MEDIA DISCIPLINE');

    // What an admin actually pastes, and what it must become. A raw watch URL
    // renders as a broken iframe, so the server normalises it on the way in.
    const mediaCases = [
      ['https://www.youtube.com/watch?v=ZwAd3sJc0m0', 'https://www.youtube.com/embed/ZwAd3sJc0m0', 'A YouTube watch URL'],
      ['https://youtu.be/ZwAd3sJc0m0?t=30s', 'https://www.youtube.com/embed/ZwAd3sJc0m0', 'A YouTube short URL'],
      ['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871', 'A Vimeo URL'],
    ];
    const mediaLessonIds = [];
    for (const [pasted, expected, label] of mediaCases) {
      const created = await request('POST', '/api/curriculum/lessons', {
        ...asAdmin,
        body: { course: courseId, module: moduleAId, title: `${label} lesson`, videoUrl: pasted },
      });
      const stored = created.json?.lesson?.videoUrl;
      check(
        `${label} is stored as a playable embed`,
        [200, 201].includes(created.status) && stored === expected,
        stored ? `${pasted} → ${stored}` : `HTTP ${created.status}`
      );
      if (created.json?.lesson?._id) mediaLessonIds.push(created.json.lesson._id);
    }

    const insecureVideo = await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: { course: courseId, module: moduleAId, title: 'Insecure video lesson', videoUrl: 'http://www.youtube.com/watch?v=ZwAd3sJc0m0' },
    });
    check('An insecure http video link is refused', insecureVideo.status === 400, `HTTP ${insecureVideo.status}`);

    const junkVideo = await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: { course: courseId, module: moduleAId, title: 'Junk video lesson', videoUrl: 'not a url at all' },
    });
    check('A video link that is not a URL is refused', junkVideo.status === 400, `HTTP ${junkVideo.status}`);

    // Dummy "Lab Resources" used to appear on every lesson that had none.
    const bareLesson = await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: { course: courseId, module: moduleAId, title: 'Lesson with no material' },
    });
    check(
      'A lesson with no material stores an empty list, not placeholders',
      Array.isArray(bareLesson.json?.lesson?.resources) && bareLesson.json.lesson.resources.length === 0,
      JSON.stringify(bareLesson.json?.lesson?.resources || null)
    );
    const bareLessonId = bareLesson.json?.lesson?._id;

    const withMaterial = await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: {
        course: courseId,
        module: moduleAId,
        title: 'Lesson with real material',
        resources: [{ title: 'Lab worksheet', url: 'https://example.com/lab-worksheet.pdf' }],
      },
    });
    check(
      'A real resource link is preserved',
      (withMaterial.json?.lesson?.resources || [])[0]?.url === 'https://example.com/lab-worksheet.pdf',
      JSON.stringify(withMaterial.json?.lesson?.resources || [])
    );

    const junkResources = await request('POST', '/api/curriculum/lessons', {
      ...asAdmin,
      body: {
        course: courseId,
        module: moduleAId,
        title: 'Lesson with junk material',
        resources: [
          { title: 'Script link', url: 'javascript:alert(1)' },
          { title: 'Empty link', url: '' },
          { title: 'Also empty', url: '   ' },
        ],
      },
    });
    check(
      'Unsafe and half-filled resources are dropped, never stored',
      (junkResources.json?.lesson?.resources || []).length === 0,
      JSON.stringify(junkResources.json?.lesson?.resources || [])
    );

    // ══════════════════════════════════════════════════════════════════════
    section('STUDENT JOURNEY');

    // The enrolment section deliberately suspended this student, which is the
    // staff off-switch. Flipping it back must restore access — otherwise a
    // suspension would be a one-way door.
    const reactivate = await request('PUT', `/api/admin/lms/enrollments/${enroll.json?.enrollment?._id}`, {
      ...asAdmin,
      body: { status: 'Active' },
    });
    check(
      'Re-activating an enrolment restores the student\'s access',
      reactivate.status === 200 && reactivate.json?.enrollment?.status === 'Active',
      `HTTP ${reactivate.status}`
    );

    const learn = await request('GET', `/api/lms/courses/${courseId}/learn`, { token: studentLogin.token });
    const learnModules = learn.json?.curriculum || [];
    check(
      'The enrolled student can open the course an admin gave them',
      learn.status === 200 && learnModules.length > 0,
      `HTTP ${learn.status}, ${learnModules.length} module(s)`
    );
    const firstLesson = learnModules.flatMap((m) => m.lessons || [])[0];
    const totalPublished = learn.json?.totalLessons || 0;
    check('The player is told how many lessons the course has', totalPublished > 0, `${totalPublished} lessons`);
    check(
      'A media lesson reaches the student with its embed intact',
      learnModules.flatMap((m) => m.lessons || []).some((l) => l.videoUrl === 'https://www.youtube.com/embed/ZwAd3sJc0m0'),
      'embed present in the student payload'
    );

    const lessonDetails = await request('GET', `/api/lms/lessons/${firstLesson?._id}`, { token: studentLogin.token });
    check(
      'Opening a lesson returns that lesson, not a catalogue',
      lessonDetails.status === 200 && lessonDetails.json?.lesson?._id === firstLesson?._id,
      `HTTP ${lessonDetails.status}`
    );

    const lessonComplete = await request('POST', `/api/lms/lessons/${firstLesson?._id}/complete`, { token: studentLogin.token });
    check('The student can mark a lesson complete', lessonComplete.status === 200, `HTTP ${lessonComplete.status}`);
    const expectedPercent = Math.round((1 / Math.max(totalPublished, 1)) * 100);
    check(
      'The completion percentage is calculated, not guessed',
      lessonComplete.json?.progressPercent === expectedPercent,
      `${lessonComplete.json?.progressPercent}% (expected ${expectedPercent}%)`
    );

    const reLearn = await request('GET', `/api/lms/courses/${courseId}/learn`, { token: studentLogin.token });
    check(
      'The completed lesson is still complete after a refresh',
      (reLearn.json?.progress?.completedLessons || []).includes(String(firstLesson?._id))
        && reLearn.json?.progress?.progressPercent === expectedPercent,
      `${reLearn.json?.progress?.progressPercent}%`
    );
    check(
      'The lesson is flagged complete in the curriculum the player renders',
      (reLearn.json?.curriculum || []).flatMap((m) => m.lessons || []).some((l) => l._id === firstLesson?._id && l.isCompleted === true),
      'isCompleted flag set'
    );

    const studentCourses = await request('GET', '/api/lms/my-courses', { token: studentLogin.token });
    check(
      'The assigned course appears in the student list with its progress',
      (studentCourses.json?.courses || []).some(
        (row) => String(row.course?._id) === String(courseId) && row.progressPercent === expectedPercent
      ),
      `${studentCourses.json?.courses?.length ?? 0} course(s)`
    );

    // ── Quiz grading, both outcomes ────────────────────────────────────────
    const studentQuiz = await request('POST', '/api/curriculum/quizzes', {
      ...asAdmin,
      body: {
        course: courseId,
        module: moduleAId,
        title: `Journey quiz ${stamp}`,
        timeLimitMinutes: 10,
        passingScorePercent: 60,
        questions: [
          { questionText: 'What is 5 + 5?', options: ['8', '10', '11'], correctOptionIndex: 1 },
          { questionText: 'What is 3 × 3?', options: ['9', '6', '12'], correctOptionIndex: 0 },
        ],
      },
    });
    const journeyQuiz = studentQuiz.json?.quiz;
    check('A graded quiz is published for the journey', Boolean(journeyQuiz?._id), `HTTP ${studentQuiz.status}`);

    const wrong = await request('POST', `/api/lms/quizzes/${journeyQuiz?._id}/submit`, {
      token: studentLogin.token,
      body: {
        answers: journeyQuiz?.questions?.map((q) => ({ questionId: q._id, selectedOptionIndex: 2 })) || [],
        timeSpentSeconds: 42,
      },
    });
    check(
      'Every wrong answer scores zero and does not pass',
      wrong.status === 200 && wrong.json?.scorePercent === 0 && wrong.json?.passed === false,
      `HTTP ${wrong.status} score=${wrong.json?.scorePercent} passed=${wrong.json?.passed}`
    );

    const right = await request('POST', `/api/lms/quizzes/${journeyQuiz?._id}/submit`, {
      token: studentLogin.token,
      body: {
        answers: (journeyQuiz?.questions || []).map((q) => ({ questionId: q._id, selectedOptionIndex: q.correctOptionIndex })),
        timeSpentSeconds: 55,
      },
    });
    check(
      'Every correct answer scores full marks and passes',
      right.status === 200 && right.json?.scorePercent === 100 && right.json?.passed === true,
      `score=${right.json?.scorePercent} passed=${right.json?.passed}`
    );
    // A quiz UI that submits "1" instead of 1 used to silently score zero.
    const stringAnswers = await request('POST', `/api/lms/quizzes/${journeyQuiz?._id}/submit`, {
      token: studentLogin.token,
      body: {
        answers: (journeyQuiz?.questions || []).map((q) => ({ questionId: q._id, selectedOptionIndex: String(q.correctOptionIndex) })),
        timeSpentSeconds: 30,
      },
    });
    check(
      'A numeric answer sent as a string is still graded, not silently failed',
      stringAnswers.json?.passed === true,
      `score=${stringAnswers.json?.scorePercent}`
    );

    const emptyAnswers = await request('POST', `/api/lms/quizzes/${journeyQuiz?._id}/submit`, {
      token: studentLogin.token,
      body: { answers: [], timeSpentSeconds: 5 },
    });
    check(
      'Submitting nothing scores zero instead of throwing',
      emptyAnswers.status === 200 && emptyAnswers.json?.passed === false && emptyAnswers.json?.scorePercent === 0,
      `HTTP ${emptyAnswers.status} score=${emptyAnswers.json?.scorePercent}`
    );

    // Every submission must be on the record — an admin reviewing pass rates
    // needs all four attempts, not just the latest per student.
    const attemptReview = await request('GET', `/api/admin/lms/quiz-attempts?courseId=${courseId}`, asAdmin);
    const gradedRows = (attemptReview.json?.attempts || []).filter(
      (row) => String(row.quizId) === String(journeyQuiz?._id)
    );
    check(
      'Every graded attempt is stored for the admin to review',
      gradedRows.length === 4 && gradedRows.filter((row) => row.passed).length === 2,
      `${gradedRows.length} attempt(s) stored, `
        + `${gradedRows.filter((row) => row.passed).length} passed, `
        + `pass rate ${attemptReview.json?.passRatePercent}%`
    );
    check(
      'The review list names the quiz the student sat and who sat it',
      gradedRows.every((row) => row.quizTitle === `Journey quiz ${stamp}` && row.studentEmail === studentEmail),
      gradedRows[0]?.quizTitle || 'no rows'
    );
    check(
      'The attempts carry the marks the student actually scored',
      gradedRows.map((row) => row.scorePercent).sort((a, b) => a - b).join(',') === '0,0,100,100',
      gradedRows.map((row) => row.scorePercent).join(',')
    );

    // ══════════════════════════════════════════════════════════════════════
    section('STUDENT ISOLATION');

    const outsiderEmail = `lms.outsider.${stamp}@example.com`;
    const outsiderPassword = 'Bramble-Harbor-58!';
    const outsider = await request('POST', '/api/students/admin', {
      ...asAdmin,
      body: { name: `LMS Outsider ${stamp}`, email: outsiderEmail, password: outsiderPassword, phone: '+1 555 0201' },
    });
    check('A second student account exists for the isolation checks', outsider.status === 201, `HTTP ${outsider.status}`);
    const outsiderLogin = await login(outsiderEmail, outsiderPassword);
    check('The unenrolled student can sign in', Boolean(outsiderLogin.token), `HTTP ${outsiderLogin.status}`);
    const asOutsider = { token: outsiderLogin.token };

    const outsiderLearn = await request('GET', `/api/lms/courses/${courseId}/learn`, asOutsider);
    check(
      'A student who was never enrolled cannot open the course',
      outsiderLearn.status === 403 && outsiderLearn.json?.code === 'NOT_ENROLLED',
      `HTTP ${outsiderLearn.status} ${outsiderLearn.json?.code || ''}`
    );

    const outsiderLesson = await request('GET', `/api/lms/lessons/${firstLesson?._id}`, asOutsider);
    check(
      'A student cannot read another cohort\'s lesson by guessing its id',
      outsiderLesson.status === 403,
      `HTTP ${outsiderLesson.status}`
    );

    const outsiderComplete = await request('POST', `/api/lms/lessons/${firstLesson?._id}/complete`, asOutsider);
    check('A student cannot write progress into a course they were not given', outsiderComplete.status === 403, `HTTP ${outsiderComplete.status}`);

    const outsiderQuizSubmit = await request('POST', `/api/lms/quizzes/${journeyQuiz?._id}/submit`, {
      ...asOutsider,
      body: { answers: [], timeSpentSeconds: 1 },
    });
    check('A student cannot attempt a quiz from an unassigned course', outsiderQuizSubmit.status === 403, `HTTP ${outsiderQuizSubmit.status}`);

    const outsiderList = await request('GET', '/api/lms/my-courses', asOutsider);
    check(
      'The course never appears in another student\'s list',
      !(outsiderList.json?.courses || []).some((row) => String(row.course?._id) === String(courseId)),
      `${outsiderList.json?.courses?.length ?? 0} course(s) visible`
    );

    const outsiderAuthoring = await request('POST', '/api/curriculum/lessons', {
      ...asOutsider,
      body: { course: courseId, module: moduleAId, title: 'Student-authored lesson' },
    });
    check('A student cannot author LMS content', [401, 403].includes(outsiderAuthoring.status), `HTTP ${outsiderAuthoring.status}`);

    const outsiderIssue = await request('POST', '/api/admin/certificates/issue', {
      ...asOutsider,
      body: { studentId, courseId },
    });
    check('A student cannot issue themselves a certificate', [401, 403].includes(outsiderIssue.status), `HTTP ${outsiderIssue.status}`);

    const outsiderAdminPage = await request('GET', '/api/admin/lms/enrollments', asOutsider);
    check('A student cannot list every enrolment', [401, 403].includes(outsiderAdminPage.status), `HTTP ${outsiderAdminPage.status}`);

    // The bare lesson must stay honest for the student too.
    if (bareLessonId) {
      const bareForStudent = await request('GET', `/api/lms/lessons/${bareLessonId}`, { token: studentLogin.token });
      check(
        'A lesson with no material reports an empty list to the player',
        bareForStudent.status === 200 && (bareForStudent.json?.lesson?.resources || []).length === 0,
        JSON.stringify(bareForStudent.json?.lesson?.resources || null)
      );
    }

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
