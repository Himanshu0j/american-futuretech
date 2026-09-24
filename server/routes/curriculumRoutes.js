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
const { protect, authorizeScoped } = require('../middleware/auth');

// Curriculum authoring lives in the Courses CMS, so it is gated by the COURSES_*
// capability (create / edit / delete) instead of by role alone. INSTRUCTOR keeps
// its documented authoring scope; an ADMIN now needs the matching grant — a
// read-only admin could previously write modules, lessons and quizzes.
const AUTHORING_ROLES = ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR'];
const canCreate = authorizeScoped(AUTHORING_ROLES, ['COURSES_CREATE', 'COURSES_EDIT']);
const canEdit = authorizeScoped(AUTHORING_ROLES, ['COURSES_EDIT']);
const canDelete = authorizeScoped(['SUPERADMIN', 'ADMIN'], ['COURSES_DELETE']);

// Public curriculum read
router.get('/courses/:courseId', getCourseCurriculum);

// Admin Curriculum CRUD
router.post('/modules', protect, canCreate, createModule);
router.put('/modules/:id', protect, canEdit, updateModule);
router.delete('/modules/:id', protect, canDelete, deleteModule);

router.post('/lessons', protect, canCreate, createLesson);
router.put('/lessons/:id', protect, canEdit, updateLesson);
router.delete('/lessons/:id', protect, canDelete, deleteLesson);

router.post('/quizzes', protect, canCreate, createOrUpdateQuiz);

module.exports = router;
