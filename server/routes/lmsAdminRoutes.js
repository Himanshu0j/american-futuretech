const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/lmsAdminController');
const { protect, authorizeScoped } = require('../middleware/auth');

// The LMS control centre follows the same capability model as the rest of the
// admin API: an ADMIN needs an explicit grant, while COUNSELOR (student records)
// and INSTRUCTOR (teaching) keep their documented role scope. The legacy
// STUDENTS_* / SETTINGS_* ids stay listed so an account granted before the LMS_*
// permissions existed does not lose access.
const VIEW_ROLES = ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'COUNSELOR'];

const canView = authorizeScoped(VIEW_ROLES, ['LMS_VIEW', 'STUDENTS_VIEW']);
const canManageEnroll = authorizeScoped(['SUPERADMIN', 'ADMIN', 'COUNSELOR'], ['LMS_ENROLL_EDIT', 'STUDENTS_EDIT']);
const canManageProgress = authorizeScoped(['SUPERADMIN', 'ADMIN', 'INSTRUCTOR'], ['LMS_PROGRESS_EDIT', 'STUDENTS_EDIT']);
const canManageComms = authorizeScoped(['SUPERADMIN', 'ADMIN', 'COUNSELOR'], ['LMS_COMMS_EDIT', 'STUDENTS_EDIT']);
const canManageSettings = authorizeScoped(['SUPERADMIN', 'ADMIN'], ['LMS_CONTENT_EDIT', 'SETTINGS_EDIT']);

// Dashboard
router.get('/overview', protect, canView, getLmsOverview);

// Enrollments & access
router.get('/enrollments', protect, canView, listEnrollments);
router.post('/enrollments', protect, canManageEnroll, createEnrollment);
router.put('/enrollments/:id', protect, canManageEnroll, updateEnrollment);
router.delete('/enrollments/:id', protect, canManageEnroll, deleteEnrollment);

// Assessments
router.get('/quiz-attempts', protect, canView, listQuizAttempts);

// Progress control
router.get('/progress', protect, canView, listProgress);
router.post('/progress/reset', protect, canManageProgress, resetProgress);
router.post('/progress/complete', protect, canManageProgress, completeProgress);

// Announcements
router.get('/announcements', protect, canView, listAnnouncements);
router.post('/announcements', protect, canManageComms, createAnnouncement);
router.put('/announcements/:id', protect, canManageComms, updateAnnouncement);
router.delete('/announcements/:id', protect, canManageComms, deleteAnnouncement);

// LMS defaults & certificate wording
router.get('/settings', protect, canView, getLmsSettings);
router.put('/settings', protect, canManageSettings, updateLmsSettings);

module.exports = router;
