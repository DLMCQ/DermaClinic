const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { initDb } = require("./database");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Servir frontend compilado
const FRONTEND_BUILD = path.join(__dirname, "../../frontend/build");
if (fs.existsSync(FRONTEND_BUILD)) {
  app.use(express.static(FRONTEND_BUILD));
}

// Rutas API
const pacientesRouter = require("./routes/pacientes");
const sesionesRouter = require("./routes/sesiones");
app.use("/api/pacientes", pacientesRouter);
app.use("/api/sesiones", sesionesRouter);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Catchall React
if (fs.existsSync(FRONTEND_BUILD)) {
  app.get("*", (req, res) => res.sendFile(path.join(FRONTEND_BUILD, "index.html")));
}

// Iniciar DB y luego servidor
initDb().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("================================================");
    console.log("   DermaClinic - Servidor Activo");
    console.log("================================================");
    console.log("");
    console.log("Acceso local:   http://localhost:" + PORT);
    console.log("Acceso en red:  http://[IP-DE-ESTA-PC]:" + PORT);
    console.log("");
    console.log("Para encontrar tu IP: ejecuta 'ipconfig' en CMD");
    console.log("Ctrl+C para detener el servidor");
    console.log("");
  });
}).catch((err) => {
  console.error("Error iniciando la base de datos:", err);
  process.exit(1);
});
