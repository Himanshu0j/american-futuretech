const mongoose = require('mongoose');

const SuccessStorySchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  course: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  companyLogo: {
    type: String,
    default: '',
  },
  salaryHikePercent: {
    type: Number,
    default: 135,
  },
  testimonial: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 5,
  },
  isFeatured: {
    type: Boolean,
    default: true,
  },
  graduationYear: {
    type: String,
    default: '2025',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SuccessStory', SuccessStorySchema);
