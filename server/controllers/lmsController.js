const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const { checkCourseAccess, denyResponse } = require('../utils/access');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Certificate = require('../models/Certificate');

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
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
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
      const studentAnswer = answers?.find(a => a.questionId === q._id.toString()) || { selectedOptionIndex: -1 };
      const isCorrect = studentAnswer.selectedOptionIndex === q.correctOptionIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: q._id,
        questionText: q.questionText,
        selectedOptionIndex: studentAnswer.selectedOptionIndex,
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's issued certificates
// @route   GET /api/lms/certificates
// @access  Private (Student)
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('course', 'title slug cardTheme thumbnail')
      .sort({ issueDate: -1 });

    return res.status(200).json({
      success: true,
      certificates,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify certificate publicly
// @route   GET /api/lms/certificate/:certificateId
// @access  Public
const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId: certificateId.toUpperCase() })
      .populate('student', 'name email avatar')
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

    return res.status(200).json({
      success: true,
      sample: isSample,
      notice: isSample
        ? 'Sample credential record kept for demonstration. It is not evidence of a conferred qualification.'
        : null,
      certificate: cert,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
  verifyCertificate,
};
