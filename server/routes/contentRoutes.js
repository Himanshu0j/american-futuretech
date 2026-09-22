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
const { protect, checkPermission } = require('../middleware/auth');

// Blogs
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);
router.post('/blogs', protect, checkPermission('FAQ_CREATE', 'HOMEPAGE_EDIT'), createBlog);
router.put('/blogs/:id', protect, checkPermission('FAQ_EDIT', 'HOMEPAGE_EDIT'), updateBlog);
router.delete('/blogs/:id', protect, checkPermission('FAQ_DELETE', 'HOMEPAGE_EDIT'), deleteBlog);

// FAQs
router.get('/faqs', getFaqs);
router.post('/faqs', protect, checkPermission('FAQ_CREATE'), createFaq);
router.put('/faqs/:id', protect, checkPermission('FAQ_EDIT'), updateFaq);
router.delete('/faqs/:id', protect, checkPermission('FAQ_DELETE'), deleteFaq);

// Success Stories
router.get('/success-stories', getSuccessStories);
router.post('/success-stories', protect, checkPermission('HOMEPAGE_EDIT', 'FAQ_CREATE'), createSuccessStory);
router.put('/success-stories/:id', protect, checkPermission('HOMEPAGE_EDIT', 'FAQ_EDIT'), updateSuccessStory);
router.delete('/success-stories/:id', protect, checkPermission('HOMEPAGE_EDIT', 'FAQ_DELETE'), deleteSuccessStory);

module.exports = router;
