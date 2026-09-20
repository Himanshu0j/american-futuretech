const mongoose = require('mongoose');

const CurriculumModuleSchema = new mongoose.Schema({
  moduleNumber: { type: Number, required: true },
  moduleTitle: { type: String, required: true },
  topics: [{ type: String }],
  hours: { type: Number, default: 20 }
}, { _id: false });

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    default: 'Technology',
  },
  shortDescription: {
    type: String,
    default: 'Industry-leading practical program engineered for high-demand tech careers with hands-on capstone projects.',
  },
  description: {
    type: String,
    default: 'Comprehensive live training covering core foundational principles through advanced production-grade architectures. Master cutting-edge tools, build a robust professional portfolio, and achieve accredited US certifications under direct industry mentorship.',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  banner: {
    type: String,
    default: '',
  },
  badge: {
    type: String,
    default: '',
  },
  cardTheme: {
    type: String,
    enum: ['cyan', 'rose', 'emerald', 'indigo', 'amber', 'purple'],
    default: 'cyan',
  },
  duration: {
    type: String,
    default: '6 Months',
  },
  pricing: {
    basePrice: { type: Number, default: 2499 },
    discountedPrice: { type: Number, default: 1899 },
    currency: { type: String, default: '$' },
  },
  instructor: {
    name: { type: String, default: 'Dr. Marcus Vance' },
    role: { type: String, default: 'Chief AI Architect & Ex-FAANG Lead' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    bio: { type: String, default: '15+ years engineering scalable distributed intelligence and cybersecurity architectures.' },
  },
  rating: {
    type: Number,
    default: 4.9,
  },
  reviewsCount: {
    type: Number,
    default: 348,
  },
  highlights: [{
    type: String,
  }],
  skills: [{
    type: String,
  }],
  tools: [{
    type: String,
  }],
  prerequisites: [{
    type: String,
  }],
  outcomes: [{
    type: String,
  }],
  curriculum: [CurriculumModuleSchema],
  brochureUrl: {
    type: String,
    default: '/brochures/American_FutureTech_Syllabus.pdf',
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: true,
  },
  isPopular: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 1,
  },
  seatsUrgencyText: {
    type: String,
    default: 'Only 3 seats remaining for this cohort',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Course', CourseSchema);
