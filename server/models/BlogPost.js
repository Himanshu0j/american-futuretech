const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  excerpt: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'Artificial Intelligence',
  },
  tags: [{
    type: String,
  }],
  coverImage: {
    type: String,
    // Self-hosted defaults: the live CSP is `img-src 'self' data:`, so a new
    // post that leaves these blank must not fall back to a blocked URL.
    default: '/images/blog/default-cover.webp',
  },
  author: {
    name: { type: String, default: 'American FutureTech AI Research Group' },
    role: { type: String, default: 'Principal Instructor & AI Architect' },
    avatar: { type: String, default: '/images/avatars/default-avatar.webp' },
  },
  readTimeMinutes: {
    type: Number,
    default: 5,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  views: {
    type: Number,
    default: 142,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('BlogPost', BlogPostSchema);
