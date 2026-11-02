const mongoose = require('mongoose');

/**
 * Append-only timeline of what a student actually did.
 *
 * Kept separate from AuditLog: AuditLog records staff actions, this is scoped to
 * one student and is read from the student detail drawer ("kb kya kiya"). Rows
 * are never updated, so the history cannot be rewritten by a later action.
 */
const StudentActivitySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'session_ended',
        'lesson_opened',
        'lesson_completed',
        'class_opened',
        'quiz_submitted',
        'assignment_submitted',
        'profile_updated',
        'enrolled',
        'access_changed',
        'status_changed',
        'password_set',
        'transferred',
      ],
      index: true,
    },
    title: { type: String, required: true },
    detail: { type: String, default: '' },
    // Who performed it when the action was admin-driven (blank for self-service).
    actorName: { type: String, default: '' },
    actorRole: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

StudentActivitySchema.index({ student: 1, at: -1 });

module.exports = mongoose.model('StudentActivity', StudentActivitySchema);
