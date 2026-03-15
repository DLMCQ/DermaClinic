const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * MySQL Adapter
 * Uses mysql2/promise connection pool
 */
class MySQLAdapter {
  constructor(connectionString) {
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for database connection');
    }

    this.pool = mysql.createPool({
      uri: connectionString,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  /**
   * Test connection
   */
  async connect() {
    try {
      const conn = await this.pool.getConnection();
      const [rows] = await conn.query('SELECT NOW() as now');
      conn.release();
      console.log(`📡 Connected to MySQL at ${rows[0].now}`);
    } catch (err) {
      console.error('Failed to connect to MySQL:', err);
      throw err;
    }
  }

  /**
   * Run migrations
   */
  async migrate() {
    // Create migrations table if not exists
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(__dirname, '../migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found, skipping migrations');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const [executed] = await this.pool.query(
        'SELECT filename FROM schema_migrations WHERE filename = ?',
        [file]
      );

      if (executed.length > 0) {
        console.log(`⏭️  Skipping migration: ${file} (already executed)`);
        continue;
      }

      console.log(`🔄 Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Split on semicolons to execute each statement separately
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      try {
        for (const statement of statements) {
          await this.pool.query(statement);
        }

        await this.pool.query(
          'INSERT INTO schema_migrations (filename) VALUES (?)',
          [file]
        );
        console.log(`✅ Migration completed: ${file}`);
      } catch (err) {
        console.error(`❌ Migration failed: ${file}`, err);
        throw err;
      }
    }

    console.log('✅ All MySQL migrations completed');
  }

  /**
   * Execute query and return all rows
   * @param {string} sql - SQL query (use ? for params)
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>}
   */
  async query(sql, params = []) {
    const [rows] = await this.pool.query(sql, params);
    return rows;
  }

  /**
   * Execute query and return single row
   * @param {string} sql - SQL query (use ? for params)
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>}
   */
  async queryOne(sql, params = []) {
    const [rows] = await this.pool.query(sql, params);
    return rows[0] || null;
  }

  /**
   * Execute statement (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL statement (use ? for params)
   * @param {Array} params - Statement parameters
   * @returns {Promise<void>}
   */
  async execute(sql, params = []) {
    await this.pool.query(sql, params);
  }

  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback receives an adapter
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    const conn = await this.pool.getConnection();

    try {
      await conn.beginTransaction();

      const transactionAdapter = {
        query: async (sql, params = []) => {
          const [rows] = await conn.query(sql, params);
          return rows;
        },
        queryOne: async (sql, params = []) => {
          const [rows] = await conn.query(sql, params);
          return rows[0] || null;
        },
        execute: async (sql, params = []) => {
          await conn.query(sql, params);
        },
      };

      const result = await callback(transactionAdapter);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Close database connection pool
   */
  async close() {
    await this.pool.end();
    console.log('MySQL connection pool closed');
  }
}

module.exports = MySQLAdapter;
