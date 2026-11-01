const Enrollment = require('../models/Enrollment');
const Batch = require('../models/Batch');

/**
 * Access control for student-facing content.
 *
 * The client's rule: a student may ONLY reach the programs, courses, batches
 * and lessons that were assigned to them by staff. Hiding cards in the browser
 * is not enough — every student endpoint runs through this guard, so calling the
 * API directly for an unassigned course returns 403 instead of data.
 */

const STAFF_ROLES = ['SUPERADMIN', 'ADMIN', 'COUNSELOR', 'INSTRUCTOR'];
const TEACHING_ROLES = ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR'];

const normalizeRole = (role) => String(role || '').toUpperCase();

const isStaff = (user) => STAFF_ROLES.includes(normalizeRole(user?.role));

/** Staff who may open any course (counselors are not teaching staff). */
const canViewAnyCourse = (user) => TEACHING_ROLES.includes(normalizeRole(user?.role));

/**
 * May this user open this course? Students need an Active enrollment document —
 * an enrollment is the single source of truth for assignment, so removing the
 * enrollment immediately removes access.
 */
const checkCourseAccess = async (user, courseId) => {
  if (!user) return { allowed: false, reason: 'UNAUTHENTICATED' };
  if (canViewAnyCourse(user)) return { allowed: true, staff: true, enrollment: null };

  const enrollment = await Enrollment.findOne({
    student: user._id,
    course: courseId,
    status: 'Active',
  }).lean();

  if (!enrollment) return { allowed: false, reason: 'NOT_ENROLLED' };
  return { allowed: true, staff: false, enrollment };
};

/**
 * Is this enrollment usable right now? A blank access window means unlimited on
 * that side, so legacy enrollments keep their existing behaviour.
 */
const isEnrollmentCurrent = (enrollment, now = new Date()) => {
  if (!enrollment || enrollment.status !== 'Active') return false;
  const start = enrollment.accessStart ? new Date(enrollment.accessStart) : null;
  const until = enrollment.accessUntil ? new Date(enrollment.accessUntil) : null;
  if (start && !Number.isNaN(start.getTime()) && now < start) return false;
  if (until && !Number.isNaN(until.getTime()) && now > until) return false;
  return true;
};

/**
 * Batch-level guard used by every class/recording/material read.
 *
 * A student must hold an Active enrollment for BOTH the course and the same
 * batch. Checking only the course would let a 7 AM student open the 8 PM
 * cohort's room by guessing its id.
 */
const checkBatchAccess = async (user, batchId) => {
  if (!user) return { allowed: false, reason: 'UNAUTHENTICATED' };

  const batch = await Batch.findById(batchId).lean();
  if (!batch) return { allowed: false, reason: 'NOT_FOUND' };

  if (canViewAnyCourse(user)) {
    return { allowed: true, staff: true, batch, enrollment: null };
  }

  const enrollment = await Enrollment.findOne({
    student: user._id,
    course: batch.course,
    batch: batch._id,
    status: 'Active',
  }).lean();

  if (!isEnrollmentCurrent(enrollment)) {
    return { allowed: false, reason: 'NOT_ENROLLED', batch };
  }

  return { allowed: true, staff: false, batch, enrollment };
};

const denyBatchResponse = (res, reason) => {
  if (reason === 'NOT_FOUND') {
    return res.status(404).json({ success: false, message: 'That class no longer exists.' });
  }
  if (reason === 'UNAUTHENTICATED') {
    return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
  }
  return res.status(403).json({
    success: false,
    code: 'NOT_ENROLLED',
    message:
      'This class belongs to a batch you are not enrolled in. Access is granted by the admissions team — please contact your advisor.',
  });
};

const denyResponse = (res, reason, message) =>
  res.status(403).json({
    success: false,
    code: reason === 'UNAUTHENTICATED' ? 'UNAUTHENTICATED' : 'NOT_ENROLLED',
    message:
      message ||
      'You do not have access to this program. Access is granted by our admissions team — please contact your advisor.',
  });

module.exports = {
  STAFF_ROLES,
  TEACHING_ROLES,
  isStaff,
  canViewAnyCourse,
  checkCourseAccess,
  checkBatchAccess,
  isEnrollmentCurrent,
  denyResponse,
  denyBatchResponse,
};
