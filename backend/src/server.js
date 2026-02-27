const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const { initDb, getDb } = require("./database");
const config = require("./config");
const { helmetConfig, generalLimiter, authLimiter, compressionConfig } = require("./middleware/security");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(compressionConfig);

// Logging (solo en desarrollo)
if (config.isDevelopment) {
  app.use(morgan('dev'));
}

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

// Body parsing
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Rate limiting global
app.use('/api/', generalLimiter);

// Servir frontend compilado
const FRONTEND_BUILD = path.join(__dirname, "../../frontend/build");
if (fs.existsSync(FRONTEND_BUILD)) {
  app.use(express.static(FRONTEND_BUILD));
}

// API Routes
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const pacientesRouter = require("./routes/pacientes");
const sesionesRouter = require("./routes/sesiones");
const dashboardRouter = require("./routes/dashboard");
const appointmentsRouter = require("./routes/appointments");
const imagesRouter = require("./routes/images");

// Auth routes con rate limiting especial
app.use("/api/auth", authLimiter, authRouter);

// Otras rutas
app.use("/api/users", usersRouter);
app.use("/api/pacientes", pacientesRouter);
app.use("/api/sesiones", sesionesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/images", imagesRouter);

// Health check
app.get("/api/health", (req, res) => res.json({
  status: "ok",
  mode: config.isLocal ? 'local' : 'cloud',
  database: config.isLocal ? 'sqlite' : 'postgres',
  env: config.env,
  timestamp: new Date().toISOString(),
}));

// Debug endpoint - Ver todas las tablas de la base de datos
app.get("/api/debug/tables", async (req, res) => {
  try {
    const { getDb } = require("./database");
    const db = getDb();
    
    let data = {};
    
    if (config.isLocal) {
      // SQLite query
      data.users = db.db.exec("SELECT * FROM users")[0]?.values || [];
      data.pacientes = db.db.exec("SELECT * FROM pacientes")[0]?.values || [];
      data.sesiones = db.db.exec("SELECT * FROM sesiones")[0]?.values || [];
    } else {
      // PostgreSQL query
      const usersResult = await db.pool.query("SELECT * FROM users");
      const pacientesResult = await db.pool.query("SELECT * FROM pacientes");
      const sesionesResult = await db.pool.query("SELECT * FROM sesiones");
      
      data.users = usersResult.rows;
      data.pacientes = pacientesResult.rows;
      data.sesiones = sesionesResult.rows;
    }
    
    res.json({
      success: true,
      database: config.isLocal ? 'SQLite' : 'PostgreSQL',
      tables: {
        users: {
          count: data.users.length,
          data: data.users
        },
        pacientes: {
          count: data.pacientes.length,
          data: data.pacientes
        },
        sesiones: {
          count: data.sesiones.length,
          data: data.sesiones
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Catchall React (debe estar antes del 404 handler)
if (fs.existsSync(FRONTEND_BUILD)) {
  app.get("*", (req, res, next) => {
    // Solo servir index.html para rutas no-API
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(FRONTEND_BUILD, "index.html"));
  });
}

// 404 handler para API routes no encontradas
app.use('/api/*', notFoundHandler);

// Error handler global (debe ser el último middleware)
app.use(errorHandler);

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
