const mongoose = require('mongoose');

/**
 * A badge a student has actually earned.
 *
 * The badge catalogue and its thresholds live on the server. This collection
 * only records the award, so refreshing the page can never fabricate progress
 * and the award keeps its original date even after the underlying numbers move.
 */
const StudentBadgeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    awardedAt: {
      type: Date,
      default: Date.now,
    },
    // A snapshot of the evidence at award time, so the student page can explain
    // why it was earned without recomputing historical values.
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

StudentBadgeSchema.index({ student: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('StudentBadge', StudentBadgeSchema);
