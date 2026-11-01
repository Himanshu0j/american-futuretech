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
const {
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
} = require('../controllers/classroomAdminController');
const {
  createBatchQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizResults,
  evaluateQuizAttempt,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  evaluateSubmission,
  createResource,
  deleteResource,
  createBatchAnnouncement,
  deleteBatchAnnouncement,
  createBatchJob,
  listBatchJobs,
  listJobApplications,
  enrollStudentInBatch,
  resetStudentPassword,
  setStudentStatus,
  updateStudentAccess,
  transferStudentBatch,
  markAttendance,
  getBatchAnalytics,
} = require('../controllers/lmsWorkspaceAdminController');
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

// The course → batch → class authoring surface. INSTRUCTOR keeps its teaching
// scope; an ADMIN needs one of the content grants.
const canManageClassroom = authorizeScoped(
  ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR'],
  ['LMS_CONTENT_EDIT', 'COURSES_EDIT', 'COURSES_CREATE']
);

// Dashboard
router.get('/overview', protect, canView, getLmsOverview);

// LMS Portal — courses → batches → classes
router.get('/portal', protect, canView, getPortalOverview);
router.get('/portal/courses/:courseId', protect, canView, getCourseWorkspace);
router.patch('/portal/courses/:courseId/visibility', protect, canManageClassroom, setCourseVisibility);
router.post('/batches', protect, canManageClassroom, createBatch);
router.get('/batches/:id', protect, canView, getBatchWorkspace);
router.put('/batches/:id', protect, canManageClassroom, updateBatch);
router.delete('/batches/:id', protect, canManageClassroom, deleteBatch);
router.post('/batches/:id/archive', protect, canManageClassroom, archiveBatch);
router.post('/batches/:id/duplicate', protect, canManageClassroom, duplicateBatch);
router.post('/classes', protect, canManageClassroom, createClass);
router.put('/classes/:id', protect, canManageClassroom, updateClass);
router.delete('/classes/:id', protect, canManageClassroom, deleteClass);
router.post('/classes/:id/duplicate', protect, canManageClassroom, duplicateClass);

// Batch → Add Quiz
router.post('/batches/:id/quizzes', protect, canManageClassroom, createBatchQuiz);
router.put('/quizzes/:id', protect, canManageClassroom, updateQuiz);
router.delete('/quizzes/:id', protect, canManageClassroom, deleteQuiz);
router.get('/quizzes/:id/results', protect, canView, getQuizResults);
router.put('/quiz-attempts/:id/evaluate', protect, canManageProgress, evaluateQuizAttempt);

// Batch → Assignments
router.post('/batches/:id/assignments', protect, canManageClassroom, createAssignment);
router.put('/assignments/:id', protect, canManageClassroom, updateAssignment);
router.delete('/assignments/:id', protect, canManageClassroom, deleteAssignment);
router.get('/assignments/:id/submissions', protect, canView, getAssignmentSubmissions);
router.put('/assignment-submissions/:id/evaluate', protect, canManageProgress, evaluateSubmission);

// Batch → Resources / Announcements
router.post('/batches/:id/resources', protect, canManageClassroom, createResource);
router.delete('/resources/:id', protect, canManageClassroom, deleteResource);
router.post('/batches/:id/announcements', protect, canManageComms, createBatchAnnouncement);
router.delete('/batches/announcements/:id', protect, canManageComms, deleteBatchAnnouncement);

// Batch → Jobs
router.post('/batches/:id/jobs', protect, canManageClassroom, createBatchJob);
router.get('/batches/:id/jobs', protect, canView, listBatchJobs);
router.get('/jobs/:id/applications', protect, canView, listJobApplications);

// Batch → Students
router.post('/batches/:id/students', protect, canManageEnroll, enrollStudentInBatch);
router.post('/students/:id/reset-password', protect, canManageEnroll, resetStudentPassword);
router.put('/students/:id/status', protect, canManageEnroll, setStudentStatus);
router.put('/students/:id/access', protect, canManageEnroll, updateStudentAccess);
router.put('/students/:id/transfer', protect, canManageEnroll, transferStudentBatch);

// Batch → Attendance & analytics
router.post('/batches/:id/attendance', protect, canManageProgress, markAttendance);
router.get('/batches/:id/analytics', protect, canView, getBatchAnalytics);

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
