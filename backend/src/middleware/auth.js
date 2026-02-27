const { verifyAccessToken } = require('../utils/jwt');
const config = require('../config');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
function authenticate(req, res, next) {
  // Skip authentication in local mode (backward compatibility)
  if (config.isLocal) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach { userId, email, role } to request
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message || 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block request
 */
function optionalAuth(req, res, next) {
  if (config.isLocal) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    } catch (err) {
      // Silently ignore invalid token
      req.user = null;
    }
  }

  next();
}

module.exports = {
  authenticate,
  optionalAuth,
};
