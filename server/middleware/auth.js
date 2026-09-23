const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/auth');

// `passwordChangedAt` is stamped after hashing and the replacement token is
// signed after that, so a fresh token always carries iat >= passwordChangedAt.
// No grace window is needed — every older session dies immediately.

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token missing.',
    });
  }

  try {
    // No fallback secret: config/auth.js throws in production when it is missing
    // or unsafe, so a forged token cannot be signed with a published key.
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Invalid or expired token.',
      });
    }

    // Rotating a password revokes every session that started before it.
    if (req.user.passwordChangedAt && decoded.iat) {
      const changedAtSeconds = Math.floor(req.user.passwordChangedAt.getTime() / 1000);
      if (changedAtSeconds > decoded.iat) {
        return res.status(401).json({
          success: false,
          code: 'PASSWORD_CHANGED',
          message: 'Your password was changed. Please log in again.',
        });
      }
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact SuperAdmin.',
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Invalid or expired token.',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Authentication required.',
      });
    }
    const userRoleLower = (req.user.role || '').toLowerCase();
    const allowedRolesLower = roles.map(r => r.toLowerCase());
    if (!allowedRolesLower.includes(userRoleLower)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to perform this action.`,
      });
    }
    next();
  };
};

/**
 * Granular Permission Guard Middleware
 * - SuperAdmin automatically passes all checks.
 * - For ADMIN and other staff, verifies that req.user.permissions includes at least one of the required permissions.
 * - Rejects with 403 Forbidden if permissions are insufficient.
 */
const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const roleLower = (req.user.role || '').toLowerCase();

    // SuperAdmin has unconditional authority
    if (roleLower === 'superadmin') {
      return next();
    }

    // Normal Admin or other roles must possess at least one matching granular permission
    const userPermissions = req.user.permissions || [];
    const hasAccess = requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not possess the required permission (${requiredPermissions.join(' or ')}) to perform this action.`,
        requiredPermissions,
      });
    }

    next();
  };
};

module.exports = { protect, authorize, checkPermission };

