const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

const DATA_DIR = path.join(__dirname, "../../data");
const DB_PATH = path.join(DATA_DIR, "dermaclinic.db");

let db = null;

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id                TEXT PRIMARY KEY,
      nombre            TEXT NOT NULL,
      dni               TEXT NOT NULL UNIQUE,
      fecha_nacimiento  TEXT,
      telefono          TEXT,
      email             TEXT,
      direccion         TEXT,
      obra_social       TEXT,
      nro_afiliado      TEXT,
      motivo_consulta   TEXT,
      foto_url          TEXT,
      creado_en         TEXT DEFAULT (datetime('now','localtime')),
      actualizado_en    TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS sesiones (
      id              TEXT PRIMARY KEY,
      paciente_id     TEXT NOT NULL,
      fecha           TEXT NOT NULL,
      tratamiento     TEXT NOT NULL,
      productos       TEXT,
      notas           TEXT,
      imagen_antes    TEXT,
      imagen_despues  TEXT,
      creado_en       TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
    );
  `);

  saveDb();
  console.log("Base de datos lista:", DB_PATH);
}

function all(query, params) {
  const stmt = db.prepare(query);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(query, params) {
  const rows = all(query, params);
  return rows[0] || null;
}

function run(query, params) {
  db.run(query, params || []);
  saveDb();
}

module.exports = { initDb, all, get, run };
