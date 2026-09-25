const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  courseTitle: {
    type: String,
    required: true,
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  grade: {
    type: String,
    default: 'Honor Distinction',
  },
  accreditationBody: {
    type: String,
    default: 'American FutureTech Institute of Advanced Technologies (Wyoming, USA)',
  },
  verificationUrl: {
    type: String,
    required: true,
  },
  pdfUrl: {
    type: String,
    default: '',
  },
  // Showcase/seed records are flagged in the database itself, not just in one
  // screen. Every consumer (verification API, student dashboard, printed page)
  // can then refuse to present it as a conferred credential.
  isSample: {
    type: Boolean,
    default: false,
  },
  // Revocation is recorded on the document (not by deleting it) so the public
  // registry can answer honestly: "issued, then withdrawn" instead of 404ing
  // and leaving a printed certificate unexplainable.
  revokedAt: {
    type: Date,
    default: null,
  },
  revokedBy: {
    type: String,
    default: '',
  },
  revokedReason: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Certificate', CertificateSchema);
