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
const { protect, authorizeScoped } = require('../middleware/auth');

// Admissions pipeline. COUNSELOR keeps its documented role scope (the seeded
// counselor works this queue); an ADMIN must hold the matching LEADS_* grant, so
// a courses-only or read-only admin can no longer read or edit the CRM.
const LEADS_STAFF = ['SUPERADMIN', 'ADMIN', 'COUNSELOR'];
const canViewLeads = authorizeScoped(LEADS_STAFF, ['LEADS_VIEW']);
const canExportLeads = authorizeScoped(LEADS_STAFF, ['LEADS_EXPORT']);
const canEditLeads = authorizeScoped(LEADS_STAFF, ['LEADS_EDIT']);

// Public lead submission (supports both /api/leads and /api/leads/apply)
router.post('/apply', createLead);
router.post('/', createLead);

// Admin CRM routes
router.get('/', protect, canViewLeads, getLeads);
router.get('/export/csv', protect, canExportLeads, exportLeadsCsv);
router.get('/:id', protect, canViewLeads, getLeadById);
router.patch('/:id/status', protect, canEditLeads, updateLeadStatus);
router.post('/:id/call-logs', protect, canEditLeads, addCallLog);
router.post('/:id/convert', protect, canEditLeads, convertToStudent);

module.exports = router;
