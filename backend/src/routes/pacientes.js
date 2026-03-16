const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../database");
const { authenticate } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const cloudinary = require("../utils/cloudinary");

// Extrae el public_id de una URL de Cloudinary
function getPublicId(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<id>.ext
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
}

async function deleteFromCloudinary(url) {
  const publicId = getPublicId(url);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      console.error("Error eliminando imagen de Cloudinary:", publicId, e.message);
    }
  }
}

// GET todos los pacientes (con búsqueda y filtros avanzados)
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { q, tratamiento, fecha_desde, fecha_hasta, productos } = req.query;
    const db = getDb();

    let query = 'SELECT DISTINCT p.* FROM pacientes p';
    let joins = [];
    let conditions = [];
    let params = [];

    if (tratamiento || fecha_desde || fecha_hasta || productos) {
      joins.push('LEFT JOIN sesiones s ON s.paciente_id = p.id');
    }

    if (q) {
      conditions.push(`(p.nombre LIKE ? OR p.dni LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`);
    }

    if (tratamiento) {
      conditions.push(`s.tratamiento = ?`);
      params.push(tratamiento);
    }

    if (fecha_desde) {
      conditions.push(`s.fecha >= ?`);
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      conditions.push(`s.fecha <= ?`);
      params.push(fecha_hasta);
    }

    if (productos) {
      conditions.push(`s.productos LIKE ?`);
      params.push(`%${productos}%`);
    }

    if (joins.length) query += ' ' + joins.join(' ');
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY p.nombre ASC';

    const pacientes = await db.query(query, params);

    const result = await Promise.all(pacientes.map(async (p) => {
      const count = await db.queryOne('SELECT COUNT(*) as count FROM sesiones WHERE paciente_id = ?', [p.id]);
      return { ...p, total_sesiones: count ? parseInt(count.count) : 0 };
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET un paciente con sus sesiones
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const db = getDb();

    const paciente = await db.queryOne('SELECT * FROM pacientes WHERE id = ?', [req.params.id]);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    const sesiones = await db.query(
      "SELECT * FROM sesiones WHERE paciente_id = ? ORDER BY fecha DESC",
      [req.params.id]
    );

    res.json({ ...paciente, sesiones });
  } catch (err) {
    next(err);
  }
});

// POST crear paciente
router.post("/", authenticate, validate(schemas.createPaciente), async (req, res, next) => {
  try {
    const { nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_path } = req.body;
    const db = getDb();

    const exists = await db.queryOne("SELECT id FROM pacientes WHERE dni = ?", [dni]);
    if (exists) return res.status(409).json({ error: "Ya existe una paciente con ese DNI" });

    const id = uuidv4();

    await db.execute(
      "INSERT INTO pacientes (id, nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, nombre, dni, fecha_nacimiento || null, telefono || null, email || null, direccion || null, obra_social || null, nro_afiliado || null, motivo_consulta || null, foto_path || null]
    );

    const paciente = await db.queryOne("SELECT * FROM pacientes WHERE id = ?", [id]);
    res.status(201).json({ ...paciente, sesiones: [] });
  } catch (err) {
    next(err);
  }
});

// PUT actualizar paciente
router.put("/:id", authenticate, validate(schemas.updatePaciente), async (req, res, next) => {
  try {
    const { nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_path } = req.body;
    const db = getDb();

    const paciente = await db.queryOne("SELECT * FROM pacientes WHERE id = ?", [req.params.id]);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    if (dni) {
      const conflict = await db.queryOne(
        "SELECT id FROM pacientes WHERE dni = ? AND id != ?",
        [dni, req.params.id]
      );
      if (conflict) return res.status(409).json({ error: "Ya existe otra paciente con ese DNI" });
    }

    await db.execute(
      "UPDATE pacientes SET nombre=?, dni=?, fecha_nacimiento=?, telefono=?, email=?, direccion=?, obra_social=?, nro_afiliado=?, motivo_consulta=?, foto_path=?, updated_at=NOW() WHERE id=?",
      [nombre, dni, fecha_nacimiento || null, telefono || null, email || null, direccion || null, obra_social || null, nro_afiliado || null, motivo_consulta || null, foto_path || null, req.params.id]
    );

    const updated = await db.queryOne("SELECT * FROM pacientes WHERE id = ?", [req.params.id]);
    const sesiones = await db.query(
      "SELECT * FROM sesiones WHERE paciente_id = ? ORDER BY fecha DESC",
      [req.params.id]
    );

    res.json({ ...updated, sesiones });
  } catch (err) {
    next(err);
  }
});

// DELETE paciente
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const db = getDb();

    const paciente = await db.queryOne("SELECT * FROM pacientes WHERE id = ?", [req.params.id]);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    // Obtener todas las sesiones del paciente para borrar sus imágenes
    const sesiones = await db.query("SELECT imagen_antes, imagen_despues FROM sesiones WHERE paciente_id = ?", [req.params.id]);

    // Eliminar de Cloudinary: foto del paciente + imágenes de sesiones
    const imagenesAEliminar = [
      paciente.foto_path,
      ...sesiones.map(s => s.imagen_antes),
      ...sesiones.map(s => s.imagen_despues),
    ];
    await Promise.all(imagenesAEliminar.map(deleteFromCloudinary));

    await db.execute("DELETE FROM pacientes WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
