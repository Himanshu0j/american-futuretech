/**
 * Student-facing LMS workspace: quizzes, assignments, grades, attendance,
 * resources and jobs.
 *
 * Access rule (same as the classroom controller): the student's Active
 * enrollments are the only source of truth. Batch ids are derived from those
 * enrollments on the server, so a student cannot open another cohort's quiz by
 * guessing its id, and every single-document read re-runs the guard.
 */

const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const AttendanceRecord = require('../models/AttendanceRecord');
const LmsResource = require('../models/LmsResource');
const Job = require('../models/Job');
const { currentEnrollments, allowedBatchIds } = require('../utils/lmsStudentScope');
const { sendError } = require('../utils/apiError');
const { recordActivity } = require('../utils/studentActivity');

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/** A quiz is open when it is published and the clock is inside its window. */
const quizWindow = (quiz, now = new Date()) => {
  const starts = quiz.startsAt ? new Date(quiz.startsAt) : null;
  const ends = quiz.endsAt ? new Date(quiz.endsAt) : null;
  if (starts && now < starts) return { open: false, phase: 'upcoming', starts, ends };
  if (ends && now > ends) return { open: false, phase: 'closed', starts, ends };
  return { open: Boolean(quiz.isPublished), phase: 'open', starts, ends };
};

/** Public quiz shape — never includes a correct answer. */
const presentQuiz = (quiz, attempts, now = new Date()) => {
  const window = quizWindow(quiz, now);
  const used = attempts.filter((row) => String(row.quiz) === String(quiz._id)).length;
  return {
    _id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    instructions: quiz.instructions,
    timeLimitMinutes: quiz.timeLimitMinutes,
    totalMarks: quiz.totalMarks,
    passingMarks: quiz.passingMarks,
    passingScorePercent: quiz.passingScorePercent,
    attemptsAllowed: quiz.attemptsAllowed,
    startsAt: quiz.startsAt,
    endsAt: quiz.endsAt,
    resultVisibility: quiz.resultVisibility,
    questionCount: (quiz.questions || []).length,
    status: window.open ? 'Open' : window.phase === 'upcoming' ? 'Upcoming' : 'Closed',
    attemptsUsed: used,
    attemptsLeft: Math.max(0, Number(quiz.attemptsAllowed || 1) - used),
    course: quiz.course && quiz.course.title ? { _id: quiz.course._id, title: quiz.course.title } : null,
    batch: quiz.batch && quiz.batch.name ? { _id: quiz.batch._id, name: quiz.batch.name, batchCode: quiz.batch.batchCode } : null,
  };
};

