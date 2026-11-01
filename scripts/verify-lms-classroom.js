/**
 * LMS classroom regression — course → batch → class, plus the access rules that
 * keep one batch out of another.
 *
 *   npm run verify:classroom
 *
 * Boots a real API against a throwaway database and asserts:
 *   1. admin can create a course, two batches and their classes;
 *   2. a student enrolled in Batch A receives Batch A's classes only;
 *   3. a direct request for Batch B's class is refused with 403;
 *   4. a draft class never appears;
 *   5. the live meeting link is withheld until the join window opens;
 *   6. a recording appears only after the class has ended;
 *   7. suspending the enrollment removes access immediately;
 *   8. a batch holding students/classes cannot be deleted (409, archive instead);
 *   9. a student cannot call the admin authoring endpoints.
 */

const path = require('path');
const { spawn } = require('child_process');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const mongoose = require('mongoose');

const PORT = 5621;
const BASE = `http://127.0.0.1:${PORT}`;
const DB_NAME = `aft_classroom_${Date.now()}`;
// No URI by default: the server boots its own in-memory MongoDB, so this suite
// never touches the developer's real database and needs no credentials.
const MONGO_URI = String(process.env.VERIFY_MONGO_URI || '').trim();

const ADMIN_EMAIL = 'admin@americanfuturetech.com';
const ADMIN_PASSWORD = 'Classroom-QA-2026!x9';
const STUDENT_PASSWORD = 'Student-QA-2026!x9';

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

