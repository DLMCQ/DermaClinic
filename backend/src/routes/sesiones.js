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

// POST crear sesion
router.post("/", authIfCloud, validate(schemas.createSesion), async (req, res, next) => {
  try {
    const { paciente_id, fecha, tratamiento, productos, notas, imagen_antes, imagen_despues } = req.body;
    const db = getDb();

    // Verificar que el paciente existe
    const paciente = await db.queryOne(
      config.isLocal ? "SELECT id FROM pacientes WHERE id = ?" : "SELECT id FROM pacientes WHERE id = $1",
      [paciente_id]
    );

    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    const id = uuidv4();

    if (config.isLocal) {
      await db.execute(
        "INSERT INTO sesiones (id, paciente_id, fecha, tratamiento, productos, notas, imagen_antes, imagen_despues) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, paciente_id, fecha, tratamiento, productos || null, notas || null, imagen_antes || null, imagen_despues || null]
      );
    } else {
      await db.execute(
        "INSERT INTO sesiones (id, paciente_id, fecha, tratamiento, productos, notas, imagen_antes_path, imagen_despues_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [id, paciente_id, fecha, tratamiento, productos || null, notas || null, imagen_antes || null, imagen_despues || null]
      );
    }

    const sesion = await db.queryOne(
      config.isLocal ? "SELECT * FROM sesiones WHERE id = ?" : "SELECT * FROM sesiones WHERE id = $1",
      [id]
    );

    res.status(201).json(sesion);
  } catch (err) {
    next(err);
  }
});

// PUT actualizar sesion
router.put("/:id", authIfCloud, validate(schemas.updateSesion), async (req, res, next) => {
  try {
    const { fecha, tratamiento, productos, notas, imagen_antes, imagen_despues } = req.body;
    const db = getDb();

    const sesion = await db.queryOne(
      config.isLocal ? "SELECT * FROM sesiones WHERE id = ?" : "SELECT * FROM sesiones WHERE id = $1",
      [req.params.id]
    );

    if (!sesion) return res.status(404).json({ error: "Sesion no encontrada" });

    if (config.isLocal) {
      await db.execute(
        "UPDATE sesiones SET fecha=?, tratamiento=?, productos=?, notas=?, imagen_antes=?, imagen_despues=? WHERE id=?",
        [fecha, tratamiento, productos || null, notas || null, imagen_antes || null, imagen_despues || null, req.params.id]
      );
    } else {
      await db.execute(
        "UPDATE sesiones SET fecha=$1, tratamiento=$2, productos=$3, notas=$4, imagen_antes_path=$5, imagen_despues_path=$6 WHERE id=$7",
        [fecha, tratamiento, productos || null, notas || null, imagen_antes || null, imagen_despues || null, req.params.id]
      );
    }

    const updated = await db.queryOne(
      config.isLocal ? "SELECT * FROM sesiones WHERE id = ?" : "SELECT * FROM sesiones WHERE id = $1",
      [req.params.id]
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE sesion
router.delete("/:id", authIfCloud, async (req, res, next) => {
  try {
    const db = getDb();

    const sesion = await db.queryOne(
      config.isLocal ? "SELECT * FROM sesiones WHERE id = ?" : "SELECT * FROM sesiones WHERE id = $1",
      [req.params.id]
    );

    if (!sesion) return res.status(404).json({ error: "Sesion no encontrada" });

    await db.execute(
      config.isLocal ? "DELETE FROM sesiones WHERE id = ?" : "DELETE FROM sesiones WHERE id = $1",
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
