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
    default: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  },
  author: {
    name: { type: String, default: 'American FutureTech AI Research Group' },
    role: { type: String, default: 'Principal Instructor & AI Architect' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
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
