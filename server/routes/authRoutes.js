const express = require('express');
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

router.post('/register', registerStudent);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin & Staff management with granular RBAC & SuperAdmin delegation
router.get('/users', protect, checkPermission('ADMIN_MANAGEMENT_VIEW'), getAllUsers);
router.post('/users', protect, checkPermission('ADMIN_MANAGEMENT_CREATE'), createUser);
router.put('/users/:id', protect, checkPermission('ADMIN_MANAGEMENT_EDIT'), updateUser);
router.delete('/users/:id', protect, checkPermission('ADMIN_MANAGEMENT_DELETE'), deleteUser);
router.post('/users/:id/reset-password', protect, checkPermission('ADMIN_MANAGEMENT_EDIT'), resetUserPassword);

module.exports = router;
