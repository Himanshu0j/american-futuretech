const express = require('express');
const router = express.Router();
const {
  getSiteSettings,
  updateSiteSettings,
  getAuditLogs,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getSiteSettings);
router.put('/', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), updateSiteSettings);
router.get('/audit-logs', protect, authorize('SUPERADMIN', 'ADMIN', 'SuperAdmin'), getAuditLogs);

module.exports = router;
