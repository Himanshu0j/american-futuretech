const express = require('express');
const router = express.Router();
const {
  registerStudent,
  login,
  getMe,
  getAllUsers,
  createUser,
  updateUser,
  updateProfile,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', registerStudent);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// SuperAdmin user management
router.get('/users', protect, authorize('SUPERADMIN', 'SuperAdmin'), getAllUsers);
router.post('/users', protect, authorize('SUPERADMIN', 'SuperAdmin'), createUser);
router.put('/users/:id', protect, authorize('SUPERADMIN', 'SuperAdmin'), updateUser);

module.exports = router;
