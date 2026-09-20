const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  applicantName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  linkedinUrl: {
    type: String,
    default: '',
  },
  portfolioUrl: {
    type: String,
    default: '',
  },
  resumeUrl: {
    type: String,
    default: '',
  },
  coverNote: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Submitted', 'Reviewing', 'Shortlisted', 'Interviewed', 'Rejected', 'Hired'],
    default: 'Submitted',
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
