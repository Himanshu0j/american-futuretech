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
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/', getPublishedCourses);
router.get('/:slug', getCourseBySlug);

// Admin CMS
router.get('/admin/all', protect, getAllCourses);
router.post('/', protect, authorize('SuperAdmin', 'Counselor'), createCourse);
router.put('/:id', protect, authorize('SuperAdmin', 'Counselor'), updateCourse);
router.patch('/:id/badge', protect, authorize('SuperAdmin'), toggleBadge);
router.delete('/:id', protect, authorize('SuperAdmin'), deleteCourse);

module.exports = router;
