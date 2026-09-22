const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'american_futuretech_jwt_secret_ultra_secure_key_2026', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register a new student account
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email and password',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'STUDENT',
      isActive: true,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      studentDetails: {
        enrollmentNumber: 'AFT-' + Math.floor(100000 + Math.random() * 900000),
      },
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to American FutureTech.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        enrollmentNumber: user.studentDetails?.enrollmentNumber,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Universal/Admin/Student login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact admissions.',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        permissions: user.permissions || [],
        enrollmentNumber: user.studentDetails?.enrollmentNumber,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        permissions: user.permissions || [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all staff/users
// @route   GET /api/auth/users
// @access  Private (SuperAdmin or ADMIN_MANAGEMENT_VIEW)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new staff / admin member
// @route   POST /api/auth/users
// @access  Private (SuperAdmin or ADMIN_MANAGEMENT_CREATE)
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const actorRole = (req.user?.role || '').toUpperCase();
    const requestedRole = (role || 'ADMIN').toUpperCase();

    // SuperAdmin Protection: Only a SUPERADMIN can create a SUPERADMIN
    if (requestedRole === 'SUPERADMIN' && actorRole !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only SuperAdmin can create SuperAdmin accounts.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: requestedRole,
      permissions: Array.isArray(permissions) ? permissions : [],
      isActive: true,
    });

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'SUPERADMIN',
      action: 'ADMIN_CREATED',
      entity: 'User',
      entityId: user._id.toString(),
      details: `Created staff member ${user.name} (${user.email}) as ${user.role} with ${user.permissions?.length || 0} permissions`,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user role, status or permissions
// @route   PUT /api/auth/users/:id
// @access  Private (SuperAdmin or ADMIN_MANAGEMENT_EDIT)
const updateUser = async (req, res) => {
  try {
    const { role, isActive, name, phone, permissions } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const actorRole = (req.user?.role || '').toUpperCase();
    const targetRole = (user.role || '').toUpperCase();

    // SuperAdmin Protection: Non-SuperAdmin cannot edit a SuperAdmin account
    if (targetRole === 'SUPERADMIN' && actorRole !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Non-SuperAdmin accounts cannot modify SuperAdmin profiles.',
      });
    }

    // SuperAdmin Protection: Non-SuperAdmin cannot promote anyone to SuperAdmin
    if (role && role.toUpperCase() === 'SUPERADMIN' && actorRole !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only SuperAdmin can grant SuperAdmin status.',
      });
    }

    // Protection: Cannot deactivate own active account
    if (typeof isActive === 'boolean' && user._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own active account.',
      });
    }

    if (role) user.role = role.toUpperCase();
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (Array.isArray(permissions)) user.permissions = permissions;

    await user.save();

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'SUPERADMIN',
      action: 'ADMIN_UPDATED',
      entity: 'User',
      entityId: user._id.toString(),
      details: `Updated user ${user.name} (${user.email}): role=${user.role}, active=${user.isActive}, permissions=${user.permissions?.length || 0}`,
    });

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private (SuperAdmin or ADMIN_MANAGEMENT_DELETE)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const actorRole = (req.user?.role || '').toUpperCase();
    const targetRole = (user.role || '').toUpperCase();

    // SuperAdmin Protection: Cannot delete a SuperAdmin
    if (targetRole === 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: SuperAdmin accounts are protected and cannot be deleted.',
      });
    }

    // Cannot delete own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'SUPERADMIN',
      action: 'ADMIN_DELETED',
      entity: 'User',
      entityId: req.params.id,
      details: `Deleted user ${user.name} (${user.email}) role=${user.role}`,
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reset user password
// @route   POST /api/auth/users/:id/reset-password
// @access  Private (SuperAdmin)
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const actorRole = (req.user?.role || '').toUpperCase();
    const targetRole = (user.role || '').toUpperCase();

    if (targetRole === 'SUPERADMIN' && actorRole !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only SuperAdmin can reset passwords for SuperAdmin accounts.',
      });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'SuperAdmin',
      actorRole: req.user?.role || 'SUPERADMIN',
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: user._id.toString(),
      details: `Password reset by ${req.user.name} for user ${user.name} (${user.email})`,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update current user's profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, avatar, bio, currentPassword, newPassword } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (bio) user.bio = bio;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Please provide current password to set a new password' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match' });
      }
      user.password = newPassword;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        bio: user.bio,
        enrollmentNumber: user.studentDetails?.enrollmentNumber,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerStudent,
  login,
  getMe,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  updateProfile,
};
