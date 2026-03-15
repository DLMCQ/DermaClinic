/**
 * Database seed script
 * Creates default users if they don't exist
 */

const { v4: uuidv4 } = require('uuid');
const { getDb, initDb, closeDb } = require('./database');

async function seed() {
  try {
    await initDb();
    const db = getDb();

    const users = [
      { username: 'admin', password: 'admin123', nombre: 'Administrador', role: 'admin' },
      { username: 'demo', password: 'password', nombre: 'Demo User', role: 'doctor' },
    ];

    for (const userData of users) {
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
      }
    }

    await closeDb();
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
