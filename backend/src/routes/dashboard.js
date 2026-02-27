const express = require('express');
const { getDb } = require('../database');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Estadísticas generales del dashboard
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const db = getDb();
    const isLocal = config.isLocal;

    // Queries adaptadas según el modo
    let stats = {};

    if (isLocal) {
      // Modo local (SQLite)
      const [
        totalPatients,
        totalSessions,
        recentPatients,
        topTreatments
      ] = await Promise.all([
        db.queryOne('SELECT COUNT(*) as count FROM pacientes'),
        db.queryOne('SELECT COUNT(*) as count FROM sesiones'),
        db.query(`
          SELECT id, nombre, dni, foto_url as foto_path, creado_en as created_at
          FROM pacientes
          ORDER BY creado_en DESC
          LIMIT 5
        `),
        db.query(`
          SELECT tratamiento, COUNT(*) as count
          FROM sesiones
          GROUP BY tratamiento
          ORDER BY count DESC
          LIMIT 5
        `)
      ]);

      // Estadísticas este mes (SQLite usa diferentes funciones de fecha)
      const newPatientsThisMonth = await db.queryOne(`
        SELECT COUNT(*) as count
        FROM pacientes
        WHERE DATE(creado_en) >= DATE('now', 'start of month')
      `);

      const sessionsThisMonth = await db.queryOne(`
        SELECT COUNT(*) as count
        FROM sesiones
        WHERE DATE(creado_en) >= DATE('now', 'start of month')
      `);

      stats = {
        totalPatients: parseInt(totalPatients.count),
        newPatientsThisMonth: parseInt(newPatientsThisMonth.count),
        totalSessions: parseInt(totalSessions.count),
        sessionsThisMonth: parseInt(sessionsThisMonth.count),
        upcomingAppointments: 0, // No disponible en modo local
        topTreatments: topTreatments.map(t => ({
          tratamiento: t.tratamiento,
          count: parseInt(t.count)
        })),
        recentPatients,
      };
    } else {
      // Modo cloud (PostgreSQL)
      const [
        totalPatients,
        newPatientsThisMonth,
        totalSessions,
        sessionsThisMonth,
        upcomingAppointments,
        topTreatments,
        recentPatients
      ] = await Promise.all([
        db.queryOne('SELECT COUNT(*) as count FROM pacientes'),
        db.queryOne(`
          SELECT COUNT(*) as count
          FROM pacientes
          WHERE created_at >= date_trunc('month', CURRENT_DATE)
        `),
        db.queryOne('SELECT COUNT(*) as count FROM sesiones'),
        db.queryOne(`
          SELECT COUNT(*) as count
          FROM sesiones
          WHERE created_at >= date_trunc('month', CURRENT_DATE)
        `),
        db.queryOne(`
          SELECT COUNT(*) as count
          FROM appointments
          WHERE fecha_hora > NOW() AND estado != 'cancelada'
        `),
        db.query(`
          SELECT tratamiento, COUNT(*) as count
          FROM sesiones
          GROUP BY tratamiento
          ORDER BY count DESC
          LIMIT 5
        `),
        db.query(`
          SELECT id, nombre, dni, foto_path, created_at
          FROM pacientes
          ORDER BY created_at DESC
          LIMIT 5
        `)
      ]);

      stats = {
        totalPatients: parseInt(totalPatients.count),
        newPatientsThisMonth: parseInt(newPatientsThisMonth.count),
        totalSessions: parseInt(totalSessions.count),
        sessionsThisMonth: parseInt(sessionsThisMonth.count),
        upcomingAppointments: parseInt(upcomingAppointments.count),
        topTreatments: topTreatments.map(t => ({
          tratamiento: t.tratamiento,
          count: parseInt(t.count)
        })),
        recentPatients,
      };
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Estadísticas por rango de fechas
router.get('/stats/range', authenticate, async (req, res, next) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        error: 'Se requieren fecha_desde y fecha_hasta',
      });
    }

    const db = getDb();
    const isLocal = config.isLocal;

    let stats;

    if (isLocal) {
      // SQLite
      const [sessionsInRange, patientsInRange, treatmentsByRange] = await Promise.all([
        db.queryOne(`
          SELECT COUNT(*) as count
          FROM sesiones
          WHERE DATE(fecha) BETWEEN DATE(?) AND DATE(?)
        `, [fecha_desde, fecha_hasta]),
        db.queryOne(`
          SELECT COUNT(*) as count
          FROM pacientes
          WHERE DATE(creado_en) BETWEEN DATE(?) AND DATE(?)
        `, [fecha_desde, fecha_hasta]),
        db.query(`
          SELECT tratamiento, COUNT(*) as count
          FROM sesiones
          WHERE DATE(fecha) BETWEEN DATE(?) AND DATE(?)
          GROUP BY tratamiento
          ORDER BY count DESC
        `, [fecha_desde, fecha_hasta])
      ]);

      stats = {
        sessionsInRange: parseInt(sessionsInRange.count),
        patientsInRange: parseInt(patientsInRange.count),
        treatmentsByRange: treatmentsByRange.map(t => ({
          tratamiento: t.tratamiento,
          count: parseInt(t.count)
        })),
      };
    } else {
      // PostgreSQL
      const [sessionsInRange, patientsInRange, treatmentsByRange] = await Promise.all([
        db.queryOne(`
          SELECT COUNT(*) as count
          FROM sesiones
          WHERE fecha BETWEEN $1 AND $2
        `, [fecha_desde, fecha_hasta]),
        db.queryOne(`
          SELECT COUNT(*) as count
          FROM pacientes
          WHERE created_at::date BETWEEN $1 AND $2
        `, [fecha_desde, fecha_hasta]),
        db.query(`
          SELECT tratamiento, COUNT(*) as count
          FROM sesiones
          WHERE fecha BETWEEN $1 AND $2
          GROUP BY tratamiento
          ORDER BY count DESC
        `, [fecha_desde, fecha_hasta])
      ]);

      stats = {
        sessionsInRange: parseInt(sessionsInRange.count),
        patientsInRange: parseInt(patientsInRange.count),
        treatmentsByRange: treatmentsByRange.map(t => ({
          tratamiento: t.tratamiento,
          count: parseInt(t.count)
        })),
      };
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Actividad reciente (últimas sesiones)
router.get('/activity', authenticate, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const db = getDb();
    const isLocal = config.isLocal;

    let recentActivity;

    if (isLocal) {
      recentActivity = await db.query(`
        SELECT
          s.id,
          s.fecha,
          s.tratamiento,
          s.creado_en as created_at,
          p.id as paciente_id,
          p.nombre as paciente_nombre
        FROM sesiones s
        JOIN pacientes p ON s.paciente_id = p.id
        ORDER BY s.creado_en DESC
        LIMIT ?
      `, [parseInt(limit)]);
    } else {
      recentActivity = await db.query(`
        SELECT
          s.id,
          s.fecha,
          s.tratamiento,
          s.created_at,
          p.id as paciente_id,
          p.nombre as paciente_nombre
        FROM sesiones s
        JOIN pacientes p ON s.paciente_id = p.id
        ORDER BY s.created_at DESC
        LIMIT $1
      `, [parseInt(limit)]);
    }

    res.json(recentActivity);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
