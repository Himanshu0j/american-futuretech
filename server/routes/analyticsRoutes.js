const express = require('express');
const router = express.Router();
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const { protect, authorizeScoped } = require('../middleware/auth');

// The panel gates the Executive Dashboard with DASHBOARD_VIEW. COUNSELOR keeps
// its documented role scope; an ADMIN now needs the permission itself.
router.get('/dashboard', protect, authorizeScoped(['SUPERADMIN', 'ADMIN', 'COUNSELOR'], ['DASHBOARD_VIEW']), getDashboardAnalytics);

module.exports = router;
