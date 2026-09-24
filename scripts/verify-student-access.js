/**
 * Student management + access-control contract test.
 *
 *   npm run verify:students
 *
 * The client's rule: a student may only ever reach what staff assigned. This
 * suite proves it at the API level — not by hiding cards in the browser — by
 * creating a real student, assigning one program, then attacking the other
 * program's endpoints directly (IDOR), plus checking the add/edit/revoke/reset
 * administration flows and that public self-registration stays closed.
 *
 * Runs against a throwaway database.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5205;
const BASE = `http://127.0.0.1:${PORT}`;
const SEED_ADMIN_PASSWORD = 'Admin-Student-Check-2026!z';
const DB_NAME = `aft_studenttest_${Date.now()}`;
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
      JWT_SECRET: 'student_access_secret_long_enough_0000001',
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
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch (error) { /* not up yet */ }
      await sleep(1200);
    }
    check('API boots on a throwaway database', healthy);
    if (!healthy) throw new Error('server never became reachable');

    let adminToken = '';
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: 'admin@americanfuturetech.com', password: SEED_ADMIN_PASSWORD },
      });
      if (res.status === 200 && res.json?.token) { adminToken = res.json.token; break; }
      await sleep(1200);
    }
    check('Admin can sign in', Boolean(adminToken));
    if (!adminToken) throw new Error('could not authenticate as admin');

    // Wait for the background seeder so courses/batches exist.
    let courses = [];
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const res = await request('GET', '/api/courses');
      courses = res.json?.courses || [];
      if (courses.length >= 2) break;
      await sleep(1200);
    }
    check('Seed data has at least two programs', courses.length >= 2, `${courses.length} programs`);

    const courseA = courses[0];
    const courseB = courses[1];

    let options = await request('GET', '/api/students/admin/options', { token: adminToken });
    check(
      'Assignment options expose programs and batches',
      options.status === 200 && (options.json?.courses || []).length >= 2,
      `batches=${(options.json?.batches || []).length}`,
    );

    // The seeder creates batches on its own schedule. Grabbing the first batch
    // immediately left `batch` undefined whenever the courses had landed but the
    // batches had not, so the student was created with batchId=null and the
    // batch-assignment assertion flaked. Wait for one, and fail loudly if the
    // batch seeder is genuinely broken.
    let batch = (options.json?.batches || [])[0];
    for (let attempt = 0; attempt < 30 && !batch; attempt += 1) {
      await sleep(1000);
      options = await request('GET', '/api/students/admin/options', { token: adminToken });
      batch = (options.json?.batches || [])[0];
    }
    check('A batch exists to assign (seeder finished)', Boolean(batch));

    section('1. PUBLIC SELF-REGISTRATION IS CLOSED');

    const selfRegister = await request('POST', '/api/auth/register', {
      body: { name: 'Sneaky Self Signup', email: `sneaky.${Date.now()}@example.com`, password: 'Passw0rd!23' },
    });
    check(
      'Anonymous self-registration is refused',
      selfRegister.status === 403 && selfRegister.json?.code === 'REGISTRATION_CLOSED',
      `status=${selfRegister.status} code=${selfRegister.json?.code}`,
    );

    section('2. ADMIN CREATES A STUDENT WITH ASSIGNMENTS');

    const created = await request('POST', '/api/students/admin', {
      token: adminToken,
      body: {
        name: 'Access QA Student',
        email: `access.qa.${Date.now()}@example.com`,
        phone: '+1 555 0100',
        courseIds: [courseA._id],
        batchId: batch?._id || null,
        personalizedLearning: true,
        targetCareer: 'QA Engineer',
      },
    });
    const student = created.json?.student;
    const credentials = created.json?.credentials;
    check(
      'Student is created with a generated one-time password',
      created.status === 201 && Boolean(student?._id) && Boolean(credentials?.temporaryPassword),
      `status=${created.status}`,
    );
    check(
      'Only the assigned program is attached',
      (student?.courses || []).length === 1 && String(student.courses[0].courseId) === String(courseA._id),
      (student?.courses || []).map((c) => c.title).join(', '),
    );
    check('Personalized learning flag is stored', student?.personalizedLearning === true);
    check(
      'Batch assignment is stored',
      Boolean(student?.batchId) && String(student.batchId) === String(batch?._id),
    );

    const duplicate = await request('POST', '/api/students/admin', {
      token: adminToken,
      body: { name: 'Duplicate', email: credentials?.email },
    });
    check('Duplicate student emails are refused', duplicate.status === 409, `status=${duplicate.status}`);

    section('3. STUDENT LOGIN + ASSIGNED-ONLY LMS');

    const login = await request('POST', '/api/auth/login', {
      body: { email: credentials.email, password: credentials.temporaryPassword },
    });
    const studentToken = login.json?.token;
    check('Student can sign in with the issued credentials', Boolean(studentToken), `status=${login.status}`);

    const myCourses = await request('GET', '/api/lms/my-courses', { token: studentToken });
    const myCourseIds = (myCourses.json?.courses || []).map((c) => String(c._id || c.course?._id));
    check(
      'My Courses shows the assigned program',
      myCourseIds.includes(String(courseA._id)),
      myCourseIds.join(', '),
    );
    check(
      'My Courses hides every unassigned program',
      !myCourseIds.includes(String(courseB._id)),
      `hidden=${courseB.title}`,
    );

    const assignedLearn = await request('GET', `/api/lms/courses/${courseA._id}/learn`, { token: studentToken });
    check('Assigned course curriculum loads for the student', assignedLearn.status === 200, `status=${assignedLearn.status}`);

    section('4. IDOR — DIRECT API ATTACKS (must be 403)');

    const foreignLearn = await request('GET', `/api/lms/courses/${courseB._id}/learn`, { token: studentToken });
    check(
      'Unassigned course curriculum is refused (403)',
      foreignLearn.status === 403 && foreignLearn.json?.code === 'NOT_ENROLLED',
      `status=${foreignLearn.status} code=${foreignLearn.json?.code}`,
    );

    // Pull a real lesson id from the unassigned course to attack lesson routes.
    const Course = require(path.join(__dirname, '..', 'server', 'models', 'Course'));
    const Module = require(path.join(__dirname, '..', 'server', 'models', 'Module'));
    const Lesson = require(path.join(__dirname, '..', 'server', 'models', 'Lesson'));
    const Quiz = require(path.join(__dirname, '..', 'server', 'models', 'Quiz'));
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });

    const foreignLesson = await Lesson.findOne({ course: courseB._id, isPublished: true }).lean();
    const foreignQuiz = await Quiz.findOne({ course: courseB._id, isPublished: true }).lean();
    check('A foreign lesson exists to attack', Boolean(foreignLesson?._id));

    if (foreignLesson) {
      const lessonRead = await request('GET', `/api/lms/lessons/${foreignLesson._id}`, { token: studentToken });
      check(
        'Reading an unassigned lesson is refused (403)',
        lessonRead.status === 403,
        `status=${lessonRead.status}`,
      );

      const lessonComplete = await request('POST', `/api/lms/lessons/${foreignLesson._id}/complete`, {
        token: studentToken,
        body: {},
      });
      check(
        'Marking an unassigned lesson complete is refused (403)',
        lessonComplete.status === 403,
        `status=${lessonComplete.status}`,
      );
    }

    if (foreignQuiz) {
      const quizSubmit = await request('POST', `/api/lms/quizzes/${foreignQuiz._id}/submit`, {
        token: studentToken,
        body: { answers: [] },
      });
      check(
        'Submitting an unassigned quiz is refused (403)',
        quizSubmit.status === 403,
        `status=${quizSubmit.status}`,
      );
    }

    const adminApi = await request('GET', '/api/students/admin', { token: studentToken });
    check('Student cannot reach the admin student directory', adminApi.status === 403, `status=${adminApi.status}`);

    const adminCreate = await request('POST', '/api/students/admin', {
      token: studentToken,
      body: { name: 'Self Made', email: `self.made.${Date.now()}@example.com` },
    });
    check('Student cannot create other student accounts', adminCreate.status === 403, `status=${adminCreate.status}`);

    const otherDetail = await request('GET', `/api/students/admin/${student._id}`, { token: studentToken });
    check('Student cannot read the admin student profile', otherDetail.status === 403, `status=${otherDetail.status}`);

    const noToken = await request('GET', `/api/lms/courses/${courseA._id}/learn`);
    check('Anonymous LMS access is refused (401)', noToken.status === 401, `status=${noToken.status}`);

    section('5. ADMIN DIRECTORY (search + pagination)');

    const directory = await request('GET', '/api/students/admin?limit=10&page=1', { token: adminToken });
    check(
      'Admin directory lists the created student',
      directory.status === 200 && (directory.json?.students || []).some((s) => String(s._id) === String(student._id)),
      `total=${directory.json?.pagination?.total}`,
    );

    const searchResult = await request('GET', `/api/students/admin?search=${encodeURIComponent('Access QA Student')}`, {
      token: adminToken,
    });
    check(
      'Searching by name finds the student',
      (searchResult.json?.students || []).some((s) => String(s._id) === String(student._id)),
      `count=${searchResult.json?.count}`,
    );

    const courseFiltered = await request('GET', `/api/students/admin?courseId=${courseB._id}`, { token: adminToken });
    check(
      'Filtering by a program excludes students not enrolled in it',
      !(courseFiltered.json?.students || []).some((s) => String(s._id) === String(student._id)),
      `count=${courseFiltered.json?.count}`,
    );

    section('6. REVOKE, DEACTIVATE, RESET');

    const detail = await request('GET', `/api/students/admin/${student._id}`, { token: adminToken });
    check(
      'Student detail returns enrollments, payments and certificates',
      detail.status === 200 &&
        Array.isArray(detail.json?.detail?.enrollments) &&
        Array.isArray(detail.json?.detail?.payments) &&
        Array.isArray(detail.json?.detail?.certificates),
    );

    const revoked = await request('DELETE', `/api/students/admin/${student._id}/access`, { token: adminToken });
    check('Revoking access succeeds', revoked.status === 200, revoked.json?.message);

    const afterRevokeLearn = await request('GET', `/api/lms/courses/${courseA._id}/learn`, { token: studentToken });
    check(
      'Revoked access immediately blocks the previously allowed course (403)',
      afterRevokeLearn.status === 403,
      `status=${afterRevokeLearn.status}`,
    );
    const afterRevokeList = await request('GET', '/api/lms/my-courses', { token: studentToken });
    check(
      'Revoked access empties My Courses',
      (afterRevokeList.json?.courses || []).length === 0,
      `count=${(afterRevokeList.json?.courses || []).length}`,
    );

    // Grant access again through the edit flow, then confirm it comes back.
    const regranted = await request('PUT', `/api/students/admin/${student._id}`, {
      token: adminToken,
      body: { courseIds: [courseA._id, courseB._id] },
    });
    check(
      'Editing assignments grants a second program',
      regranted.status === 200 && (regranted.json?.student?.courses || []).length === 2,
      (regranted.json?.student?.courses || []).map((c) => c.title).join(', '),
    );
    const regrantedLearn = await request('GET', `/api/lms/courses/${courseB._id}/learn`, { token: studentToken });
    check('The newly assigned program opens immediately', regrantedLearn.status === 200, `status=${regrantedLearn.status}`);

    const reset = await request('POST', `/api/students/admin/${student._id}/reset-access`, {
      token: adminToken,
      body: {},
    });
    const newPassword = reset.json?.credentials?.temporaryPassword;
    check('Reset access issues a new password', Boolean(newPassword));

    const oldLogin = await request('POST', '/api/auth/login', {
      body: { email: credentials.email, password: credentials.temporaryPassword },
    });
    check('The old password stops working', oldLogin.status >= 400, `status=${oldLogin.status}`);

    const newLogin = await request('POST', '/api/auth/login', {
      body: { email: credentials.email, password: newPassword },
    });
    check('The new password works', newLogin.status === 200 && Boolean(newLogin.json?.token), `status=${newLogin.status}`);

    await request('PUT', `/api/students/admin/${student._id}`, {
      token: adminToken,
      body: { isActive: false },
    });
    const deactivatedLogin = await request('POST', '/api/auth/login', {
      body: { email: credentials.email, password: newPassword },
    });
    check(
      'A deactivated student cannot log in',
      deactivatedLogin.status >= 400,
      `status=${deactivatedLogin.status}`,
    );

    section('7. DELETE ACCOUNT — no orphaned learning state');

    // Deleting the user used to leave the student's Enrollment and Progress rows
    // behind, where they stayed counted in completion reporting forever.
    const Enrollment = require(path.join(__dirname, '..', 'server', 'models', 'Enrollment'));
    const Progress = require(path.join(__dirname, '..', 'server', 'models', 'Progress'));

    await request('PUT', `/api/students/admin/${student._id}`, {
      token: adminToken,
      body: { courseIds: [courseA._id], isActive: true },
    });
    await Progress.findOneAndUpdate(
      { student: student._id, course: courseA._id },
      { $set: { progressPercent: 10 } },
      { upsert: true },
    );

    const enrollmentsBefore = await Enrollment.countDocuments({ student: student._id });
    const progressBefore = await Progress.countDocuments({ student: student._id });
    check(
      'Learning state exists before the account is deleted',
      enrollmentsBefore > 0 && progressBefore > 0,
      `${enrollmentsBefore} enrollment(s), ${progressBefore} progress row(s)`,
    );

    const deleted = await request('DELETE', `/api/auth/users/${student._id}`, { token: adminToken });
    check('SuperAdmin can delete a student account', deleted.status === 200, `status=${deleted.status}`);
    check(
      'The response reports what was cleaned up',
      typeof deleted.json?.removedLearningState?.enrollments === 'number',
      JSON.stringify(deleted.json?.removedLearningState),
    );

    const enrollmentsAfter = await Enrollment.countDocuments({ student: student._id });
    const progressAfter = await Progress.countDocuments({ student: student._id });
    check('Deleting the account removes its enrollments', enrollmentsAfter === 0, `${enrollmentsBefore} → ${enrollmentsAfter}`);
    check('Deleting the account removes its progress rows', progressAfter === 0, `${progressBefore} → ${progressAfter}`);

    await mongoose.disconnect();
  } catch (error) {
    check('Suite ran to completion', false, error.message);
  } finally {
    await stopServer();
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  console.log(`\n${'═'.repeat(64)}`);
  console.log(`RESULT: ${passed}/${results.length} checks passed${failed.length ? ` — ${failed.length} FAILED` : ' ✅'}`);
  failed.forEach((f) => console.log(`   ❌ ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
  console.log('═'.repeat(64));
  if (failed.length) {
    console.log('\nServer log tail:');
    console.log(serverLog.split('\n').slice(-25).join('\n'));
  }
  process.exit(failed.length ? 1 : 0);
};

run();
