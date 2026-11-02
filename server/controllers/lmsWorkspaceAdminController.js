/**
 * Batch workspace actions — the four primary operations of the Admin LMS.
 *
 *   Batch → Add Class   (classroomAdminController)
 *   Batch → Add Quiz    → here
 *   Batch → Enroll      → here
 *   Batch → Add Job     → here
 *
 * Every write re-reads the batch from the database and derives the course from
 * it. The client's `courseId` is never trusted, so a request cannot attach a
 * quiz, assignment, job or student to a different course than the batch's own.
 */

const mongoose = require('mongoose');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const ClassSession = require('../models/ClassSession');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const AttendanceRecord = require('../models/AttendanceRecord');
const LmsResource = require('../models/LmsResource');
const Announcement = require('../models/Announcement');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const StudentSession = require('../models/StudentSession');
const StudentActivity = require('../models/StudentActivity');
const { sendError } = require('../utils/apiError');
const { generateSecurePassword, validatePassword } = require('../utils/passwords');
const {
  ACTIVE_WINDOW_MS,
  recordActivity,
  endAllStudentSessions,
  isSessionLive,
} = require('../utils/studentActivity');

const toId = (value) => (mongoose.Types.ObjectId.isValid(value) ? value : null);
const asText = (value) => String(value ?? '').trim();
const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
const isHttpUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// A resource may be a web link OR a file uploaded through our own upload
// endpoints. Those are same-origin paths, so `new URL(value)` throws and the
// old check rejected every uploaded PDF the admin attached.
const SAME_ORIGIN_ASSET =
  /^\/(?:api\/upload\/(?:document|video)\/[a-f0-9]{24}(?:\.[a-z0-9]+)?|uploads\/[A-Za-z0-9._-]+)$/i;
const isAssetUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return false;
  return SAME_ORIGIN_ASSET.test(raw) || isHttpUrl(raw);
};

const audit = async (req, action, details, entityId) => {
  try {
    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'System',
      actorRole: req.user?.role || 'ADMIN',
      action,
      entity: 'LMS_BATCH',
      entityId: entityId ? String(entityId) : undefined,
      details,
    });
  } catch {
    /* auditing must never break the operation */
  }
};

/** Load a batch with its course, or answer the request with the right error. */
const requireBatch = async (req, res) => {
  const id = toId(req.params.id || req.params.batchId);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid batch id.' });
    return null;
  }
  const batch = await Batch.findById(id).populate('course', 'title slug thumbnail').lean();
  if (!batch) {
    res.status(404).json({ success: false, message: 'Batch not found.' });
    return null;
  }
  return batch;
};

// ─────────────────────────────────────────────────────────────────────────────
// Quizzes
// ─────────────────────────────────────────────────────────────────────────────

const QUESTION_TYPES = ['MCQ', 'MultipleSelect', 'TrueFalse', 'ShortAnswer', 'LongAnswer', 'FillBlank', 'Matching'];

const sanitizeQuestion = (row, index) => {
  const type = QUESTION_TYPES.includes(row?.type) ? row.type : 'MCQ';
  const text = asText(row?.questionText);
  if (!text) throw new Error(`Question ${index + 1} needs its question text.`);

  const question = {
    questionText: text,
    type,
    marks: Math.max(0, asNumber(row?.marks, 1)),
    explanation: asText(row?.explanation),
    imageUrl: asText(row?.imageUrl),
    options: [],
    correctOptionIndex: 0,
    correctOptionIndexes: [],
    correctAnswer: asText(row?.correctAnswer),
    pairs: [],
  };

  if (type === 'MCQ' || type === 'TrueFalse' || type === 'MultipleSelect') {
    let options = Array.isArray(row?.options) ? row.options.map(asText).filter(Boolean) : [];
    if (type === 'TrueFalse') options = ['True', 'False'];
    if (options.length < 2) throw new Error(`Question ${index + 1} needs at least two options.`);
    question.options = options;

    const indexes = Array.isArray(row?.correctOptionIndexes)
      ? row.correctOptionIndexes.map((value) => Number(value))
      : [];
    const legacy = Number.isInteger(Number(row?.correctOptionIndex)) ? Number(row.correctOptionIndex) : 0;

    if (type === 'MultipleSelect') {
      const valid = [...new Set(indexes.filter((value) => Number.isInteger(value) && value >= 0 && value < options.length))];
      if (!valid.length) throw new Error(`Question ${index + 1} needs at least one correct option.`);
      question.correctOptionIndexes = valid;
      question.correctOptionIndex = valid[0];
    } else {
      const chosen = indexes.length ? indexes[0] : legacy;
      if (!Number.isInteger(chosen) || chosen < 0 || chosen >= options.length) {
        throw new Error(`Question ${index + 1} needs a correct option.`);
      }
      question.correctOptionIndex = chosen;
      question.correctOptionIndexes = [chosen];
    }
  }

  if (type === 'ShortAnswer' || type === 'FillBlank') {
    if (!question.correctAnswer) throw new Error(`Question ${index + 1} needs the expected answer.`);
  }

  if (type === 'Matching') {
    const pairs = Array.isArray(row?.pairs)
      ? row.pairs
          .map((pair) => ({ left: asText(pair?.left), right: asText(pair?.right) }))
          .filter((pair) => pair.left && pair.right)
      : [];
    if (pairs.length < 2) throw new Error(`Question ${index + 1} needs at least two matching pairs.`);
    question.pairs = pairs;
  }

  return question;
};

