const mongoose = require('mongoose');

/**
 * Attendance for one student in one class.
 *
 * Stored per class rather than as an array on ClassSession so marking is
 * idempotent (upsert on class + student) and a student's own attendance can be
 * queried without loading every roster.
 */
const AttendanceRecordSchema = new mongoose.Schema(
  {
    classSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSession',
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
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      default: 'Present',
    },
    note: { type: String, default: '' },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    markedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AttendanceRecordSchema.index({ classSession: 1, student: 1 }, { unique: true });
AttendanceRecordSchema.index({ student: 1, batch: 1 });

module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);
