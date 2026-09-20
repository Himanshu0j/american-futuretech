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
  deadline: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Job', JobSchema);
