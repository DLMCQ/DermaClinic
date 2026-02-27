const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { initDb } = require("./database");
const config = require("./config");

const app = express();

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

// Body parsing
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Servir frontend compilado
const FRONTEND_BUILD = path.join(__dirname, "../../frontend/build");
if (fs.existsSync(FRONTEND_BUILD)) {
  app.use(express.static(FRONTEND_BUILD));
}

// API Routes
const authRouter = require("./routes/auth");
const pacientesRouter = require("./routes/pacientes");
const sesionesRouter = require("./routes/sesiones");

app.use("/api/auth", authRouter);
app.use("/api/pacientes", pacientesRouter);
app.use("/api/sesiones", sesionesRouter);
app.get("/api/health", (req, res) => res.json({
  status: "ok",
  mode: config.isLocal ? 'local' : 'cloud',
  env: config.env,
}));

// Catchall React
if (fs.existsSync(FRONTEND_BUILD)) {
  app.get("*", (req, res) => res.sendFile(path.join(FRONTEND_BUILD, "index.html")));
}

// Iniciar DB y luego servidor
initDb().then(() => {
  app.listen(config.server.port, config.server.host, () => {
    console.log("");
    console.log("================================================");
    console.log("   DermaClinic - Servidor Activo");
    console.log("================================================");
    console.log("");
    console.log(`Puerto:         ${config.server.port}`);
    console.log(`Environment:    ${config.env}`);
    console.log(`Database Mode:  ${config.isLocal ? 'LOCAL (sql.js)' : 'CLOUD (PostgreSQL)'}`);
    console.log("");
    console.log(`Acceso local:   http://localhost:${config.server.port}`);
    console.log(`Acceso en red:  http://[IP-DE-ESTA-PC]:${config.server.port}`);
    console.log("");
    console.log("Para encontrar tu IP: ejecuta 'ipconfig' en CMD");
    console.log("Ctrl+C para detener el servidor");
    console.log("");
  });
}).catch((err) => {
  console.error("Error iniciando la base de datos:", err);
  process.exit(1);
});
