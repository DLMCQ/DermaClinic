const express = require('express');
const { getDb } = require('../database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { validate, schemas } = require('../middleware/validate');
const { hashPassword } = require('../utils/password');
const config = require('../config');

const router = express.Router();

// Solo disponible en modo cloud
const cloudOnly = (req, res, next) => {
  if (config.isLocal) {
    return res.status(404).json({
      error: 'Endpoint solo disponible en modo cloud',
    });
  }
  next();
};

// Listar todos los usuarios (solo admin)
router.get('/', cloudOnly, authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDb();

    const users = await db.query(`
      SELECT id, username, nombre, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Obtener un usuario por ID (admin o el mismo usuario)
router.get('/:id', cloudOnly, authenticate, async (req, res, next) => {
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
      SELECT id, username, nombre, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
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
  cloudOnly,
  authenticate,
  requireRole('admin'),
  validate(schemas.createUser),
  async (req, res, next) => {
    try {
      const { username, password, nombre, role } = req.body;
      const db = getDb();

      // Verificar que el username no exista
      const existing = await db.queryOne(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existing) {
        return res.status(409).json({
          error: 'Ya existe un usuario con este Nombre de Usuario',
        });
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Crear usuario
      const user = await db.queryOne(`
        INSERT INTO users (username, password_hash, nombre, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, nombre, role, is_active, created_at
      `, [username, password_hash, nombre, role]);

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
);

// Actualizar usuario (admin o el mismo usuario)
router.put(
  '/:id',
  cloudOnly,
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

      const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
      const values = [id, ...fields.map(f => updates[f])];

      const user = await db.queryOne(`
        UPDATE users
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING id, username, nombre, role, is_active, updated_at
      `, values);

      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
        });
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

// Desactivar usuario (solo admin) - soft delete
router.delete('/:id', cloudOnly, authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // No permitir auto-desactivación
    if (req.user.userId === id) {
      return res.status(400).json({
        error: 'No puedes desactivar tu propia cuenta',
      });
    }

    const user = await db.queryOne(`
      UPDATE users
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id, username, nombre, is_active
    `, [id]);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      message: 'Usuario desactivado exitosamente',
      user,
    });
  } catch (error) {
    next(error);
  }
});

// Reactivar usuario (solo admin)
router.patch('/:id/activate', cloudOnly, authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const user = await db.queryOne(`
      UPDATE users
      SET is_active = true, updated_at = NOW()
      WHERE id = $1
      RETURNING id, username, nombre, is_active
    `, [id]);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      message: 'Usuario reactivado exitosamente',
      user,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
