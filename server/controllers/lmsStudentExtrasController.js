/**
 * Student LMS modules that sit beside the classroom and assessments:
 * calendar, academic transcript, notifications, leaderboard and badges.
 *
 * Every read starts from the student's current Active enrollments. Batch ids are
 * derived on the server, never accepted from the query string, so a student in
 * the 7 AM cohort cannot see the 5 PM cohort's dates, ranks or notices.
 */

const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const AttendanceRecord = require('../models/AttendanceRecord');
const ClassSession = require('../models/ClassSession');
const Announcement = require('../models/Announcement');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const StudentNotification = require('../models/StudentNotification');
const StudentBadge = require('../models/StudentBadge');
const {
  currentEnrollments,
  allowedBatchIds,
  allowedCourseIds,
  uniqueIds,
} = require('../utils/lmsStudentScope');
const { isEnrollmentCurrent } = require('../utils/access');
const { sendError } = require('../utils/apiError');

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);
const daysAhead = (days) => new Date(Date.now() + days * DAY_MS);
const uniqueBy = (rows, keyFn) => {
  const seen = new Set();
  return rows.filter((row) => {
    const key = keyFn(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const clampText = (value, length = 220) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
};

const round = (value, digits = 0) => {
  if (!Number.isFinite(Number(value))) return 0;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
};

const average = (values) => {
  const rows = values.map(Number).filter((value) => Number.isFinite(value));
  return rows.length ? rows.reduce((sum, value) => sum + value, 0) / rows.length : null;
};

const percentOf = (marks, total) => {
  const denominator = Number(total);
  if (!Number.isFinite(Number(marks)) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return round((Number(marks) / denominator) * 100);
};

const gradeFor = (percent) => {
  if (percent === null || percent === undefined) return { letter: 'In progress', points: null };
  if (percent >= 90) return { letter: 'A', points: 4 };
  if (percent >= 80) return { letter: 'B', points: 3 };
  if (percent >= 70) return { letter: 'C', points: 2 };
  if (percent >= 60) return { letter: 'D', points: 1 };
  return { letter: 'F', points: 0 };
};

/**
 * Composite grade used by the transcript and leaderboard.
 * Weights are normalised over the components that actually exist, so a batch
 * without assignments is not punished for missing data.
 */
const compositePercent = ({ quizAverage, quizCount, assignmentAverage, assignmentCount, attendanceRate, attendanceCount }) => {
  const parts = [];
  if (quizCount > 0 && quizAverage !== null) parts.push({ value: quizAverage, weight: 0.6 });
  if (assignmentCount > 0 && assignmentAverage !== null) parts.push({ value: assignmentAverage, weight: 0.25 });
  if (attendanceCount > 0 && attendanceRate !== null) parts.push({ value: attendanceRate, weight: 0.15 });
  if (!parts.length) return null;
  const weight = parts.reduce((sum, part) => sum + part.weight, 0);
  return round(parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weight);
};

// ─────────────────────────────────────────────────────────────────────────────
// Calendar
// ─────────────────────────────────────────────────────────────────────────────

const readRange = (query) => {
  const now = new Date();
  let from = parseDate(query.from);
  let to = parseDate(query.to);
  if (!from) from = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!to) to = new Date(now.getFullYear(), now.getMonth() + 6, 0);
  if (to < from) [from, to] = [to, from];
  if (to.getTime() - from.getTime() > 370 * DAY_MS) {
    to = new Date(from.getTime() + 370 * DAY_MS);
  }
  return { from, to };
};

const targetedJobFilter = (batchIds, courseIds) => ({
  isPublished: true,
  isActive: true,
  isArchived: { $ne: true },
  $or: [
    { targetBatches: { $in: batchIds } },
    { targetCourses: { $in: courseIds } },
    { targetBatches: { $size: 0 }, targetCourses: { $size: 0 } },
    { targetBatches: { $exists: false }, targetCourses: { $exists: false } },
  ],
});

// @desc   Calendar events for the student's batches
// @route  GET /api/lms/calendar
const getMyCalendar = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments);
    const courseIds = allowedCourseIds(enrollments);
    const { from, to } = readRange(req.query);
    const now = new Date();

    if (!batchIds.length) {
      return res.status(200).json({
        success: true,
        range: { from, to },
        events: [],
        summary: { total: 0, class: 0, quiz: 0, assignment: 0, job: 0 },
      });
    }

    const [classes, quizzes, assignments, jobs] = await Promise.all([
      ClassSession.find({
        batch: { $in: batchIds },
        status: { $in: ['Scheduled', 'Published', 'Completed', 'Cancelled'] },
        startsAt: { $gte: from, $lte: to },
        $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }],
      })
        .select('title batch course startsAt endsAt status deliveryMode meetingPlatform instructor recordingUrl attendanceRequired')
        .populate('batch', 'name batchCode')
        .sort({ startsAt: 1 })
        .lean(),
      Quiz.find({
        isPublished: true,
        $or: [{ batch: { $in: batchIds } }, { batch: null, course: { $in: courseIds } }],
      })
        .select('title batch course startsAt endsAt timeLimitMinutes totalMarks')
        .populate('batch', 'name batchCode')
        .lean(),
      Assignment.find({
        batch: { $in: batchIds },
        status: { $in: ['Published', 'Closed'] },
        dueAt: { $gte: from, $lte: to },
      })
        .select('title batch course dueAt totalMarks status')
        .populate('batch', 'name batchCode')
        .sort({ dueAt: 1 })
        .lean(),
      Job.find({
        ...targetedJobFilter(batchIds, courseIds),
        deadline: { $gte: from, $lte: to },
      })
        .select('title company deadline employmentType location targetBatches targetCourses')
        .lean(),
    ]);

    const assignmentIds = assignments.map((row) => row._id);
    const submissions = assignmentIds.length
      ? await AssignmentSubmission.find({
          student: req.user._id,
          assignment: { $in: assignmentIds },
        })
          .select('assignment status submittedAt')
          .lean()
      : [];
    const submittedAssignments = new Set(submissions.map((row) => String(row.assignment)));

    const events = [];

    classes.forEach((row) => {
      if (!row.startsAt) return;
      events.push({
        id: `class:${row._id}`,
        type: 'class',
        title: row.title,
        subtitle: row.batch?.name || row.batch?.batchCode || '',
        start: row.startsAt,
        end: row.endsAt,
        allDay: false,
        link: '/student/classes',
        meta: {
          status: row.status,
          deliveryMode: row.deliveryMode,
          meetingPlatform: row.meetingPlatform,
          instructor: row.instructor,
          hasRecording: Boolean(row.recordingUrl),
          attendanceRequired: Boolean(row.attendanceRequired),
        },
      });
    });

    quizzes.forEach((row) => {
      const start = row.startsAt || row.endsAt;
      const end = row.endsAt || row.startsAt;
      if (!start || !end) return;
      if (end < from || start > to) return;
      events.push({
        id: `quiz:${row._id}`,
        type: 'quiz',
        title: row.title,
        subtitle: row.batch?.name || row.batch?.batchCode || 'Course quiz',
        start,
        end,
        allDay: false,
        link: '/student/quizzes',
        meta: {
          timeLimitMinutes: row.timeLimitMinutes,
          totalMarks: row.totalMarks,
          status: now < start ? 'Upcoming' : now > end ? 'Closed' : 'Open',
        },
      });
    });

    assignments.forEach((row) => {
      if (!row.dueAt) return;
      events.push({
        id: `assignment:${row._id}`,
        type: 'assignment',
        title: row.title,
        subtitle: row.batch?.name || row.batch?.batchCode || '',
        start: row.dueAt,
        end: row.dueAt,
        allDay: false,
        link: '/student/assignments',
        meta: {
          totalMarks: row.totalMarks,
          status: row.status,
          submitted: submittedAssignments.has(String(row._id)),
        },
      });
    });

    jobs.forEach((row) => {
      if (!row.deadline) return;
      events.push({
        id: `job:${row._id}`,
        type: 'job',
        title: `Application deadline · ${row.title}`,
        subtitle: row.company || '',
        start: row.deadline,
        end: row.deadline,
        allDay: false,
        link: '/student/jobs',
        meta: {
          employmentType: row.employmentType,
          location: row.location,
          targeted: (row.targetBatches || []).length > 0,
        },
      });
    });

    events.sort((a, b) => new Date(a.start) - new Date(b.start));
    const summary = events.reduce(
      (acc, event) => {
        acc.total += 1;
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      { total: 0, class: 0, quiz: 0, assignment: 0, job: 0 }
    );

    return res.status(200).json({ success: true, range: { from, to }, events, summary });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Academic transcript
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Full academic record across every enrollment, with per-course grades
// @route  GET /api/lms/transcript
const getMyTranscript = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course', 'title slug thumbnail')
      .populate('batch', 'name batchCode timing')
      .sort({ enrolledAt: 1, createdAt: 1 })
      .lean();

    const batchIds = uniqueIds(enrollments.map((row) => row.batch?._id));
    const courseIds = uniqueIds(enrollments.map((row) => row.course?._id));

    const [attempts, submissions, attendance, certificates] = await Promise.all([
      QuizAttempt.find({ student: req.user._id })
        .populate('quiz', 'title totalMarks passingMarks')
        .select('quiz course batch scoreMarks totalMarks scorePercent passed status submittedAt')
        .sort({ submittedAt: -1 })
        .lean(),
      AssignmentSubmission.find({ student: req.user._id })
        .populate('assignment', 'title totalMarks dueAt')
        .select('assignment course batch marks status submittedAt isLate')
        .sort({ submittedAt: -1 })
        .lean(),
      AttendanceRecord.find({ student: req.user._id })
        .select('batch status markedAt')
        .lean(),
      Certificate.find({ student: req.user._id })
        .select('certificateId course courseTitle issueDate grade revokedAt isSample')
        .sort({ issueDate: -1 })
        .lean(),
    ]);

    const records = enrollments.map((enrollment) => {
      const courseId = String(enrollment.course?._id || enrollment.course || '');
      const batchId = String(enrollment.batch?._id || enrollment.batch || '');

      const scopedAttempts = attempts.filter((row) => {
        if (String(row.course) !== courseId) return false;
        if (batchId) return String(row.batch || '') === batchId;
        return !row.batch;
      });
      const scopedSubmissions = submissions.filter(
        (row) => String(row.course) === courseId && (!batchId || String(row.batch || '') === batchId)
      );
      const scopedAttendance = attendance.filter(
        (row) => !batchId || String(row.batch || '') === batchId
      );

      const gradedAttempts = scopedAttempts.filter((row) => row.status !== 'Pending review');
      const quizPercent = average(gradedAttempts.map((row) => Number(row.scorePercent || 0)));
      const evaluated = scopedSubmissions.filter(
        (row) => row.status === 'Evaluated' && row.marks !== null && row.marks !== undefined
      );
      const assignmentPercent = average(
        evaluated.map((row) => percentOf(row.marks, row.assignment?.totalMarks || 0))
      );

      const attendanceCounts = scopedAttendance.reduce(
        (acc, row) => {
          acc.total += 1;
          if (row.status === 'Present') acc.present += 1;
          else if (row.status === 'Late') acc.late += 1;
          else if (row.status === 'Absent') acc.absent += 1;
          else if (row.status === 'Excused') acc.excused += 1;
          return acc;
        },
        { total: 0, present: 0, late: 0, absent: 0, excused: 0 }
      );
      const attendanceRate = attendanceCounts.total
        ? round(((attendanceCounts.present + attendanceCounts.late) / attendanceCounts.total) * 100)
        : null;

      const overall = compositePercent({
        quizAverage: quizPercent,
        quizCount: gradedAttempts.length,
        assignmentAverage: assignmentPercent,
        assignmentCount: evaluated.length,
        attendanceRate,
        attendanceCount: attendanceCounts.total,
      });
      const grade = gradeFor(overall);

      const certificate = certificates.find(
        (row) => String(row.course) === courseId && !row.revokedAt && !row.isSample
      );
      const certificateCount = certificates.filter(
        (row) => String(row.course) === courseId && !row.revokedAt && !row.isSample
      ).length;

      const completed = Boolean(certificate) || enrollment.status === 'Completed';
      const recordStatus = completed ? 'Completed' : enrollment.status;

      return {
        _id: enrollment._id,
        course: enrollment.course
          ? {
              _id: enrollment.course._id,
              title: enrollment.course.title,
              slug: enrollment.course.slug,
              thumbnail: enrollment.course.thumbnail,
            }
          : { _id: null, title: 'Course record', slug: '', thumbnail: '' },
        batch: enrollment.batch
          ? { _id: enrollment.batch._id, name: enrollment.batch.name, batchCode: enrollment.batch.batchCode }
          : null,
        enrolledAt: enrollment.enrolledAt,
        accessStart: enrollment.accessStart || null,
        accessUntil: enrollment.accessUntil || null,
        completedAt: certificate?.issueDate || enrollment.completedAt || null,
        status: recordStatus,
        enrollmentStatus: enrollment.status,
        certificate: certificate
          ? {
              certificateId: certificate.certificateId,
              issueDate: certificate.issueDate,
              grade: certificate.grade,
            }
          : null,
        certificateCount,
        quizAverage: quizPercent === null ? null : round(quizPercent),
        quizCount: scopedAttempts.length,
        gradedQuizCount: gradedAttempts.length,
        pendingQuizCount: scopedAttempts.filter((row) => row.status === 'Pending review').length,
        assignmentAverage: assignmentPercent === null ? null : round(assignmentPercent),
        assignmentCount: evaluated.length,
        submittedAssignmentCount: scopedSubmissions.length,
        attendance: { ...attendanceCounts, rate: attendanceRate },
        overall: overall === null ? null : round(overall),
        letterGrade: grade.letter,
        gpaPoints: grade.points,
        quizzes: scopedAttempts.slice(0, 60).map((row) => ({
          _id: row._id,
          title: row.quiz?.title || 'Quiz',
          scoreMarks: row.scoreMarks ?? 0,
          totalMarks: row.totalMarks ?? row.quiz?.totalMarks ?? 0,
          scorePercent: row.scorePercent ?? 0,
          passed: Boolean(row.passed),
          status: row.status,
          submittedAt: row.submittedAt,
        })),
        assignments: scopedSubmissions.slice(0, 60).map((row) => ({
          _id: row._id,
          title: row.assignment?.title || 'Assignment',
          marks: row.marks,
          totalMarks: row.assignment?.totalMarks ?? 0,
          percent: percentOf(row.marks, row.assignment?.totalMarks || 0),
          status: row.status,
          isLate: Boolean(row.isLate),
          submittedAt: row.submittedAt,
        })),
      };
    });

    const gradedRecords = records.filter((row) => row.gpaPoints !== null);
    const gpa = gradedRecords.length
      ? round(gradedRecords.reduce((sum, row) => sum + row.gpaPoints, 0) / gradedRecords.length, 2)
      : null;

    const attendanceTotals = records.reduce(
      (acc, row) => {
        acc.total += row.attendance.total;
        acc.attended += row.attendance.present + row.attendance.late;
        return acc;
      },
      { total: 0, attended: 0 }
    );

    return res.status(200).json({
      success: true,
      generatedAt: new Date(),
      student: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        enrollmentNumber: req.user.studentDetails?.enrollmentNumber || '',
      },
      summary: {
        totalCourses: records.length,
        activeCourses: records.filter((row) => row.enrollmentStatus === 'Active').length,
        completedCourses: records.filter((row) => row.status === 'Completed').length,
        gradedCourses: gradedRecords.length,
        gpa,
        quizzesTaken: records.reduce((sum, row) => sum + row.quizCount, 0),
        assignmentsGraded: records.reduce((sum, row) => sum + row.assignmentCount, 0),
        attendanceRate: attendanceTotals.total
          ? round((attendanceTotals.attended / attendanceTotals.total) * 100)
          : null,
        certificates: records.reduce((sum, row) => sum + row.certificateCount, 0),
      },
      records,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Build the candidate event list from real LMS records, then upsert it into the
 * student's inbox. `$setOnInsert` keeps the original read state and award date.
 */
const syncStudentNotifications = async (user, enrollments) => {
  const batchIds = allowedBatchIds(enrollments);
  const courseIds = allowedCourseIds(enrollments);

  const [announcements, classes, quizzes, assignments, jobs, attempts, gradedAssignments, certificates, applications] =
    await Promise.all([
      Announcement.find({
        isPublished: true,
        $or: [
          { audience: 'All Students' },
          { audience: 'Course', course: { $in: courseIds } },
          { audience: 'Batch', batch: { $in: batchIds } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
      batchIds.length
        ? ClassSession.find({
            batch: { $in: batchIds },
            status: { $in: ['Scheduled', 'Published'] },
            notifyStudents: { $ne: false },
            startsAt: { $gte: daysAgo(30), $lte: daysAhead(90) },
            $or: [{ visibleFrom: null }, { visibleFrom: { $lte: new Date() } }],
          })
            .populate('batch', 'name batchCode')
            .sort({ createdAt: -1 })
            .limit(60)
            .lean()
        : [],
      Quiz.find({
        isPublished: true,
        $or: [{ batch: { $in: batchIds } }, { batch: null, course: { $in: courseIds } }],
      })
        .populate('batch', 'name batchCode')
        .sort({ createdAt: -1 })
        .limit(60)
        .lean(),
      batchIds.length
        ? Assignment.find({
            batch: { $in: batchIds },
            status: { $in: ['Published', 'Closed'] },
            createdAt: { $gte: daysAgo(120) },
          })
            .populate('batch', 'name batchCode')
            .sort({ createdAt: -1 })
            .limit(60)
            .lean()
        : [],
      Job.find({
        ...targetedJobFilter(batchIds, courseIds),
        createdAt: { $gte: daysAgo(120) },
      })
        .sort({ postedAt: -1, createdAt: -1 })
        .limit(40)
        .lean(),
      QuizAttempt.find({
        student: user._id,
        submittedAt: { $gte: daysAgo(120) },
        status: { $in: ['Auto-graded', 'Evaluated'] },
      })
        .populate('quiz', 'title totalMarks resultVisibility')
        .sort({ submittedAt: -1 })
        .limit(40)
        .lean(),
      AssignmentSubmission.find({
        student: user._id,
        status: 'Evaluated',
        evaluatedAt: { $gte: daysAgo(120) },
      })
        .populate('assignment', 'title totalMarks')
        .sort({ evaluatedAt: -1 })
        .limit(40)
        .lean(),
      Certificate.find({ student: user._id, revokedAt: null, isSample: { $ne: true } })
        .sort({ issueDate: -1 })
        .limit(20)
        .lean(),
      JobApplication.find({ email: String(user.email || '').toLowerCase() })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

  const candidates = [];

  announcements.forEach((row) => {
    candidates.push({
      type: 'Announcement',
      title: row.pinned ? `📌 ${row.title}` : row.title,
      body: clampText(row.body),
      link: '/student/dashboard',
      dedupeKey: `announcement:${row._id}`,
      eventAt: row.createdAt || new Date(),
    });
  });

  classes.forEach((row) => {
    candidates.push({
      type: 'Class',
      title: `${row.status === 'Scheduled' ? 'Class scheduled' : 'Class published'}: ${row.title}`,
      body: `${formatDateTime(row.startsAt)}${row.batch?.name ? ` · ${row.batch.name}` : ''}${
        row.instructor ? ` · ${row.instructor}` : ''
      }`,
      link: '/student/classes',
      dedupeKey: `class:${row._id}`,
      eventAt: row.publishedAt || row.createdAt || new Date(),
    });
  });

  quizzes.forEach((row) => {
    candidates.push({
      type: 'Quiz',
      title: `Quiz published: ${row.title}`,
      body: `${row.batch?.name || 'Course quiz'} · ${(row.questions || []).length} question(s)${
        row.timeLimitMinutes ? ` · ${row.timeLimitMinutes} min` : ''
      }`,
      link: '/student/quizzes',
      dedupeKey: `quiz:${row._id}`,
      eventAt: row.createdAt || new Date(),
    });
  });

  assignments.forEach((row) => {
    candidates.push({
      type: 'Assignment',
      title: `Assignment posted: ${row.title}`,
      body: `${row.dueAt ? `Due ${formatDateTime(row.dueAt)}` : 'No deadline'} · ${row.totalMarks || 0} marks${
        row.batch?.name ? ` · ${row.batch.name}` : ''
      }`,
      link: '/student/assignments',
      dedupeKey: `assignment:${row._id}`,
      eventAt: row.createdAt || new Date(),
    });
  });

  jobs.forEach((row) => {
    candidates.push({
      type: 'Job',
      title: `New role: ${row.title}`,
      body: `${row.company || 'Career partner'}${row.location ? ` · ${row.location}` : ''}${
        row.employmentType ? ` · ${row.employmentType}` : ''
      }`,
      link: '/student/jobs',
      dedupeKey: `job:${row._id}`,
      eventAt: row.postedAt || row.createdAt || new Date(),
    });
  });

  attempts.forEach((row) => {
    if (row.quiz?.resultVisibility === 'Hidden') return;
    candidates.push({
      type: 'Grade',
      title: `Quiz result: ${row.quiz?.title || 'Quiz'}`,
      body: `You scored ${row.scoreMarks ?? 0}/${row.totalMarks || row.quiz?.totalMarks || 0} (${
        row.scorePercent ?? 0
      }%)${row.passed ? ' · Passed' : ''}`,
      link: '/student/grades',
      dedupeKey: `quiz-grade:${row._id}`,
      eventAt: row.submittedAt || row.createdAt || new Date(),
    });
  });

  gradedAssignments.forEach((row) => {
    candidates.push({
      type: 'Grade',
      title: `Assignment graded: ${row.assignment?.title || 'Assignment'}`,
      body: `You scored ${row.marks ?? 0}/${row.assignment?.totalMarks || 0}${
        row.feedback ? ` · ${clampText(row.feedback, 100)}` : ''
      }`,
      link: '/student/grades',
      dedupeKey: `assignment-grade:${row._id}`,
      eventAt: row.evaluatedAt || row.updatedAt || new Date(),
    });
  });

  certificates.forEach((row) => {
    candidates.push({
      type: 'Certificate',
      title: `Certificate issued: ${row.courseTitle}`,
      body: `Certificate ${row.certificateId} · ${formatDateTime(row.issueDate)}`,
      link: '/student/certificates',
      dedupeKey: `certificate:${row._id}`,
      eventAt: row.issueDate || row.createdAt || new Date(),
    });
  });

  enrollments.forEach((row) => {
    candidates.push({
      type: 'Enrollment',
      title: `You're enrolled in ${row.course?.title || 'your course'}`,
      body: row.batch?.name ? `${row.batch.name}${row.batch.batchCode ? ` · ${row.batch.batchCode}` : ''}` : 'Course access is active.',
      link: '/student/courses',
      dedupeKey: `enrollment:${row._id}`,
      eventAt: row.enrolledAt || row.createdAt || new Date(),
    });
  });

  applications.forEach((row) => {
    if (row.status === 'Submitted') return;
    candidates.push({
      type: 'Job',
      title: 'Your job application was updated',
      body: `Application status: ${row.status}`,
      link: '/student/jobs',
      dedupeKey: `application:${row._id}`,
      eventAt: row.updatedAt || row.createdAt || new Date(),
    });
  });

  const unique = uniqueBy(
    candidates
      .filter((row) => row.dedupeKey && row.title)
      .sort((a, b) => new Date(b.eventAt) - new Date(a.eventAt)),
    (row) => row.dedupeKey
  ).slice(0, 120);

  if (unique.length) {
    try {
      await StudentNotification.bulkWrite(
        unique.map((row) => ({
          updateOne: {
            filter: { student: user._id, dedupeKey: row.dedupeKey },
            update: {
              $setOnInsert: {
                student: user._id,
                type: row.type,
                title: row.title,
                body: row.body,
                link: row.link,
                dedupeKey: row.dedupeKey,
                eventAt: row.eventAt,
                readAt: null,
              },
            },
            upsert: true,
          },
        })),
        { ordered: true }
      );
    } catch (error) {
      // A concurrent sync can race on the unique (student, dedupeKey) index.
      // The inbox is already correct in that case, so only rethrow real errors.
      if (error?.code !== 11000) throw error;
    }
  }
};

// @desc   Student's notification inbox, synced from real LMS events
// @route  GET /api/lms/notifications
const getMyNotifications = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    await syncStudentNotifications(req.user, enrollments);

    const [rows, unreadCount] = await Promise.all([
      StudentNotification.find({ student: req.user._id })
        .sort({ eventAt: -1, createdAt: -1 })
        .limit(100)
        .lean(),
      StudentNotification.countDocuments({ student: req.user._id, readAt: null }),
    ]);

    const summary = rows.reduce(
      (acc, row) => {
        acc.total += 1;
        acc[row.type] = (acc[row.type] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );

    return res.status(200).json({
      success: true,
      unreadCount,
      summary,
      notifications: rows.map((row) => ({
        _id: row._id,
        type: row.type,
        title: row.title,
        body: row.body,
        link: row.link,
        eventAt: row.eventAt,
        read: Boolean(row.readAt),
        readAt: row.readAt,
      })),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Unread count for the sidebar badge
// @route  GET /api/lms/notifications/unread-count
const getMyNotificationCount = async (req, res) => {
  try {
    const unreadCount = await StudentNotification.countDocuments({
      student: req.user._id,
      readAt: null,
    });
    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Mark one of this student's notifications as read
// @route  PATCH /api/lms/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id.' });
    }
    const updated = await StudentNotification.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      { readAt: new Date() },
      { new: true }
    ).lean();
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    const unreadCount = await StudentNotification.countDocuments({
      student: req.user._id,
      readAt: null,
    });
    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc   Mark every notification in the student's inbox as read
// @route  PATCH /api/lms/notifications/read-all
const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await StudentNotification.updateMany(
      { student: req.user._id, readAt: null },
      { readAt: new Date() }
    );
    return res.status(200).json({ success: true, marked: result.modifiedCount || 0, unreadCount: 0 });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard
// ─────────────────────────────────────────────────────────────────────────────

const bestQuizScores = (attempts) => {
  const best = new Map();
  attempts.forEach((row) => {
    const key = String(row.quiz?._id || row.quiz || '');
    if (!key) return;
    const score = Number(row.scorePercent || 0);
    if (!best.has(key) || score > best.get(key)) best.set(key, score);
  });
  return best;
};

// @desc   Batch-scoped leaderboard, ranked from real quiz, assignment and attendance data
// @route  GET /api/lms/leaderboard
const getMyLeaderboard = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments);

    if (!batchIds.length) {
      return res.status(200).json({ success: true, generatedAt: new Date(), batches: [] });
    }

    const [batches, peerEnrollments] = await Promise.all([
      Batch.find({ _id: { $in: batchIds } })
        .select('name batchCode timing course')
        .populate('course', 'title')
        .lean(),
      Enrollment.find({ batch: { $in: batchIds }, status: 'Active' })
        .select('student course batch accessStart accessUntil status')
        .lean(),
    ]);

    const usableEnrollments = peerEnrollments.filter((row) => isEnrollmentCurrent(row));
    const peerIds = uniqueIds(usableEnrollments.map((row) => row.student));

    if (!peerIds.length) {
      return res.status(200).json({ success: true, generatedAt: new Date(), batches: [] });
    }

    const [users, attempts, submissions, attendance, badges] = await Promise.all([
      User.find({ _id: { $in: peerIds }, isActive: { $ne: false } })
        .select('name avatar studentDetails.enrollmentNumber')
        .lean(),
      QuizAttempt.find({ student: { $in: peerIds }, batch: { $in: batchIds } })
        .select('student batch quiz scorePercent status')
        .lean(),
      AssignmentSubmission.find({ student: { $in: peerIds }, batch: { $in: batchIds } })
        .populate('assignment', 'totalMarks')
        .select('student batch assignment marks status')
        .lean(),
      AttendanceRecord.find({ student: { $in: peerIds }, batch: { $in: batchIds } })
        .select('student batch status')
        .lean(),
      StudentBadge.find({ student: { $in: peerIds } })
        .select('student')
        .lean(),
    ]);

    const userMap = new Map(users.map((row) => [String(row._id), row]));
    const badgeCounts = badges.reduce((map, row) => {
      const key = String(row.student);
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map());

    const groupByStudentBatch = (rows) => {
      const map = new Map();
      rows.forEach((row) => {
        const key = `${String(row.student)}|${String(row.batch)}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(row);
      });
      return map;
    };

    const attemptMap = groupByStudentBatch(attempts);
    const submissionMap = groupByStudentBatch(submissions);
    const attendanceMap = groupByStudentBatch(attendance);

    const boards = batches.map((batch) => {
      const batchId = String(batch._id);
      const peers = usableEnrollments
        .filter((row) => String(row.batch) === batchId)
        .map((row) => String(row.student))
        .filter((id, index, list) => list.indexOf(id) === index)
        .filter((id) => userMap.has(id));

      const entries = peers.map((studentId) => {
        const user = userMap.get(studentId);
        const key = `${studentId}|${batchId}`;
        const studentAttempts = attemptMap.get(key) || [];
        const best = bestQuizScores(studentAttempts);
        const quizAverage = best.size ? average([...best.values()]) : null;

        const evaluated = (submissionMap.get(key) || []).filter(
          (row) => row.status === 'Evaluated' && row.marks !== null && row.marks !== undefined
        );
        const assignmentAverage = average(
          evaluated.map((row) => percentOf(row.marks, row.assignment?.totalMarks || 0))
        );

        const attendanceRows = attendanceMap.get(key) || [];
        const present = attendanceRows.filter((row) => row.status === 'Present').length;
        const late = attendanceRows.filter((row) => row.status === 'Late').length;
        const attendanceRate = attendanceRows.length
          ? round(((present + late) / attendanceRows.length) * 100)
          : null;

        const score =
          compositePercent({
            quizAverage,
            quizCount: best.size,
            assignmentAverage,
            assignmentCount: evaluated.length,
            attendanceRate,
            attendanceCount: attendanceRows.length,
          }) ?? 0;

        return {
          studentId,
          name: user.name || 'Student',
          initials: String(user.name || 'S')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join(''),
          avatar: user.avatar || '',
          enrollmentNumber: user.studentDetails?.enrollmentNumber || '',
          isMe: studentId === String(req.user._id),
          score,
          quizAverage: quizAverage === null ? null : round(quizAverage),
          quizzesCounted: best.size,
          assignmentAverage: assignmentAverage === null ? null : round(assignmentAverage),
          assignmentsGraded: evaluated.length,
          attendanceRate,
          classesMarked: attendanceRows.length,
          badges: badgeCounts.get(studentId) || 0,
        };
      });

      entries.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      const ranked = entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
      const myEntry = ranked.find((entry) => entry.isMe) || null;

      return {
        batch: {
          _id: batch._id,
          name: batch.name || batch.batchCode,
          batchCode: batch.batchCode,
          timing: batch.timing,
          course: batch.course?.title || '',
        },
        entries: ranked.slice(0, 50),
        participantCount: ranked.length,
        myRank: myEntry?.rank || null,
        myEntry,
        scoring: '60% best quiz scores · 25% graded assignments · 15% attendance, normalised to the data available',
      };
    });

    return res.status(200).json({
      success: true,
      generatedAt: new Date(),
      batches: boards.filter((board) => board.participantCount > 0),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Badges
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_CATALOG = [
  {
    key: 'first-quiz',
    title: 'First Steps',
    description: 'Submit your first quiz attempt',
    tier: 'bronze',
    icon: 'Sparkles',
    evaluate: (stats) => ({
      earned: stats.quizAttempts >= 1,
      current: Math.min(stats.quizAttempts, 1),
      target: 1,
      label: `${stats.quizAttempts} quiz attempt(s)`,
    }),
  },
  {
    key: 'perfect-score',
    title: 'Perfect Score',
    description: 'Score 100% on any quiz',
    tier: 'gold',
    icon: 'Target',
    evaluate: (stats) => ({
      earned: stats.bestQuizPercent >= 100,
      current: Math.min(round(stats.bestQuizPercent), 100),
      target: 100,
      label: `Best score ${round(stats.bestQuizPercent)}%`,
    }),
  },
  {
    key: 'quiz-scholar',
    title: 'Quiz Scholar',
    description: 'Average 90% or higher across at least 3 quizzes',
    tier: 'gold',
    icon: 'Brain',
    evaluate: (stats) => {
      const qualified = stats.quizCount >= 3 && stats.quizAverage >= 90;
      const progress = stats.quizCount < 3
        ? Math.round((stats.quizCount / 3) * 100)
        : Math.min(99, round(stats.quizAverage));
      return {
        earned: qualified,
        current: stats.quizCount < 3 ? stats.quizCount : round(stats.quizAverage),
        target: stats.quizCount < 3 ? 3 : 90,
        percent: progress,
        label: `${stats.quizCount} quiz(zes) · ${round(stats.quizAverage)}% average`,
      };
    },
  },
  {
    key: 'assignment-ace',
    title: 'Assignment Ace',
    description: 'Earn 80% or higher on 5 evaluated assignments',
    tier: 'silver',
    icon: 'ClipboardCheck',
    evaluate: (stats) => ({
      earned: stats.highAssignments >= 5,
      current: Math.min(stats.highAssignments, 5),
      target: 5,
      label: `${stats.highAssignments} assignment(s) at 80%+`,
    }),
  },
  {
    key: 'attendance-star',
    title: 'Attendance Star',
    description: 'Attend 10 or more classes with at least 90% attendance',
    tier: 'silver',
    icon: 'CalendarCheck',
    evaluate: (stats) => {
      const earned = stats.attendanceTotal >= 10 && stats.attendanceRate >= 90;
      const percent = stats.attendanceTotal < 10
        ? Math.round((stats.attendanceTotal / 10) * 100)
        : Math.min(99, round(stats.attendanceRate));
      return {
        earned,
        current: stats.attendanceTotal < 10 ? stats.attendanceTotal : round(stats.attendanceRate),
        target: stats.attendanceTotal < 10 ? 10 : 90,
        percent,
        label: `${stats.attendanceTotal} class(es) marked · ${round(stats.attendanceRate)}% attendance`,
      };
    },
  },
  {
    key: 'course-completer',
    title: 'Course Completer',
    description: 'Finish a course and earn its certificate',
    tier: 'platinum',
    icon: 'GraduationCap',
    evaluate: (stats) => ({
      earned: stats.certificates >= 1,
      current: Math.min(stats.certificates, 1),
      target: 1,
      label: `${stats.certificates} certificate(s)`,
    }),
  },
  {
    key: 'career-ready',
    title: 'Career Ready',
    description: 'Apply to a published role through the career network',
    tier: 'bronze',
    icon: 'Briefcase',
    evaluate: (stats) => ({
      earned: stats.jobApplications >= 1,
      current: Math.min(stats.jobApplications, 1),
      target: 1,
      label: `${stats.jobApplications} application(s)`,
    }),
  },
];

const syncBadges = async (user, stats) => {
  const awards = BADGE_CATALOG.filter((badge) => badge.evaluate(stats).earned);
  if (!awards.length) return;

  const existing = await StudentBadge.find({
    student: user._id,
    key: { $in: awards.map((badge) => badge.key) },
  })
    .select('key')
    .lean();
  const existingKeys = new Set(existing.map((row) => row.key));
  const missing = awards.filter((badge) => !existingKeys.has(badge.key));

  if (!missing.length) return;

  try {
    await StudentBadge.bulkWrite(
      missing.map((badge) => {
        const evaluation = badge.evaluate(stats);
        return {
          updateOne: {
            filter: { student: user._id, key: badge.key },
            update: {
              $setOnInsert: {
                student: user._id,
                key: badge.key,
                title: badge.title,
                description: badge.description,
                tier: badge.tier,
                awardedAt: new Date(),
                meta: { label: evaluation.label, generatedAt: new Date() },
              },
            },
            upsert: true,
          },
        };
      }),
      { ordered: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
};

// @desc   Badge catalogue plus the badges this student has earned
// @route  GET /api/lms/badges
const getMyBadges = async (req, res) => {
  try {
    const enrollments = await currentEnrollments(req.user);
    const batchIds = allowedBatchIds(enrollments);
    const courseIds = allowedCourseIds(enrollments);

    const [attempts, submissions, attendance, certificates, applications] = await Promise.all([
      QuizAttempt.find({
        student: req.user._id,
        $or: [{ batch: { $in: batchIds } }, { batch: null, course: { $in: courseIds } }],
      })
        .select('quiz scorePercent status')
        .lean(),
      batchIds.length
        ? AssignmentSubmission.find({ student: req.user._id, batch: { $in: batchIds } })
            .populate('assignment', 'totalMarks')
            .select('marks status assignment')
            .lean()
        : [],
      batchIds.length
        ? AttendanceRecord.find({ student: req.user._id, batch: { $in: batchIds } })
            .select('status')
            .lean()
        : [],
      Certificate.find({ student: req.user._id, revokedAt: null, isSample: { $ne: true } })
        .select('course')
        .lean(),
      JobApplication.find({ email: String(req.user.email || '').toLowerCase() }).select('_id').lean(),
    ]);

    const best = bestQuizScores(attempts);
    const quizAverage = best.size ? average([...best.values()]) : 0;
    const bestQuizPercent = best.size ? Math.max(...best.values()) : 0;

    const evaluated = submissions.filter(
      (row) => row.status === 'Evaluated' && row.marks !== null && row.marks !== undefined
    );
    const highAssignments = evaluated.filter(
      (row) => (percentOf(row.marks, row.assignment?.totalMarks || 0) ?? 0) >= 80
    ).length;

    const present = attendance.filter((row) => row.status === 'Present').length;
    const late = attendance.filter((row) => row.status === 'Late').length;
    const attendanceRate = attendance.length ? (present + late) / attendance.length * 100 : 0;

    const stats = {
      quizAttempts: attempts.length,
      quizCount: best.size,
      quizAverage,
      bestQuizPercent,
      highAssignments,
      attendanceTotal: attendance.length,
      attendanceRate,
      certificates: certificates.length,
      jobApplications: applications.length,
    };

    await syncBadges(req.user, stats);

    const awards = await StudentBadge.find({ student: req.user._id }).lean();
    const awardMap = new Map(awards.map((row) => [row.key, row]));

    const badges = BADGE_CATALOG.map((badge) => {
      const evaluation = badge.evaluate(stats);
      const award = awardMap.get(badge.key);
      return {
        key: badge.key,
        title: badge.title,
        description: badge.description,
        tier: badge.tier,
        icon: badge.icon,
        earned: Boolean(award) || evaluation.earned,
        awardedAt: award?.awardedAt || null,
        progress: {
          current: evaluation.current,
          target: evaluation.target,
          percent: Math.max(0, Math.min(100, evaluation.percent ?? Math.round((evaluation.current / Math.max(1, evaluation.target)) * 100))),
          label: evaluation.label,
        },
      };
    });

    const earned = badges.filter((badge) => badge.earned);
    const locked = badges
      .filter((badge) => !badge.earned)
      .sort((a, b) => b.progress.percent - a.progress.percent);

    return res.status(200).json({
      success: true,
      summary: {
        earned: earned.length,
        total: badges.length,
        nextBadge: locked[0]?.key || null,
      },
      badges,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getMyCalendar,
  getMyTranscript,
  getMyNotifications,
  getMyNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  getMyLeaderboard,
  getMyBadges,
};
