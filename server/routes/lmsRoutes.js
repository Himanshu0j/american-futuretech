const express = require('express');
const router = express.Router();
const {
  getStudentDashboard,
  getMyCourses,
  getCourseLearnData,
  getLessonDetails,
  completeLesson,
  getMyCertificates,
  getMyAnnouncements,
  verifyCertificate,
} = require('../controllers/lmsController');
const { getMyClasses, getClassDetails } = require('../controllers/classroomController');
const {
  getMyQuizzes,
  getQuizForAttempt,
  submitQuiz,
  getMyQuizResults,
  getMyAssignments,
  submitAssignment,
  getMyGrades,
  getMyAttendance,
  getMyResources,
  getMyJobs,
} = require('../controllers/lmsWorkspaceStudentController');
const {
  getMyCalendar,
  getMyTranscript,
  getMyNotifications,
  getMyNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  getMyLeaderboard,
  getMyBadges,
} = require('../controllers/lmsStudentExtrasController');
const { protect } = require('../middleware/auth');

// Public verification
router.get('/certificate/:certificateId', verifyCertificate);

// Protected student routes
router.get('/dashboard', protect, getStudentDashboard);
router.get('/my-courses', protect, getMyCourses);
router.get('/courses/:courseId/learn', protect, getCourseLearnData);
router.get('/lessons/:lessonId', protect, getLessonDetails);
router.post('/lessons/:lessonId/complete', protect, completeLesson);
router.get('/certificates', protect, getMyCertificates);
router.get('/announcements', protect, getMyAnnouncements);

// Classroom — every read is scoped to the student's own active batch
router.get('/classes', protect, getMyClasses);
router.get('/classes/:id', protect, getClassDetails);

// Assessments — batch-scoped, answer keys never leave the server
router.get('/quizzes', protect, getMyQuizzes);
router.get('/quizzes/:id', protect, getQuizForAttempt);
router.post('/quizzes/:id/submit', protect, submitQuiz);
router.get('/quiz-results', protect, getMyQuizResults);

// Assignments
router.get('/assignments', protect, getMyAssignments);
router.post('/assignments/:id/submit', protect, submitAssignment);

// Progress, attendance, resources and jobs
router.get('/grades', protect, getMyGrades);
router.get('/attendance', protect, getMyAttendance);
router.get('/resources', protect, getMyResources);
router.get('/jobs', protect, getMyJobs);

// Calendar, transcript, inbox, leaderboard and badges
router.get('/calendar', protect, getMyCalendar);
router.get('/transcript', protect, getMyTranscript);
router.get('/notifications', protect, getMyNotifications);
router.get('/notifications/unread-count', protect, getMyNotificationCount);
router.patch('/notifications/read-all', protect, markAllNotificationsRead);
router.patch('/notifications/:id/read', protect, markNotificationRead);
router.get('/leaderboard', protect, getMyLeaderboard);
router.get('/badges', protect, getMyBadges);

module.exports = router;
