const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  addCallLog,
  convertToStudent,
  exportLeadsCsv,
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');

// Public lead submission (supports both /api/leads and /api/leads/apply)
router.post('/apply', createLead);
router.post('/', createLead);

// Admin CRM routes
router.get('/', protect, authorize('SuperAdmin', 'Counselor', 'SUPERADMIN', 'ADMIN'), getLeads);
router.get('/export/csv', protect, authorize('SuperAdmin', 'Counselor', 'SUPERADMIN', 'ADMIN'), exportLeadsCsv);
router.get('/:id', protect, authorize('SuperAdmin', 'Counselor', 'SUPERADMIN', 'ADMIN'), getLeadById);
router.patch('/:id/status', protect, authorize('SuperAdmin', 'Counselor', 'SUPERADMIN', 'ADMIN'), updateLeadStatus);
router.post('/:id/call-logs', protect, authorize('SuperAdmin', 'Counselor', 'SUPERADMIN', 'ADMIN'), addCallLog);
router.post('/:id/convert', protect, authorize('SuperAdmin', 'Counselor', 'SUPERADMIN', 'ADMIN'), convertToStudent);

module.exports = router;
