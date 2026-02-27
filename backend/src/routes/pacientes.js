const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../database");
const { authenticate } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const config = require("../config");

// Middleware condicional de autenticación (solo en modo cloud)
const authIfCloud = (req, res, next) => {
  if (config.isLocal) {
    return next(); // Sin auth en modo local
  }
  return authenticate(req, res, next);
};

// GET todos los pacientes (con búsqueda y filtros avanzados)
router.get("/", authIfCloud, async (req, res, next) => {
  try {
    const { q, tratamiento, fecha_desde, fecha_hasta, productos } = req.query;
    const db = getDb();

    let query;
    let params = [];
    let paramIndex = 1;

    if (config.isLocal) {
      // Modo local (SQLite)
      query = 'SELECT * FROM pacientes';
      let joins = [];
      let conditions = [];

      if (tratamiento || fecha_desde || fecha_hasta || productos) {
        joins.push('LEFT JOIN sesiones s ON s.paciente_id = pacientes.id');
      }

      if (q) {
        conditions.push('(pacientes.nombre LIKE ? OR pacientes.dni LIKE ?)');
        params.push(`%${q}%`, `%${q}%`);
      }

      if (tratamiento) {
        conditions.push('s.tratamiento = ?');
        params.push(tratamiento);
      }

      if (fecha_desde) {
        conditions.push('DATE(s.fecha) >= DATE(?)');
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        conditions.push('DATE(s.fecha) <= DATE(?)');
        params.push(fecha_hasta);
      }

      if (productos) {
        conditions.push('s.productos LIKE ?');
        params.push(`%${productos}%`);
      }

      if (joins.length) query += ' ' + joins.join(' ');
      if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
      query += ' GROUP BY pacientes.id ORDER BY pacientes.nombre ASC';

      const pacientes = await db.query(query, params);

      // Agregar total_sesiones
      const result = await Promise.all(pacientes.map(async (p) => {
        const count = await db.queryOne('SELECT COUNT(*) as count FROM sesiones WHERE paciente_id = ?', [p.id]);
        return {
          ...p,
          total_sesiones: count ? parseInt(count.count) : 0,
        };
      }));

      res.json(result);
    } else {
      // Modo cloud (PostgreSQL)
      query = 'SELECT DISTINCT p.* FROM pacientes p';
      let joins = [];
      let conditions = [];

      if (tratamiento || fecha_desde || fecha_hasta || productos) {
        joins.push('LEFT JOIN sesiones s ON s.paciente_id = p.id');
      }

      if (q) {
        conditions.push(`(p.nombre ILIKE $${paramIndex} OR p.dni ILIKE $${paramIndex + 1})`);
        params.push(`%${q}%`, `%${q}%`);
        paramIndex += 2;
      }

      if (tratamiento) {
        conditions.push(`s.tratamiento = $${paramIndex}`);
        params.push(tratamiento);
        paramIndex++;
      }

      if (fecha_desde) {
        conditions.push(`s.fecha >= $${paramIndex}`);
        params.push(fecha_desde);
        paramIndex++;
      }

      if (fecha_hasta) {
        conditions.push(`s.fecha <= $${paramIndex}`);
        params.push(fecha_hasta);
        paramIndex++;
      }

      if (productos) {
        conditions.push(`s.productos ILIKE $${paramIndex}`);
        params.push(`%${productos}%`);
        paramIndex++;
      }

      if (joins.length) query += ' ' + joins.join(' ');
      if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
      query += ' ORDER BY p.nombre ASC';

      const pacientes = await db.query(query, params);

      // Agregar total_sesiones
      const result = await Promise.all(pacientes.map(async (p) => {
        const count = await db.queryOne('SELECT COUNT(*) as count FROM sesiones WHERE paciente_id = $1', [p.id]);
        return {
          ...p,
          total_sesiones: count ? parseInt(count.count) : 0,
        };
      }));

      res.json(result);
    }
  } catch (err) {
    next(err);
  }
});

// GET un paciente con sus sesiones
router.get("/:id", authIfCloud, async (req, res, next) => {
  try {
    const db = getDb();
    const param = config.isLocal ? [req.params.id] : [req.params.id];
    const placeholder = config.isLocal ? '?' : '$1';

    const paciente = await db.queryOne(`SELECT * FROM pacientes WHERE id = ${placeholder}`, param);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    const sesiones = await db.query(
      config.isLocal
        ? "SELECT * FROM sesiones WHERE paciente_id = ? ORDER BY fecha DESC"
        : "SELECT * FROM sesiones WHERE paciente_id = $1 ORDER BY fecha DESC",
      [req.params.id]
    );

    res.json({ ...paciente, sesiones });
  } catch (err) {
    next(err);
  }
});

