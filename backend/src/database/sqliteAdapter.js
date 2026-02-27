const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

/**
 * SQLite Adapter (sql.js) for local mode
 * Maintains compatibility with existing sql.js implementation
 */
class SqliteAdapter {
  constructor(dbPath) {
    this.dbPath = path.resolve(dbPath);
    this.db = null;
  }

  /**
   * Connect to SQLite database
   */
  async connect() {
    const dataDir = path.dirname(this.dbPath);

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
      console.log(`📂 Loaded existing database: ${this.dbPath}`);
    } else {
      this.db = new SQL.Database();
      console.log(`📂 Created new database: ${this.dbPath}`);
    }
  }

  /**
   * Run migrations (create tables if not exist)
   */
  async migrate() {
    // Create tables (existing schema)
    this.db.run(`
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

    this.saveToFile();
    console.log('✅ SQLite migrations completed');
  }

  /**
   * Execute query and return all rows
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>}
   */
  async query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    return rows;
  }

  /**
   * Execute query and return single row
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>}
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  /**
   * Execute statement (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL statement
   * @param {Array} params - Statement parameters
   * @returns {Promise<void>}
   */
  async execute(sql, params = []) {
    this.db.run(sql, params);
    this.saveToFile();
  }

  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    try {
      this.db.run('BEGIN TRANSACTION');
      const result = await callback(this);
      this.db.run('COMMIT');
      this.saveToFile();
      return result;
    } catch (err) {
      this.db.run('ROLLBACK');
      throw err;
    }
  }

  /**
   * Save database to file
   */
  saveToFile() {
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      this.saveToFile();
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = SqliteAdapter;
