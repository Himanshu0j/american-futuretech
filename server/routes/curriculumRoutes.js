const express = require('express');
const router = express.Router();
const {
  getCourseCurriculum,
  getAdminCourseCurriculum,
  reorderCurriculum,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  duplicateLesson,
  deleteLesson,
  createOrUpdateQuiz,
  deleteQuiz,
} = require('../controllers/curriculumController');
const { protect, authorizeScoped } = require('../middleware/auth');

// Curriculum authoring lives in the Courses CMS / LMS Control Centre, so it is
// gated by capability (create / edit / delete) instead of by role alone.
// INSTRUCTOR keeps its documented authoring scope; an ADMIN needs one of the
// listed grants — a read-only admin cannot write modules, lessons or quizzes.
//
// The LMS_* permissions were introduced with the LMS control centre. The older
// COURSES_* ids stay in every list so an existing staff account that was granted
// only COURSES_EDIT does not silently lose access.
const AUTHORING_ROLES = ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR'];
const VIEW_ROLES = ['SUPERADMIN', 'ADMIN', 'INSTRUCTOR', 'COUNSELOR'];

const canViewCurriculum = authorizeScoped(VIEW_ROLES, ['LMS_VIEW', 'COURSES_VIEW']);
const canCreate = authorizeScoped(AUTHORING_ROLES, ['LMS_CONTENT_EDIT', 'COURSES_CREATE', 'COURSES_EDIT']);
const canEdit = authorizeScoped(AUTHORING_ROLES, ['LMS_CONTENT_EDIT', 'COURSES_EDIT']);
const canEditQuiz = authorizeScoped(AUTHORING_ROLES, ['LMS_QUIZ_EDIT', 'COURSES_EDIT', 'COURSES_CREATE']);
const canDelete = authorizeScoped(['SUPERADMIN', 'ADMIN'], ['LMS_CONTENT_EDIT', 'COURSES_DELETE']);

// Public curriculum read (what the website and syllabus modal render)
router.get('/courses/:courseId', getCourseCurriculum);

// Admin curriculum read — includes unpublished drafts, which the public read hides
router.get('/admin/courses/:courseId', protect, canViewCurriculum, getAdminCourseCurriculum);

// Drag-and-drop ordering
router.put('/courses/:courseId/reorder', protect, canEdit, reorderCurriculum);

// Module CRUD
router.post('/modules', protect, canCreate, createModule);
router.put('/modules/:id', protect, canEdit, updateModule);
router.delete('/modules/:id', protect, canDelete, deleteModule);

// Lesson CRUD (video link, notes, resources)
router.post('/lessons', protect, canCreate, createLesson);
router.post('/lessons/:id/duplicate', protect, canCreate, duplicateLesson);
router.put('/lessons/:id', protect, canEdit, updateLesson);
router.delete('/lessons/:id', protect, canDelete, deleteLesson);

// Quizzes
router.post('/quizzes', protect, canEditQuiz, createOrUpdateQuiz);
router.delete('/quizzes/:id', protect, canEditQuiz, deleteQuiz);

module.exports = router;
