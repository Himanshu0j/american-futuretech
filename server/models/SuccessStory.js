const mongoose = require('mongoose');

const SuccessStorySchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    // A local file, not Unsplash: the live CSP (`img-src 'self' data:`) refuses
    // third-party images, which is why the alumni wall rendered empty circles.
    default: '/images/avatars/default-story.webp',
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
