/**
 * LMS Control Centre — the API behind Admin → Academy / LMS.
 *
 * Everything the client needs to run the student portal from one place:
 * dashboard reporting, enrollment/access control, lesson-level progress
 * control, announcements, and the LMS defaults/certificate wording.
 *
 * Every write records an AuditLog entry, so "who unenrolled that student" is
 * answerable later.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');
const Announcement = require('../models/Announcement');
const LmsSetting = require('../models/LmsSetting');
const SupportTicket = require('../models/SupportTicket');
const AuditLog = require('../models/AuditLog');
const { sendError } = require('../utils/apiError');

const logAudit = async (req, action, details, entityId) => {
  try {
    await AuditLog.create({
      actorName: req.user?.name || 'System',
      actorRole: req.user?.role || 'ADMIN',
      action,
      entity: 'LMS',
      entityId: entityId ? String(entityId) : undefined,
      details,
    });
  } catch {
    /* auditing must never break the operation */
  }
};

const toId = (value) => (mongoose.Types.ObjectId.isValid(value) ? value : null);

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Headline numbers for the LMS dashboard
// @route   GET /api/admin/lms/overview
// @access  Private (LMS_VIEW)
const getLmsOverview = async (req, res) => {
  try {
    const [
      studentCount,
      courseCount,
      lessonCount,
      quizCount,
      enrollmentCount,
      activeEnrollments,
      certificateCount,
      revokedCount,
      pendingTickets,
      progressRows,
      attemptRows,
      recentEnrollments,
      announcements,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['STUDENT', 'Student'] } }),
      Course.countDocuments({}),
      Lesson.countDocuments({}),
      Quiz.countDocuments({}),
      Enrollment.countDocuments({}),
      Enrollment.countDocuments({ status: 'Active' }),
      Certificate.countDocuments({ revokedAt: null }),
      Certificate.countDocuments({ revokedAt: { $ne: null } }),
      SupportTicket.countDocuments({ status: { $in: ['Open', 'In Progress'] } }),
      Progress.find({}).select('progressPercent isCompleted').lean(),
      QuizAttempt.find({}).select('passed scorePercent').lean(),
      Enrollment.find({})
        .populate('student', 'name email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Announcement.find({}).sort({ pinned: -1, createdAt: -1 }).limit(5).lean(),
    ]);

    const completed = progressRows.filter((row) => row.isCompleted).length;
    const avgProgress = progressRows.length
      ? Math.round(progressRows.reduce((sum, row) => sum + (row.progressPercent || 0), 0) / progressRows.length)
      : 0;
    const passRate = attemptRows.length
      ? Math.round((attemptRows.filter((row) => row.passed).length / attemptRows.length) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      stats: {
        students: studentCount,
        courses: courseCount,
        lessons: lessonCount,
        quizzes: quizCount,
        enrollments: enrollmentCount,
        activeEnrollments,
        certificates: certificateCount,
        revokedCertificates: revokedCount,
        pendingTickets,
        trackedProgress: progressRows.length,
        completedCourses: completed,
        averageProgressPercent: avgProgress,
        quizAttempts: attemptRows.length,
        quizPassRatePercent: passRate,
      },
      recentEnrollments: recentEnrollments.map((row) => ({
        id: row._id,
        studentName: row.student?.name || row.studentName || 'Unknown',
        studentEmail: row.student?.email || row.email || '',
        courseTitle: row.course?.title || row.courseTitle || 'Unknown course',
        status: row.status,
        createdAt: row.createdAt,
      })),
      announcements,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Enrollments & access
// ─────────────────────────────────────────────────────────────────────────────

// @desc    List enrollments with the student's progress attached
// @route   GET /api/admin/lms/enrollments
// @access  Private (LMS_VIEW)
const listEnrollments = async (req, res) => {
  try {
    const { courseId, batchId, status, search } = req.query;
    const query = {};
    if (toId(courseId)) query.course = courseId;
    if (toId(batchId)) query.batch = batchId;
    if (status) query.status = status;

    let rows = await Enrollment.find(query)
      .populate('student', 'name email phone isActive')
      .populate('course', 'title slug duration')
      .populate('batch', 'batchCode status startDate')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    if (search) {
      const needle = String(search).toLowerCase();
      rows = rows.filter(
        (row) =>
          (row.student?.name || '').toLowerCase().includes(needle) ||
          (row.student?.email || '').toLowerCase().includes(needle) ||
          (row.course?.title || '').toLowerCase().includes(needle)
      );
    }

    const progressRows = await Progress.find({}).select('student course progressPercent isCompleted').lean();
    const progressMap = new Map(progressRows.map((p) => [`${p.student}-${p.course}`, p]));

    const enrollments = rows.map((row) => {
      const progress = progressMap.get(`${row.student?._id}-${row.course?._id}`);
      return {
        ...row,
        progressPercent: progress?.progressPercent ?? 0,
        isCompleted: progress?.isCompleted ?? false,
      };
    });

    return res.status(200).json({ success: true, count: enrollments.length, enrollments });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Enroll a student in a course (idempotent)
// @route   POST /api/admin/lms/enrollments
// @access  Private (LMS_ENROLL_EDIT)
const createEnrollment = async (req, res) => {
  try {
    const { studentId, courseId, batchId, status } = req.body || {};
    if (!toId(studentId) || !toId(courseId)) {
      return res.status(400).json({ success: false, message: 'A valid studentId and courseId are required.' });
    }

    const [student, course] = await Promise.all([User.findById(studentId), Course.findById(courseId)]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const enrollment = await Enrollment.findOneAndUpdate(
      { student: student._id, course: course._id },
      {
        $set: { batch: toId(batchId) ? batchId : null, status: status || 'Active' },
        $setOnInsert: { enrolledAt: new Date() },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // A progress row makes the student show up on the LMS dashboard immediately.
    await Progress.findOneAndUpdate(
      { student: student._id, course: course._id },
      { $setOnInsert: { completedLessons: [], progressPercent: 0 } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    await logAudit(req, 'LMS_ENROLLMENT_CREATED', `${student.name} enrolled in ${course.title}`, enrollment._id);
    return res.status(201).json({ success: true, enrollment });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Update an enrollment (status / batch)
// @route   PUT /api/admin/lms/enrollments/:id
// @access  Private (LMS_ENROLL_EDIT)
const updateEnrollment = async (req, res) => {
  try {
    const { status, batchId } = req.body || {};
    const patch = {};
    if (status) patch.status = status;
    if (batchId !== undefined) patch.batch = toId(batchId) ? batchId : null;

    const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    await logAudit(req, 'LMS_ENROLLMENT_UPDATED', `Enrollment ${enrollment._id} set to ${enrollment.status}`, enrollment._id);
    return res.status(200).json({ success: true, enrollment });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Remove a student's access to one course (enrollment + progress)
// @route   DELETE /api/admin/lms/enrollments/:id
// @access  Private (LMS_ENROLL_EDIT)
const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    await Progress.deleteOne({ student: enrollment.student, course: enrollment.course });
    await enrollment.deleteOne();

    await logAudit(
      req,
      'LMS_ENROLLMENT_REMOVED',
      `Access removed for student ${enrollment.student} on course ${enrollment.course}`,
      enrollment._id
    );
    return res.status(200).json({ success: true, message: 'Access removed' });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Quiz attempts
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Recent quiz attempts (score review)
// @route   GET /api/admin/lms/quiz-attempts
// @access  Private (LMS_VIEW)
const listQuizAttempts = async (req, res) => {
  try {
    const { courseId, quizId } = req.query;
    const query = {};
    if (toId(courseId)) query.course = courseId;
    if (toId(quizId)) query.quiz = quizId;

    const attempts = await QuizAttempt.find(query)
      .populate('student', 'name email')
      .populate('quiz', 'title passingScorePercent')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    const rows = attempts.map((attempt) => ({
      id: attempt._id,
      studentId: attempt.student?._id,
      studentName: attempt.student?.name || 'Unknown',
      studentEmail: attempt.student?.email || '',
      quizId: attempt.quiz?._id,
      quizTitle: attempt.quiz?.title || 'Quiz removed',
      courseId: attempt.course?._id,
      courseTitle: attempt.course?.title || 'Unknown course',
      scorePercent: attempt.scorePercent,
      correctAnswersCount: attempt.correctAnswersCount,
      totalQuestions: attempt.totalQuestions,
      passed: Boolean(attempt.passed),
      timeSpentSeconds: attempt.timeSpentSeconds || 0,
      submittedAt: attempt.createdAt,
    }));

    const passed = rows.filter((row) => row.passed).length;

    return res.status(200).json({
      success: true,
      count: rows.length,
      passRatePercent: rows.length ? Math.round((passed / rows.length) * 100) : 0,
      attempts: rows,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Progress
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Per-student progress for a course (or every course)
// @route   GET /api/admin/lms/progress
// @access  Private (LMS_VIEW)
const listProgress = async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = toId(courseId) ? { course: courseId } : {};

    const rows = await Progress.find(query)
      .populate('student', 'name email isActive')
      .populate('course', 'title slug')
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();

    const courseIds = [...new Set(rows.map((row) => String(row.course?._id)).filter(Boolean))];
    const lessonTotals = await Lesson.aggregate([
      { $match: { course: { $in: courseIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: '$course', total: { $sum: 1 } } },
    ]);
    const totalMap = new Map(lessonTotals.map((row) => [String(row._id), row.total]));

    const progress = rows.map((row) => ({
      id: row._id,
      studentId: row.student?._id,
      studentName: row.student?.name || 'Unknown',
      studentEmail: row.student?.email || '',
      isActive: row.student?.isActive !== false,
      courseId: row.course?._id,
      courseTitle: row.course?.title || 'Unknown course',
      completedLessons: (row.completedLessons || []).length,
      totalLessons: totalMap.get(String(row.course?._id)) || 0,
      progressPercent: row.progressPercent || 0,
      isCompleted: Boolean(row.isCompleted),
      completionDate: row.completionDate || null,
      lastActivity: row.updatedAt,
    }));

    return res.status(200).json({ success: true, count: progress.length, progress });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Reset a student's progress in one course
// @route   POST /api/admin/lms/progress/reset
// @access  Private (LMS_PROGRESS_EDIT)
const resetProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.body || {};
    if (!toId(studentId) || !toId(courseId)) {
      return res.status(400).json({ success: false, message: 'A valid studentId and courseId are required.' });
    }

    const progress = await Progress.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $set: { completedLessons: [], completedModules: [], progressPercent: 0, isCompleted: false, completionDate: null } },
      { new: true }
    );

    await logAudit(req, 'LMS_PROGRESS_RESET', `Progress reset for student ${studentId} on course ${courseId}`, progress?._id);
    return res.status(200).json({ success: true, message: 'Progress reset', progress });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Mark a course complete for a student (support / offline cohort)
// @route   POST /api/admin/lms/progress/complete
// @access  Private (LMS_PROGRESS_EDIT)
const completeProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.body || {};
    if (!toId(studentId) || !toId(courseId)) {
      return res.status(400).json({ success: false, message: 'A valid studentId and courseId are required.' });
    }

    const lessons = await Lesson.find({ course: courseId }).select('_id').lean();

    const progress = await Progress.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        $set: {
          completedLessons: lessons.map((lesson) => lesson._id),
          progressPercent: 100,
          isCompleted: true,
          completionDate: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await logAudit(req, 'LMS_PROGRESS_COMPLETED', `Course marked complete for student ${studentId}`, progress?._id);
    return res.status(200).json({ success: true, message: 'Course marked complete', progress });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Announcements
// ─────────────────────────────────────────────────────────────────────────────

// @desc    List announcements
// @route   GET /api/admin/lms/announcements
// @access  Private (LMS_VIEW)
const listAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .populate('course', 'title')
      .populate('batch', 'batchCode')
      .sort({ pinned: -1, createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Create an announcement
// @route   POST /api/admin/lms/announcements
// @access  Private (LMS_COMMS_EDIT)
const createAnnouncement = async (req, res) => {
  try {
    const { title, body, audience, courseId, batchId, pinned, isPublished } = req.body || {};
    if (!String(title || '').trim()) {
      return res.status(400).json({ success: false, message: 'A title is required.' });
    }

    const announcement = await Announcement.create({
      title: String(title).trim(),
      body: String(body || ''),
      audience: audience || 'All Students',
      course: audience === 'Course' && toId(courseId) ? courseId : undefined,
      batch: audience === 'Batch' && toId(batchId) ? batchId : undefined,
      pinned: Boolean(pinned),
      isPublished: isPublished !== false,
      createdBy: req.user?._id,
      createdByName: req.user?.name || '',
    });

    await logAudit(req, 'LMS_ANNOUNCEMENT_CREATED', `Announcement "${announcement.title}" published`, announcement._id);
    return res.status(201).json({ success: true, announcement });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Update an announcement
// @route   PUT /api/admin/lms/announcements/:id
// @access  Private (LMS_COMMS_EDIT)
const updateAnnouncement = async (req, res) => {
  try {
    const { title, body, audience, courseId, batchId, pinned, isPublished } = req.body || {};
    const patch = {};
    if (title !== undefined) patch.title = String(title).trim();
    if (body !== undefined) patch.body = String(body);
    if (audience !== undefined) patch.audience = audience;
    if (courseId !== undefined) patch.course = toId(courseId) ? courseId : undefined;
    if (batchId !== undefined) patch.batch = toId(batchId) ? batchId : undefined;
    if (pinned !== undefined) patch.pinned = Boolean(pinned);
    if (isPublished !== undefined) patch.isPublished = Boolean(isPublished);

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

    await logAudit(req, 'LMS_ANNOUNCEMENT_UPDATED', `Announcement "${announcement.title}" updated`, announcement._id);
    return res.status(200).json({ success: true, announcement });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/admin/lms/announcements/:id
// @access  Private (LMS_COMMS_EDIT)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

    await logAudit(req, 'LMS_ANNOUNCEMENT_DELETED', `Announcement "${announcement.title}" deleted`, announcement._id);
    return res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Read LMS defaults
// @route   GET /api/admin/lms/settings
// @access  Private (LMS_VIEW)
const getLmsSettings = async (req, res) => {
  try {
    let settings = await LmsSetting.findOne();
    if (!settings) settings = await LmsSetting.create({});
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Update LMS defaults
// @route   PUT /api/admin/lms/settings
// @access  Private (LMS_CONTENT_EDIT)
const updateLmsSettings = async (req, res) => {
  try {
    const allowed = [
      'defaultLessonDuration',
      'defaultModuleHours',
      'defaultQuizTimeLimit',
      'defaultQuizPassingScore',
      'certificateGrade',
      'certificateAccreditationBody',
      'allowLessonPreview',
      'showAnnouncementsInLms',
      'welcomeMessage',
    ];
    const patch = {};
    allowed.forEach((key) => {
      if (req.body?.[key] !== undefined) patch[key] = req.body[key];
    });

    let settings = await LmsSetting.findOne();
    if (!settings) {
      settings = await LmsSetting.create(patch);
    } else {
      settings = await LmsSetting.findByIdAndUpdate(settings._id, patch, { new: true, runValidators: true });
    }

    await logAudit(req, 'LMS_SETTINGS_UPDATED', 'LMS defaults updated', settings._id);
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getLmsOverview,
  listEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  listQuizAttempts,
  listProgress,
  resetProgress,
  completeProgress,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getLmsSettings,
  updateLmsSettings,
};
