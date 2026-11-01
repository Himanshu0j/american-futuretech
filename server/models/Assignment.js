const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    fileType: { type: String, default: 'PDF' },
  },
  { _id: false }
);

/**
 * A graded task inside a batch.
 *
 * Assignment is the brief (what to do, by when, for how many marks);
 * AssignmentSubmission is the student's answer. Both carry `batch` because the
 * batch is the access boundary — a student in the 7 AM cohort must never see the
 * 5 PM cohort's assignment.
 */
const AssignmentSchema = new mongoose.Schema(
  {
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
    classSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSession',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
    },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    dueAt: { type: Date, default: null },
    totalMarks: { type: Number, default: 100, min: 0 },
    attachments: { type: [AttachmentSchema], default: [] },
    allowLateSubmission: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Closed'],
      default: 'Published',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

AssignmentSchema.index({ batch: 1, status: 1, dueAt: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
