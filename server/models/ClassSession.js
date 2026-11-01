const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, default: 'PDF' },
  fileSize: { type: String, default: '' },
}, { _id: false });

/**
 * One scheduled class inside a batch.
 *
 * A class is always attached to both its course and its batch. That pair is the
 * access boundary: a student only ever receives classes whose `batch` matches
 * their active Enrollment, so Batch A never leaks into Batch B.
 *
 * `startsAt` / `endsAt` are derived from `classDate` + the time strings so the
 * API can decide "is this live right now?" without timezone parsing on the
 * client. They are recomputed on every save and are not accepted from the
 * request body.
 */
const ClassSessionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Class title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  sessionNumber: {
    type: Number,
    default: 1,
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
  classDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    default: '10:00',
  },
  endTime: {
    type: String,
    default: '11:00',
  },
  timezone: {
    type: String,
    default: 'EST (UTC-5)',
  },
  startsAt: {
    type: Date,
    index: true,
  },
  endsAt: {
    type: Date,
    index: true,
  },
  deliveryMode: {
    type: String,
    enum: ['Live', 'Recorded', 'Hybrid'],
    default: 'Live',
  },
  meetingPlatform: {
    type: String,
    enum: ['Zoom', 'Google Meet', 'Microsoft Teams', 'YouTube Live', 'Other', 'None'],
    default: 'Zoom',
  },
  meetingUrl: {
    type: String,
    default: '',
  },
  recordingUrl: {
    type: String,
    default: '',
  },
  materials: {
    type: [MaterialSchema],
    default: [],
  },
  thumbnail: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Published', 'Completed', 'Cancelled'],
    default: 'Scheduled',
    index: true,
  },
  // The class stays out of the student portal until this moment. Empty means
  // "as soon as it is published".
  visibleFrom: {
    type: Date,
  },
  attendanceRequired: {
    type: Boolean,
    default: false,
  },
  notifyStudents: {
    type: Boolean,
    default: true,
  },
  publishedAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

ClassSessionSchema.index({ batch: 1, classDate: 1 });
ClassSessionSchema.index({ course: 1, status: 1 });

/** "14:30" → [14, 30]; anything unparseable falls back to the default. */
const parseTime = (value, fallback) => {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return [hours, minutes];
};

const combine = (dateValue, timeValue, fallback) => {
  const base = dateValue ? new Date(dateValue) : null;
  if (!base || Number.isNaN(base.getTime())) return undefined;
  const [hours, minutes] = parseTime(timeValue, fallback);
  // The date picker submits a plain YYYY-MM-DD, which Mongo stores as UTC
  // midnight. Building the instant from the UTC calendar parts keeps the class
  // on the day the admin picked instead of shifting it back a day in US zones.
  return new Date(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );
};

ClassSessionSchema.pre('validate', function deriveWindow(next) {
  const start = combine(this.classDate, this.startTime, [10, 0]);
  const end = combine(this.classDate, this.endTime, [11, 0]);
  this.startsAt = start;
  this.endsAt = end && start && end <= start
    // An overnight class is still a valid window: roll the end to the next day.
    ? new Date(end.getTime() + 24 * 60 * 60 * 1000)
    : end;

  if (this.status === 'Published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('ClassSession', ClassSessionSchema);
