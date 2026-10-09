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
const guardImages = require('../middleware/blockExternalImages');

// Blog covers, author avatars and alumni photos must be served by this site:
// the live CSP (`img-src 'self' data:`) refuses any other origin, which is how
// the alumni wall ended up rendering 50 empty circles.

// Blogs
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);
router.post('/blogs', protect, checkPermission('FAQ_CREATE', 'HOMEPAGE_EDIT'), guardImages, createBlog);
router.put('/blogs/:id', protect, checkPermission('FAQ_EDIT', 'HOMEPAGE_EDIT'), guardImages, updateBlog);
router.delete('/blogs/:id', protect, checkPermission('FAQ_DELETE', 'HOMEPAGE_EDIT'), deleteBlog);

// FAQs
router.get('/faqs', getFaqs);
router.post('/faqs', protect, checkPermission('FAQ_CREATE'), createFaq);
router.put('/faqs/:id', protect, checkPermission('FAQ_EDIT'), updateFaq);
router.delete('/faqs/:id', protect, checkPermission('FAQ_DELETE'), deleteFaq);

// Success Stories
router.get('/success-stories', getSuccessStories);
router.post('/success-stories', protect, checkPermission('HOMEPAGE_EDIT', 'FAQ_CREATE'), guardImages, createSuccessStory);
router.put('/success-stories/:id', protect, checkPermission('HOMEPAGE_EDIT', 'FAQ_EDIT'), guardImages, updateSuccessStory);
router.delete('/success-stories/:id', protect, checkPermission('HOMEPAGE_EDIT', 'FAQ_DELETE'), deleteSuccessStory);

module.exports = router;
