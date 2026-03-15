const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// Listar citas con filtros opcionales
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { fecha_desde, fecha_hasta, paciente_id, estado, doctor_id } = req.query;
    const db = getDb();

    let query = `
      SELECT
        a.id,
        a.paciente_id,
        a.doctor_id,
        a.fecha_hora,
        a.duracion_minutos,
        a.tratamiento_planeado,
        a.estado,
        a.notas,
        a.recordatorio_enviado,
        a.created_at,
        a.updated_at,
        p.nombre as paciente_nombre,
        p.telefono as paciente_telefono,
        u.nombre as doctor_nombre
      FROM appointments a
      JOIN pacientes p ON a.paciente_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (fecha_desde) {
      query += ` AND a.fecha_hora >= ?`;
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      query += ` AND a.fecha_hora <= ?`;
      params.push(fecha_hasta);
    }

    if (paciente_id) {
      query += ` AND a.paciente_id = ?`;
      params.push(paciente_id);
    }

    if (estado) {
      query += ` AND a.estado = ?`;
      params.push(estado);
    }

    if (doctor_id) {
      query += ` AND a.doctor_id = ?`;
      params.push(doctor_id);
    }

    query += ' ORDER BY a.fecha_hora ASC';

    const appointments = await db.query(query, params);
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

// Obtener cita por ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const appointment = await db.queryOne(`
      SELECT
        a.*,
        p.nombre as paciente_nombre,
        p.telefono as paciente_telefono,
        p.email as paciente_email,
        u.nombre as doctor_nombre
      FROM appointments a
      JOIN pacientes p ON a.paciente_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE a.id = ?
    `, [id]);

    if (!appointment) {
      return res.status(404).json({
        error: 'Cita no encontrada',
      });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// Crear nueva cita
router.post(
  '/',
  authenticate,
  validate(schemas.createAppointment),
  async (req, res, next) => {
    try {
      const {
        paciente_id,
        doctor_id,
        fecha_hora,
        duracion_minutos = 60,
        tratamiento_planeado,
        notas,
        estado = 'pendiente'
      } = req.body;

      const db = getDb();

      // Verificar que el paciente existe
      const patient = await db.queryOne(
        'SELECT id FROM pacientes WHERE id = ?',
        [paciente_id]
      );

      if (!patient) {
        return res.status(404).json({
          error: 'Paciente no encontrado',
        });
      }

      // Verificar que el doctor existe (si se especifica)
      if (doctor_id) {
        const doctor = await db.queryOne(
          "SELECT id FROM users WHERE id = ? AND role IN ('doctor', 'admin')",
          [doctor_id]
        );

        if (!doctor) {
          return res.status(404).json({
            error: 'Doctor no encontrado',
          });
        }
      }

      // Verificar conflictos de horario (advertencia)
      const conflicts = await db.query(`
        SELECT id, fecha_hora, duracion_minutos
        FROM appointments
        WHERE doctor_id = ?
          AND estado NOT IN ('cancelada', 'completada')
          AND DATE(fecha_hora) = DATE(?)
          AND fecha_hora < DATE_ADD(?, INTERVAL ? MINUTE)
          AND DATE_ADD(fecha_hora, INTERVAL duracion_minutos MINUTE) > ?
      `, [doctor_id || req.user.userId, fecha_hora, fecha_hora, duracion_minutos, fecha_hora]);

      if (conflicts.length > 0) {
        console.warn('Advertencia: Conflicto de horario detectado', conflicts);
      }

      // Crear cita con UUID generado en la app
      const id = uuidv4();
      await db.execute(`
        INSERT INTO appointments (
          id,
          paciente_id,
          doctor_id,
          fecha_hora,
          duracion_minutos,
          tratamiento_planeado,
          notas,
          estado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        paciente_id,
        doctor_id || req.user.userId,
        fecha_hora,
        duracion_minutos,
        tratamiento_planeado,
        notas,
        estado
      ]);

      // Obtener datos completos con joins
      const fullAppointment = await db.queryOne(`
        SELECT
          a.*,
          p.nombre as paciente_nombre,
          u.nombre as doctor_nombre
        FROM appointments a
        JOIN pacientes p ON a.paciente_id = p.id
        LEFT JOIN users u ON a.doctor_id = u.id
        WHERE a.id = ?
      `, [id]);

      res.status(201).json(fullAppointment);
    } catch (error) {
      next(error);
    }
  }
);

// Actualizar cita
router.put(
  '/:id',
  authenticate,
  validate(schemas.updateAppointment),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const db = getDb();

      // Verificar que la cita existe
      const existing = await db.queryOne('SELECT id FROM appointments WHERE id = ?', [id]);

      if (!existing) {
        return res.status(404).json({
          error: 'Cita no encontrada',
        });
      }

      // Construir query dinámica
      const fields = Object.keys(updates);
      if (fields.length === 0) {
        return res.status(400).json({
          error: 'No hay campos para actualizar',
        });
      }

      // MySQL: params en orden de SET, id al final para WHERE
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = [...fields.map(f => updates[f]), id];

      await db.execute(
        `UPDATE appointments SET ${setClause}, updated_at = NOW() WHERE id = ?`,
        values
      );

      // Obtener datos completos
      const fullAppointment = await db.queryOne(`
        SELECT
          a.*,
          p.nombre as paciente_nombre,
          u.nombre as doctor_nombre
        FROM appointments a
        JOIN pacientes p ON a.paciente_id = p.id
        LEFT JOIN users u ON a.doctor_id = u.id
        WHERE a.id = ?
      `, [id]);

      res.json(fullAppointment);
    } catch (error) {
      next(error);
    }
  }
);

// Marcar cita como completada
router.patch('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const existing = await db.queryOne('SELECT id FROM appointments WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({
        error: 'Cita no encontrada',
      });
    }

    await db.execute(
      `UPDATE appointments SET estado = 'completada', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    const appointment = await db.queryOne('SELECT * FROM appointments WHERE id = ?', [id]);

    res.json({
      message: 'Cita marcada como completada',
      appointment,
    });
  } catch (error) {
    next(error);
  }
});

// Cancelar cita
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const existing = await db.queryOne('SELECT id FROM appointments WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({
        error: 'Cita no encontrada',
      });
    }

    await db.execute(
      `UPDATE appointments SET estado = 'cancelada', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    const appointment = await db.queryOne('SELECT * FROM appointments WHERE id = ?', [id]);

    res.json({
      message: 'Cita cancelada',
      appointment,
    });
  } catch (error) {
    next(error);
  }
});

// Eliminar cita (hard delete)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const appointment = await db.queryOne(
      'SELECT id FROM appointments WHERE id = ?',
      [id]
    );

    if (!appointment) {
      return res.status(404).json({
        error: 'Cita no encontrada',
      });
    }

    await db.execute('DELETE FROM appointments WHERE id = ?', [id]);

    res.json({
      message: 'Cita eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
