const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Suspended', 'Cancelled'],
    default: 'Active',
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  // Optional access window. A blank date means "no limit on that side", so
  // every enrollment written before these fields existed keeps working.
  accessStart: {
    type: Date,
  },
  accessUntil: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  certificateIssued: {
    type: Boolean,
    default: false,
  },
  certificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
  },
}, {
  timestamps: true,
});

EnrollmentSchema.index({ student: 1, batch: 1 });
EnrollmentSchema.index({ batch: 1, status: 1 });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
