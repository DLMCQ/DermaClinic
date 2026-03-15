const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const router = express.Router();

// Listar todos los usuarios (solo admin)
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDb();
    const users = await db.query('SELECT id, username, nombre, role FROM users ORDER BY nombre ASC');
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Obtener un usuario por ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({ error: 'No tenés permiso para ver este usuario' });
    }

    const user = await db.queryOne(
      'SELECT id, username, nombre, role FROM users WHERE id = ?',
      [id]
    );

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Crear nuevo usuario (solo admin)
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { username, password, nombre, role } = req.body;
    const db = getDb();

    if (!username || !password || !nombre || !role) {
      return res.status(400).json({ error: 'username, password, nombre y role son requeridos' });
    }

    const existing = await db.queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese nombre de usuario' });
    }

    const id = uuidv4();
    await db.execute(
      'INSERT INTO users (id, username, password, nombre, role) VALUES (?, ?, ?, ?, ?)',
      [id, username.toLowerCase(), password, nombre, role]
    );

    const user = await db.queryOne(
      'SELECT id, username, nombre, role FROM users WHERE id = ?',
      [id]
    );

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// Actualizar usuario
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, password, nombre, role } = req.body;
    const db = getDb();

    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.userId === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'No tenés permiso para actualizar este usuario' });
    }

    if (!isAdmin && role) {
      return res.status(403).json({ error: 'No tenés permiso para cambiar el role' });
    }

    const existing = await db.queryOne('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    const updates = {};
    if (username) updates.username = username.toLowerCase();
    if (password) updates.password = password;
    if (nombre) updates.nombre = nombre;
    if (role && isAdmin) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    await db.execute(`UPDATE users SET ${setClause} WHERE id = ?`, values);

    const user = await db.queryOne(
      'SELECT id, username, nombre, role FROM users WHERE id = ?',
      [id]
    );

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Eliminar usuario (solo admin)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    if (req.user.userId === id) {
      return res.status(400).json({ error: 'No podés eliminar tu propia cuenta' });
    }

    const user = await db.queryOne('SELECT id, username, nombre FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado exitosamente', user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
