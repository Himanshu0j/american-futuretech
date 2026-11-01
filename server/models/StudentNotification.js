const mongoose = require('mongoose');

/**
 * One notification in a student's inbox.
 *
 * Notifications are generated from real LMS events (announcements, classes,
 * quizzes, assignments, results, jobs and certificates). `dedupeKey` is the
 * stable identity of the source event, so syncing the inbox twice never creates
 * a duplicate and never clears a student's read state.
 */
const StudentNotificationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Announcement', 'Class', 'Quiz', 'Assignment', 'Grade', 'Job', 'Certificate', 'Enrollment'],
      default: 'Announcement',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      default: '',
    },
    link: {
      type: String,
      default: '/student/dashboard',
    },
    dedupeKey: {
      type: String,
      required: true,
      trim: true,
    },
    eventAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

StudentNotificationSchema.index({ student: 1, dedupeKey: 1 }, { unique: true });
StudentNotificationSchema.index({ student: 1, eventAt: -1 });

module.exports = mongoose.model('StudentNotification', StudentNotificationSchema);
