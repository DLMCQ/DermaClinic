const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * PostgreSQL Adapter for cloud mode
 * Uses pg connection pool for better performance
 */
class PostgresAdapter {
  constructor(connectionString) {
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for cloud mode');
    }

    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  /**
   * Connect to PostgreSQL (test connection)
   */
  async connect() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log(`📡 Connected to PostgreSQL at ${result.rows[0].now}`);
    } catch (err) {
      console.error('Failed to connect to PostgreSQL:', err);
      throw err;
    }
  }

  /**
   * Run migrations
   */
  async migrate() {
    const migrationsDir = path.join(__dirname, '../migrations');

    // Create migrations table if not exists
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found, skipping migrations');
      return;
    }

    // Get all migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      // Check if migration already executed
      const executed = await this.pool.query(
        'SELECT filename FROM schema_migrations WHERE filename = $1',
        [file]
      );

      if (executed.rows.length > 0) {
        console.log(`⏭️  Skipping migration: ${file} (already executed)`);
        continue;
      }

      // Execute migration
      console.log(`🔄 Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await this.pool.query(sql);
        await this.pool.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        console.log(`✅ Migration completed: ${file}`);
      } catch (err) {
        console.error(`❌ Migration failed: ${file}`, err);
        throw err;
      }
    }

    console.log('✅ All PostgreSQL migrations completed');
  }

  /**
   * Execute query and return all rows
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters ($1, $2, etc.)
   * @returns {Promise<Array>}
   */
  async query(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  /**
   * Execute query and return single row
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>}
   */
  async queryOne(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Execute statement (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL statement
   * @param {Array} params - Statement parameters
   * @returns {Promise<void>}
   */
  async execute(sql, params = []) {
    await this.pool.query(sql, params);
  }

  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback receives a client
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create adapter interface for the transaction client
      const transactionAdapter = {
        query: async (sql, params) => {
          const result = await client.query(sql, params);
          return result.rows;
        },
        queryOne: async (sql, params) => {
          const result = await client.query(sql, params);
          return result.rows[0] || null;
        },
        execute: async (sql, params) => {
          await client.query(sql, params);
        },
      };

      const result = await callback(transactionAdapter);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection pool
   */
  async close() {
    await this.pool.end();
    console.log('PostgreSQL connection pool closed');
  }
}

module.exports = PostgresAdapter;
