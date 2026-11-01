/**
 * LMS classroom control centre.
 *
 * This is the Admin → LMS Portal hierarchy: every course, the batches inside it,
 * and the classes scheduled for each batch. It sits beside the existing LMS
 * controller (which owns enrollment, progress and certificates) and reuses the
 * same Batch / Enrollment / Course records, so nothing already authored is
 * duplicated or migrated.
 *
 * Guard rails:
 *   - a batch always stays attached to its course;
 *   - a batch with students or classes is archived, never silently deleted;
 *   - every write is recorded in AuditLog;
 *   - meeting links are validated to http(s) before they are stored.
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
const AuditLog = require('../models/AuditLog');
const { sendError } = require('../utils/apiError');
const { getClassWindow } = require('../utils/classWindow');

const toId = (value) => (mongoose.Types.ObjectId.isValid(value) ? value : null);

const logAudit = async (req, action, details, entityId) => {
  try {
    await AuditLog.create({
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

const isHttpUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const sanitizeMaterials = (materials) => {
  if (!Array.isArray(materials)) return undefined;
  return materials
    .map((row) => ({
      title: String(row?.title || '').trim(),
      url: String(row?.url || '').trim(),
      fileType: String(row?.fileType || 'PDF').trim().toUpperCase().slice(0, 12),
      fileSize: String(row?.fileSize || '').trim().slice(0, 24),
    }))
    .filter((row) => row.title && isHttpUrl(row.url));
};

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const normalizeDays = (days) => {
  if (!Array.isArray(days)) return undefined;
  const cleaned = [...new Set(days.map((day) => String(day).trim()).filter((day) => DAY_ORDER.includes(day)))];
  return cleaned.sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
};

const batchPayload = (body) => {
  const payload = {
    name: body.name !== undefined ? String(body.name).trim() : undefined,
    instructor: body.instructor !== undefined ? String(body.instructor).trim() : undefined,
    assistantInstructor:
      body.assistantInstructor !== undefined ? String(body.assistantInstructor).trim() : undefined,
    days: normalizeDays(body.days),
    startTime: body.startTime !== undefined ? String(body.startTime).trim() : undefined,
    endTime: body.endTime !== undefined ? String(body.endTime).trim() : undefined,
    timezone: body.timezone !== undefined ? String(body.timezone).trim() : undefined,
    description: body.description !== undefined ? String(body.description) : undefined,
    meetingPlatform: body.meetingPlatform,
    meetingLink: body.meetingLink !== undefined ? String(body.meetingLink).trim() : undefined,
    maxCapacity: body.maxCapacity !== undefined ? Number(body.maxCapacity) : undefined,
    status: body.status,
    visibility: body.visibility,
    endDate: body.endDate || undefined,
    enrollmentStart: body.enrollmentStart || undefined,
    enrollmentEnd: body.enrollmentEnd || undefined,
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
};

// ─────────────────────────────────────────────────────────────────────────────
// LMS Portal — courses
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Every course with its live batch/class/student counts
// @route  GET /api/admin/lms/portal
const getPortalOverview = async (req, res) => {
  try {
    const courses = await Course.find({})
      .select('title slug thumbnail category duration instructor description isPublished displayOrder')
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    const [batchRows, enrollmentRows, classRows, quizRows] = await Promise.all([
      Batch.aggregate([
        {
          $group: {
            _id: '$course',
            total: { $sum: 1 },
            archived: { $sum: { $cond: [{ $eq: ['$status', 'Archived'] }, 1, 0] } },
          },
        },
      ]),
      Enrollment.aggregate([
        { $group: { _id: { course: '$course', status: '$status' }, count: { $sum: 1 } } },
      ]),
      ClassSession.aggregate([
        {
          $group: {
            _id: '$course',
            total: { $sum: 1 },
            upcoming: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$startsAt', new Date()] },
                      { $in: ['$status', ['Scheduled', 'Published']] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Quiz.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]),
    ]);

    const batchMap = new Map(batchRows.map((row) => [String(row._id), row]));
    const classMap = new Map(classRows.map((row) => [String(row._id), row]));
    const quizMap = new Map(quizRows.map((row) => [String(row._id), row.count]));
    const enrollmentMap = new Map();
    enrollmentRows.forEach((row) => {
      const key = String(row._id.course);
      const entry = enrollmentMap.get(key) || { total: 0, active: 0, suspended: 0 };
      entry.total += row.count;
      if (row._id.status === 'Active') entry.active += row.count;
      if (row._id.status === 'Suspended') entry.suspended += row.count;
      enrollmentMap.set(key, entry);
    });

    const rows = courses.map((course) => {
      const key = String(course._id);
      const batch = batchMap.get(key) || { total: 0, archived: 0 };
      const enrollment = enrollmentMap.get(key) || { total: 0, active: 0, suspended: 0 };
      const classes = classMap.get(key) || { total: 0, upcoming: 0 };
      return {
        ...course,
        batches: batch.total,
        archivedBatches: batch.archived,
        students: enrollment.total,
        activeStudents: enrollment.active,
        suspendedStudents: enrollment.suspended,
        classes: classes.total,
        upcomingClasses: classes.upcoming,
        quizzes: quizMap.get(key) || 0,
      };
    });

    const totals = rows.reduce(
      (sum, row) => ({
        courses: sum.courses + 1,
        batches: sum.batches + (row.batches - row.archivedBatches),
        students: sum.students + row.students,
        classes: sum.classes + row.classes,
        upcomingClasses: sum.upcomingClasses + row.upcomingClasses,
      }),
      { courses: 0, batches: 0, students: 0, classes: 0, upcomingClasses: 0 }
    );

    return res.status(200).json({ success: true, totals, courses: rows });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   One course plus every batch inside it
// @route  GET /api/admin/lms/portal/courses/:courseId
const getCourseWorkspace = async (req, res) => {
  try {
    const courseId = toId(req.params.courseId);
    if (!courseId) return res.status(400).json({ success: false, message: 'Invalid course id.' });

    const course = await Course.findById(courseId)
      .select('title slug thumbnail category duration instructor description isPublished')
      .lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const batches = await Batch.find({ course: courseId })
      .sort({ status: 1, startDate: 1 })
      .lean();

    const batchIds = batches.map((batch) => batch._id);
    const [enrollmentRows, classRows] = await Promise.all([
      Enrollment.aggregate([
        { $match: { batch: { $in: batchIds }, status: 'Active' } },
        { $group: { _id: '$batch', count: { $sum: 1 } } },
      ]),
      ClassSession.aggregate([
        { $match: { batch: { $in: batchIds } } },
        {
          $group: {
            _id: '$batch',
            total: { $sum: 1 },
            upcoming: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$startsAt', new Date()] },
                      { $in: ['$status', ['Scheduled', 'Published']] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const enrollmentMap = new Map(enrollmentRows.map((row) => [String(row._id), row.count]));
    const classMap = new Map(classRows.map((row) => [String(row._id), row]));

    return res.status(200).json({
      success: true,
      course,
      batches: batches.map((batch) => {
        const classes = classMap.get(String(batch._id)) || { total: 0, upcoming: 0 };
        return {
          ...batch,
          activeStudents: enrollmentMap.get(String(batch._id)) || 0,
          classCount: classes.total,
          upcomingClasses: classes.upcoming,
        };
      }),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Batches
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Create a batch inside a course
// @route  POST /api/admin/lms/batches
const createBatch = async (req, res) => {
  try {
    const courseId = toId(req.body.courseId || req.body.course);
    if (!courseId) return res.status(400).json({ success: false, message: 'Pick a course for this batch.' });

    const course = await Course.findById(courseId).select('title').lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const batchCode = String(req.body.batchCode || '').trim().toUpperCase();
    if (!batchCode) return res.status(400).json({ success: false, message: 'Batch code is required.' });

    const duplicate = await Batch.findOne({ batchCode });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Batch code ${batchCode} is already in use.` });
    }

    if (!req.body.startDate) {
      return res.status(400).json({ success: false, message: 'Start date is required.' });
    }

    const payload = batchPayload(req.body);
    if (payload.startTime && !TIME_RE.test(payload.startTime)) {
      return res.status(400).json({ success: false, message: 'Start time must look like 09:30.' });
    }
    if (payload.endTime && !TIME_RE.test(payload.endTime)) {
      return res.status(400).json({ success: false, message: 'End time must look like 11:00.' });
    }
    if (payload.meetingLink && !isHttpUrl(payload.meetingLink)) {
      return res.status(400).json({ success: false, message: 'Meeting link must start with http:// or https://.' });
    }

    const batch = await Batch.create({
      ...payload,
      course: courseId,
      batchCode,
      startDate: req.body.startDate,
    });

    await logAudit(req, 'BATCH_CREATE', `${batch.batchCode} created for ${course.title}`, batch._id);

    return res.status(201).json({ success: true, batch });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'That batch code is already in use.' });
    }
    return sendError(res, error);
  }
};

// @desc   Update batch scheduling, instructor, capacity or room
// @route  PUT /api/admin/lms/batches/:id
const updateBatch = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid batch id.' });

    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    const payload = batchPayload(req.body);
    if (payload.startTime && !TIME_RE.test(payload.startTime)) {
      return res.status(400).json({ success: false, message: 'Start time must look like 09:30.' });
    }
    if (payload.endTime && !TIME_RE.test(payload.endTime)) {
      return res.status(400).json({ success: false, message: 'End time must look like 11:00.' });
    }
    if (payload.meetingLink && !isHttpUrl(payload.meetingLink)) {
      return res.status(400).json({ success: false, message: 'Meeting link must start with http:// or https://.' });
    }

    if (req.body.startDate) batch.startDate = req.body.startDate;
    if (req.body.batchCode) {
      const nextCode = String(req.body.batchCode).trim().toUpperCase();
      if (nextCode !== batch.batchCode) {
        const taken = await Batch.findOne({ batchCode: nextCode, _id: { $ne: batch._id } }).lean();
        if (taken) return res.status(409).json({ success: false, message: `Batch code ${nextCode} is already in use.` });
        batch.batchCode = nextCode;
      }
    }
    Object.assign(batch, payload);

    // Re-saving runs the model's timing sync and validation, so the public
    // one-line schedule always matches the structured fields.
    await batch.save();
    await logAudit(req, 'BATCH_UPDATE', `${batch.batchCode} updated`, batch._id);

    return res.status(200).json({ success: true, batch });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Delete an empty batch; refuse when students or classes depend on it
// @route  DELETE /api/admin/lms/batches/:id
const deleteBatch = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid batch id.' });

    const batch = await Batch.findById(id).lean();
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    const [enrollments, classes] = await Promise.all([
      Enrollment.countDocuments({ batch: id }),
      ClassSession.countDocuments({ batch: id }),
    ]);

    if (enrollments > 0 || classes > 0) {
      return res.status(409).json({
        success: false,
        message: `${batch.batchCode} still has ${enrollments} enrollment(s) and ${classes} class(es). Archive it instead — deleting would orphan student progress.`,
        counts: { enrollments, classes },
      });
    }

    await Batch.findByIdAndDelete(id);
    await logAudit(req, 'BATCH_DELETE', `${batch.batchCode} deleted`, id);

    return res.status(200).json({ success: true, message: 'Batch deleted.' });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Archive a batch without touching its history
// @route  POST /api/admin/lms/batches/:id/archive
const archiveBatch = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid batch id.' });

    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    batch.status = 'Archived';
    batch.archivedAt = new Date();
    batch.visibility = 'Draft';
    await batch.save();
    await logAudit(req, 'BATCH_ARCHIVE', `${batch.batchCode} archived`, batch._id);

    return res.status(200).json({ success: true, batch });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Duplicate a batch's configuration (no students, no classes)
// @route  POST /api/admin/lms/batches/:id/duplicate
const duplicateBatch = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid batch id.' });

    const source = await Batch.findById(id).lean();
    if (!source) return res.status(404).json({ success: false, message: 'Batch not found.' });

    let suffix = 1;
    let batchCode = `${source.batchCode}-COPY`;
    // Keep trying until the unique batch code is free.
    while (await Batch.exists({ batchCode })) {
      suffix += 1;
      batchCode = `${source.batchCode}-COPY${suffix}`;
    }

    const copy = await Batch.create({
      course: source.course,
      name: `${source.name || source.batchCode} (copy)`,
      batchCode,
      startDate: source.startDate,
      endDate: source.endDate,
      timing: source.timing,
      days: source.days,
      startTime: source.startTime,
      endTime: source.endTime,
      timezone: source.timezone,
      instructor: source.instructor,
      assistantInstructor: source.assistantInstructor,
      description: source.description,
      meetingPlatform: source.meetingPlatform,
      meetingLink: source.meetingLink,
      maxCapacity: source.maxCapacity,
      enrollmentStart: source.enrollmentStart,
      enrollmentEnd: source.enrollmentEnd,
      visibility: 'Draft',
      status: 'Upcoming',
      enrolledStudents: [],
    });

    await logAudit(req, 'BATCH_DUPLICATE', `${source.batchCode} duplicated as ${batchCode}`, copy._id);
    return res.status(201).json({ success: true, batch: copy });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Batch detail + roster with per-student progress
// @route  GET /api/admin/lms/batches/:id
const getBatchWorkspace = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid batch id.' });

    const batch = await Batch.findById(id).populate('course', 'title slug thumbnail category').lean();
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    const [classes, enrollments, quizzes, assignments, resources, announcements, jobs, attendanceRows] = await Promise.all([
      ClassSession.find({ batch: id }).sort({ startsAt: 1 }).lean(),
      Enrollment.find({ batch: id })
        .populate('student', 'name email phone avatar studentDetails isActive')
        .sort({ createdAt: -1 })
        .lean(),
      Quiz.find({ batch: id }).sort({ createdAt: -1 }).lean(),
      Assignment.find({ batch: id }).sort({ dueAt: 1, createdAt: -1 }).lean(),
      LmsResource.find({ batch: id }).sort({ createdAt: -1 }).lean(),
      Announcement.find({ batch: id }).sort({ pinned: -1, createdAt: -1 }).lean(),
      Job.find({ targetBatches: id }).sort({ createdAt: -1 }).lean(),
      AttendanceRecord.find({ batch: id }).select('classSession student status').lean(),
    ]);

    const [quizAttempts, submissions, jobApplications] = await Promise.all([
      QuizAttempt.find({ batch: id }).select('quiz student scorePercent passed status').lean(),
      AssignmentSubmission.find({ batch: id }).select('assignment student marks status').lean(),
      jobs.length
        ? JobApplication.aggregate([
            { $match: { job: { $in: jobs.map((job) => job._id) } } },
            { $group: { _id: '$job', count: { $sum: 1 } } },
          ])
        : [],
    ]);

    const attemptsByQuiz = new Map();
    quizAttempts.forEach((row) => {
      const key = String(row.quiz);
      const entry = attemptsByQuiz.get(key) || { attempts: 0, passed: 0, pending: 0, percentTotal: 0 };
      entry.attempts += 1;
      if (row.passed) entry.passed += 1;
      if (row.status === 'Pending review') entry.pending += 1;
      entry.percentTotal += Number(row.scorePercent || 0);
      attemptsByQuiz.set(key, entry);
    });

    const submissionsByAssignment = new Map();
    submissions.forEach((row) => {
      const key = String(row.assignment);
      const entry = submissionsByAssignment.get(key) || { submissions: 0, evaluated: 0 };
      entry.submissions += 1;
      if (row.status === 'Evaluated') entry.evaluated += 1;
      submissionsByAssignment.set(key, entry);
    });

    const jobApplicationMap = new Map(jobApplications.map((row) => [String(row._id), row.count]));

    const attendanceByClass = new Map();
    attendanceRows.forEach((row) => {
      const key = String(row.classSession);
      const entry = attendanceByClass.get(key) || { total: 0, present: 0 };
      entry.total += 1;
      if (row.status === 'Present' || row.status === 'Late') entry.present += 1;
      attendanceByClass.set(key, entry);
    });
    const attendanceSummary = attendanceRows.reduce(
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
    attendanceSummary.rate = attendanceSummary.total
      ? Math.round(((attendanceSummary.present + attendanceSummary.late) / attendanceSummary.total) * 100)
      : 0;

    const studentIds = enrollments.map((row) => row.student?._id).filter(Boolean);
    const progressRows = studentIds.length
      ? await Progress.find({ course: batch.course?._id, student: { $in: studentIds } })
          .select('student progressPercent isCompleted')
          .lean()
      : [];
    const progressMap = new Map(progressRows.map((row) => [String(row.student), row]));

    const now = new Date();
    const upcoming = classes.filter(
      (session) => session.startsAt && session.startsAt >= now && ['Scheduled', 'Published'].includes(session.status)
    );

    return res.status(200).json({
      success: true,
      batch,
      stats: {
        students: enrollments.length,
        activeStudents: enrollments.filter((row) => row.status === 'Active').length,
        suspendedStudents: enrollments.filter((row) => row.status === 'Suspended').length,
        capacity: batch.maxCapacity || 0,
        seatsLeft: Math.max(0, (batch.maxCapacity || 0) - enrollments.length),
        classes: classes.length,
        upcomingClasses: upcoming.length,
        completedClasses: classes.filter((row) => row.status === 'Completed').length,
        publishedClasses: classes.filter((row) => row.status === 'Published').length,
        quizzes: quizzes.length,
        assignments: assignments.length,
        resources: resources.length,
        pendingEvaluations:
          quizAttempts.filter((row) => row.status === 'Pending review').length +
          submissions.filter((row) => row.status === 'Submitted').length,
      },
      quizzes: quizzes.map((quiz) => {
        const stats = attemptsByQuiz.get(String(quiz._id)) || { attempts: 0, passed: 0, pending: 0, percentTotal: 0 };
        return {
          ...quiz,
          stats: {
            attempts: stats.attempts,
            passed: stats.passed,
            pendingReview: stats.pending,
            averagePercent: stats.attempts ? Math.round(stats.percentTotal / stats.attempts) : 0,
          },
        };
      }),
      assignments: assignments.map((assignment) => {
        const stats = submissionsByAssignment.get(String(assignment._id)) || { submissions: 0, evaluated: 0 };
        return { ...assignment, stats: { ...stats, pending: stats.submissions - stats.evaluated } };
      }),
      resources,
      announcements,
      jobs: jobs.map((job) => ({ ...job, applications: jobApplicationMap.get(String(job._id)) || 0 })),
      attendance: {
        summary: attendanceSummary,
        markedClasses: attendanceByClass.size,
        byClass: Object.fromEntries(attendanceByClass),
      },
      classes: classes.map((session) => ({
        ...session,
        window: getClassWindow(session, now),
      })),
      students: enrollments.map((row) => ({
        enrollmentId: row._id,
        status: row.status,
        enrolledAt: row.enrolledAt,
        accessUntil: row.accessUntil || null,
        progressPercent: progressMap.get(String(row.student?._id))?.progressPercent || 0,
        student: row.student
          ? {
              _id: row.student._id,
              name: row.student.name,
              email: row.student.email,
              phone: row.student.phone,
              avatar: row.student.avatar,
              enrollmentNumber: row.student.studentDetails?.enrollmentNumber || '',
              isActive: row.student.isActive,
            }
          : null,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Classes
// ─────────────────────────────────────────────────────────────────────────────

const classPayload = (body) => {
  const payload = {
    title: body.title !== undefined ? String(body.title).trim() : undefined,
    description: body.description !== undefined ? String(body.description) : undefined,
    sessionNumber: body.sessionNumber !== undefined ? Number(body.sessionNumber) : undefined,
    instructor: body.instructor !== undefined ? String(body.instructor).trim() : undefined,
    assistantInstructor:
      body.assistantInstructor !== undefined ? String(body.assistantInstructor).trim() : undefined,
    startTime: body.startTime !== undefined ? String(body.startTime).trim() : undefined,
    endTime: body.endTime !== undefined ? String(body.endTime).trim() : undefined,
    timezone: body.timezone !== undefined ? String(body.timezone).trim() : undefined,
    deliveryMode: body.deliveryMode,
    meetingPlatform: body.meetingPlatform,
    meetingUrl: body.meetingUrl !== undefined ? String(body.meetingUrl).trim() : undefined,
    recordingUrl: body.recordingUrl !== undefined ? String(body.recordingUrl).trim() : undefined,
    thumbnail: body.thumbnail !== undefined ? String(body.thumbnail).trim() : undefined,
    status: body.status,
    attendanceRequired: body.attendanceRequired,
    notifyStudents: body.notifyStudents,
    visibleFrom: body.visibleFrom || undefined,
    materials: sanitizeMaterials(body.materials),
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
};

const validateClassLinks = (payload) => {
  if (payload.meetingUrl && !isHttpUrl(payload.meetingUrl)) {
    return 'Meeting link must start with http:// or https://.';
  }
  if (payload.recordingUrl && !isHttpUrl(payload.recordingUrl)) {
    return 'Recording link must start with http:// or https://.';
  }
  if (payload.startTime && !TIME_RE.test(payload.startTime)) {
    return 'Start time must look like 09:30.';
  }
  if (payload.endTime && !TIME_RE.test(payload.endTime)) {
    return 'End time must look like 11:00.';
  }
  return '';
};

// @desc   Create a class inside a batch
// @route  POST /api/admin/lms/classes
const createClass = async (req, res) => {
  try {
    const batchId = toId(req.body.batchId || req.body.batch);
    if (!batchId) return res.status(400).json({ success: false, message: 'Pick the batch this class belongs to.' });

    const batch = await Batch.findById(batchId).lean();
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    if (!String(req.body.title || '').trim()) {
      return res.status(400).json({ success: false, message: 'Class title is required.' });
    }
    if (!req.body.classDate) {
      return res.status(400).json({ success: false, message: 'Class date is required.' });
    }

    const payload = classPayload(req.body);
    const linkError = validateClassLinks(payload);
    if (linkError) return res.status(400).json({ success: false, message: linkError });

    let sessionNumber = Number(payload.sessionNumber);
    if (!sessionNumber || sessionNumber < 1) {
      sessionNumber = (await ClassSession.countDocuments({ batch: batchId })) + 1;
    }

    const session = await ClassSession.create({
      ...payload,
      sessionNumber,
      course: batch.course,
      batch: batchId,
      classDate: req.body.classDate,
      instructor: payload.instructor || batch.instructor || '',
      timezone: payload.timezone || batch.timezone || 'EST (UTC-5)',
      createdBy: req.user?._id,
    });

    await logAudit(
      req,
      'CLASS_CREATE',
      `${session.title} scheduled for ${batch.batchCode} on ${new Date(session.classDate).toDateString()}`,
      session._id
    );

    return res.status(201).json({ success: true, class: session });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Edit or reschedule a class
// @route  PUT /api/admin/lms/classes/:id
const updateClass = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid class id.' });

    const session = await ClassSession.findById(id);
    if (!session) return res.status(404).json({ success: false, message: 'Class not found.' });

    const payload = classPayload(req.body);
    const linkError = validateClassLinks(payload);
    if (linkError) return res.status(400).json({ success: false, message: linkError });

    if (req.body.classDate) session.classDate = req.body.classDate;
    Object.assign(session, payload);
    if (session.status === 'Published' && !session.publishedAt) session.publishedAt = new Date();

    await session.save();
    await logAudit(req, 'CLASS_UPDATE', `${session.title} updated`, session._id);

    return res.status(200).json({ success: true, class: session });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Delete a class
// @route  DELETE /api/admin/lms/classes/:id
const deleteClass = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid class id.' });

    const session = await ClassSession.findByIdAndDelete(id).lean();
    if (!session) return res.status(404).json({ success: false, message: 'Class not found.' });

    await logAudit(req, 'CLASS_DELETE', `${session.title} deleted`, id);
    return res.status(200).json({ success: true, message: 'Class deleted.' });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Duplicate a class one week later as a draft
// @route  POST /api/admin/lms/classes/:id/duplicate
const duplicateClass = async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid class id.' });

    const source = await ClassSession.findById(id).lean();
    if (!source) return res.status(404).json({ success: false, message: 'Class not found.' });

    const nextDate = new Date(source.classDate);
    nextDate.setDate(nextDate.getDate() + 7);

    const copy = await ClassSession.create({
      course: source.course,
      batch: source.batch,
      title: `${source.title} (copy)`,
      description: source.description,
      sessionNumber: (await ClassSession.countDocuments({ batch: source.batch })) + 1,
      instructor: source.instructor,
      assistantInstructor: source.assistantInstructor,
      classDate: nextDate,
      startTime: source.startTime,
      endTime: source.endTime,
      timezone: source.timezone,
      deliveryMode: source.deliveryMode,
      meetingPlatform: source.meetingPlatform,
      meetingUrl: source.meetingUrl,
      materials: source.materials,
      thumbnail: source.thumbnail,
      status: 'Draft',
      attendanceRequired: source.attendanceRequired,
      notifyStudents: false,
      createdBy: req.user?._id,
    });

    await logAudit(req, 'CLASS_DUPLICATE', `${source.title} duplicated`, copy._id);
    return res.status(201).json({ success: true, class: copy });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Activate / deactivate a course from the LMS portal
// @route  PATCH /api/admin/lms/portal/courses/:courseId/visibility
const setCourseVisibility = async (req, res) => {
  try {
    const courseId = toId(req.params.courseId);
    if (!courseId) return res.status(400).json({ success: false, message: 'Invalid course id.' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const next = req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : !course.isPublished;
    course.isPublished = next;
    await course.save();

    await logAudit(req, 'COURSE_VISIBILITY', `${course.title} ${next ? 'published' : 'unpublished'}`, course._id);
    return res.status(200).json({ success: true, course: { _id: course._id, isPublished: course.isPublished } });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getPortalOverview,
  setCourseVisibility,
  getCourseWorkspace,
  createBatch,
  updateBatch,
  deleteBatch,
  archiveBatch,
  duplicateBatch,
  getBatchWorkspace,
  createClass,
  updateClass,
  deleteClass,
  duplicateClass,
};
