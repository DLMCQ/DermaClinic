const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../database");

// GET todos los pacientes (con busqueda opcional)
router.get("/", (req, res) => {
  try {
    const { q } = req.query;
    let pacientes;
    if (q) {
      pacientes = db.all(
        "SELECT * FROM pacientes WHERE nombre LIKE ? OR dni LIKE ? ORDER BY nombre ASC",
        ["%" + q + "%", "%" + q + "%"]
      );
    } else {
      pacientes = db.all("SELECT * FROM pacientes ORDER BY nombre ASC");
    }

    const result = pacientes.map((p) => ({
      ...p,
      total_sesiones: (db.get("SELECT COUNT(*) as count FROM sesiones WHERE paciente_id = ?", [p.id]) || {}).count || 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET un paciente con sus sesiones
router.get("/:id", (req, res) => {
  try {
    const paciente = db.get("SELECT * FROM pacientes WHERE id = ?", [req.params.id]);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    const sesiones = db.all("SELECT * FROM sesiones WHERE paciente_id = ? ORDER BY fecha DESC", [req.params.id]);
    res.json({ ...paciente, sesiones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST crear paciente
router.post("/", (req, res) => {
  try {
    const { nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_url } = req.body;

    if (!nombre || !dni) return res.status(400).json({ error: "Nombre y DNI son obligatorios" });

    const exists = db.get("SELECT id FROM pacientes WHERE dni = ?", [dni]);
    if (exists) return res.status(409).json({ error: "Ya existe una paciente con ese DNI" });

    const id = uuidv4();
    db.run(
      "INSERT INTO pacientes (id, nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, nombre, dni, fecha_nacimiento || null, telefono || null, email || null, direccion || null, obra_social || null, nro_afiliado || null, motivo_consulta || null, foto_url || null]
    );

    const paciente = db.get("SELECT * FROM pacientes WHERE id = ?", [id]);
    res.status(201).json({ ...paciente, sesiones: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT actualizar paciente
router.put("/:id", (req, res) => {
  try {
    const { nombre, dni, fecha_nacimiento, telefono, email, direccion, obra_social, nro_afiliado, motivo_consulta, foto_url } = req.body;

    const paciente = db.get("SELECT * FROM pacientes WHERE id = ?", [req.params.id]);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    const conflict = db.get("SELECT id FROM pacientes WHERE dni = ? AND id != ?", [dni, req.params.id]);
    if (conflict) return res.status(409).json({ error: "Ya existe otra paciente con ese DNI" });

    db.run(
      "UPDATE pacientes SET nombre=?, dni=?, fecha_nacimiento=?, telefono=?, email=?, direccion=?, obra_social=?, nro_afiliado=?, motivo_consulta=?, foto_url=?, actualizado_en=datetime('now','localtime') WHERE id=?",
      [nombre, dni, fecha_nacimiento || null, telefono || null, email || null, direccion || null, obra_social || null, nro_afiliado || null, motivo_consulta || null, foto_url || null, req.params.id]
    );

    const updated = db.get("SELECT * FROM pacientes WHERE id = ?", [req.params.id]);
    const sesiones = db.all("SELECT * FROM sesiones WHERE paciente_id = ? ORDER BY fecha DESC", [req.params.id]);
    res.json({ ...updated, sesiones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE paciente
router.delete("/:id", (req, res) => {
  try {
    const paciente = db.get("SELECT * FROM pacientes WHERE id = ?", [req.params.id]);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    db.run("DELETE FROM sesiones WHERE paciente_id = ?", [req.params.id]);
    db.run("DELETE FROM pacientes WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
