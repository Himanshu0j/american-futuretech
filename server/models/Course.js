const mongoose = require('mongoose');

const CurriculumModuleSchema = new mongoose.Schema({
  moduleNumber: { type: Number, required: true },
  moduleTitle: { type: String, required: true },
  topics: [{ type: String }],
  hours: { type: Number, default: 20 }
}, { _id: false });

// ── Per-course "Tools Covered" block ──
// Every course used to render the same hard-coded tool grid (the Data Science
// one, for any course the static data did not recognise) with no way to change
// it. Tools now live on the course, so each program shows its own stack.
const CourseToolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '' },
}, { _id: false });

/**
 * Legacy rows (and the seeder) store the stack as plain names —
 * `tools: ['Python', 'Docker']`. Accept both shapes so an old course keeps
 * loading and the seed can still write its string list.
 */
const normalizeCourseTool = (tool) => {
  if (typeof tool === 'string') return { name: tool.trim(), icon: '' };
  if (tool && typeof tool === 'object') {
    return {
      name: String(tool.name || '').trim(),
      icon: String(tool.icon || '').trim(),
    };
  }
  return tool;
};

// ── Per-course capstone showcase cards ──
// The site-wide capstone list made every course show identical projects; this
// lets a course carry its own, with the global list kept as a fallback.
const CourseCapstoneSchema = new mongoose.Schema({
  tag: { type: String, default: 'Capstone' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  stack: [{ type: String }],
  color: { type: String, default: 'from-indigo-500 to-blue-500' },
  order: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
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

  // ── "Choose your learning experience" block on the course detail page ──
  // Admin ticks decide which of the two ways to learn this course offers.
  // Both default to true so an existing course keeps showing both cards.
  viewOptions: {
    groupBatch: { type: Boolean, default: true },
    personalizedMentor: { type: Boolean, default: true },
  },

  // ── "Tools Covered" block (heading + grid) ──
  // Empty title falls back to "<Course title> Program Tools Covered"; an empty
  // tools array keeps the static/legacy icon grid so no course renders blank.
  toolsTitle: {
    type: String,
    default: '',
  },
  toolsSubtitle: {
    type: String,
    default: '',
  },
  tools: {
    type: [CourseToolSchema],
    default: [],
    set: (value) => (Array.isArray(value) ? value.map(normalizeCourseTool) : value),
  },

  // ── Per-course Capstone Projects ──
  capstoneProjects: {
    type: [CourseCapstoneSchema],
    default: [],
  },

  // ── "Who Can Apply for this Course?" block ──
  // Different for every course, so it is edited on the course itself.
  eligibility: {
    eyebrow: { type: String, default: 'Eligibility & Candidate Profile' },
    title: { type: String, default: 'Who Can Apply for this Course?' },
    subtitle: {
      type: String,
      default: 'Our fellowship is designed to bridge learners from diverse professional and academic backgrounds into high-tier technology roles.',
    },
    points: [{ type: String }],
    certificationTitle: { type: String, default: 'Globally Recognised Certification' },
    certificationText: {
      type: String,
      default: 'Earn a verified credential recognized by Fortune 500 employers across the United States, Europe, and Asia. Accelerate your career with measurable credentials.',
    },
    certificationPoints: [{
      type: String,
    }],
    audiences: [{
      type: String,
    }],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Course', CourseSchema);
