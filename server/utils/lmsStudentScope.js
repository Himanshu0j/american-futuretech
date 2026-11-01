/**
 * Shared student LMS scoping.
 *
 * The Active enrollment list is the single source of truth for what a student
 * may read. Every student controller derives its batch ids from this module so
 * calendar, transcript, notifications, leaderboard and badges cannot drift away
 * from the classroom/quiz access rules.
 */

const Enrollment = require('../models/Enrollment');
const { isEnrollmentCurrent } = require('./access');

/** Enrollment rows that are Active and inside their access window right now. */
const currentEnrollments = async (user) => {
  const rows = await Enrollment.find({ student: user._id, status: 'Active' })
    .populate('course', 'title slug thumbnail')
    .populate('batch', 'name batchCode timing')
    .lean();
  // A course-level enrollment (legacy, no batch) still grants the course's own
  // quizzes and lessons. It simply contributes no batch ids.
  return rows.filter((row) => isEnrollmentCurrent(row));
};

/** The exact batch ids this student may read from. */
const allowedBatchIds = (enrollments) =>
  enrollments.map((row) => row.batch?._id).filter(Boolean);

/** The course ids attached to the student's current enrollments. */
const allowedCourseIds = (enrollments) =>
  enrollments.map((row) => row.course?._id).filter(Boolean);

const batchLookup = (enrollments) =>
  new Map(
    enrollments
      .filter((row) => row.batch?._id)
      .map((row) => [String(row.batch._id), row])
  );

const uniqueIds = (values) => {
  const seen = new Set();
  return values.filter((value) => {
    if (!value) return false;
    const key = String(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

module.exports = {
  currentEnrollments,
  allowedBatchIds,
  allowedCourseIds,
  batchLookup,
  uniqueIds,
};
