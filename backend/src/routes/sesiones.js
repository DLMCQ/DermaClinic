const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../database");
const { authenticate } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

// POST crear sesion
router.post("/", authenticate, validate(schemas.createSesion), async (req, res, next) => {
  try {
    const { paciente_id, fecha, tratamiento, productos, notas, imagen_antes, imagen_despues } = req.body;
    const db = getDb();

    const paciente = await db.queryOne("SELECT id FROM pacientes WHERE id = $1", [paciente_id]);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    const id = uuidv4();

    await db.execute(
      "INSERT INTO sesiones (id, paciente_id, fecha, tratamiento, productos, notas, imagen_antes, imagen_despues) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, paciente_id, fecha, tratamiento, productos || null, notas || null, imagen_antes || null, imagen_despues || null]
    );

    const sesion = await db.queryOne("SELECT * FROM sesiones WHERE id = $1", [id]);
    res.status(201).json(sesion);
  } catch (err) {
    next(err);
  }
});

// PUT actualizar sesion
router.put("/:id", authenticate, validate(schemas.updateSesion), async (req, res, next) => {
  try {
    const { fecha, tratamiento, productos, notas, imagen_antes, imagen_despues } = req.body;
    const db = getDb();

    const sesion = await db.queryOne("SELECT * FROM sesiones WHERE id = $1", [req.params.id]);
    if (!sesion) return res.status(404).json({ error: "Sesion no encontrada" });

    await db.execute(
      "UPDATE sesiones SET fecha=$1, tratamiento=$2, productos=$3, notas=$4, imagen_antes=$5, imagen_despues=$6 WHERE id=$7",
      [fecha, tratamiento, productos || null, notas || null, imagen_antes || null, imagen_despues || null, req.params.id]
    );

    const updated = await db.queryOne("SELECT * FROM sesiones WHERE id = $1", [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE sesion
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const db = getDb();

    const sesion = await db.queryOne("SELECT * FROM sesiones WHERE id = $1", [req.params.id]);
    if (!sesion) return res.status(404).json({ error: "Sesion no encontrada" });

    await db.execute("DELETE FROM sesiones WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
