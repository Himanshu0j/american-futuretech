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

const BatchSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
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
  timing: {
    type: String,
    default: 'Sat & Sun: 10:00 AM - 12:00 PM EST',
  },
  maxCapacity: {
    type: Number,
    default: 25,
  },
  enrolledStudents: [EnrolledStudentSchema],
  status: {
    type: String,
    enum: ['Upcoming', 'In Progress', 'Completed', 'Closed'],
    default: 'Upcoming',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Batch', BatchSchema);
