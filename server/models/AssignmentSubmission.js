const mongoose = require('mongoose');

const SubmittedFileSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    fileType: { type: String, default: 'LINK' },
  },
  { _id: false }
);

/**
 * A student's submission for one assignment. Kept separate from the assignment
 * so the brief is never overwritten by an answer, and so evaluation records who
 * graded what and when.
 */
const AssignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    text: { type: String, default: '' },
    files: { type: [SubmittedFileSchema], default: [] },
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Submitted', 'Evaluated'],
      default: 'Submitted',
      index: true,
    },
    marks: { type: Number, default: null },
    feedback: { type: String, default: '' },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    evaluatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
