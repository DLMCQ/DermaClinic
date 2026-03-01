const express = require('express');
const { getDb } = require('../database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = getDb();

    // Find user by username
    const user = await db.queryOne(
      'SELECT * FROM users WHERE username = $1 AND is_active = $2',
      [username.toLowerCase(), true]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 8); // 8 hours

    // Limpiar tokens viejos o expirados del usuario antes de insertar
    await db.execute(
      'DELETE FROM refresh_tokens WHERE user_id = $1 OR expires_at <= $2',
      [user.id, new Date().toISOString()]
    );
    
    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt.toISOString()]
    );

    // Return user (without password) and tokens
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const db = getDb();

    // Check if refresh token exists and is not expired
    const tokenRecord = await db.queryOne(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > $2',
      [refreshToken, new Date().toISOString()]
    );

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user
    const user = await db.queryOne(
      'SELECT * FROM users WHERE id = $1 AND is_active = $2',
      [decoded.userId, true]
    );

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const db = getDb();

    // Delete refresh token from database
    await db.execute(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [refreshToken]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    if (config.isLocal) {
      // In local mode, return dummy user
      return res.json({
        id: 'local-user',
        username: 'admin',
        nombre: 'Usuario Local',
        role: 'admin',
        is_active: true,
      });
    }

    const db = getDb();

    const user = await db.queryOne(
      'SELECT id, username, nombre, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
