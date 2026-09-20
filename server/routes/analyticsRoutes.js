const express = require('express');
const router = express.Router();
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('SUPERADMIN', 'ADMIN', 'COUNSELOR', 'SuperAdmin', 'Counselor'), getDashboardAnalytics);

module.exports = router;
