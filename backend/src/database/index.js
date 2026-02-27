const config = require('../config');

let db = null;

/**
 * Initialize database connection based on DATABASE_MODE
 * @returns {Promise<DatabaseAdapter>}
 */
async function initDb() {
  if (db) {
    console.log('Database already initialized');
    return db;
  }

  try {
    if (config.isLocal) {
      console.log('🗄️  Initializing LOCAL database (sql.js)...');
      const SqliteAdapter = require('./sqliteAdapter');
      db = new SqliteAdapter(config.database.localPath);
    } else {
      console.log('🗄️  Initializing CLOUD database (PostgreSQL)...');
      const PostgresAdapter = require('./postgresAdapter');
      db = new PostgresAdapter(config.database.url);
    }

    await db.connect();
    await db.migrate();

    console.log(`✅ Database initialized successfully (${config.isLocal ? 'LOCAL' : 'CLOUD'})`);
    return db;
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    throw err;
  }
}

/**
 * Get current database instance
 * @returns {DatabaseAdapter}
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

/**
 * Close database connection
 */
async function closeDb() {
  if (db) {
    await db.close();
    db = null;
    console.log('Database connection closed');
  }
}

module.exports = {
  initDb,
  getDb,
  closeDb,
};
