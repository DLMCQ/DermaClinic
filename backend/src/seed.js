/**
 * Database seed script
 * Creates default users if they don't exist
 */

const { v4: uuidv4 } = require('uuid');
const { getDb, initDb, closeDb } = require('./database');

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', nombre: 'Administrador', role: 'admin' },
  { username: 'demo', password: 'password', nombre: 'Demo User', role: 'doctor' },
];

async function seedUsers(db) {
  for (const userData of DEFAULT_USERS) {
    const exists = await db.queryOne(
      'SELECT id FROM users WHERE username = ?',
      [userData.username]
    );

    if (!exists) {
      await db.execute(
        'INSERT INTO users (id, username, password, nombre, role) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), userData.username, userData.password, userData.nombre, userData.role]
      );
      console.log(`✅ Usuario creado: ${userData.username}`);
    } else {
      console.log(`⏭️ Usuario ya existe: ${userData.username}`);
    }
  }
}

// Permite correr el seed de forma standalone
async function seed() {
  try {
    await initDb();
    const db = getDb();
    await seedUsers(db);
    await closeDb();
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

module.exports = { seedUsers };

// Si se ejecuta directamente: node seed.js
if (require.main === module) {
  seed();
}
