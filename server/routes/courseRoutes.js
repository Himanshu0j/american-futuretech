const express = require('express');
const router = express.Router();
const {
  getPublishedCourses,
  getAllCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  toggleBadge,
  deleteCourse,
} = require('../controllers/courseController');
const { protect, checkPermission } = require('../middleware/auth');

// Public
router.get('/', getPublishedCourses);
router.get('/:slug', getCourseBySlug);

// Admin CMS
router.get('/admin/all', protect, checkPermission('COURSES_VIEW'), getAllCourses);
router.post('/', protect, checkPermission('COURSES_CREATE'), createCourse);
router.put('/:id', protect, checkPermission('COURSES_EDIT'), updateCourse);
router.patch('/:id/badge', protect, checkPermission('COURSES_EDIT'), toggleBadge);
router.delete('/:id', protect, checkPermission('COURSES_DELETE'), deleteCourse);

module.exports = router;