// POST crear paciente
router.post("/", authIfCloud, validate(schemas.createPaciente), async (req, res, next) => {
  try {
    const { nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_url, foto_path } = req.body;
    const db = getDb();

    // Verificar DNI duplicado
    const exists = await db.queryOne(
      config.isLocal
        ? "SELECT id FROM pacientes WHERE dni = ?"
        : "SELECT id FROM pacientes WHERE dni = $1",
      [dni]
    );

    if (exists) return res.status(409).json({ error: "Ya existe una paciente con ese DNI" });

    const id = uuidv4();

    if (config.isLocal) {
      await db.execute(
        "INSERT INTO pacientes (id, nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, nombre, dni, fecha_nacimiento || null, telefono || null, email || null, direccion || null, obra_social || null, nro_afiliado || null, motivo_consulta || null, foto_url || null]
      );
    } else {
      await db.execute(
        "INSERT INTO pacientes (id, nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
        [id, nombre, dni, fecha_nacimiento || null, telefono || null, email || null, direccion || null, obra_social || null, nro_afiliado || null, motivo_consulta || null, foto_path || null]
      );
    }

    const paciente = await db.queryOne(
      config.isLocal ? "SELECT * FROM pacientes WHERE id = ?" : "SELECT * FROM pacientes WHERE id = $1",
      [id]
    );

    res.status(201).json({ ...paciente, sesiones: [] });
  } catch (err) {
    next(err);
  }
});

// PUT actualizar paciente
router.put("/:id", authIfCloud, validate(schemas.updatePaciente), async (req, res, next) => {
  try {
    const { nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_url, foto_path } = req.body;
    const db = getDb();

    const paciente = await db.queryOne(
      config.isLocal ? "SELECT * FROM pacientes WHERE id = ?" : "SELECT * FROM pacientes WHERE id = $1",
      [req.params.id]
    );

    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    // Verificar conflicto de DNI
    if (dni) {
      const conflict = await db.queryOne(
        config.isLocal
          ? "SELECT id FROM pacientes WHERE dni = ? AND id != ?"
          : "SELECT id FROM pacientes WHERE dni = $1 AND id != $2",
        [dni, req.params.id]
      );

      if (conflict) return res.status(409).json({ error: "Ya existe otra paciente con ese DNI" });
    }

    if (config.isLocal) {
      await db.execute(
        "UPDATE pacientes SET nombre=?, dni=?, fecha_nacimiento=?, telefono=?, email=?, direccion=?, obra_social=?, nro_afiliado=?, motivo_consulta=?, foto_url=?, actualizado_en=datetime('now','localtime') WHERE id=?",
        [nombre, dni, fecha_nacimiento || null, telefono || null, email || null, direccion || null, obra_social || null, nro_afiliado || null, motivo_consulta || null, foto_url || null, req.params.id]
      );
    } else {
      await db.execute(
        "UPDATE pacientes SET nombre=$1, dni=$2, fecha_nacimiento=$3, telefono=$4, email=$5, direccion=$6, obra_social=$7, nro_afiliado=$8, motivo_consulta=$9, foto_path=$10, updated_at=NOW() WHERE id=$11",
        [nombre, dni, fecha_nacimiento || null, telefono || null, email || null, direccion || null, obra_social || null, nro_afiliado || null, motivo_consulta || null, foto_path || null, req.params.id]
      );
    }

    const updated = await db.queryOne(
      config.isLocal ? "SELECT * FROM pacientes WHERE id = ?" : "SELECT * FROM pacientes WHERE id = $1",
      [req.params.id]
    );

    const sesiones = await db.query(
      config.isLocal
        ? "SELECT * FROM sesiones WHERE paciente_id = ? ORDER BY fecha DESC"
        : "SELECT * FROM sesiones WHERE paciente_id = $1 ORDER BY fecha DESC",
      [req.params.id]
    );

    res.json({ ...updated, sesiones });
  } catch (err) {
    next(err);
  }
});

// DELETE paciente
router.delete("/:id", authIfCloud, async (req, res, next) => {
  try {
    const db = getDb();

    const paciente = await db.queryOne(
      config.isLocal ? "SELECT * FROM pacientes WHERE id = ?" : "SELECT * FROM pacientes WHERE id = $1",
      [req.params.id]
    );

    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    // En modo cloud, CASCADE delete manejará sesiones automáticamente
    // En modo local, eliminamos manualmente
    if (config.isLocal) {
      await db.execute("DELETE FROM sesiones WHERE paciente_id = ?", [req.params.id]);
    }

    await db.execute(
      config.isLocal ? "DELETE FROM pacientes WHERE id = ?" : "DELETE FROM pacientes WHERE id = $1",
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
