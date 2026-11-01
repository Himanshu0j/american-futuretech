const mongoose = require('mongoose');

/**
 * A learning resource attached to a batch.
 *
 * Class materials live on ClassSession; this collection is the batch-wide
 * library (reading lists, datasets, templates) that the Resources tab manages.
 */
const LmsResourceSchema = new mongoose.Schema(
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
      required: [true, 'Resource title is required'],
      trim: true,
    },
    description: { type: String, default: '' },
    url: { type: String, required: true },
    fileType: { type: String, default: 'LINK' },
    category: { type: String, default: 'Reading' },
    isPublished: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

LmsResourceSchema.index({ batch: 1, isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('LmsResource', LmsResourceSchema);
