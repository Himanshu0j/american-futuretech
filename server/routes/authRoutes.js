const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  registerStudent,
  login,
  getMe,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  updateProfile,
} = require('../controllers/authController');
const { protect, checkPermission } = require('../middleware/auth');

// Layer 1 of brute-force defence: per-IP limits on the credential endpoints.
// Layer 2 (per-account lock) lives in authController.login.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // Only failed attempts count, so normal logins are never throttled.
  skipSuccessfulRequests: true,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many failed login attempts from this network. Please try again in 15 minutes.',
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many accounts created from this network. Please try again later.',
  },
});

router.post('/register', registerLimiter, registerStudent);
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin & Staff management with granular RBAC & SuperAdmin delegation
router.get('/users', protect, checkPermission('ADMIN_MANAGEMENT_VIEW'), getAllUsers);
router.post('/users', protect, checkPermission('ADMIN_MANAGEMENT_CREATE'), createUser);
router.put('/users/:id', protect, checkPermission('ADMIN_MANAGEMENT_EDIT'), updateUser);
router.delete('/users/:id', protect, checkPermission('ADMIN_MANAGEMENT_DELETE'), deleteUser);
router.post('/users/:id/reset-password', protect, checkPermission('ADMIN_MANAGEMENT_EDIT'), resetUserPassword);

module.exports = router;
