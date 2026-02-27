const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate access token (short-lived)
 * @param {Object} user - User object with id, email, role
 * @returns {string} JWT token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );
}

/**
 * Generate refresh token (long-lived)
 * @param {Object} user - User object with id
 * @returns {string} JWT token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );
}

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload { userId, email, role }
 * @throws {Error} If token is invalid or expired
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    throw new Error('Invalid access token');
  }
}

/**
 * Verify refresh token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload { userId }
 * @throws {Error} If token is invalid or expired
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw new Error('Invalid refresh token');
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
