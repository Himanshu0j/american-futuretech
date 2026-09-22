const BlogPost = require('../models/BlogPost');
const FAQ = require('../models/FAQ');
const SuccessStory = require('../models/SuccessStory');

// BLOGS
const getBlogs = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isPublished: true };
    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    const blogs = await BlogPost.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: blogs.length, blogs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const blog = await BlogPost.findOne({ slug: req.params.slug, isPublished: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog article not found' });
    blog.views = (blog.views || 0) + 1;
    await blog.save();
    return res.status(200).json({ success: true, blog });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createBlog = async (req, res) => {
  try {
    const blog = await BlogPost.create(req.body);
    return res.status(201).json({ success: true, blog });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    return res.status(200).json({ success: true, blog });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Blog post deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// FAQS
const getFaqs = async (req, res) => {
  try {
    const { category, all } = req.query;
    let query = {};
    if (all !== 'true') {
      query.isPublished = true;
    }
    if (category && category !== 'All') query.category = category;
    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ success: true, count: faqs.length, faqs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createFaq = async (req, res) => {
  try {
    const faq = await FAQ.create(req.body);
    return res.status(201).json({ success: true, faq });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateFaq = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    return res.status(200).json({ success: true, faq });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFaq = async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// SUCCESS STORIES
const getSuccessStories = async (req, res) => {
  try {
    const stories = await SuccessStory.find({ isFeatured: true }).sort({ rating: -1, createdAt: -1 });
    return res.status(200).json({ success: true, count: stories.length, stories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.create(req.body);
    return res.status(201).json({ success: true, story });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, story });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSuccessStory = async (req, res) => {
  try {
    await SuccessStory.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Story deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
