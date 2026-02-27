const express = require('express');
const { getDb } = require('../database');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const config = require('../config');

const router = express.Router();

// Solo disponible en modo cloud
const cloudOnly = (req, res, next) => {
  if (config.isLocal) {
    return res.status(404).json({
      error: 'Calendario de citas solo disponible en modo cloud',
    });
  }
  next();
};

// Listar citas con filtros opcionales
router.get('/', cloudOnly, authenticate, async (req, res, next) => {
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
    let paramIndex = 1;

    if (fecha_desde) {
      query += ` AND a.fecha_hora >= $${paramIndex}`;
      params.push(fecha_desde);
      paramIndex++;
    }

    if (fecha_hasta) {
      query += ` AND a.fecha_hora <= $${paramIndex}`;
      params.push(fecha_hasta);
      paramIndex++;
    }

    if (paciente_id) {
      query += ` AND a.paciente_id = $${paramIndex}`;
      params.push(paciente_id);
      paramIndex++;
    }

    if (estado) {
      query += ` AND a.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (doctor_id) {
      query += ` AND a.doctor_id = $${paramIndex}`;
      params.push(doctor_id);
      paramIndex++;
    }

    query += ' ORDER BY a.fecha_hora ASC';

    const appointments = await db.query(query, params);
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

// Obtener cita por ID
router.get('/:id', cloudOnly, authenticate, async (req, res, next) => {
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
      WHERE a.id = $1
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
  cloudOnly,
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
        'SELECT id FROM pacientes WHERE id = $1',
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
          'SELECT id FROM users WHERE id = $1 AND role IN ($2, $3)',
          [doctor_id, 'doctor', 'admin']
        );

        if (!doctor) {
          return res.status(404).json({
            error: 'Doctor no encontrado',
          });
        }
      }

      // Verificar conflictos de horario (opcional - por ahora solo advertencia)
      const conflicts = await db.query(`
        SELECT id, fecha_hora, duracion_minutos
        FROM appointments
        WHERE doctor_id = $1
          AND estado NOT IN ('cancelada', 'completada')
          AND fecha_hora::date = $2::date
          AND (
            (fecha_hora <= $2 AND fecha_hora + (duracion_minutos || ' minutes')::interval > $2)
            OR
            (fecha_hora < $2 + ($3 || ' minutes')::interval AND fecha_hora >= $2)
          )
      `, [doctor_id || req.user.userId, fecha_hora, duracion_minutos]);

      if (conflicts.length > 0) {
        console.warn('Advertencia: Conflicto de horario detectado', conflicts);
      }

      // Crear cita
      const appointment = await db.queryOne(`
        INSERT INTO appointments (
          paciente_id,
          doctor_id,
          fecha_hora,
          duracion_minutos,
          tratamiento_planeado,
          notas,
          estado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
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
        WHERE a.id = $1
      `, [appointment.id]);

      res.status(201).json(fullAppointment);
    } catch (error) {
      next(error);
    }
  }
);

// Actualizar cita
router.put(
  '/:id',
  cloudOnly,
  authenticate,
  validate(schemas.updateAppointment),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const db = getDb();

      // Verificar que la cita existe
      const existing = await db.queryOne('SELECT * FROM appointments WHERE id = $1', [id]);

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

      const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
      const values = [id, ...fields.map(f => updates[f])];

      const appointment = await db.queryOne(`
        UPDATE appointments
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, values);

      // Obtener datos completos
      const fullAppointment = await db.queryOne(`
        SELECT
          a.*,
          p.nombre as paciente_nombre,
          u.nombre as doctor_nombre
        FROM appointments a
        JOIN pacientes p ON a.paciente_id = p.id
        LEFT JOIN users u ON a.doctor_id = u.id
        WHERE a.id = $1
      `, [id]);

      res.json(fullAppointment);
    } catch (error) {
      next(error);
    }
  }
);

// Marcar cita como completada
router.patch('/:id/complete', cloudOnly, authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const appointment = await db.queryOne(`
      UPDATE appointments
      SET estado = 'completada', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (!appointment) {
      return res.status(404).json({
        error: 'Cita no encontrada',
      });
    }

    res.json({
      message: 'Cita marcada como completada',
      appointment,
    });
  } catch (error) {
    next(error);
  }
});

// Cancelar cita
router.patch('/:id/cancel', cloudOnly, authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const appointment = await db.queryOne(`
      UPDATE appointments
      SET estado = 'cancelada', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (!appointment) {
      return res.status(404).json({
        error: 'Cita no encontrada',
      });
    }

    res.json({
      message: 'Cita cancelada',
      appointment,
    });
  } catch (error) {
    next(error);
  }
});

// Eliminar cita (hard delete)
router.delete('/:id', cloudOnly, authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const appointment = await db.queryOne(
      'DELETE FROM appointments WHERE id = $1 RETURNING id',
      [id]
    );

    if (!appointment) {
      return res.status(404).json({
        error: 'Cita no encontrada',
      });
    }

    res.json({
      message: 'Cita eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