const pad = (value) => String(value).padStart(2, '0');
const dateOnly = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const run = async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI, // deliberately empty unless VERIFY_MONGO_URI is set
      NODE_ENV: 'production',
      SEED_ON_BOOT: 'true',
      SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
      JWT_SECRET: 'classroom_qa_secret_long_enough_00000001',
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
    // An explicit URI is dropped; the in-memory engine disappears with the
    // server process, so there is nothing to clean up (and no real DB to touch).
    if (!MONGO_URI) return;
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch (error) {
      console.log(`  (cleanup note: ${error.message})`);
    }
  };

  try {
    console.log(`\nBooting API on port ${PORT} against ${MONGO_URI || DB_NAME + ' (in-memory)'}`);

    let healthy = false;
    for (let attempt = 0; attempt < 75; attempt += 1) {
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) { healthy = true; break; }
      } catch {
        /* still booting */
      }
      await sleep(2000);
    }
    check('API boots against a throwaway database', healthy);
    if (!healthy) throw new Error(`server never became reachable\n${serverLog.slice(-2000)}`);

    const login = async (email, password) => {
      const res = await request('POST', '/api/auth/login', { body: { email, password } });
      return {
        token: res.json?.token || '',
        id: res.json?.user?._id || res.json?.user?.id || '',
        status: res.status,
        json: res.json,
      };
    };

    let admin = { token: '' };
    for (let attempt = 0; attempt < 30; attempt += 1) {
      admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      if (admin.token) break;
      await sleep(1200);
    }
    check('SUPERADMIN signs in', Boolean(admin.token));
    if (!admin.token) throw new Error(`could not authenticate as superadmin\n${serverLog.slice(-2000)}`);
    const asAdmin = { token: admin.token };

    const stamp = Date.now();
    const today = new Date();
    const todayStr = dateOnly(today);
    const tomorrowStr = dateOnly(new Date(today.getTime() + 24 * 60 * 60 * 1000));
    const yesterdayStr = dateOnly(new Date(today.getTime() - 24 * 60 * 60 * 1000));

    // ── Course + two batches ──────────────────────────────────────────────
    section('COURSE → BATCHES');

    const courseRes = await request('POST', '/api/courses', {
      ...asAdmin,
      body: {
        title: `Classroom QA ${stamp}`,
        category: 'Artificial Intelligence & Analytics',
        duration: '3 Months',
        description: 'throwaway course for the classroom suite',
      },
    });
    const courseId = courseRes.json?.course?._id;
    check('Course is created', courseRes.status === 201 && Boolean(courseId), `HTTP ${courseRes.status}`);

    const batchARes = await request('POST', '/api/admin/lms/batches', {
      ...asAdmin,
      body: {
        courseId,
        name: 'Batch 7–8 AM',
        batchCode: `QA-A-${stamp}`,
        startDate: todayStr,
        days: ['Mon', 'Wed'],
        startTime: '07:00',
        endTime: '08:00',
        timezone: 'EST (UTC-5)',
        instructor: 'QA Instructor A',
        meetingPlatform: 'Zoom',
        meetingLink: 'https://zoom.us/j/1111111111',
        maxCapacity: 20,
      },
    });
    const batchBRes = await request('POST', '/api/admin/lms/batches', {
      ...asAdmin,
      body: {
        courseId,
        name: 'Batch 8–9 PM',
        batchCode: `QA-B-${stamp}`,
        startDate: todayStr,
        days: ['Tue', 'Thu'],
        startTime: '20:00',
        endTime: '21:00',
        instructor: 'QA Instructor B',
        maxCapacity: 20,
      },
    });
    const batchA = batchARes.json?.batch;
    const batchB = batchBRes.json?.batch;
    check('Batch A is created', batchARes.status === 201 && Boolean(batchA?._id), `HTTP ${batchARes.status}`);
    check('Batch B is created', batchBRes.status === 201 && Boolean(batchB?._id), `HTTP ${batchBRes.status}`);
    check(
      'The structured schedule is mirrored into the public timing line',
      String(batchA?.timing || '').includes('07:00') && String(batchA?.timing || '').includes('Mon'),
      batchA?.timing
    );
    if (!batchA?._id || !batchB?._id) throw new Error('batches were not created');

    const badLink = await request('POST', '/api/admin/lms/batches', {
      ...asAdmin,
      body: { courseId, batchCode: `QA-X-${stamp}`, startDate: todayStr, meetingLink: 'javascript:alert(1)' },
    });
    check('A non-http meeting link is refused', badLink.status === 400, `HTTP ${badLink.status}`);

    // ── Classes ───────────────────────────────────────────────────────────
    section('CLASSES');

    const liveClassRes = await request('POST', '/api/admin/lms/classes', {
      ...asAdmin,
      body: {
        batchId: batchA._id,
        title: 'Live session for Batch A',
        classDate: todayStr,
        // A full-day window keeps this assertion stable whenever the suite runs.
        startTime: '00:00',
        endTime: '23:59',
        status: 'Published',
        meetingPlatform: 'Zoom',
        meetingUrl: 'https://zoom.us/j/2222222222',
        materials: [{ title: 'Session slides', url: 'https://example.com/slides.pdf', fileType: 'PDF' }],
      },
    });
    const liveClass = liveClassRes.json?.class;
    check('Published class is created for Batch A', liveClassRes.status === 201 && Boolean(liveClass?._id), `HTTP ${liveClassRes.status}`);

    const otherBatchClassRes = await request('POST', '/api/admin/lms/classes', {
      ...asAdmin,
      body: {
        batchId: batchB._id,
        title: 'Live session for Batch B',
        classDate: todayStr,
        startTime: '00:00',
        endTime: '23:59',
        status: 'Published',
        meetingUrl: 'https://zoom.us/j/3333333333',
      },
    });
    const otherBatchClass = otherBatchClassRes.json?.class;
    check('Published class is created for Batch B', otherBatchClassRes.status === 201 && Boolean(otherBatchClass?._id), `HTTP ${otherBatchClassRes.status}`);

    const draftClassRes = await request('POST', '/api/admin/lms/classes', {
      ...asAdmin,
      body: { batchId: batchA._id, title: 'Unpublished draft class', classDate: todayStr, status: 'Draft' },
    });
    const draftClass = draftClassRes.json?.class;

    const futureClassRes = await request('POST', '/api/admin/lms/classes', {
      ...asAdmin,
      body: {
        batchId: batchA._id,
        title: 'Tomorrow class',
        classDate: tomorrowStr,
        startTime: '10:00',
        endTime: '11:00',
        status: 'Published',
        meetingUrl: 'https://zoom.us/j/4444444444',
      },
    });
    const futureClass = futureClassRes.json?.class;

    const recordedClassRes = await request('POST', '/api/admin/lms/classes', {
      ...asAdmin,
      body: {
        batchId: batchA._id,
        title: 'Recorded session',
        classDate: yesterdayStr,
        startTime: '10:00',
        endTime: '11:00',
        status: 'Completed',
        recordingUrl: 'https://example.com/recording.mp4',
      },
    });
    const recordedClass = recordedClassRes.json?.class;
    check('Draft and recorded classes are created', Boolean(draftClass?._id && futureClass?._id && recordedClass?._id));

    // ── Student + enrollment ──────────────────────────────────────────────
    section('STUDENT ENROLLMENT');

    const studentEmail = `classroom.qa.${stamp}@example.com`;
    const studentRes = await request('POST', '/api/students/admin', {
      ...asAdmin,
      body: {
        name: `Classroom QA ${stamp}`,
        email: studentEmail,
        password: STUDENT_PASSWORD,
        courseIds: [courseId],
        batchId: batchA._id,
        isActive: true,
      },
    });
    check('Student account is created in Batch A', studentRes.status === 201, `HTTP ${studentRes.status}`);

    const studentLogin = await login(studentEmail, STUDENT_PASSWORD);
    check('Student can sign in', Boolean(studentLogin.token), `HTTP ${studentLogin.status}`);
    const asStudent = { token: studentLogin.token };
    if (!asStudent.token) throw new Error('could not authenticate as student');

    const enrollmentRes = await request('GET', `/api/admin/lms/enrollments?courseId=${courseId}`, asAdmin);
    const enrollment = (enrollmentRes.json?.enrollments || []).find(
      (row) => String(row.batch?._id || row.batch) === String(batchA._id)
    );
    check('The enrollment is linked to Batch A', Boolean(enrollment?._id));

    // ── Student classroom access ──────────────────────────────────────────
    section('STUDENT CLASSROOM');

    const myClasses = await request('GET', '/api/lms/classes', asStudent);
    const list = myClasses.json?.classes || [];
    const ids = list.map((row) => String(row._id));
    check('Student receives their Batch A classes', myClasses.status === 200 && ids.includes(String(liveClass._id)), `HTTP ${myClasses.status}, ${list.length} class(es)`);
    check('Batch B classes are absent from the list', !ids.includes(String(otherBatchClass._id)));
    check('Draft classes never leave the server', !ids.includes(String(draftClass._id)));

    const liveRow = list.find((row) => String(row._id) === String(liveClass._id));
    check('The live class is joinable inside its window', liveRow?.canJoin === true && Boolean(liveRow?.joinUrl), `canJoin=${liveRow?.canJoin}`);
    check('Materials are delivered with the published class', liveRow?.materials?.length === 1);

    const futureRow = list.find((row) => String(row._id) === String(futureClass._id));
    check(
      'A future class withholds its meeting link',
      Boolean(futureRow) && futureRow.canJoin === false && futureRow.joinUrl === '',
      `joinUrl="${futureRow?.joinUrl}"`
    );

    const recordedRow = list.find((row) => String(row._id) === String(recordedClass._id));
    check(
      'A completed class exposes its recording',
      Boolean(recordedRow?.recordingUrl),
      recordedRow?.recordingUrl || 'missing'
    );

    const crossBatch = await request('GET', `/api/lms/classes/${otherBatchClass._id}`, asStudent);
    check('Direct access to another batch class is refused', crossBatch.status === 403, `HTTP ${crossBatch.status}`);

    const draftRead = await request('GET', `/api/lms/classes/${draftClass._id}`, asStudent);
    check('A draft class is not readable by id', draftRead.status === 404, `HTTP ${draftRead.status}`);

    const anonymous = await request('GET', '/api/lms/classes');
    check('Anonymous classroom read is refused', anonymous.status === 401, `HTTP ${anonymous.status}`);

    const studentWrite = await request('POST', '/api/admin/lms/classes', {
      ...asStudent,
      body: { batchId: batchA._id, title: 'Student attempt', classDate: todayStr },
    });
    check('A student cannot author a class', studentWrite.status === 403, `HTTP ${studentWrite.status}`);

    // ── Suspension ────────────────────────────────────────────────────────
    section('ACCESS REVOCATION');

    if (enrollment?._id) {
      const suspend = await request('PUT', `/api/admin/lms/enrollments/${enrollment._id}`, {
        ...asAdmin,
        body: { status: 'Suspended' },
      });
      check('Admin can suspend the enrollment', suspend.status === 200, `HTTP ${suspend.status}`);

      const afterSuspend = await request('GET', '/api/lms/classes', asStudent);
      check(
        'Suspended enrollment receives no classes',
        afterSuspend.status === 200 && (afterSuspend.json?.classes || []).length === 0,
        `${(afterSuspend.json?.classes || []).length} class(es)`
      );

      const stillDirect = await request('GET', `/api/lms/classes/${liveClass._id}`, asStudent);
      check('Suspended enrollment cannot open the class by id', stillDirect.status === 403, `HTTP ${stillDirect.status}`);

      await request('PUT', `/api/admin/lms/enrollments/${enrollment._id}`, {
        ...asAdmin,
        body: { status: 'Active' },
      });
    }

    // ── Batch assessments: quizzes + assignments ─────────────────────────
    section('BATCH ASSESSMENTS');

    const quizRes = await request('POST', `/api/admin/lms/batches/${batchA._id}/quizzes`, {
      ...asAdmin,
      body: {
        title: `Batch A quiz ${stamp}`,
        description: 'Grading and isolation check',
        passingScorePercent: 75,
        attemptsAllowed: 2,
        questions: [
          { type: 'MCQ', questionText: '2 + 2?', options: ['3', '4', '5'], correctOptionIndex: 1, marks: 1 },
          {
            type: 'MultipleSelect',
            questionText: 'Pick the even numbers',
            options: ['2', '3', '4'],
            correctOptionIndexes: [0, 2],
            marks: 1,
          },
          { type: 'TrueFalse', questionText: 'The sky is blue', options: ['True', 'False'], correctOptionIndex: 0, marks: 1 },
          { type: 'ShortAnswer', questionText: 'Capital of France?', correctAnswer: 'Paris', marks: 1 },
        ],
      },
    });
    const quiz = quizRes.json?.quiz;
    check('Admin builds a batch quiz', quizRes.status === 201 && Boolean(quiz?._id), `HTTP ${quizRes.status}`);
    check(
      'Quiz marks are derived from its questions',
      quiz?.totalMarks === 4 && quiz?.passingMarks === 3,
      `total=${quiz?.totalMarks} pass=${quiz?.passingMarks}`
    );

    const otherQuizRes = await request('POST', `/api/admin/lms/batches/${batchB._id}/quizzes`, {
      ...asAdmin,
      body: {
        title: `Batch B private quiz ${stamp}`,
        questions: [{ type: 'MCQ', questionText: 'Batch B only?', options: ['Yes', 'No'], correctOptionIndex: 0 }],
      },
    });
    const otherQuiz = otherQuizRes.json?.quiz;
    check('Batch B gets its own quiz', otherQuizRes.status === 201 && Boolean(otherQuiz?._id));

    const studentQuizzes = await request('GET', '/api/lms/quizzes', asStudent);
    const quizIds = (studentQuizzes.json?.quizzes || []).map((row) => String(row._id));
    check('The student sees their batch quiz', quizIds.includes(String(quiz?._id)), `${quizIds.length} quiz(es)`);
    check('Another batch quiz stays hidden', !quizIds.includes(String(otherQuiz?._id)));

    const crossQuiz = await request('GET', `/api/lms/quizzes/${otherQuiz?._id}`, asStudent);
    check('Opening another batch quiz is refused', crossQuiz.status === 403, `HTTP ${crossQuiz.status}`);

    const quizPaper = await request('GET', `/api/lms/quizzes/${quiz?._id}`, asStudent);
    const paperQuestions = quizPaper.json?.quiz?.questions || [];
    check('The student receives the question paper', quizPaper.status === 200 && paperQuestions.length === 4, `HTTP ${quizPaper.status}`);
    check(
      'Answer keys never leave the server',
      paperQuestions.every(
        (row) =>
          row.correctOptionIndex === undefined &&
          row.correctOptionIndexes === undefined &&
          row.correctAnswer === undefined
      )
    );

    const byText = (text) => paperQuestions.find((row) => row.questionText === text) || {};
    const answers = [
      { questionId: byText('2 + 2?')._id, selectedOptionIndex: 1 },
      { questionId: byText('Pick the even numbers')._id, selectedOptionIndexes: [0, 2] },
      { questionId: byText('The sky is blue')._id, selectedOptionIndex: 0 },
      { questionId: byText('Capital of France?')._id, textAnswer: 'paris' },
    ];

    const wrongQuiz = await request('POST', `/api/lms/quizzes/${quiz?._id}/submit`, {
      ...asStudent,
      body: {
        answers: answers.map((row) => ({
          ...row,
          selectedOptionIndex: 2,
          selectedOptionIndexes: [1],
          textAnswer: 'London',
        })),
      },
    });
    check(
      'A wrong attempt is graded, not passed',
      wrongQuiz.status === 200 && wrongQuiz.json?.passed === false && wrongQuiz.json?.scorePercent === 0,
      `HTTP ${wrongQuiz.status} score=${wrongQuiz.json?.scorePercent}`
    );

    const quizSubmit = await request('POST', `/api/lms/quizzes/${quiz?._id}/submit`, { ...asStudent, body: { answers } });
    check(
      'A correct attempt scores full marks and passes',
      quizSubmit.status === 200 &&
        quizSubmit.json?.passed === true &&
        quizSubmit.json?.scorePercent === 100 &&
        quizSubmit.json?.result?.scoreMarks === 4,
      `score=${quizSubmit.json?.scorePercent} marks=${quizSubmit.json?.result?.scoreMarks}`
    );

    const crossQuizSubmit = await request('POST', `/api/lms/quizzes/${otherQuiz?._id}/submit`, {
      ...asStudent,
      body: { answers: [] },
    });
    check('Submitting another batch quiz is refused', crossQuizSubmit.status === 403, `HTTP ${crossQuizSubmit.status}`);

    const quizResults = await request('GET', `/api/admin/lms/quizzes/${quiz?._id}/results`, asAdmin);
    check(
      'Admin sees the student attempt and performance',
      quizResults.status === 200 &&
        (quizResults.json?.attempts || []).length === 2 &&
        (quizResults.json?.attempts || []).some((row) => String(row.student?._id || row.student) === String(studentLogin.id) && row.passed === true),
      `HTTP ${quizResults.status}, ${(quizResults.json?.attempts || []).length} attempt(s)`
    );

    const assignmentRes = await request('POST', `/api/admin/lms/batches/${batchA._id}/assignments`, {
      ...asAdmin,
      body: {
        title: `Batch A assignment ${stamp}`,
        description: 'Submit a short answer.',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        totalMarks: 20,
        status: 'Published',
      },
    });
    const assignment = assignmentRes.json?.assignment;
    check('Admin creates a batch assignment', assignmentRes.status === 201 && Boolean(assignment?._id), `HTTP ${assignmentRes.status}`);

    const studentAssignments = await request('GET', '/api/lms/assignments', asStudent);
    check(
      'The assignment reaches the enrolled student',
      studentAssignments.status === 200 &&
        (studentAssignments.json?.assignments || []).some((row) => String(row._id) === String(assignment?._id)),
      `HTTP ${studentAssignments.status}`
    );

    const submitAssignment = await request('POST', `/api/lms/assignments/${assignment?._id}/submit`, {
      ...asStudent,
      body: { text: 'My submitted answer for the QA suite.' },
    });
    check(
      'Student submits the assignment',
      submitAssignment.status === 201 && Boolean(submitAssignment.json?.submission?._id),
      `HTTP ${submitAssignment.status}`
    );

    const submissions = await request('GET', `/api/admin/lms/assignments/${assignment?._id}/submissions`, asAdmin);
    const submissionRow = (submissions.json?.submissions || [])[0];
    check(
      'Admin sees the submission awaiting a grade',
      submissions.status === 200 && Boolean(submissionRow?._id) && submissionRow.status !== 'Evaluated',
      `HTTP ${submissions.status}`
    );

    const evaluate = await request('PUT', `/api/admin/lms/assignment-submissions/${submissionRow?._id}/evaluate`, {
      ...asAdmin,
      body: { marks: 18, feedback: 'Clear and correct.' },
    });
    check(
      'Admin evaluates the submission',
      evaluate.status === 200 && evaluate.json?.submission?.marks === 18 && evaluate.json?.submission?.status === 'Evaluated',
      `HTTP ${evaluate.status}`
    );

    const otherAssignmentRes = await request('POST', `/api/admin/lms/batches/${batchB._id}/assignments`, {
      ...asAdmin,
      body: { title: `Batch B private assignment ${stamp}`, status: 'Published' },
    });
    const otherAssignment = otherAssignmentRes.json?.assignment;
    const crossSubmit = await request('POST', `/api/lms/assignments/${otherAssignment?._id}/submit`, {
      ...asStudent,
      body: { text: 'Should be refused.' },
    });
    check('Another batch assignment cannot be submitted', crossSubmit.status === 403, `HTTP ${crossSubmit.status}`);

    const grades = await request('GET', '/api/lms/grades', asStudent);
    check(
      'Grades reflect the real quiz and assignment marks',
      grades.status === 200 && grades.json?.summary?.quizAverage === 50 && grades.json?.summary?.assignmentAverage === 90,
      `quiz=${grades.json?.summary?.quizAverage} assignment=${grades.json?.summary?.assignmentAverage}`
    );

    // ── Resources, announcements, jobs, attendance ────────────────────────
    const resourceRes = await request('POST', `/api/admin/lms/batches/${batchA._id}/resources`, {
      ...asAdmin,
      body: { title: `Batch A notes ${stamp}`, url: 'https://example.com/notes.pdf', fileType: 'PDF', isPublished: true },
    });
    check('Admin publishes a batch resource', resourceRes.status === 201, `HTTP ${resourceRes.status}`);

    const studentResources = await request('GET', '/api/lms/resources', asStudent);
    check(
      'The resource reaches the enrolled student',
      (studentResources.json?.resources || []).some((row) => String(row._id) === String(resourceRes.json?.resource?._id))
    );

    const announcementRes = await request('POST', `/api/admin/lms/batches/${batchA._id}/announcements`, {
      ...asAdmin,
      body: { title: `Batch A notice ${stamp}`, body: 'Class moved by 30 minutes.', isPublished: true },
    });
    check('Admin publishes a batch announcement', announcementRes.status === 201, `HTTP ${announcementRes.status}`);

    const studentNotices = await request('GET', '/api/lms/announcements', asStudent);
    check(
      'The announcement reaches the enrolled student',
      (studentNotices.json?.announcements || []).some((row) => String(row._id) === String(announcementRes.json?.announcement?._id))
    );

    const otherAnnouncementRes = await request('POST', `/api/admin/lms/batches/${batchB._id}/announcements`, {
      ...asAdmin,
      body: { title: `Batch B private notice ${stamp}`, body: 'Only Batch B should read this.', isPublished: true },
    });
    check('Admin publishes a Batch B-only announcement', otherAnnouncementRes.status === 201, `HTTP ${otherAnnouncementRes.status}`);

    const jobRes = await request('POST', `/api/admin/lms/batches/${batchA._id}/jobs`, {
      ...asAdmin,
      body: {
        title: `Data Analyst ${stamp}`,
        company: 'QA Analytics',
        description: 'Analyse classroom datasets.',
        skills: 'SQL, Excel',
        location: 'Remote',
        employmentType: 'Full-time',
        applyLink: 'https://example.com/apply',
      },
    });
    const job = jobRes.json?.job;
    check('Admin publishes a batch job', jobRes.status === 201 && Boolean(job?._id), `HTTP ${jobRes.status}`);

    const otherJobRes = await request('POST', `/api/admin/lms/batches/${batchB._id}/jobs`, {
      ...asAdmin,
      body: { title: `Batch B private job ${stamp}`, description: 'Should stay in Batch B.' },
    });
    const otherJob = otherJobRes.json?.job;

    const studentJobs = await request('GET', '/api/lms/jobs', asStudent);
    const studentJobIds = (studentJobs.json?.jobs || []).map((row) => String(row._id));
    check('The student sees the job for their batch', studentJobIds.includes(String(job?._id)));
    check('Another batch job stays hidden', !studentJobIds.includes(String(otherJob?._id)));

    const batchJobs = await request('GET', `/api/admin/lms/batches/${batchA._id}/jobs`, asAdmin);
    check(
      'Admin lists the batch jobs with application counts',
      batchJobs.status === 200 && (batchJobs.json?.jobs || []).some((row) => String(row._id) === String(job?._id)),
      `HTTP ${batchJobs.status}`
    );

    const apply = await request('POST', `/api/jobs/${job?._id}/apply`, {
      body: { applicantName: 'QA Applicant', email: `applicant.${stamp}@example.com`, phone: '555-0100' },
    });
    check('A student can apply to the job', apply.status === 201, `HTTP ${apply.status}`);

    const applications = await request('GET', `/api/admin/lms/jobs/${job?._id}/applications`, asAdmin);
    check(
      'Admin sees the application and its status',
      applications.status === 200 &&
        (applications.json?.applications || []).some((row) => row.applicantName === 'QA Applicant' && row.status === 'Submitted'),
      `HTTP ${applications.status}`
    );

    const attendance = await request('POST', `/api/admin/lms/batches/${batchA._id}/attendance`, {
      ...asAdmin,
      body: { classSessionId: liveClass._id, records: [{ studentId: studentLogin.id, status: 'Present' }] },
    });
    check('Admin marks attendance', attendance.status === 200 && attendance.json?.marked === 1, `HTTP ${attendance.status}`);

    const studentAttendance = await request('GET', '/api/lms/attendance', asStudent);
    check(
      'The student sees their attendance',
      studentAttendance.status === 200 &&
        studentAttendance.json?.summary?.total === 1 &&
        studentAttendance.json?.summary?.rate === 100,
      `total=${studentAttendance.json?.summary?.total} rate=${studentAttendance.json?.summary?.rate}`
    );

    // ── Student modules: calendar, transcript, inbox, leaderboard, badges ──
    section('STUDENT MODULES');

    const calendarFrom = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const calendarTo = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const calendar = await request(
      'GET',
      `/api/lms/calendar?from=${encodeURIComponent(calendarFrom)}&to=${encodeURIComponent(calendarTo)}`,
      asStudent
    );
    const calendarEvents = calendar.json?.events || [];
    const calendarIds = calendarEvents.map((row) => row.id);
    check('Calendar returns the batch schedule', calendar.status === 200 && calendarEvents.length >= 4, `HTTP ${calendar.status}, ${calendarEvents.length} event(s)`);
    check('Calendar includes the student class and assignment', calendarIds.includes(`class:${liveClass._id}`) && calendarIds.includes(`assignment:${assignment._id}`));
    check('Calendar excludes the draft and the other batch class', !calendarIds.includes(`class:${draftClass._id}`) && !calendarIds.includes(`class:${otherBatchClass._id}`));
    check(
      'Calendar summary counts real event types',
      calendar.json?.summary?.class === 3 && calendar.json?.summary?.assignment === 1,
      `class=${calendar.json?.summary?.class} assignment=${calendar.json?.summary?.assignment}`
    );

    const transcript = await request('GET', '/api/lms/transcript', asStudent);
    const transcriptRecord = (transcript.json?.records || [])[0];
    check(
      'Transcript reports the enrolled course and batch',
      transcript.status === 200 &&
        transcript.json?.records?.length === 1 &&
        String(transcriptRecord?.batch?._id) === String(batchA._id),
      `HTTP ${transcript.status}, ${transcript.json?.records?.length} record(s)`
    );
    check(
      'Transcript grades come from real quiz and assignment marks',
      transcriptRecord?.quizAverage === 50 &&
        transcriptRecord?.assignmentAverage === 90 &&
        transcriptRecord?.overall === 68 &&
        transcriptRecord?.letterGrade === 'D' &&
        transcriptRecord?.gpaPoints === 1,
      `quiz=${transcriptRecord?.quizAverage} assignment=${transcriptRecord?.assignmentAverage} overall=${transcriptRecord?.overall} ${transcriptRecord?.letterGrade}`
    );
    check(
      'Transcript counts both attempts and the evaluated submission',
      transcriptRecord?.quizCount === 2 &&
        transcriptRecord?.assignmentCount === 1 &&
        transcriptRecord?.attendance?.rate === 100,
      `quizzes=${transcriptRecord?.quizCount} assignments=${transcriptRecord?.assignmentCount} attendance=${transcriptRecord?.attendance?.rate}`
    );

    const inbox = await request('GET', '/api/lms/notifications', asStudent);
    const inboxRows = inbox.json?.notifications || [];
    const inboxTitles = inboxRows.map((row) => row.title);
    check('Inbox is generated from real LMS events', inbox.status === 200 && inboxRows.length >= 5, `HTTP ${inbox.status}, ${inboxRows.length} notification(s)`);
    check('Inbox includes the Batch A announcement', inboxTitles.some((title) => title.includes(String(announcementRes.json?.announcement?.title))));
    check(
      'Inbox excludes the Batch B announcement',
      !inboxTitles.some((title) => title.includes(`Batch B private notice ${stamp}`))
    );
    check('Inbox reports an unread count', Number(inbox.json?.unreadCount) > 0, `unread=${inbox.json?.unreadCount}`);

    const unread = await request('GET', '/api/lms/notifications/unread-count', asStudent);
    check('Unread-count endpoint agrees with the inbox', unread.status === 200 && unread.json?.unreadCount === inbox.json?.unreadCount);

    const firstUnread = inboxRows.find((row) => !row.read);
    const marked = await request('PATCH', `/api/lms/notifications/${firstUnread?._id}/read`, asStudent);
    check(
      'Marking one notification read lowers the unread count',
      marked.status === 200 && marked.json?.unreadCount === inbox.json?.unreadCount - 1,
      `HTTP ${marked.status} unread=${marked.json?.unreadCount}`
    );

    const foreignNotification = await request('PATCH', '/api/lms/notifications/64b7f9d2c1a2b3d4e5f60718/read', asStudent);
    check('A notification owned by someone else cannot be marked read', foreignNotification.status === 404, `HTTP ${foreignNotification.status}`);

    const readAll = await request('PATCH', '/api/lms/notifications/read-all', asStudent);
    const afterReadAll = await request('GET', '/api/lms/notifications', asStudent);
    check(
      'Read state persists across a fresh inbox sync',
      readAll.status === 200 &&
        readAll.json?.unreadCount === 0 &&
        afterReadAll.json?.unreadCount === 0 &&
        (afterReadAll.json?.notifications || []).every((row) => row.read),
      `unread=${afterReadAll.json?.unreadCount}`
    );

    const leaderboard = await request('GET', '/api/lms/leaderboard', asStudent);
    const board = (leaderboard.json?.batches || [])[0];
    check(
      'Leaderboard only includes the student’s own batch',
      leaderboard.status === 200 &&
        leaderboard.json?.batches?.length === 1 &&
        String(board?.batch?._id) === String(batchA._id),
      `HTTP ${leaderboard.status}, ${leaderboard.json?.batches?.length} board(s)`
    );
    check(
      'Leaderboard ranks the real composite score',
      board?.participantCount === 1 &&
        board?.myRank === 1 &&
        board?.myEntry?.score === 98 &&
        board?.myEntry?.quizAverage === 100 &&
        board?.myEntry?.assignmentAverage === 90 &&
        board?.myEntry?.attendanceRate === 100,
      `rank=${board?.myRank} score=${board?.myEntry?.score} quiz=${board?.myEntry?.quizAverage}`
    );

    const badges = await request('GET', '/api/lms/badges', asStudent);
    const badgeMap = new Map((badges.json?.badges || []).map((row) => [row.key, row]));
    check(
      'Badges are awarded from real quiz performance',
      badges.status === 200 &&
        badgeMap.get('first-quiz')?.earned === true &&
        badgeMap.get('perfect-score')?.earned === true,
      `HTTP ${badges.status}, earned=${badges.json?.summary?.earned}`
    );
    check(
      'A locked badge reports honest progress',
      badgeMap.get('assignment-ace')?.earned === false && badgeMap.get('assignment-ace')?.progress?.current === 1,
      `progress=${badgeMap.get('assignment-ace')?.progress?.current}/${badgeMap.get('assignment-ace')?.progress?.target}`
    );

    const firstAward = badgeMap.get('first-quiz')?.awardedAt;
    const badgesAgain = await request('GET', '/api/lms/badges', asStudent);
    const repeatedAward = (badgesAgain.json?.badges || []).find((row) => row.key === 'first-quiz')?.awardedAt;
    check('An earned badge keeps its original award date', Boolean(firstAward) && firstAward === repeatedAward, `${firstAward} vs ${repeatedAward}`);

    const anonymousModules = await Promise.all([
      request('GET', '/api/lms/calendar'),
      request('GET', '/api/lms/transcript'),
      request('GET', '/api/lms/notifications'),
      request('GET', '/api/lms/leaderboard'),
      request('GET', '/api/lms/badges'),
    ]);
    check(
      'Every new module refuses anonymous reads',
      anonymousModules.every((row) => row.status === 401),
      anonymousModules.map((row) => row.status).join(', ')
    );

    const analytics = await request('GET', `/api/admin/lms/batches/${batchA._id}/analytics`, asAdmin);
    check(
      'Batch analytics aggregate the real activity',
      analytics.status === 200 &&
        analytics.json?.analytics?.students?.total === 1 &&
        analytics.json?.analytics?.quizzes?.total >= 1 &&
        analytics.json?.analytics?.assignments?.total >= 1 &&
        analytics.json?.analytics?.attendance?.present === 1,
      `HTTP ${analytics.status}`
    );

    // ── Student access window + transfer ──────────────────────────────────
    const batchCRes = await request('POST', '/api/admin/lms/batches', {
      ...asAdmin,
      body: {
        courseId,
        name: 'Batch 5–6 PM',
        batchCode: `QA-C-${stamp}`,
        startDate: todayStr,
        days: ['Mon'],
        startTime: '17:00',
        endTime: '18:00',
        maxCapacity: 10,
      },
    });
    const batchC = batchCRes.json?.batch;
    check('A third batch is created for the transfer', batchCRes.status === 201 && Boolean(batchC?._id));

    const extendUntil = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const extend = await request('PUT', `/api/admin/lms/students/${studentLogin.id}/access`, {
      ...asAdmin,
      body: { enrollmentId: enrollment._id, accessUntil: extendUntil },
    });
    check(
      'Admin extends the access window',
      extend.status === 200 && String(extend.json?.enrollment?.accessUntil || '').slice(0, 10) === extendUntil,
      `HTTP ${extend.status}`
    );

    const studentExtend = await request('PUT', `/api/admin/lms/students/${studentLogin.id}/access`, {
      ...asStudent,
      body: { enrollmentId: enrollment._id, accessUntil: extendUntil },
    });
    check('A student cannot extend their own access', studentExtend.status === 403, `HTTP ${studentExtend.status}`);

    const transfer = await request('PUT', `/api/admin/lms/students/${studentLogin.id}/transfer`, {
      ...asAdmin,
      body: { enrollmentId: enrollment._id, batchId: batchC._id },
    });
    check(
      'Admin transfers the student to another batch',
      transfer.status === 200 && String(transfer.json?.enrollment?.batch) === String(batchC._id),
      `HTTP ${transfer.status}`
    );

    const transferredClasses = await request('GET', '/api/lms/classes', asStudent);
    check(
      'The transfer moves the student out of the old classroom',
      (transferredClasses.json?.classes || []).length === 0,
      `${(transferredClasses.json?.classes || []).length} class(es)`
    );

    const oldEnrollments = await request('GET', `/api/admin/lms/enrollments?courseId=${courseId}`, asAdmin);
    const oldEnrollment = (oldEnrollments.json?.enrollments || []).find((row) => String(row._id) === String(enrollment._id));
    check('The old enrollment is closed, not deleted', oldEnrollment?.status === 'Cancelled', oldEnrollment?.status);

    const studentTransfer = await request('PUT', `/api/admin/lms/students/${studentLogin.id}/transfer`, {
      ...asStudent,
      body: { enrollmentId: enrollment._id, batchId: batchA._id },
    });
    check('A student cannot transfer themselves', studentTransfer.status === 403, `HTTP ${studentTransfer.status}`);

    const studentAuthoring = await request('POST', `/api/admin/lms/batches/${batchA._id}/quizzes`, {
      ...asStudent,
      body: { title: 'Student-authored quiz', questions: [] },
    });
    check('A student cannot author a quiz', studentAuthoring.status === 403, `HTTP ${studentAuthoring.status}`);

    const studentJobWrite = await request('POST', `/api/admin/lms/batches/${batchA._id}/jobs`, {
      ...asStudent,
      body: { title: 'Student job', description: 'nope' },
    });
    check('A student cannot publish a job', studentJobWrite.status === 403, `HTTP ${studentJobWrite.status}`);

    // ── Safe deletion, archive, duplicate ─────────────────────────────────
    section('BATCH LIFECYCLE');

    const blockedDelete = await request('DELETE', `/api/admin/lms/batches/${batchA._id}`, asAdmin);
    check(
      'A batch with students/classes is not deleted',
      blockedDelete.status === 409,
      `HTTP ${blockedDelete.status} ${blockedDelete.json?.message || ''}`
    );

    const archive = await request('POST', `/api/admin/lms/batches/${batchB._id}/archive`, asAdmin);
    check(
      'An unused batch can be archived',
      archive.status === 200 && archive.json?.batch?.status === 'Archived',
      `HTTP ${archive.status}`
    );

    const duplicate = await request('POST', `/api/admin/lms/batches/${batchA._id}/duplicate`, asAdmin);
    check(
      'Duplicate creates a fresh draft code',
      duplicate.status === 201 && String(duplicate.json?.batch?.batchCode || '').includes('COPY'),
      duplicate.json?.batch?.batchCode
    );

    const update = await request('PUT', `/api/admin/lms/batches/${batchA._id}`, {
      ...asAdmin,
      body: { days: ['Tue', 'Thu'], startTime: '18:00', endTime: '19:30' },
    });
    check('Batch timing can be changed', update.status === 200, `HTTP ${update.status}`);
    check(
      'The public timing line follows the new schedule',
      String(update.json?.batch?.timing || '').includes('18:00') &&
        String(update.json?.batch?.timing || '').includes('Tue'),
      update.json?.batch?.timing
    );

    const portal = await request('GET', '/api/admin/lms/portal', asAdmin);
    const portalCourse = (portal.json?.courses || []).find((row) => String(row._id) === String(courseId));
    check('LMS Portal reports the course batches', portalCourse?.batches >= 3, `batches=${portalCourse?.batches}`);
    check('LMS Portal reports the course classes', portalCourse?.classes >= 5, `classes=${portalCourse?.classes}`);
    check('LMS Portal reports the enrolled student', portalCourse?.activeStudents >= 1, `students=${portalCourse?.activeStudents}`);

    const workspace = await request('GET', `/api/admin/lms/batches/${batchA._id}`, asAdmin);
    check(
      'Batch workspace returns roster and class stats',
      workspace.status === 200 && workspace.json?.stats?.students >= 1 && workspace.json?.classes?.length >= 4,
      `HTTP ${workspace.status}`
    );
  } finally {
    await shutdown();
  }

  const failed = results.filter((row) => !row.passed);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFailures:');
    failed.forEach((row) => console.log(`  ❌ ${row.name}${row.detail ? ` — ${row.detail}` : ''}`));
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error('\nSuite crashed:', error);
  process.exitCode = 1;
});
