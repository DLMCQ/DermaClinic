const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { validate, schemas } = require('../middleware/validate');
const { hashPassword } = require('../utils/password');
const router = express.Router();

// Listar todos los usuarios (solo admin)
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDb();

    const users = await db.query(`
      SELECT id, email, nombre, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Obtener un usuario por ID (admin o el mismo usuario)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Admin puede ver cualquier usuario, otros solo a sí mismos
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({
        error: 'No tienes permiso para ver este usuario',
      });
    }

    const user = await db.queryOne(`
      SELECT id, email, nombre, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Crear nuevo usuario (solo admin)
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  validate(schemas.createUser),
  async (req, res, next) => {
    try {
      const { username, password, nombre, role } = req.body;
      const db = getDb();

      // Verificar que el username no exista
      const existing = await db.queryOne(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existing) {
        return res.status(409).json({
          error: 'Ya existe un usuario con este nombre de usuario',
        });
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Crear usuario con UUID generado en la app
      const id = uuidv4();
      await db.execute(
        'INSERT INTO users (id, username, password_hash, nombre, role) VALUES (?, ?, ?, ?, ?)',
        [id, username, password_hash, nombre, role]
      );

      const user = await db.queryOne(
        'SELECT id, username, nombre, role, is_active, created_at FROM users WHERE id = ?',
        [id]
      );

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
);

// Actualizar usuario (admin o el mismo usuario)
router.put(
  '/:id',
  authenticate,
  validate(schemas.updateUser),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const db = getDb();

      // Verificar permisos
      const isAdmin = req.user.role === 'admin';
      const isSelf = req.user.userId === id;

      if (!isAdmin && !isSelf) {
        return res.status(403).json({
          error: 'No tienes permiso para actualizar este usuario',
        });
      }

      // Solo admin puede cambiar role e is_active
      if (!isAdmin && (updates.role || updates.is_active !== undefined)) {
        return res.status(403).json({
          error: 'No tienes permiso para cambiar role o estado activo',
        });
      }

      // Si se actualiza password, hashear
      if (updates.password) {
        updates.password_hash = await hashPassword(updates.password);
        delete updates.password;
      }

      // Construir query dinámica
      const fields = Object.keys(updates);
      if (fields.length === 0) {
        return res.status(400).json({
          error: 'No hay campos para actualizar',
        });
      }

      // Verificar que el usuario existe
      const existing = await db.queryOne('SELECT id FROM users WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // MySQL: params van en orden de SET, id al final para WHERE
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = [...fields.map(f => updates[f]), id];

      await db.execute(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`,
        values
      );

      const user = await db.queryOne(
        'SELECT id, email, nombre, role, is_active, updated_at FROM users WHERE id = ?',
        [id]
      );

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

// Desactivar usuario (solo admin) - hard delete
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // No permitir auto-desactivación
    if (req.user.userId === id) {
      return res.status(400).json({
        error: 'No puedes desactivar tu propia cuenta',
      });
    }

    const user = await db.queryOne(
      'SELECT id, email, nombre FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      message: 'Usuario eliminado exitosamente',
      user,
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