// @desc   Quizzes assigned to this student's batches
// @route  GET /api/lms/quizzes
const getMyQuizzes = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments);
    const courseIds = enrollments.map((row) => row.course?._id).filter(Boolean);

    const quizzes = batchIds.length
      ? await Quiz.find({
          isPublished: true,
          $or: [
            { batch: { $in: batchIds } },
            // Legacy course quizzes authored before batches existed.
            { batch: null, course: { $in: courseIds } },
          ],
        })
          .populate('course', 'title')
          .populate('batch', 'name batchCode')
          .sort({ startsAt: 1, createdAt: -1 })
          .lean()
      : [];

    const attempts = quizzes.length
      ? await QuizAttempt.find({ student: req.user._id, quiz: { $in: quizzes.map((quiz) => quiz._id) } })
          .select('quiz scoreMarks totalMarks scorePercent passed status submittedAt')
          .sort({ createdAt: -1 })
          .lean()
      : [];

    const now = new Date();
    return res.status(200).json({
      success: true,
      quizzes: quizzes.map((quiz) => ({
        ...presentQuiz(quiz, attempts, now),
        latestAttempt: attempts.find((row) => String(row.quiz) === String(quiz._id)) || null,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   One quiz, without answer keys, for taking it
// @route  GET /api/lms/quizzes/:id
const getQuizForAttempt = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz id.' });
    }

    const quiz = await Quiz.findById(req.params.id).populate('course', 'title').populate('batch', 'name batchCode').lean();
    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments).map(String);
    const courseIds = enrollments.map((row) => String(row.course?._id)).filter(Boolean);
    const permitted = quiz.batch ? batchIds.includes(String(quiz.batch._id)) : courseIds.includes(String(quiz.course._id));
    if (!permitted) {
      return res.status(403).json({
        success: false,
        code: 'NOT_ENROLLED',
        message: 'This quiz belongs to a batch you are not enrolled in.',
      });
    }

    const window = quizWindow(quiz);
    if (!window.open) {
      return res.status(409).json({
        success: false,
        message: window.phase === 'upcoming' ? 'This quiz has not opened yet.' : 'This quiz is closed.',
        code: window.phase.toUpperCase(),
      });
    }

    const attemptsUsed = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id });
    if (attemptsUsed >= Number(quiz.attemptsAllowed || 1)) {
      return res.status(409).json({
        success: false,
        message: 'You have used every attempt for this quiz.',
        code: 'NO_ATTEMPTS_LEFT',
      });
    }

    // Strip every field that could reveal an answer.
    const questions = (quiz.questions || []).map((question) => ({
      _id: question._id,
      questionText: question.questionText,
      type: question.type,
      options: question.options || [],
      marks: question.marks,
      imageUrl: question.imageUrl || '',
      pairs: (question.pairs || []).map((pair) => ({ left: pair.left })),
      // Matching choices are shuffled as a separate bank.
      matchingChoices: (question.pairs || []).map((pair) => pair.right).sort(() => Math.random() - 0.5),
    }));

    if (quiz.shuffleQuestions) questions.sort(() => Math.random() - 0.5);

    return res.status(200).json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        instructions: quiz.instructions,
        timeLimitMinutes: quiz.timeLimitMinutes,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        attemptsAllowed: quiz.attemptsAllowed,
        attemptsUsed,
        startsAt: quiz.startsAt,
        endsAt: quiz.endsAt,
        course: quiz.course,
        batch: quiz.batch,
        questions,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const normalise = (value) => String(value || '').trim().toLowerCase();

const sameSet = (left, right) => {
  if (left.length !== right.length) return false;
  const a = [...left].sort((x, y) => x - y);
  const b = [...right].sort((x, y) => x - y);
  return a.every((value, index) => value === b[index]);
};

/** Grade one answer; `null` means a human has to decide. */
const gradeAnswer = (question, answer) => {
  const type = question.type || 'MCQ';
  const marks = Number(question.marks ?? 1);

  if (type === 'LongAnswer') return { isCorrect: null, awardedMarks: 0 };

  if (type === 'MultipleSelect') {
    const correct = (question.correctOptionIndexes?.length ? question.correctOptionIndexes : [question.correctOptionIndex]).map(Number);
    const chosen = (answer.selectedOptionIndexes || []).map(Number);
    const isCorrect = sameSet(chosen, correct);
    return { isCorrect, awardedMarks: isCorrect ? marks : 0 };
  }

  if (type === 'MCQ' || type === 'TrueFalse') {
    const chosen = Number(answer.selectedOptionIndex ?? -1);
    const isCorrect = chosen === Number(question.correctOptionIndex);
    return { isCorrect, awardedMarks: isCorrect ? marks : 0 };
  }

  if (type === 'ShortAnswer' || type === 'FillBlank') {
    const isCorrect = Boolean(question.correctAnswer) && normalise(answer.textAnswer) === normalise(question.correctAnswer);
    return { isCorrect, awardedMarks: isCorrect ? marks : 0 };
  }

  if (type === 'Matching') {
    // The client sends `textAnswer` as JSON: [{ left, right }].
    let pairs = [];
    try {
      pairs = JSON.parse(answer.textAnswer || '[]');
    } catch {
      pairs = [];
    }
    const key = new Map((question.pairs || []).map((pair) => [normalise(pair.left), normalise(pair.right)]));
    const allCorrect =
      Array.isArray(pairs) &&
      pairs.length > 0 &&
      pairs.every((pair) => key.get(normalise(pair.left)) === normalise(pair.right));
    return { isCorrect: allCorrect, awardedMarks: allCorrect ? marks : 0 };
  }

  return { isCorrect: null, awardedMarks: 0 };
};

// @desc   Submit an attempt; objective questions are graded immediately
// @route  POST /api/lms/quizzes/:id/submit
const submitQuiz = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz id.' });
    }

    const quiz = await Quiz.findById(req.params.id).lean();
    if (!quiz || !quiz.isPublished) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments).map(String);
    const courseIds = enrollments.map((row) => String(row.course?._id)).filter(Boolean);
    const permitted = quiz.batch ? batchIds.includes(String(quiz.batch)) : courseIds.includes(String(quiz.course));
    if (!permitted) {
      return res.status(403).json({ success: false, code: 'NOT_ENROLLED', message: 'This quiz is not assigned to you.' });
    }

    const window = quizWindow(quiz);
    if (!window.open) {
      return res.status(409).json({ success: false, message: 'This quiz is not open for submission.' });
    }

    // Attempt caps belong to the batch quiz builder. Legacy course quizzes
    // predate the field and allowed a retake, so they keep that behaviour.
    const attemptsUsed = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id });
    if (quiz.batch && attemptsUsed >= Number(quiz.attemptsAllowed || 1)) {
      return res.status(409).json({ success: false, code: 'NO_ATTEMPTS_LEFT', message: 'No attempts left for this quiz.' });
    }

    const incoming = Array.isArray(req.body.answers) ? req.body.answers : [];
    const questionMap = new Map((quiz.questions || []).map((question) => [String(question._id), question]));

    let manualPending = false;
    let correctCount = 0;
    let awarded = 0;

    const answers = [];
    for (const row of incoming) {
      const question = questionMap.get(String(row.questionId));
      if (!question) continue;

      const answer = {
        questionId: question._id,
        selectedOptionIndex:
          row.selectedOptionIndex !== undefined && row.selectedOptionIndex !== null
            ? Number(row.selectedOptionIndex)
            : null,
        selectedOptionIndexes: Array.isArray(row.selectedOptionIndexes)
          ? row.selectedOptionIndexes.map(Number)
          : [],
        textAnswer: String(row.textAnswer ?? ''),
      };

      const grade = gradeAnswer(question, answer);
      answer.isCorrect = grade.isCorrect;
      answer.awardedMarks = grade.awardedMarks;
      if (grade.isCorrect === null) manualPending = true;
      if (grade.isCorrect) correctCount += 1;
      awarded += grade.awardedMarks;
      answers.push(answer);
    }

    // Unanswered questions still count toward the denominator, and a negative
    // marking rule subtracts for wrong objective answers.
    const totalMarks = Number(quiz.totalMarks || (quiz.questions || []).reduce((sum, question) => sum + Number(question.marks || 1), 0));
    const negative = Number(quiz.negativeMarking || 0);
    const wrongObjective = answers.filter((answer) => answer.isCorrect === false).length;
    const scoreMarks = Math.max(0, awarded - wrongObjective * negative);
    const scorePercent = totalMarks ? Math.round((scoreMarks / totalMarks) * 100) : 0;
    const passed = Number(quiz.passingMarks || 0) > 0
      ? scoreMarks >= Number(quiz.passingMarks)
      : scorePercent >= Number(quiz.passingScorePercent || 70);

    const attempt = await QuizAttempt.create({
      student: req.user._id,
      quiz: quiz._id,
      course: quiz.course,
      batch: quiz.batch || null,
      answers,
      totalQuestions: (quiz.questions || []).length,
      correctAnswersCount: correctCount,
      scorePercent,
      scoreMarks,
      totalMarks,
      passed,
      status: manualPending ? 'Pending review' : 'Auto-graded',
      timeSpentSeconds: Math.max(0, Number(req.body.timeSpentSeconds || 0)),
      submittedAt: new Date(),
    });

    const canReveal = quiz.resultVisibility !== 'Hidden' && !manualPending;
    // 200, not 201: the lesson player and the existing client contract read a
    // submission as a result, not as a newly created resource.
    return res.status(200).json({
      success: true,
      // Legacy top-level fields: the lesson player's quiz view reads these
      // directly, so the richer batch response stays backwards compatible.
      passed,
      scorePercent,
      correctAnswersCount: correctCount,
      totalQuestions: (quiz.questions || []).length,
      attemptId: attempt._id,
      evaluatedAnswers: answers.map((answer) => {
        const question = questionMap.get(String(answer.questionId)) || {};
        return {
          questionId: answer.questionId,
          questionText: question.questionText,
          selectedOptionIndex: answer.selectedOptionIndex,
          correctOptionIndex: question.correctOptionIndex,
          explanation: question.explanation,
          isCorrect: answer.isCorrect,
        };
      }),
      attempt: {
        _id: attempt._id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        attemptsLeft: Math.max(0, Number(quiz.attemptsAllowed || 1) - (attemptsUsed + 1)),
      },
      result: canReveal
        ? {
            scoreMarks,
            totalMarks,
            scorePercent,
            passed,
            correctAnswersCount: correctCount,
            totalQuestions: attempt.totalQuestions,
          }
        : null,
      message: manualPending
        ? 'Submitted. Some answers need an instructor review, so your final marks will appear later.'
        : 'Quiz submitted.',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   This student's quiz results
// @route  GET /api/lms/quiz-results
const getMyQuizResults = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user._id })
      .populate('quiz', 'title totalMarks passingMarks resultVisibility batch')
      .populate('batch', 'name batchCode')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      results: attempts.map((row) => ({
        _id: row._id,
        quiz: row.quiz ? { _id: row.quiz._id, title: row.quiz.title, totalMarks: row.quiz.totalMarks } : null,
        batch: row.batch ? { _id: row.batch._id, name: row.batch.name, batchCode: row.batch.batchCode } : null,
        scoreMarks: row.scoreMarks ?? 0,
        totalMarks: row.totalMarks ?? 0,
        scorePercent: row.scorePercent ?? 0,
        passed: Boolean(row.passed),
        status: row.status,
        submittedAt: row.submittedAt || row.createdAt,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Assignments for this student's batches
// @route  GET /api/lms/assignments
const getMyAssignments = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments);

    const assignments = batchIds.length
      ? await Assignment.find({ batch: { $in: batchIds }, status: { $in: ['Published', 'Closed'] } })
          .populate('course', 'title')
          .populate('batch', 'name batchCode')
          .sort({ dueAt: 1, createdAt: -1 })
          .lean()
      : [];

    const submissions = assignments.length
      ? await AssignmentSubmission.find({
          student: req.user._id,
          assignment: { $in: assignments.map((row) => row._id) },
        }).lean()
      : [];
    const submissionMap = new Map(submissions.map((row) => [String(row.assignment), row]));

    const now = new Date();
    return res.status(200).json({
      success: true,
      assignments: assignments.map((assignment) => {
        const submission = submissionMap.get(String(assignment._id));
        return {
          _id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          instructions: assignment.instructions,
          dueAt: assignment.dueAt,
          totalMarks: assignment.totalMarks,
          attachments: assignment.attachments || [],
          allowLateSubmission: assignment.allowLateSubmission,
          status: assignment.status,
          isOverdue: Boolean(assignment.dueAt && new Date(assignment.dueAt) < now && !submission),
          course: assignment.course,
          batch: assignment.batch,
          submission: submission
            ? {
                _id: submission._id,
                submittedAt: submission.submittedAt,
                isLate: submission.isLate,
                status: submission.status,
                marks: submission.marks,
                feedback: submission.feedback,
                text: submission.text,
                files: submission.files || [],
              }
            : null,
        };
      }),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Submit (or resubmit) an assignment
// @route  POST /api/lms/assignments/:id/submit
const submitAssignment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment id.' });
    }

    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment || assignment.status === 'Draft') {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments).map(String);
    if (!batchIds.includes(String(assignment.batch))) {
      return res.status(403).json({
        success: false,
        code: 'NOT_ENROLLED',
        message: 'This assignment is not assigned to your batch.',
      });
    }

    if (assignment.status === 'Closed') {
      return res.status(409).json({ success: false, message: 'This assignment is closed.' });
    }

    const text = String(req.body.text || '').trim();
    const files = Array.isArray(req.body.files)
      ? req.body.files
          .map((row) => ({
            title: String(row?.title || '').trim(),
            url: String(row?.url || '').trim(),
            fileType: String(row?.fileType || 'LINK').toUpperCase().slice(0, 12),
          }))
          .filter((row) => row.title && isHttpUrl(row.url))
      : [];

    if (!text && !files.length) {
      return res.status(400).json({ success: false, message: 'Add your answer or at least one file link.' });
    }

    const now = new Date();
    const isLate = Boolean(assignment.dueAt && new Date(assignment.dueAt) < now);
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(409).json({ success: false, message: 'The deadline has passed and late submission is not allowed.' });
    }

    const existing = await AssignmentSubmission.findOne({ assignment: assignment._id, student: req.user._id });
    if (existing?.status === 'Evaluated') {
      return res.status(409).json({ success: false, message: 'This submission is already graded and cannot be replaced.' });
    }

    const payload = {
      assignment: assignment._id,
      student: req.user._id,
      course: assignment.course,
      batch: assignment.batch,
      text,
      files,
      submittedAt: now,
      isLate,
      status: 'Submitted',
    };

    const submission = existing
      ? await AssignmentSubmission.findByIdAndUpdate(existing._id, payload, { new: true })
      : await AssignmentSubmission.create(payload);

    recordActivity(
      req.user._id,
      {
        type: 'assignment_submitted',
        title: `Submitted assignment: ${assignment.title}`,
        detail: isLate ? 'Submitted after the deadline' : 'Submitted on time',
        meta: { assignmentId: String(assignment._id), isLate },
      },
      req,
    );

    return res.status(201).json({
      success: true,
      message: isLate ? 'Submitted late — your instructor can still grade it.' : 'Assignment submitted.',
      submission: {
        _id: submission._id,
        submittedAt: submission.submittedAt,
        isLate: submission.isLate,
        status: submission.status,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Grades across quizzes and assignments
// @route  GET /api/lms/grades
const getMyGrades = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments);

    const [attempts, submissions] = await Promise.all([
      QuizAttempt.find({ student: req.user._id })
        .populate('quiz', 'title totalMarks passingMarks')
        .populate('batch', 'name batchCode')
        .sort({ createdAt: -1 })
        .lean(),
      AssignmentSubmission.find({ student: req.user._id })
        .populate('assignment', 'title totalMarks dueAt')
        .populate('batch', 'name batchCode')
        .sort({ submittedAt: -1 })
        .lean(),
    ]);

    const scopedAttempts = attempts.filter(
      (row) => !row.batch || batchIds.some((id) => String(id) === String(row.batch._id))
    );
    const scopedSubmissions = submissions.filter(
      (row) => !row.batch || batchIds.some((id) => String(id) === String(row.batch._id))
    );

    const quizPercent = scopedAttempts.length
      ? Math.round(scopedAttempts.reduce((sum, row) => sum + Number(row.scorePercent || 0), 0) / scopedAttempts.length)
      : 0;
    const evaluated = scopedSubmissions.filter((row) => row.status === 'Evaluated' && row.marks !== null);
    const assignmentPercent = evaluated.length
      ? Math.round(
          evaluated.reduce(
            (sum, row) => sum + (Number(row.marks || 0) / Math.max(1, Number(row.assignment?.totalMarks || 1))) * 100,
            0
          ) / evaluated.length
        )
      : 0;
    const overall = Math.round(
      ((quizPercent || 0) * (scopedAttempts.length || 0) + (assignmentPercent || 0) * (evaluated.length || 0)) /
        Math.max(1, scopedAttempts.length + evaluated.length)
    );

    return res.status(200).json({
      success: true,
      summary: {
        quizAverage: quizPercent,
        assignmentAverage: assignmentPercent,
        overall,
        quizzesTaken: scopedAttempts.length,
        assignmentsEvaluated: evaluated.length,
        pendingReviews: scopedAttempts.filter((row) => row.status === 'Pending review').length,
      },
      quizzes: scopedAttempts.map((row) => ({
        _id: row._id,
        title: row.quiz?.title || 'Quiz',
        batch: row.batch ? row.batch.name || row.batch.batchCode : '',
        scoreMarks: row.scoreMarks ?? 0,
        totalMarks: row.totalMarks ?? row.quiz?.totalMarks ?? 0,
        scorePercent: row.scorePercent ?? 0,
        passed: Boolean(row.passed),
        status: row.status,
        submittedAt: row.submittedAt || row.createdAt,
      })),
      assignments: scopedSubmissions.map((row) => ({
        _id: row._id,
        title: row.assignment?.title || 'Assignment',
        batch: row.batch ? row.batch.name || row.batch.batchCode : '',
        marks: row.marks,
        totalMarks: row.assignment?.totalMarks ?? 0,
        status: row.status,
        submittedAt: row.submittedAt,
        feedback: row.feedback,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   This student's attendance
// @route  GET /api/lms/attendance
const getMyAttendance = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments);

    const records = batchIds.length
      ? await AttendanceRecord.find({ student: req.user._id, batch: { $in: batchIds } })
          .populate('classSession', 'title classDate startsAt')
          .populate('batch', 'name batchCode')
          .sort({ markedAt: -1 })
          .lean()
      : [];

    const summary = records.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === 'Present') acc.present += 1;
        else if (row.status === 'Absent') acc.absent += 1;
        else if (row.status === 'Late') acc.late += 1;
        else if (row.status === 'Excused') acc.excused += 1;
        return acc;
      },
      { total: 0, present: 0, absent: 0, late: 0, excused: 0 }
    );
    summary.rate = summary.total ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 0;

    return res.status(200).json({
      success: true,
      summary,
      records: records.map((row) => ({
        _id: row._id,
        status: row.status,
        markedAt: row.markedAt,
        class: row.classSession
          ? { _id: row.classSession._id, title: row.classSession.title, classDate: row.classSession.classDate }
          : null,
        batch: row.batch ? { _id: row.batch._id, name: row.batch.name, batchCode: row.batch.batchCode } : null,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Resources published to this student's batches
// @route  GET /api/lms/resources
const getMyResources = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments);

    const resources = batchIds.length
      ? await LmsResource.find({ batch: { $in: batchIds }, isPublished: true })
          .populate('batch', 'name batchCode')
          .sort({ createdAt: -1 })
          .lean()
      : [];

    return res.status(200).json({
      success: true,
      resources: resources.map((row) => ({
        _id: row._id,
        title: row.title,
        description: row.description,
        url: row.url,
        fileType: row.fileType,
        category: row.category,
        batch: row.batch ? { _id: row.batch._id, name: row.batch.name, batchCode: row.batch.batchCode } : null,
        createdAt: row.createdAt,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Jobs published for this student's batches (+ open roles)
// @route  GET /api/lms/jobs
const getMyJobs = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments);
    const courseIds = enrollments.map((row) => row.course?._id).filter(Boolean);

    const jobs = await Job.find({
      isPublished: true,
      isActive: true,
      isArchived: { $ne: true },
      $or: [
        { targetBatches: { $in: batchIds } },
        { targetCourses: { $in: courseIds } },
        // Roles with no targeting stay open to everyone, matching the public board.
        // Legacy jobs predate both arrays, so "missing" counts as untargeted too.
        { targetBatches: { $size: 0 }, targetCourses: { $size: 0 } },
        { targetBatches: { $exists: false }, targetCourses: { $exists: false } },
      ],
    })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(60)
      .lean();

    return res.status(200).json({
      success: true,
      jobs: jobs.map((job) => ({
        _id: job._id,
        title: job.title,
        company: job.company,
        companyLogo: job.companyLogo,
        location: job.location,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        salaryRange: job.salaryRange,
        skills: job.skills || [],
        description: job.description,
        applyLink: job.applyLink,
        deadline: job.deadline,
        createdAt: job.createdAt,
        targeted: (job.targetBatches || []).length > 0,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getMyQuizzes,
  getQuizForAttempt,
  submitQuiz,
  getMyQuizResults,
  getMyAssignments,
  submitAssignment,
  getMyGrades,
  getMyAttendance,
  getMyResources,
  getMyJobs,
};
