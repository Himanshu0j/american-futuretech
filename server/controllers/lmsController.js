const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const { checkCourseAccess, denyResponse } = require('../utils/access');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Certificate = require('../models/Certificate');
const Announcement = require('../models/Announcement');
const LmsSetting = require('../models/LmsSetting');
const { sendError } = require('../utils/apiError');

// @desc    Get student dashboard summary
// @route   GET /api/lms/dashboard
// @access  Private (Student)
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrollments = await Enrollment.find({ student: studentId, status: 'Active' })
      .populate('course')
      .populate('batch');

    const courseIds = enrollments.map(e => e.course?._id).filter(Boolean);

    const progressList = await Progress.find({ student: studentId, course: { $in: courseIds } })
      .populate('lastAccessedLesson');

    const certificates = await Certificate.find({ student: studentId });
    const attempts = await QuizAttempt.find({ student: studentId }).sort({ createdAt: -1 }).limit(5);

    // Admin → LMS Settings wording, so the dashboard greeting is editable without code.
    const settings = await LmsSetting.findOne();

    // Calculate overall statistics
    const totalEnrolled = enrollments.length;
    const avgProgress = progressList.length > 0
      ? Math.round(progressList.reduce((acc, curr) => acc + (curr.progressPercent || 0), 0) / progressList.length)
      : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalEnrolled,
        avgProgress,
        certificatesEarned: certificates.length,
        quizzesTaken: attempts.length,
      },
      enrollments: enrollments.map(enr => {
        const prog = progressList.find(p => p.course.toString() === enr.course._id.toString());
        return {
          id: enr._id,
          course: enr.course,
          batch: enr.batch,
          enrolledAt: enr.enrolledAt,
          progressPercent: prog ? prog.progressPercent : 0,
          completedLessonsCount: prog ? prog.completedLessons.length : 0,
          lastAccessedLesson: prog?.lastAccessedLesson || null,
        };
      }),
      recentCertificates: certificates,
      recentQuizAttempts: attempts,
      lms: {
        welcomeMessage: settings?.welcomeMessage || '',
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get all courses enrolled by the student
// @route   GET /api/lms/my-courses
// @access  Private (Student)
const getMyCourses = async (req, res) => {
  try {
    const studentId = req.user._id;
    // Only ACTIVE enrollments are listed: revoking access in the admin panel
    // cancels the enrollment and the course must disappear from the classroom.
    const enrollments = await Enrollment.find({ student: studentId, status: 'Active' })
      .populate('course')
      .populate('batch')
      .sort({ enrolledAt: -1 });

    const courseIds = enrollments.map(e => e.course?._id).filter(Boolean);
    const progressList = await Progress.find({ student: studentId, course: { $in: courseIds } });

    const coursesWithProgress = enrollments.map(enr => {
      const prog = progressList.find(p => p.course.toString() === enr.course?._id.toString());
      return {
        enrollmentId: enr._id,
        course: enr.course,
        batch: enr.batch,
        status: enr.status,
        enrolledAt: enr.enrolledAt,
        progressPercent: prog ? prog.progressPercent : 0,
        isCompleted: prog ? prog.isCompleted : false,
      };
    });

    return res.status(200).json({
      success: true,
      courses: coursesWithProgress,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get learning player details for a course
// @route   GET /api/lms/courses/:courseId/learn
// @access  Private (Student)
const getCourseLearnData = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // ACCESS CONTROL: a student may only open a course they are enrolled in.
    // This used to silently auto-enroll the caller, which meant any logged-in
    // student could read every course's lessons by guessing the id. It is now a
    // hard 403 — assignment is staff-only (Admin → Enrolled Students).
    const access = await checkCourseAccess(req.user, courseId);
    if (!access.allowed) {
      return denyResponse(res, access.reason);
    }

    const modules = await Module.find({ course: courseId, isPublished: true }).sort({ order: 1, moduleNumber: 1 });
    const lessons = await Lesson.find({ course: courseId, isPublished: true }).sort({ order: 1, lessonNumber: 1 });
    const quizzes = await Quiz.find({ course: courseId, isPublished: true });

    let progress = await Progress.findOne({ student: studentId, course: courseId });
    if (!progress) {
      progress = await Progress.create({
        student: studentId,
        course: courseId,
        completedLessons: [],
        progressPercent: 0,
      });
    }

    const completedLessonIds = progress.completedLessons.map(id => id.toString());

    const curriculum = modules.map(mod => {
      const modLessons = lessons.filter(l => l.module.toString() === mod._id.toString()).map(l => ({
        ...l.toObject(),
        isCompleted: completedLessonIds.includes(l._id.toString()),
      }));
      const modQuiz = quizzes.find(q => q.module && q.module.toString() === mod._id.toString());
      return {
        ...mod.toObject(),
        lessons: modLessons,
        quiz: modQuiz || null,
      };
    });

    return res.status(200).json({
      success: true,
      course,
      progress: {
        completedLessons: completedLessonIds,
        progressPercent: progress.progressPercent,
        isCompleted: progress.isCompleted,
        lastAccessedLesson: progress.lastAccessedLesson,
      },
      curriculum,
      totalLessons: lessons.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get specific lesson details for playback
// @route   GET /api/lms/lessons/:lessonId
// @access  Private (Student)
const getLessonDetails = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId)
      .populate('course', 'title slug')
      .populate('module', 'title moduleNumber');

    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

    // ACCESS CONTROL: lesson content is only served for an assigned course.
    const lessonAccess = await checkCourseAccess(req.user, lesson.course?._id || lesson.course);
    if (!lessonAccess.allowed) return denyResponse(res, lessonAccess.reason);

    // Update last accessed lesson in progress
    await Progress.findOneAndUpdate(
      { student: req.user._id, course: lesson.course._id },
      { lastAccessedLesson: lesson._id },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      lesson,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Mark a lesson as completed
// @route   POST /api/lms/lessons/:lessonId/complete
// @access  Private (Student)
const completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user._id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

    // ACCESS CONTROL: progress may only be written into an assigned course.
    const progressAccess = await checkCourseAccess(req.user, lesson.course);
    if (!progressAccess.allowed) return denyResponse(res, progressAccess.reason);

    let progress = await Progress.findOne({ student: studentId, course: lesson.course });
    if (!progress) {
      progress = await Progress.create({
        student: studentId,
        course: lesson.course,
        completedLessons: [lesson._id],
        progressPercent: 0,
      });
    } else {
      if (!progress.completedLessons.includes(lesson._id)) {
        progress.completedLessons.push(lesson._id);
      }
    }

    // Recalculate percentage
    const totalLessons = await Lesson.countDocuments({ course: lesson.course, isPublished: true });
    const completedCount = progress.completedLessons.length;
    const percent = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 100;

    progress.progressPercent = percent;
    progress.lastAccessedLesson = lesson._id;

    let certificateCreated = null;

    if (percent === 100 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completionDate = new Date();

      // Check if certificate already exists
      const existingCert = await Certificate.findOne({ student: studentId, course: lesson.course });
      if (!existingCert) {
        const course = await Course.findById(lesson.course);
        const certId = 'AFT-CERT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        certificateCreated = await Certificate.create({
          certificateId: certId,
          student: studentId,
          studentName: req.user.name,
          course: course._id,
          courseTitle: course.title,
          verificationUrl: `/certificate/${certId}`,
        });
      }
    }

    await progress.save();

    return res.status(200).json({
      success: true,
      message: percent === 100 ? '🎉 Congratulations! You have completed this course and earned your certificate!' : 'Lesson marked complete',
      progressPercent: percent,
      completedLessons: progress.completedLessons,
      isCompleted: progress.isCompleted,
      certificate: certificateCreated,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Submit quiz answers and auto-grade
// @route   POST /api/lms/quizzes/:quizId/submit
// @access  Private (Student)
const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeSpentSeconds } = req.body;
    const studentId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // ACCESS CONTROL: quizzes belong to a course the student must be assigned to.
    const quizAccess = await checkCourseAccess(req.user, quiz.course);
    if (!quizAccess.allowed) return denyResponse(res, quizAccess.reason);

    let correctCount = 0;
    const evaluatedAnswers = quiz.questions.map((q, idx) => {
      const studentAnswer = answers?.find(a => String(a?.questionId) === q._id.toString()) || {};
      const isCorrect = optionIndexOf(studentAnswer.selectedOptionIndex) === q.correctOptionIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: q._id,
        questionText: q.questionText,
        selectedOptionIndex: optionIndexOf(studentAnswer.selectedOptionIndex),
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const total = quiz.questions.length;
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = scorePercent >= quiz.passingScorePercent;

    const attempt = await QuizAttempt.create({
      student: studentId,
      quiz: quiz._id,
      course: quiz.course,
      answers: evaluatedAnswers.map(a => ({
        questionId: a.questionId,
        selectedOptionIndex: a.selectedOptionIndex,
        isCorrect: a.isCorrect,
      })),
      totalQuestions: total,
      correctAnswersCount: correctCount,
      scorePercent,
      passed,
      timeSpentSeconds: timeSpentSeconds || 60,
    });

    return res.status(200).json({
      success: true,
      passed,
      scorePercent,
      correctAnswersCount: correctCount,
      totalQuestions: total,
      evaluatedAnswers,
      attemptId: attempt._id,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get student's issued certificates
// @route   GET /api/lms/certificates
// @access  Private (Student)
/**
 * The option a student picked, as an integer — or -1 for "no answer".
 *
 * Grading used to compare `studentAnswer.selectedOptionIndex` with `===`, so a
 * form that serialised its radio value as the string "1" scored every question
 * wrong and the student was told they failed a quiz they answered correctly.
 * Only a real integer or a plain digit string is accepted; anything else ("",
 * null, "2x", an object) is a non-answer rather than option zero.
 */
const optionIndexOf = (value) => {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
  return -1;
};

const getMyCertificates = async (req, res) => {
  try {
    // The holder sees their own credential, not the staff member who signed it
    // off or the internal reason note that goes with a withdrawal.
    const certificates = await Certificate.find({ student: req.user._id })
      .select('-revokedBy -revokedReason')
      .populate('course', 'title slug cardTheme thumbnail')
      .sort({ issueDate: -1 });

    return res.status(200).json({
      success: true,
      certificates,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Announcements the signed-in student should see
// @route   GET /api/lms/announcements
// @access  Private (Student)
const getMyAnnouncements = async (req, res) => {
  try {
    const setting = await LmsSetting.findOne();
    if (setting && setting.showAnnouncementsInLms === false) {
      return res.status(200).json({ success: true, count: 0, announcements: [] });
    }

    // Targeted notices only reach the students they were meant for.
    const enrollments = await Enrollment.find({ student: req.user._id }).select('course batch').lean();
    const courseIds = enrollments.map((row) => row.course).filter(Boolean);
    const batchIds = enrollments.map((row) => row.batch).filter(Boolean);

    const announcements = await Announcement.find({
      isPublished: true,
      $or: [
        { audience: 'All Students' },
        { audience: 'Course', course: { $in: courseIds } },
        { audience: 'Batch', batch: { $in: batchIds } },
      ],
    })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Verify certificate publicly
// @route   GET /api/lms/certificate/:certificateId
// @access  Public
const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    // The holder's email is deliberately NOT selected: this endpoint is public,
    // and a certificate is proof of a course, never a reason to publish a
    // student's contact details. `studentName` on the certificate already
    // carries the name this registry needs to display.
    const cert = await Certificate.findOne({ certificateId: certificateId.toUpperCase() })
      .populate('student', 'name avatar')
      .populate('course', 'title duration category');

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate ID not recognized in American FutureTech verification registry.',
      });
    }

    // A showcase record resolves, but it is labelled as such so no screen can
    // render it as a conferred credential. The flag lives on the document (see
    // models/Certificate.js), so it survives any future redesign of this page.
    const isSample = cert.isSample === true;
    const isRevoked = Boolean(cert.revokedAt);

    // An explicit whitelist, never the whole document. The schema also carries
    // the staff name/email that revoked the credential and an internal reason
    // note; echoing the document would publish those the day anyone adds a new
    // field. This endpoint answers one question: is this credential real?
    const course = cert.course || null;

    return res.status(200).json({
      success: true,
      sample: isSample,
      revoked: isRevoked,
      status: isSample ? 'sample' : isRevoked ? 'revoked' : 'valid',
      notice: isSample
        ? 'Sample credential record kept for demonstration. It is not evidence of a conferred qualification.'
        : isRevoked
          ? 'This credential has been withdrawn by American FutureTech and is no longer valid.'
          : null,
      certificate: {
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        student: cert.student ? { name: cert.student.name, avatar: cert.student.avatar } : null,
        courseTitle: cert.courseTitle,
        course: course ? { title: course.title, duration: course.duration, category: course.category } : null,
        grade: cert.grade,
        accreditationBody: cert.accreditationBody,
        issueDate: cert.issueDate,
        verificationUrl: cert.verificationUrl,
        revokedAt: cert.revokedAt || null,
        isSample,
        status: isSample ? 'sample' : isRevoked ? 'revoked' : 'valid',
      },
    });
  } catch (error) {
    console.error('[Certificate verify]', error.message);
    return res.status(500).json({ success: false, message: 'Could not verify this certificate right now.' });
  }
};

module.exports = {
  getStudentDashboard,
  getMyCourses,
  getCourseLearnData,
  getLessonDetails,
  completeLesson,
  submitQuiz,
  getMyCertificates,
  getMyAnnouncements,
  verifyCertificate,
};
