const mongoose = require('mongoose');

const EnrolledStudentSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  feePaid: { type: Number, default: 1899 },
  totalFee: { type: Number, default: 1899 },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partial', 'Pending'],
    default: 'Paid',
  },
  invoiceId: {
    type: String,
    default: () => 'INV-' + Math.floor(100000 + Math.random() * 900000),
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  }
}, { _id: true });

/**
 * A cohort of one course.
 *
 * `timing` is the legacy one-line schedule the public site prints. The fields
 * below it are what the LMS batch workspace edits: separate days/times so a
 * class can be scheduled, an instructor to assign, and a meeting room the
 * student portal can open only while the class is live.
 *
 * Everything new is optional, so the batches created by the original
 * `POST /api/batches` endpoint (and every row already in the database) keep
 * loading and saving unchanged.
 */
const BatchSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  // Human label the LMS shows, e.g. "Batch 7–8 AM". Falls back to batchCode.
  name: {
    type: String,
    default: '',
    trim: true,
  },
  batchCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  // Legacy free-text schedule ("Sat & Sun: 10:00 AM - 12:00 PM EST").
  timing: {
    type: String,
    default: 'Sat & Sun: 10:00 AM - 12:00 PM EST',
  },
  days: {
    type: [String],
    default: [],
  },
  startTime: {
    type: String,
    default: '',
  },
  endTime: {
    type: String,
    default: '',
  },
  timezone: {
    type: String,
    default: 'EST (UTC-5)',
  },
  instructor: {
    type: String,
    default: '',
    trim: true,
  },
  assistantInstructor: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  meetingPlatform: {
    type: String,
    enum: ['Zoom', 'Google Meet', 'Microsoft Teams', 'Other', 'None'],
    default: 'Zoom',
  },
  meetingLink: {
    type: String,
    default: '',
  },
  maxCapacity: {
    type: Number,
    default: 25,
  },
  enrollmentStart: {
    type: Date,
  },
  enrollmentEnd: {
    type: Date,
  },
  // Draft batches stay out of the student portal and public batch lists until
  // an admin publishes them.
  visibility: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Published',
  },
  enrolledStudents: [EnrolledStudentSchema],
  status: {
    type: String,
    enum: ['Upcoming', 'In Progress', 'Completed', 'Closed', 'Archived'],
    default: 'Upcoming',
  },
  archivedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

BatchSchema.index({ course: 1, status: 1 });
BatchSchema.index({ visibility: 1, startDate: 1 });

/**
 * Keep the legacy one-line `timing` in step with the structured schedule so the
 * public course page and the LMS never disagree about when a batch meets.
 */
BatchSchema.pre('save', function syncTiming(next) {
  if (Array.isArray(this.days) && this.days.length && this.startTime && this.endTime) {
    const days = this.days.join(' & ');
    this.timing = `${days}: ${this.startTime} - ${this.endTime} ${this.timezone || ''}`.trim();
  }
  if (!this.name) this.name = this.batchCode;
  next();
});

module.exports = mongoose.model('Batch', BatchSchema);
