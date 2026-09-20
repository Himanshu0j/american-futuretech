const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  getSuccessStories,
  createSuccessStory,
  updateSuccessStory,
  deleteSuccessStory,
} = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/auth');

// Blogs
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);
router.post('/blogs', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), createBlog);
router.put('/blogs/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), updateBlog);
router.delete('/blogs/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), deleteBlog);

// FAQs
router.get('/faqs', getFaqs);
router.post('/faqs', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), createFaq);
router.put('/faqs/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), updateFaq);
router.delete('/faqs/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), deleteFaq);

// Success Stories
router.get('/success-stories', getSuccessStories);
router.post('/success-stories', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), createSuccessStory);
router.put('/success-stories/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), updateSuccessStory);
router.delete('/success-stories/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), deleteSuccessStory);

module.exports = router;
