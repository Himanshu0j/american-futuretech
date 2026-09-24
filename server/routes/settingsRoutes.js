const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getSiteSettings,
  updateSiteSettings,
  getAuditLogs,
  getSiteEditorOverrides,
  getSiteEditorSummary,
  saveSiteEditorOverrides,
  resetSiteEditorRoute,
  getPaymentGatewayStatus,
  updatePaymentGateway,
} = require('../controllers/settingsController');
const { protect, checkPermission } = require('../middleware/auth');

// Public read of one page's text/image overrides (used by the public overlay).
const editorReadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many editor reads from this IP. Please slow down.' },
});

// ── Inline site editor (edit any text / image from the live page) ────────────
router.get(
  '/site-editor/summary',
  protect,
  checkPermission('SETTINGS_VIEW', 'SETTINGS_EDIT', 'HOMEPAGE_EDIT'),
  getSiteEditorSummary,
);
router.get('/site-editor', editorReadLimiter, getSiteEditorOverrides);
router.put('/site-editor', protect, checkPermission('SETTINGS_EDIT', 'HOMEPAGE_EDIT'), saveSiteEditorOverrides);
router.delete('/site-editor', protect, checkPermission('SETTINGS_EDIT', 'HOMEPAGE_EDIT'), resetSiteEditorRoute);

// ── Payment gateway (Stripe) — secrets go in, never come back out ────────────
router.get('/payment-gateway', protect, checkPermission('SETTINGS_VIEW', 'SETTINGS_EDIT'), getPaymentGatewayStatus);
router.put('/payment-gateway', protect, checkPermission('SETTINGS_EDIT'), updatePaymentGateway);

// ── Whole-site settings document ─────────────────────────────────────────────
router.get('/', getSiteSettings);
router.put('/', protect, checkPermission('SETTINGS_EDIT', 'HOMEPAGE_EDIT'), updateSiteSettings);
router.get('/audit-logs', protect, checkPermission('AUDIT_LOG_VIEW', 'SETTINGS_VIEW'), getAuditLogs);

module.exports = router;
