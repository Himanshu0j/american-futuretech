const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const SiteSettings = require('../models/SiteSettings');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');
const { getJwtSecret, getJwtExpire } = require('../config/auth');
const { validatePassword, describePasswordPolicy } = require('../utils/passwords');
const { sendError } = require('../utils/apiError');

// Brute-force protection thresholds (per account, on top of the per-IP route limiter).
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 15;

const generateToken = (id) => {
  // Signing key comes from config/auth.js — there is no hardcoded fallback.
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: getJwtExpire(),
  });
};

// Same response for "no such user" and "wrong password" so the endpoint cannot
// be used to discover which email addresses have accounts.
const INVALID_CREDENTIALS = { success: false, message: 'Invalid email or password.' };

const lockResponse = (lockUntil) => {
  const retryAfterSeconds = Math.max(1, Math.ceil((new Date(lockUntil).getTime() - Date.now()) / 1000));
  return {
    success: false,
    code: 'ACCOUNT_LOCKED',
    retryAfterSeconds,
    message: `Too many failed login attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
  };
};

// @desc    Register a new student account
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    // Public self-registration is OFF by default: student accounts are created
    // by authorized staff (Admin → Enrolled Students → Add Student) so access to
    // programs, batches and LMS content is always an explicit assignment. The
    // switch lives in Settings in case the client ever wants open signups again.
    const settings = await SiteSettings.findOne().lean();
    if (settings?.registration?.allowPublicStudentRegistration !== true) {
      return res.status(403).json({
        success: false,
        code: 'REGISTRATION_CLOSED',
        message:
          settings?.registration?.closedMessage ||
          'Student accounts are created by our admissions team. Please submit an admission enquiry and a counselor will set up your access.',
      });
    }

    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email and password',
      });
    }

    const strength = validatePassword(password, { email, name });
    if (!strength.valid) {
      return res.status(400).json({
        success: false,
        message: strength.errors[0],
        errors: strength.errors,
        policy: describePasswordPolicy(),
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
    return sendError(res, error);
  }
};

// @desc    Universal/Admin/Student login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Type-check before touching the database. A crafted body such as
    // `{"email":{"$ne":null},"password":{"$gt":""}}` would otherwise be handed
    // to Mongo as a query operator (and blow up on `.toLowerCase()`), turning a
    // bad request into a 500.
    const emailValue = typeof email === 'string' ? email.trim() : '';
    const passwordValue = typeof password === 'string' ? password : '';

    if (!emailValue || !passwordValue) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: emailValue.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    // Temporary account lock after repeated failures.
    if (user.isLocked && user.isLocked()) {
      return res.status(423).json(lockResponse(user.lockUntil));
    }

    const isMatch = await user.matchPassword(passwordValue);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000);
        user.failedLoginAttempts = 0;
        await user.save();

        await AuditLog.create({
          actorName: user.name,
          actorRole: user.role,
          action: 'ACCOUNT_LOCKED',
          entity: 'User',
          entityId: user._id.toString(),
          details: `Account locked for ${ACCOUNT_LOCK_MINUTES} minutes after ${MAX_FAILED_LOGIN_ATTEMPTS} failed login attempts (IP ${req.ip}).`,
        }).catch(() => {});

        return res.status(423).json(lockResponse(user.lockUntil));
      }

      await user.save();
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact admissions.',
      });
    }

    // Successful sign-in clears the failure counters.
    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
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
    return sendError(res, error);
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
    return sendError(res, error);
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
    return sendError(res, error);
  }
};

// @desc    Create new staff / admin member
// @route   POST /api/auth/users
// @access  Private (SuperAdmin or ADMIN_MANAGEMENT_CREATE)
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;

    const strength = validatePassword(password, { email, name });
    if (!strength.valid) {
      return res.status(400).json({
        success: false,
        message: strength.errors[0],
        errors: strength.errors,
        policy: describePasswordPolicy(),
      });
    }

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
    return sendError(res, error);
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
    return sendError(res, error);
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

    // A student account owns rows in other collections. Removing only the user
    // left those behind as orphans, where they stayed counted in progress and
    // completion reporting forever. Certificates are deliberately kept: they are
    // issued credentials and employers verify them by id, independent of login.
    let removedLearningState = { enrollments: 0, progresses: 0, quizAttempts: 0 };
    if (targetRole === 'STUDENT') {
      const [enrollments, progresses, attempts] = await Promise.all([
        Enrollment.deleteMany({ student: user._id }),
        Progress.deleteMany({ student: user._id }),
        QuizAttempt.deleteMany({ student: user._id }),
      ]);
      removedLearningState = {
        enrollments: enrollments?.deletedCount || 0,
        progresses: progresses?.deletedCount || 0,
        quizAttempts: attempts?.deletedCount || 0,
      };
    }

    await User.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'SUPERADMIN',
      action: 'ADMIN_DELETED',
      entity: 'User',
      entityId: req.params.id,
      details: `Deleted user ${user.name} (${user.email}) role=${user.role}` +
        (targetRole === 'STUDENT'
          ? ` — removed ${removedLearningState.enrollments} enrollment(s), ${removedLearningState.progresses} progress record(s), ${removedLearningState.quizAttempts} quiz attempt(s)`
          : ''),
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      removedLearningState,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Reset user password
// @route   POST /api/auth/users/:id/reset-password
// @access  Private (SuperAdmin)
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'A new password is required.' });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const strength = validatePassword(newPassword, { email: user.email, name: user.name });
    if (!strength.valid) {
      return res.status(400).json({
        success: false,
        message: strength.errors[0],
        errors: strength.errors,
        policy: describePasswordPolicy(),
      });
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
    return sendError(res, error);
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
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match' });
      }

      const strength = validatePassword(newPassword, { email: user.email, name: user.name });
      if (!strength.valid) {
        return res.status(400).json({
          success: false,
          message: strength.errors[0],
          errors: strength.errors,
          policy: describePasswordPolicy(),
        });
      }

      user.password = newPassword;
      // Identity was just re-proven with the current password, so an active
      // brute-force lock should not keep the owner out of their own account.
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }

    const passwordWasChanged = Boolean(newPassword);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      // Changing a password revokes every previous session, so the caller gets a
      // replacement token instead of being logged out of the device they used.
      ...(passwordWasChanged ? { token: generateToken(user._id) } : {}),
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
