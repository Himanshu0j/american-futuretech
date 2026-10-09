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
const guardImages = require('../middleware/blockExternalImages');

// Rejects an off-site image URL before it is stored: the live CSP
// (`img-src 'self' data:`) refuses anything not served by this site, so such a
// value would save cleanly and render as an empty tile.

// Public
router.get('/', getPublishedCourses);
router.get('/:slug', getCourseBySlug);

// Admin CMS
router.get('/admin/all', protect, checkPermission('COURSES_VIEW'), getAllCourses);
router.post('/', protect, checkPermission('COURSES_CREATE'), guardImages, createCourse);
router.put('/:id', protect, checkPermission('COURSES_EDIT'), guardImages, updateCourse);
router.patch('/:id/badge', protect, checkPermission('COURSES_EDIT'), toggleBadge);
router.delete('/:id', protect, checkPermission('COURSES_DELETE'), deleteCourse);

module.exports = router;
