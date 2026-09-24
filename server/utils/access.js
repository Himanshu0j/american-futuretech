const Enrollment = require('../models/Enrollment');

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
  denyResponse,
};
