const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../database");

// POST crear sesion
router.post("/", (req, res) => {
  try {
    const { paciente_id, fecha, tratamiento, productos, notas, imagen_antes, imagen_despues } = req.body;

    if (!paciente_id || !fecha || !tratamiento)
      return res.status(400).json({ error: "paciente_id, fecha y tratamiento son obligatorios" });

    const paciente = db.get("SELECT id FROM pacientes WHERE id = ?", [paciente_id]);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    const id = uuidv4();
    db.run(
      "INSERT INTO sesiones (id, paciente_id, fecha, tratamiento, productos, notas, imagen_antes, imagen_despues) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, paciente_id, fecha, tratamiento, productos || null, notas || null, imagen_antes || null, imagen_despues || null]
    );

    const sesion = db.get("SELECT * FROM sesiones WHERE id = ?", [id]);
    res.status(201).json(sesion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT actualizar sesion
router.put("/:id", (req, res) => {
  try {
    const { fecha, tratamiento, productos, notas, imagen_antes, imagen_despues } = req.body;

    const sesion = db.get("SELECT * FROM sesiones WHERE id = ?", [req.params.id]);
    if (!sesion) return res.status(404).json({ error: "Sesion no encontrada" });

    db.run(
      "UPDATE sesiones SET fecha=?, tratamiento=?, productos=?, notas=?, imagen_antes=?, imagen_despues=? WHERE id=?",
      [fecha, tratamiento, productos || null, notas || null, imagen_antes || null, imagen_despues || null, req.params.id]
    );

    const updated = db.get("SELECT * FROM sesiones WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE sesion
router.delete("/:id", (req, res) => {
  try {
    const sesion = db.get("SELECT * FROM sesiones WHERE id = ?", [req.params.id]);
    if (!sesion) return res.status(404).json({ error: "Sesion no encontrada" });

    db.run("DELETE FROM sesiones WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
