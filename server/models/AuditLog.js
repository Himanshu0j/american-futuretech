const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  actorName: {
    type: String,
    required: true,
  },
  actorRole: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true, // e.g., 'COURSE_CREATED', 'LEAD_CONVERTED', 'STUDENT_ENROLLED', 'BATCH_UPDATED'
  },
  entity: {
    type: String,
    required: true, // e.g., 'Course', 'Lead', 'Student', 'Batch', 'Payment'
  },
  entityId: {
    type: String,
    default: '',
  },
  details: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
