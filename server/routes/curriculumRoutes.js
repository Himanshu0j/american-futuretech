const express = require('express');
const router = express.Router();
const {
  getCourseCurriculum,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  createOrUpdateQuiz,
} = require('../controllers/curriculumController');
const { protect, authorize } = require('../middleware/auth');

// Public curriculum read
router.get('/courses/:courseId', getCourseCurriculum);

// Admin Curriculum CRUD
router.post('/modules', protect, authorize('SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'SuperAdmin', 'Instructor'), createModule);
router.put('/modules/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'SuperAdmin', 'Instructor'), updateModule);
router.delete('/modules/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), deleteModule);

router.post('/lessons', protect, authorize('SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'SuperAdmin', 'Instructor'), createLesson);
router.put('/lessons/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'SuperAdmin', 'Instructor'), updateLesson);
router.delete('/lessons/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), deleteLesson);

router.post('/quizzes', protect, authorize('SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'SuperAdmin', 'Instructor'), createOrUpdateQuiz);

module.exports = router;
