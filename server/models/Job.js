const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    default: 'American FutureTech Career Network Partner',
  },
  companyLogo: {
    type: String,
    default: '',
  },
  applicantCount: {
    type: Number,
    default: 0,
  },
  department: {
    type: String,
    default: 'Engineering & Technology',
  },
  location: {
    type: String,
    default: 'Remote (US & Global)',
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time',
  },
  experienceLevel: {
    type: String,
    default: 'Entry to Mid Level',
  },
  salaryRange: {
    type: String,
    default: '$95,000 - $140,000 / year',
  },
  skills: [{
    type: String,
  }],
  description: {
    type: String,
    required: true,
  },
  responsibilities: [{
    type: String,
  }],
  requirements: [{
    type: String,
  }],
  benefits: [{
    type: String,
  }],
  applyLink: {
    type: String,
    default: '',
  },
  recommendedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
  recommendedCourseTitle: {
    type: String,
    default: '',
  },
  salaryMin: {
    type: Number,
    default: 0,
  },
  salaryMax: {
    type: Number,
    default: 0,
  },
  preferredQualifications: [{
    type: String,
  }],
  keyRequirements: [{
    type: String,
  }],
  requiredCertificates: [{
    type: String,
  }],
  technicalSkills: [{
    type: String,
  }],
  softSkills: [{
    type: String,
  }],
  careerGrowth: {
    type: String,
    default: '',
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  qualifications: [{
    type: String,
  }],
  tools: [{
    type: String,
  }],
  languages: [{
    type: String,
  }],
  order: {
    type: Number,
    default: 0,
  },
  // When the role went live. Public cards show "Posted 2 hours ago" from this
  // date (falling back to createdAt), so the admin can back-date a re-post.
  postedAt: {
    type: Date,
    default: null,
  },
  // Annual salary floor, derived on save so the listing can filter/sort by
  // salary in the database instead of in memory (numbers only, never strings).
  salaryFloor: {
    type: Number,
    default: 0,
  },
  deadline: {
    type: Date,
  },
}, {
  timestamps: true,
});

const parseAnnualAmount = (value) => {
  const raw = String(value || '').replace(/,/g, '');
  const kMatch = raw.match(/(\d+(?:\.\d+)?)\s*k/i);
  if (kMatch) return Math.round(Number(kMatch[1]) * 1000);
  const numMatch = raw.match(/(\d{4,7})/);
  return numMatch ? Number(numMatch[1]) : 0;
};

JobSchema.pre('save', function computeSalaryFloor(next) {
  const explicit = Number(this.salaryMin);
  if (!isNaN(explicit) && explicit > 0) {
    this.salaryFloor = explicit;
  } else {
    const rangeFloor = parseAnnualAmount(this.salaryRange);
    this.salaryFloor = rangeFloor > 0 ? rangeFloor : 0;
  }
  if (!this.postedAt) this.postedAt = this.createdAt || new Date();
  next();
});

module.exports = mongoose.model('Job', JobSchema);
