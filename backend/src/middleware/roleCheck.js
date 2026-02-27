const config = require('../config');

/**
 * Role-based access control middleware
 * @param {...string} allowedRoles - Roles that can access the route ('admin', 'doctor')
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Skip role check in local mode
    if (config.isLocal) {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        actual: req.user.role,
      });
    }

    next();
  };
}

/**
 * Admin-only middleware (shortcut)
 */
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * Doctor or Admin middleware (shortcut)
 */
function requireDoctorOrAdmin(req, res, next) {
  return requireRole('admin', 'doctor')(req, res, next);
}

module.exports = {
  requireRole,
  requireAdmin,
  requireDoctorOrAdmin,
};
