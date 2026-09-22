const express = require('express');
const router = express.Router();
const {
  getSiteSettings,
  updateSiteSettings,
  getAuditLogs,
} = require('../controllers/settingsController');
const { protect, checkPermission } = require('../middleware/auth');

router.get('/', getSiteSettings);
router.put('/', protect, checkPermission('SETTINGS_EDIT', 'HOMEPAGE_EDIT'), updateSiteSettings);
router.get('/audit-logs', protect, checkPermission('AUDIT_LOG_VIEW', 'SETTINGS_VIEW'), getAuditLogs);

module.exports = router;