const quizPayload = (body, fallback = {}) => {
  const questions = Array.isArray(body.questions) ? body.questions.map(sanitizeQuestion) : undefined;
  const payload = {
    title: body.title !== undefined ? asText(body.title) : undefined,
    description: body.description !== undefined ? String(body.description) : undefined,
    instructions: body.instructions !== undefined ? String(body.instructions) : undefined,
    timeLimitMinutes: body.timeLimitMinutes !== undefined ? Math.max(1, asNumber(body.timeLimitMinutes, 15)) : undefined,
    passingScorePercent:
      body.passingScorePercent !== undefined ? Math.min(100, Math.max(0, asNumber(body.passingScorePercent, 70))) : undefined,
    totalMarks: body.totalMarks !== undefined ? Math.max(0, asNumber(body.totalMarks, 0)) : undefined,
    passingMarks: body.passingMarks !== undefined ? Math.max(0, asNumber(body.passingMarks, 0)) : undefined,
    attemptsAllowed: body.attemptsAllowed !== undefined ? Math.max(1, asNumber(body.attemptsAllowed, 1)) : undefined,
    startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
    shuffleQuestions: body.shuffleQuestions !== undefined ? Boolean(body.shuffleQuestions) : undefined,
    shuffleOptions: body.shuffleOptions !== undefined ? Boolean(body.shuffleOptions) : undefined,
    negativeMarking: body.negativeMarking !== undefined ? Math.max(0, asNumber(body.negativeMarking, 0)) : undefined,
    resultVisibility: ['Immediately', 'AfterDueDate', 'Hidden'].includes(body.resultVisibility)
      ? body.resultVisibility
      : undefined,
    isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : undefined,
    questions,
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  // Marks are normally derived from the questions so the two can never disagree.
  if (questions && payload.totalMarks === undefined) {
    payload.totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
  }
  if (fallback.derivePassingMarks && payload.passingMarks === undefined && payload.totalMarks !== undefined) {
    payload.passingMarks = Math.round((payload.totalMarks * (payload.passingScorePercent ?? 70)) / 100);
  }
  return payload;
};

// @desc   Create a quiz inside a batch
// @route  POST /api/admin/lms/batches/:id/quizzes
const createBatchQuiz = async (req, res) => {
  try {
    const batch = await requireBatch(req, res);
    if (!batch) return undefined;

    if (!asText(req.body.title)) {
      return res.status(400).json({ success: false, message: 'Quiz title is required.' });
    }

    let payload;
    try {
      payload = quizPayload(req.body, { derivePassingMarks: true });
    } catch (validationError) {
      return res.status(400).json({ success: false, message: validationError.message });
    }

    if (!payload.questions?.length) {
      return res.status(400).json({ success: false, message: 'Add at least one question.' });
    }

    if (payload.startsAt && payload.endsAt && payload.endsAt <= payload.startsAt) {
      return res.status(400).json({ success: false, message: 'The quiz must close after it opens.' });
    }

    const quiz = await Quiz.create({
      ...payload,
      course: batch.course._id || batch.course,
      batch: batch._id,
      classSession: toId(req.body.classSessionId) || null,
      createdBy: req.user?._id,
    });

    await audit(req, 'QUIZ_CREATE', `${quiz.title} created in ${batch.batchCode}`, quiz._id);
    return res.status(201).json({ success: true, quiz });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Edit a batch quiz (including its questions)
// @route  PUT /api/admin/lms/quizzes/:id
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(toId(req.params.id));
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    let payload;
    try {
      payload = quizPayload(req.body, { derivePassingMarks: true });
    } catch (validationError) {
      return res.status(400).json({ success: false, message: validationError.message });
    }

    if (payload.questions && !payload.questions.length) {
      return res.status(400).json({ success: false, message: 'A quiz needs at least one question.' });
    }
    if (payload.questions && payload.totalMarks === undefined) {
      payload.totalMarks = payload.questions.reduce((sum, question) => sum + question.marks, 0);
    }

    Object.assign(quiz, payload);
    if (req.body.classSessionId !== undefined) {
      quiz.classSession = toId(req.body.classSessionId) || null;
    }
    await quiz.save();

    await audit(req, 'QUIZ_UPDATE', `${quiz.title} updated`, quiz._id);
    return res.status(200).json({ success: true, quiz });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Delete a quiz; refuses when students already attempted it
// @route  DELETE /api/admin/lms/quizzes/:id
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(toId(req.params.id)).lean();
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    const attempts = await QuizAttempt.countDocuments({ quiz: quiz._id });
    if (attempts > 0) {
      return res.status(409).json({
        success: false,
        message: `${attempts} attempt(s) already exist. Unpublish the quiz instead of deleting its results.`,
      });
    }

    await Quiz.findByIdAndDelete(quiz._id);
    await audit(req, 'QUIZ_DELETE', `${quiz.title} deleted`, quiz._id);
    return res.status(200).json({ success: true, message: 'Quiz deleted.' });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Attempts for one quiz, plus the roster that has not attempted yet
// @route  GET /api/admin/lms/quizzes/:id/results
const getQuizResults = async (req, res) => {
  try {
    const quizId = toId(req.params.id);
    if (!quizId) return res.status(400).json({ success: false, message: 'Invalid quiz id.' });

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    const attempts = await QuizAttempt.find({ quiz: quizId })
      .populate('student', 'name email studentDetails.enrollmentNumber')
      .sort({ createdAt: -1 })
      .lean();

    const submitted = new Set(attempts.map((row) => String(row.student?._id)));
    const roster = quiz.batch
      ? await Enrollment.find({ batch: quiz.batch, status: 'Active' })
          .populate('student', 'name email studentDetails.enrollmentNumber')
          .lean()
      : [];

    return res.status(200).json({
      success: true,
      quiz,
      attempts: attempts.map((row) => ({
        _id: row._id,
        student: row.student
          ? {
              _id: row.student._id,
              name: row.student.name,
              email: row.student.email,
              enrollmentNumber: row.student.studentDetails?.enrollmentNumber || '',
            }
          : null,
        submittedAt: row.submittedAt || row.createdAt,
        scoreMarks: row.scoreMarks ?? 0,
        totalMarks: row.totalMarks ?? 0,
        scorePercent: row.scorePercent ?? 0,
        passed: Boolean(row.passed),
        status: row.status,
        timeSpentSeconds: row.timeSpentSeconds || 0,
        // Needed by the manual-grading panel for subjective answers.
        answers: row.answers || [],
      })),
      pendingStudents: roster
        .filter((row) => row.student && !submitted.has(String(row.student._id)))
        .map((row) => ({
          _id: row.student._id,
          name: row.student.name,
          email: row.student.email,
          enrollmentNumber: row.student.studentDetails?.enrollmentNumber || '',
        })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Grade the subjective answers of one attempt
// @route  PUT /api/admin/lms/quiz-attempts/:id/evaluate
const evaluateQuizAttempt = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(toId(req.params.id));
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found.' });

    const quiz = await Quiz.findById(attempt.quiz).lean();
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    const grades = Array.isArray(req.body.answers) ? req.body.answers : [];
    const questionMap = new Map((quiz.questions || []).map((question) => [String(question._id), question]));

    attempt.answers.forEach((answer) => {
      const input = grades.find((row) => String(row.questionId) === String(answer.questionId));
      if (!input) return;
      const question = questionMap.get(String(answer.questionId));
      const max = Number(question?.marks ?? 1);
      answer.awardedMarks = Math.min(max, Math.max(0, asNumber(input.awardedMarks, 0)));
      answer.feedback = asText(input.feedback);
      answer.isCorrect = answer.awardedMarks >= max;
    });

    const total = attempt.answers.reduce((sum, answer) => sum + Number(answer.awardedMarks || 0), 0);
    const totalMarks = Number(quiz.totalMarks || attempt.totalMarks || 0);
    const passingMarks = Number(quiz.passingMarks || 0);

    attempt.scoreMarks = total;
    attempt.scorePercent = totalMarks ? Math.round((total / totalMarks) * 100) : 0;
    attempt.passed = passingMarks > 0 ? total >= passingMarks : attempt.scorePercent >= Number(quiz.passingScorePercent || 70);
    attempt.status = 'Evaluated';
    await attempt.save();

    await audit(req, 'QUIZ_EVALUATE', `Attempt ${attempt._id} graded (${total}/${totalMarks})`, attempt._id);
    return res.status(200).json({ success: true, attempt });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Assignments
// ─────────────────────────────────────────────────────────────────────────────

const sanitizeAttachments = (rows) => {
  if (!Array.isArray(rows)) return undefined;
  return rows
    .map((row) => ({
      title: asText(row?.title),
      url: asText(row?.url),
      fileType: asText(row?.fileType || 'PDF').toUpperCase().slice(0, 12),
    }))
    .filter((row) => row.title && isHttpUrl(row.url));
};

// @desc   Create an assignment inside a batch
// @route  POST /api/admin/lms/batches/:id/assignments
const createAssignment = async (req, res) => {
  try {
    const batch = await requireBatch(req, res);
    if (!batch) return undefined;

    if (!asText(req.body.title)) {
      return res.status(400).json({ success: false, message: 'Assignment title is required.' });
    }

    const dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      return res.status(400).json({ success: false, message: 'Due date is not a valid date.' });
    }

    const assignment = await Assignment.create({
      course: batch.course._id || batch.course,
      batch: batch._id,
      classSession: toId(req.body.classSessionId) || null,
      title: asText(req.body.title),
      description: String(req.body.description || ''),
      instructions: String(req.body.instructions || ''),
      dueAt,
      totalMarks: Math.max(0, asNumber(req.body.totalMarks, 100)),
      attachments: sanitizeAttachments(req.body.attachments) || [],
      allowLateSubmission: req.body.allowLateSubmission !== false,
      status: ['Draft', 'Published', 'Closed'].includes(req.body.status) ? req.body.status : 'Published',
      createdBy: req.user?._id,
    });

    await audit(req, 'ASSIGNMENT_CREATE', `${assignment.title} created in ${batch.batchCode}`, assignment._id);
    return res.status(201).json({ success: true, assignment });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Edit an assignment
// @route  PUT /api/admin/lms/assignments/:id
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(toId(req.params.id));
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    if (req.body.title !== undefined) assignment.title = asText(req.body.title);
    if (req.body.description !== undefined) assignment.description = String(req.body.description);
    if (req.body.instructions !== undefined) assignment.instructions = String(req.body.instructions);
    if (req.body.totalMarks !== undefined) assignment.totalMarks = Math.max(0, asNumber(req.body.totalMarks, 100));
    if (req.body.allowLateSubmission !== undefined) assignment.allowLateSubmission = Boolean(req.body.allowLateSubmission);
    if (req.body.status !== undefined && ['Draft', 'Published', 'Closed'].includes(req.body.status)) {
      assignment.status = req.body.status;
    }
    if (req.body.attachments !== undefined) assignment.attachments = sanitizeAttachments(req.body.attachments) || [];
    if (req.body.dueAt !== undefined) {
      assignment.dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;
      if (assignment.dueAt && Number.isNaN(assignment.dueAt.getTime())) {
        return res.status(400).json({ success: false, message: 'Due date is not a valid date.' });
      }
    }

    await assignment.save();
    await audit(req, 'ASSIGNMENT_UPDATE', `${assignment.title} updated`, assignment._id);
    return res.status(200).json({ success: true, assignment });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Delete an assignment that has no submissions
// @route  DELETE /api/admin/lms/assignments/:id
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(toId(req.params.id)).lean();
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    const submissions = await AssignmentSubmission.countDocuments({ assignment: assignment._id });
    if (submissions > 0) {
      return res.status(409).json({
        success: false,
        message: `${submissions} submission(s) already exist. Close the assignment instead of deleting the marks.`,
      });
    }

    await Assignment.findByIdAndDelete(assignment._id);
    await audit(req, 'ASSIGNMENT_DELETE', `${assignment.title} deleted`, assignment._id);
    return res.status(200).json({ success: true, message: 'Assignment deleted.' });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Submissions for an assignment plus the students yet to submit
// @route  GET /api/admin/lms/assignments/:id/submissions
const getAssignmentSubmissions = async (req, res) => {
  try {
    const assignmentId = toId(req.params.id);
    if (!assignmentId) return res.status(400).json({ success: false, message: 'Invalid assignment id.' });

    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    const [submissions, roster] = await Promise.all([
      AssignmentSubmission.find({ assignment: assignmentId })
        .populate('student', 'name email studentDetails.enrollmentNumber')
        .sort({ submittedAt: -1 })
        .lean(),
      Enrollment.find({ batch: assignment.batch, status: 'Active' })
        .populate('student', 'name email studentDetails.enrollmentNumber')
        .lean(),
    ]);

    const submitted = new Set(submissions.map((row) => String(row.student?._id)));
    const present = (row) =>
      row.student
        ? {
            _id: row.student._id,
            name: row.student.name,
            email: row.student.email,
            enrollmentNumber: row.student.studentDetails?.enrollmentNumber || '',
          }
        : null;

    return res.status(200).json({
      success: true,
      assignment,
      submissions: submissions.map((row) => ({
        _id: row._id,
        student: present(row),
        submittedAt: row.submittedAt,
        isLate: row.isLate,
        status: row.status,
        marks: row.marks,
        feedback: row.feedback,
        text: row.text,
        files: row.files || [],
        evaluatedAt: row.evaluatedAt,
      })),
      pendingStudents: roster
        .filter((row) => row.student && !submitted.has(String(row.student._id)))
        .map(present)
        .filter(Boolean),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Evaluate a submission
// @route  PUT /api/admin/lms/assignment-submissions/:id/evaluate
const evaluateSubmission = async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findById(toId(req.params.id));
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    const assignment = await Assignment.findById(submission.assignment).lean();
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    const marks = Math.min(Number(assignment.totalMarks || 0), Math.max(0, asNumber(req.body.marks, 0)));
    submission.marks = marks;
    submission.feedback = asText(req.body.feedback);
    submission.status = 'Evaluated';
    submission.evaluatedBy = req.user?._id || null;
    submission.evaluatedAt = new Date();
    await submission.save();

    await audit(req, 'SUBMISSION_EVALUATE', `Submission ${submission._id} graded ${marks}/${assignment.totalMarks}`, submission._id);
    return res.status(200).json({ success: true, submission });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Resources & announcements
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Add a resource to the batch library
// @route  POST /api/admin/lms/batches/:id/resources
const createResource = async (req, res) => {
  try {
    const batch = await requireBatch(req, res);
    if (!batch) return undefined;

    const title = asText(req.body.title);
    const url = asText(req.body.url || req.body.fileUrl);
    if (!title) return res.status(400).json({ success: false, message: 'Resource title is required.' });
    if (!isAssetUrl(url)) {
      return res
        .status(400)
        .json({ success: false, message: 'Upload a file or paste a link that starts with http:// or https://.' });
    }

    const resource = await LmsResource.create({
      course: batch.course._id || batch.course,
      batch: batch._id,
      classSession: toId(req.body.classSessionId) || null,
      title,
      description: String(req.body.description || ''),
      url,
      fileType: asText(req.body.fileType || 'LINK').toUpperCase().slice(0, 12),
      category: asText(req.body.category || 'Reading'),
      isPublished: req.body.isPublished !== false,
      createdBy: req.user?._id,
    });

    await audit(req, 'RESOURCE_CREATE', `${resource.title} added to ${batch.batchCode}`, resource._id);
    return res.status(201).json({ success: true, resource });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Remove a resource
// @route  DELETE /api/admin/lms/resources/:id
const deleteResource = async (req, res) => {
  try {
    const resource = await LmsResource.findByIdAndDelete(toId(req.params.id)).lean();
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found.' });
    await audit(req, 'RESOURCE_DELETE', `${resource.title} removed`, resource._id);
    return res.status(200).json({ success: true, message: 'Resource removed.' });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Publish a batch announcement (audience = Batch, always)
// @route  POST /api/admin/lms/batches/:id/announcements
const createBatchAnnouncement = async (req, res) => {
  try {
    const batch = await requireBatch(req, res);
    if (!batch) return undefined;

    const title = asText(req.body.title);
    if (!title) return res.status(400).json({ success: false, message: 'Announcement title is required.' });

    const announcement = await Announcement.create({
      title,
      body: String(req.body.body || ''),
      audience: 'Batch',
      course: batch.course._id || batch.course,
      batch: batch._id,
      pinned: Boolean(req.body.pinned),
      isPublished: req.body.isPublished !== false,
      createdBy: req.user?._id,
      createdByName: req.user?.name || 'Admin',
    });

    await audit(req, 'ANNOUNCEMENT_CREATE', `${title} published to ${batch.batchCode}`, announcement._id);
    return res.status(201).json({ success: true, announcement });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Delete an announcement
// @route  DELETE /api/admin/lms/batches/announcements/:id
const deleteBatchAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(toId(req.params.id)).lean();
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found.' });
    await audit(req, 'ANNOUNCEMENT_DELETE', `${announcement.title} deleted`, announcement._id);
    return res.status(200).json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Jobs
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Publish a job for this batch
// @route  POST /api/admin/lms/batches/:id/jobs
const createBatchJob = async (req, res) => {
  try {
    const batch = await requireBatch(req, res);
    if (!batch) return undefined;

    const title = asText(req.body.title);
    const description = String(req.body.description || '');
    if (!title) return res.status(400).json({ success: false, message: 'Job title is required.' });
    if (!description.trim()) return res.status(400).json({ success: false, message: 'Job description is required.' });

    const skills = Array.isArray(req.body.skills)
      ? req.body.skills.map(asText).filter(Boolean)
      : String(req.body.skills || '')
          .split(',')
          .map(asText)
          .filter(Boolean);

    const job = await Job.create({
      title,
      company: asText(req.body.company) || 'American FutureTech Career Network Partner',
      companyLogo: asText(req.body.companyLogo),
      location: asText(req.body.location) || 'Remote (US & Global)',
      employmentType: ['Full-time', 'Part-time', 'Contract', 'Internship'].includes(req.body.employmentType)
        ? req.body.employmentType
        : 'Full-time',
      experienceLevel: asText(req.body.experienceLevel) || 'Entry to Mid Level',
      salaryRange: asText(req.body.salaryRange),
      salaryMin: Math.max(0, asNumber(req.body.salaryMin, 0)),
      salaryMax: Math.max(0, asNumber(req.body.salaryMax, 0)),
      skills,
      description,
      qualifications: Array.isArray(req.body.qualifications)
        ? req.body.qualifications.map(asText).filter(Boolean)
        : String(req.body.qualifications || '')
            .split(',')
            .map(asText)
            .filter(Boolean),
      applyLink: asText(req.body.applyLink),
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      recommendedCourse: batch.course._id || batch.course,
      recommendedCourseTitle: batch.course.title || '',
      // Authored from one batch, so it reaches that batch only. Targeting the
      // whole course here leaked the 8 PM cohort's job into the 7 AM roster.
      targetCourses: [],
      targetBatches: [batch._id],
      isPublished: req.body.isPublished !== false,
      isActive: req.body.isPublished !== false,
      createdBy: req.user?._id,
    });

    await audit(req, 'JOB_CREATE', `${job.title} published for ${batch.batchCode}`, job._id);
    return res.status(201).json({ success: true, job });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Jobs published for a batch, with application counts
// @route  GET /api/admin/lms/batches/:id/jobs
const listBatchJobs = async (req, res) => {
  try {
    const batch = await requireBatch(req, res);
    if (!batch) return undefined;

    // Batch jobs plus older course-wide roles that predate batch targeting.
    const jobs = await Job.find({
      $or: [
        { targetBatches: batch._id },
        { targetBatches: { $size: 0 }, recommendedCourse: batch.course._id || batch.course },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const counts = await JobApplication.aggregate([
      { $match: { job: { $in: jobs.map((job) => job._id) } } },
      { $group: { _id: '$job', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((row) => [String(row._id), row.count]));

    return res.status(200).json({
      success: true,
      jobs: jobs.map((job) => ({ ...job, applications: countMap.get(String(job._id)) || 0 })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Applications received for one of the batch's jobs
// @route  GET /api/admin/lms/jobs/:id/applications
const listJobApplications = async (req, res) => {
  try {
    const jobId = toId(req.params.id);
    if (!jobId) return res.status(400).json({ success: false, message: 'Invalid job id.' });

    const [job, applications] = await Promise.all([
      Job.findById(jobId).select('title company').lean(),
      JobApplication.find({ job: jobId }).sort({ createdAt: -1 }).lean(),
    ]);

    return res.status(200).json({ success: true, job, applications });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Students — create account + enroll in this batch in one operation
// ─────────────────────────────────────────────────────────────────────────────

const nextEnrollmentNumber = async () => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `AFT-${Math.floor(100000 + Math.random() * 900000)}`;
    const taken = await User.exists({ 'studentDetails.enrollmentNumber': candidate });
    if (!taken) return candidate;
  }
  return `AFT-${Date.now().toString().slice(-6)}`;
};

// @desc   Create a student account and enroll it in this batch
// @route  POST /api/admin/lms/batches/:id/students
const enrollStudentInBatch = async (req, res) => {
  try {
    const batch = await requireBatch(req, res);
    if (!batch) return undefined;

    const name = asText(req.body.name);
    const email = asText(req.body.email).toLowerCase();
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Student name and email are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Use the roster page to move that student into this batch.',
      });
    }

    const seatCount = await Enrollment.countDocuments({ batch: batch._id, status: 'Active' });
    if (batch.maxCapacity && seatCount >= batch.maxCapacity) {
      return res.status(409).json({
        success: false,
        message: `${batch.batchCode} is full (${seatCount}/${batch.maxCapacity}). Raise the capacity or move a student first.`,
      });
    }

    const requestedPassword = asText(req.body.password);
    if (requestedPassword) {
      const policy = validatePassword(requestedPassword, { email, name });
      if (!policy.valid) {
        return res.status(400).json({ success: false, message: policy.errors[0], errors: policy.errors });
      }
    }

    const generated = !requestedPassword;
    const plainPassword = requestedPassword || generateSecurePassword();
    const enrollmentNumber = asText(req.body.enrollmentNumber) || (await nextEnrollmentNumber());

    const accessStart = req.body.enrollmentDate ? new Date(req.body.enrollmentDate) : new Date();
    const accessUntil = req.body.accessUntil ? new Date(req.body.accessUntil) : null;
    if (accessUntil && Number.isNaN(accessUntil.getTime())) {
      return res.status(400).json({ success: false, message: 'Expiry date is not a valid date.' });
    }

    const student = await User.create({
      name,
      email,
      password: plainPassword,
      phone: asText(req.body.phone),
      role: 'STUDENT',
      isActive: req.body.isActive !== false,
      avatar: asText(req.body.avatar) || '/images/avatars/default-avatar.webp',
      studentDetails: {
        enrollmentNumber,
        assignedBatch: batch._id,
        targetCareer: asText(req.body.targetCareer),
        personalizedLearning: false,
        lmsAccess: {
          classroom: true,
          recordings: true,
          assignments: true,
          certificates: true,
          support: true,
          careerResources: true,
        },
      },
    });

    const enrollment = await Enrollment.create({
      student: student._id,
      course: batch.course._id || batch.course,
      batch: batch._id,
      status: 'Active',
      enrolledAt: accessStart,
      accessStart,
      accessUntil,
    });

    await Progress.findOneAndUpdate(
      { student: student._id, course: batch.course._id || batch.course },
      { $setOnInsert: { completedLessons: [], progressPercent: 0 } },
      { upsert: true }
    );

    // Keep the legacy roster array the public batch view reads in sync.
    const legacyBatch = await Batch.findById(batch._id);
    if (legacyBatch) {
      legacyBatch.enrolledStudents.push({
        studentName: student.name,
        email: student.email,
        phone: student.phone,
        feePaid: 0,
        totalFee: 0,
        paymentStatus: 'Pending',
      });
      await legacyBatch.save();
    }

    await audit(req, 'STUDENT_ENROLL', `${student.name} enrolled in ${batch.batchCode}`, student._id);
    await recordActivity(
      student._id,
      {
        type: 'enrolled',
        title: `Enrolled in ${batch.name || batch.batchCode}`,
        detail: `Course access starts ${accessStart.toISOString().slice(0, 10)}${accessUntil ? ` · until ${accessUntil.toISOString().slice(0, 10)}` : ''}`,
        actorName: req.user?.name || 'Administrator',
        actorRole: req.user?.role || '',
        meta: { batchId: String(batch._id), enrollmentId: String(enrollment._id) },
      },
      req,
    );

    return res.status(201).json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        enrollmentNumber,
        isActive: student.isActive,
      },
      enrollment: {
        _id: enrollment._id,
        status: enrollment.status,
        accessStart: enrollment.accessStart,
        accessUntil: enrollment.accessUntil,
      },
      hasPassword: Boolean(requestedPassword),
      // Returned exactly once. Only the hash is stored.
      credentials: generated ? { email: student.email, temporaryPassword: plainPassword } : null,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'That email or enrollment number is already in use.' });
    }
    return sendError(res, error);
  }
};

// @desc   Set a student's password from the roster (custom or generated)
// @route  POST /api/admin/lms/students/:id/reset-password
const resetStudentPassword = async (req, res) => {
  try {
    const student = await User.findById(toId(req.params.id));
    if (!student || String(student.role).toUpperCase() !== 'STUDENT') {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const requested = asText(req.body?.newPassword || req.body?.password);
    if (requested) {
      const policy = validatePassword(requested, { email: student.email, name: student.name });
      if (!policy.valid) {
        return res.status(400).json({ success: false, message: policy.errors[0], errors: policy.errors });
      }
    }

    const mode = requested ? 'custom' : 'generated';
    const plainPassword = requested || generateSecurePassword();
    student.password = plainPassword;
    student.failedLoginAttempts = 0;
    student.lockUntil = null;
    await student.save();

    // The new credential starts with no old portal tab still marked online.
    const endedSessions = await endAllStudentSessions(student._id, 'password_reset');

    await audit(
      req,
      'STUDENT_PASSWORD_RESET',
      `${mode === 'custom' ? 'Custom' : 'Generated'} password set for ${student.email}`,
      student._id,
    );
    await recordActivity(
      student._id,
      {
        type: 'password_set',
        title: mode === 'custom' ? 'Password changed by admin' : 'Temporary password generated by admin',
        detail: `Set by ${req.user?.name || 'an administrator'}${endedSessions ? ` · ${endedSessions} portal session(s) signed out` : ''}`,
        actorName: req.user?.name || 'Administrator',
        actorRole: req.user?.role || '',
      },
      req,
    );

    return res.status(200).json({
      success: true,
      mode,
      endedSessions,
      credentials: { email: student.email, password: plainPassword, temporaryPassword: plainPassword },
      message:
        mode === 'custom'
          ? 'Password updated. The student must use the new password on their next sign-in.'
          : 'Temporary password generated. Share it securely — it is shown only once.',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Suspend / reactivate a student from the roster
// @route  PUT /api/admin/lms/students/:id/status
const setStudentStatus = async (req, res) => {
  try {
    const student = await User.findById(toId(req.params.id));
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    student.isActive = req.body.isActive !== false;
    await student.save();

    if (req.body.enrollmentId) {
      const enrollment = await Enrollment.findById(toId(req.body.enrollmentId));
      if (enrollment) {
        enrollment.status = req.body.isActive !== false ? 'Active' : 'Suspended';
        await enrollment.save();
      }
    }

    if (!student.isActive) {
      await endAllStudentSessions(student._id, 'deactivated');
    }

    await audit(req, 'STUDENT_STATUS', `${student.email} set to ${student.isActive ? 'active' : 'suspended'}`, student._id);
    await recordActivity(
      student._id,
      {
        type: 'status_changed',
        title: student.isActive ? 'Account reactivated' : 'Account suspended',
        detail: `Changed by ${req.user?.name || 'an administrator'}`,
        actorName: req.user?.name || 'Administrator',
        actorRole: req.user?.role || '',
      },
      req,
    );
    return res.status(200).json({ success: true, student: { _id: student._id, isActive: student.isActive } });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Extend, shorten or clear a student's access window
// @route  PUT /api/admin/lms/students/:id/access
const updateStudentAccess = async (req, res) => {
  try {
    const student = await User.findById(toId(req.params.id));
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const enrollment = req.body.enrollmentId
      ? await Enrollment.findOne({ _id: toId(req.body.enrollmentId), student: student._id })
      : await Enrollment.findOne({ student: student._id, batch: toId(req.body.batchId), status: 'Active' });
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found.' });

    const parseDate = (value) => {
      if (value === undefined) return undefined;
      if (value === null || value === '') return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 'invalid' : date;
    };

    const start = parseDate(req.body.accessStart);
    const until = parseDate(req.body.accessUntil);
    if (start === 'invalid' || until === 'invalid') {
      return res.status(400).json({ success: false, message: 'Access dates must be valid dates.' });
    }
    if (until && start && until <= start) {
      return res.status(400).json({ success: false, message: 'Access must end after it starts.' });
    }

    if (start !== undefined) enrollment.accessStart = start || undefined;
    if (until !== undefined) enrollment.accessUntil = until || undefined;
    await enrollment.save();

    await audit(
      req,
      'STUDENT_ACCESS',
      `${student.email} access ${until ? `extended to ${until.toISOString().slice(0, 10)}` : 'cleared of expiry'}`,
      student._id
    );
    await recordActivity(
      student._id,
      {
        type: 'access_changed',
        title: 'Course access updated',
        detail: until
          ? `Access now runs until ${until.toISOString().slice(0, 10)}`
          : 'Access expiry cleared',
        actorName: req.user?.name || 'Administrator',
        actorRole: req.user?.role || '',
        meta: { enrollmentId: String(enrollment._id) },
      },
      req,
    );
    return res.status(200).json({
      success: true,
      enrollment: {
        _id: enrollment._id,
        accessStart: enrollment.accessStart || null,
        accessUntil: enrollment.accessUntil || null,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Move a student to another batch of the same course
// @route  PUT /api/admin/lms/students/:id/transfer
const transferStudentBatch = async (req, res) => {
  try {
    const student = await User.findById(toId(req.params.id));
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const from = await Enrollment.findOne({ _id: toId(req.body.enrollmentId), student: student._id });
    if (!from) return res.status(404).json({ success: false, message: 'Enrollment not found.' });

    const target = await Batch.findById(toId(req.body.batchId));
    if (!target) return res.status(404).json({ success: false, message: 'Target batch not found.' });
    if (target.status === 'Archived') {
      return res.status(400).json({ success: false, message: 'That batch is archived. Pick an active cohort.' });
    }
    if (String(target._id) === String(from.batch)) {
      return res.status(400).json({ success: false, message: 'The student is already in this batch.' });
    }
    if (String(target.course) !== String(from.course)) {
      return res.status(400).json({ success: false, message: 'A transfer must stay inside the same course.' });
    }

    const already = await Enrollment.findOne({ student: student._id, batch: target._id, status: 'Active' }).lean();
    if (already) {
      return res.status(409).json({ success: false, message: 'The student already has an active seat in that batch.' });
    }

    const seats = await Enrollment.countDocuments({ batch: target._id, status: 'Active' });
    if (target.maxCapacity && seats >= target.maxCapacity) {
      return res.status(409).json({ success: false, message: `${target.batchCode} is full (${seats}/${target.maxCapacity}).` });
    }

    // History stays intact: the old enrollment is closed, not deleted, and a
    // fresh active enrollment records the new cohort.
    from.status = 'Cancelled';
    await from.save();

    const enrollment = await Enrollment.create({
      student: student._id,
      course: from.course,
      batch: target._id,
      status: 'Active',
      enrolledAt: new Date(),
      accessStart: from.accessStart,
      accessUntil: from.accessUntil,
    });

    if (student.studentDetails) student.studentDetails.assignedBatch = target._id;
    await student.save();

    // Keep the legacy roster mirrors truthful for the public batch view.
    const oldBatch = await Batch.findById(from.batch);
    if (oldBatch) {
      oldBatch.enrolledStudents = (oldBatch.enrolledStudents || []).filter(
        (row) => String(row.email || '').toLowerCase() !== String(student.email).toLowerCase()
      );
      await oldBatch.save();
    }
    const alreadyListed = (target.enrolledStudents || []).some(
      (row) => String(row.email || '').toLowerCase() === String(student.email).toLowerCase()
    );
    if (!alreadyListed) {
      target.enrolledStudents.push({
        studentName: student.name,
        email: student.email,
        phone: student.phone,
        feePaid: 0,
        totalFee: 0,
        paymentStatus: 'Pending',
      });
      await target.save();
    }

    await audit(req, 'STUDENT_TRANSFER', `${student.email} moved to ${target.batchCode}`, student._id);
    await recordActivity(
      student._id,
      {
        type: 'transferred',
        title: `Moved to ${target.name || target.batchCode}`,
        detail: `Transferred from ${from.batch || 'the previous batch'} by ${req.user?.name || 'an administrator'}`,
        actorName: req.user?.name || 'Administrator',
        actorRole: req.user?.role || '',
        meta: { fromBatch: String(from.batch || ''), toBatch: String(target._id) },
      },
      req,
    );
    return res.status(200).json({
      success: true,
      enrollment: { _id: enrollment._id, batch: target._id, status: enrollment.status },
      batch: { _id: target._id, name: target.name, batchCode: target.batchCode },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Mark attendance for one class
// @route  POST /api/admin/lms/batches/:id/attendance
const markAttendance = async (req, res) => {
  try {
    const batch = await requireBatch(req, res);
    if (!batch) return undefined;

    const classSessionId = toId(req.body.classSessionId);
    if (!classSessionId) return res.status(400).json({ success: false, message: 'Pick the class to mark.' });

    const session = await ClassSession.findOne({ _id: classSessionId, batch: batch._id }).lean();
    if (!session) return res.status(404).json({ success: false, message: 'That class is not in this batch.' });

    const records = Array.isArray(req.body.records) ? req.body.records : [];
    if (!records.length) return res.status(400).json({ success: false, message: 'No attendance rows were sent.' });

    const enrollments = await Enrollment.find({ batch: batch._id }).select('student').lean();
    const enrolled = new Set(enrollments.map((row) => String(row.student)));

    const allowed = ['Present', 'Absent', 'Late', 'Excused'];
    let saved = 0;
    for (const row of records) {
      const studentId = toId(row.studentId || row.student);
      if (!studentId || !enrolled.has(String(studentId))) continue;
      const status = allowed.includes(row.status) ? row.status : 'Present';
      await AttendanceRecord.findOneAndUpdate(
        { classSession: classSessionId, student: studentId },
        {
          $set: {
            course: batch.course._id || batch.course,
            batch: batch._id,
            status,
            note: asText(row.note),
            markedBy: req.user?._id || null,
            markedAt: new Date(),
          },
        },
        { upsert: true }
      );
      saved += 1;
    }

    await audit(req, 'ATTENDANCE_MARK', `${saved} row(s) marked for ${session.title}`, classSessionId);
    return res.status(200).json({ success: true, marked: saved });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Batch analytics: enrolment, attendance, assessment performance
// @route  GET /api/admin/lms/batches/:id/analytics
const getBatchAnalytics = async (req, res) => {
  try {
    const batch = await requireBatch(req, res);
    if (!batch) return undefined;

    const [enrollments, classes, quizzes, assignments, attendance, submissions, attempts] = await Promise.all([
      Enrollment.find({ batch: batch._id }).lean(),
      ClassSession.find({ batch: batch._id }).select('status startsAt endsAt').lean(),
      Quiz.find({ batch: batch._id }).select('_id title totalMarks').lean(),
      Assignment.find({ batch: batch._id }).select('_id title totalMarks').lean(),
      AttendanceRecord.find({ batch: batch._id }).select('status').lean(),
      AssignmentSubmission.find({ batch: batch._id }).select('marks status').lean(),
      QuizAttempt.find({ batch: batch._id }).select('scorePercent passed status').lean(),
    ]);

    const attendanceSummary = attendance.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === 'Present') acc.present += 1;
        else if (row.status === 'Late') acc.late += 1;
        else if (row.status === 'Excused') acc.excused += 1;
        else acc.absent += 1;
        return acc;
      },
      { total: 0, present: 0, absent: 0, late: 0, excused: 0 }
    );
    attendanceSummary.rate = attendanceSummary.total
      ? Math.round(((attendanceSummary.present + attendanceSummary.late) / attendanceSummary.total) * 100)
      : 0;

    const evaluated = submissions.filter((row) => row.status === 'Evaluated' && row.marks !== null);
    const gradedAttempts = attempts.filter((row) => row.status !== 'Pending review');

    return res.status(200).json({
      success: true,
      analytics: {
        students: {
          total: enrollments.length,
          active: enrollments.filter((row) => row.status === 'Active').length,
          suspended: enrollments.filter((row) => row.status === 'Suspended').length,
          capacity: batch.maxCapacity || 0,
        },
        classes: {
          total: classes.length,
          completed: classes.filter((row) => row.status === 'Completed').length,
          upcoming: classes.filter((row) => row.startsAt && new Date(row.startsAt) > new Date()).length,
        },
        attendance: attendanceSummary,
        quizzes: {
          total: quizzes.length,
          attempts: attempts.length,
          averagePercent: gradedAttempts.length
            ? Math.round(gradedAttempts.reduce((sum, row) => sum + (row.scorePercent || 0), 0) / gradedAttempts.length)
            : 0,
          passRate: gradedAttempts.length
            ? Math.round((gradedAttempts.filter((row) => row.passed).length / gradedAttempts.length) * 100)
            : 0,
          pendingReview: attempts.filter((row) => row.status === 'Pending review').length,
        },
        assignments: {
          total: assignments.length,
          submissions: submissions.length,
          evaluated: evaluated.length,
          averageMarks: evaluated.length
            ? Math.round(evaluated.reduce((sum, row) => sum + Number(row.marks || 0), 0) / evaluated.length)
            : 0,
        },
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Full access history for one student (profile, sessions, activity)
// @route  GET /api/admin/lms/students/:id/activity
// @access Private (LMS_VIEW)
const getStudentActivity = async (req, res) => {
  try {
    const studentId = toId(req.params.id);
    if (!studentId) return res.status(400).json({ success: false, message: 'Invalid student id.' });

    const student = await User.findById(studentId)
      .select('-password')
      .populate('studentDetails.assignedBatch', 'name batchCode timing startDate endDate instructor')
      .lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const [enrollments, sessions, activities] = await Promise.all([
      Enrollment.find({ student: studentId })
        .populate('course', 'title slug')
        .populate('batch', 'name batchCode timing')
        .sort({ createdAt: -1 })
        .lean(),
      StudentSession.find({ student: studentId }).sort({ loginAt: -1 }).limit(100).lean(),
      StudentActivity.find({ student: studentId }).sort({ at: -1 }).limit(200).lean(),
    ]);

    const now = Date.now();
    const activeSession = sessions.find((row) => isSessionLive(row, now)) || null;
    const totalMinutes = sessions.reduce((sum, row) => {
      const start = new Date(row.loginAt).getTime();
      if (!Number.isFinite(start)) return sum;
      const end = row.logoutAt
        ? new Date(row.logoutAt).getTime()
        : Math.min(now, new Date(row.lastSeenAt || row.loginAt).getTime() + ACTIVE_WINDOW_MS);
      return sum + Math.max(0, Math.min(end - start, 24 * 60 * 60 * 1000)) / 60000;
    }, 0);

    return res.status(200).json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone || '',
        avatar: student.avatar || '',
        isActive: student.isActive !== false,
        role: student.role,
        createdAt: student.createdAt,
        enrollmentNumber: student.studentDetails?.enrollmentNumber || '',
        targetCareer: student.studentDetails?.targetCareer || '',
        lastLoginAt: student.lastLoginAt || null,
        lastLogoutAt: student.lastLogoutAt || null,
        lastSeenAt: student.lastSeenAt || null,
        lastLoginIp: student.lastLoginIp || '',
        batch: student.studentDetails?.assignedBatch || null,
      },
      stats: {
        totalLogins: sessions.length,
        activeNow: Boolean(activeSession),
        activeSessionId: activeSession?.sessionId || null,
        lastLoginAt: student.lastLoginAt || sessions[0]?.loginAt || null,
        lastLogoutAt: student.lastLogoutAt || null,
        lastSeenAt: student.lastSeenAt || sessions[0]?.lastSeenAt || null,
        totalMinutes: Math.round(totalMinutes),
        totalActivities: activities.length,
      },
      courses: enrollments.map((row) => ({
        _id: row._id,
        status: row.status,
        enrolledAt: row.enrolledAt,
        accessStart: row.accessStart || null,
        accessUntil: row.accessUntil || null,
        course: row.course ? { _id: row.course._id, title: row.course.title } : null,
        batch: row.batch
          ? { _id: row.batch._id, name: row.batch.name, batchCode: row.batch.batchCode, timing: row.batch.timing }
          : null,
      })),
      sessions: sessions.map((row) => ({
        _id: row._id,
        loginAt: row.loginAt,
        logoutAt: row.logoutAt,
        lastSeenAt: row.lastSeenAt,
        // A row is only 'Ended' when it was actually closed. An open session
        // whose heartbeat went quiet is 'Inactive', not a fake logout.
        status: isSessionLive(row, now)
          ? 'Active'
          : row.status === 'Active'
            ? 'Inactive'
            : 'Ended',
        endedReason: row.endedReason || '',
        ip: row.ip || '',
        userAgent: row.userAgent || '',
        durationMinutes: Math.max(
          0,
          Math.round(
            ((row.logoutAt ? new Date(row.logoutAt).getTime() : Math.min(now, new Date(row.lastSeenAt || row.loginAt).getTime() + ACTIVE_WINDOW_MS)) -
              new Date(row.loginAt).getTime()) /
              60000,
          ),
        ),
      })),
      activities: activities.map((row) => ({
        _id: row._id,
        type: row.type,
        title: row.title,
        detail: row.detail,
        actorName: row.actorName || '',
        at: row.at,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createBatchQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizResults,
  evaluateQuizAttempt,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  evaluateSubmission,
  createResource,
  deleteResource,
  createBatchAnnouncement,
  deleteBatchAnnouncement,
  createBatchJob,
  listBatchJobs,
  listJobApplications,
  enrollStudentInBatch,
  resetStudentPassword,
  setStudentStatus,
  updateStudentAccess,
  transferStudentBatch,
  markAttendance,
  getBatchAnalytics,
  getStudentActivity,
};
