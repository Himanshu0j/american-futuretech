const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
  caller: {
    type: String,
    default: 'Admissions Counselor',
  },
  note: {
    type: String,
    required: true,
  },
  callOutcome: {
    type: String,
    enum: ['Answered', 'Callback Requested', 'Interested', 'Not Interested', 'Voicemail', 'Counseling Scheduled'],
    default: 'Answered',
  },
  followUpDate: {
    type: Date,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const LeadSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  targetCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  preferredBatch: {
    type: String,
    default: 'Weekend Live (2 Hours)',
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Counseling Scheduled', 'Enrolled', 'Lost'],
    default: 'New',
  },
  marketingSource: {
    type: String,
    default: 'Direct Organic Landing Page',
  },
  assignedCounselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
    default: '',
  },
  callLogs: [CallLogSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Lead', LeadSchema);
