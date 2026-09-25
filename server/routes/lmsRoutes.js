const express = require('express');
const router = express.Router();
const {
  getStudentDashboard,
  getMyCourses,
  getCourseLearnData,
  getLessonDetails,
  completeLesson,
  submitQuiz,
  getMyCertificates,
  getMyAnnouncements,
  verifyCertificate,
} = require('../controllers/lmsController');
const { protect } = require('../middleware/auth');

// Public verification
router.get('/certificate/:certificateId', verifyCertificate);

// Protected student routes
router.get('/dashboard', protect, getStudentDashboard);
router.get('/my-courses', protect, getMyCourses);
router.get('/courses/:courseId/learn', protect, getCourseLearnData);
router.get('/lessons/:lessonId', protect, getLessonDetails);
router.post('/lessons/:lessonId/complete', protect, completeLesson);
router.post('/quizzes/:quizId/submit', protect, submitQuiz);
router.get('/certificates', protect, getMyCertificates);
router.get('/announcements', protect, getMyAnnouncements);

module.exports = router;
