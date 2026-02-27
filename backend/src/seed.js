/**
 * Database seed script
 * Creates demo user if it doesn't exist
 */

const { getDb, initDb, closeDb } = require('./database');
const { hashPassword } = require('./utils/password');

async function seed() {
  try {
    await initDb();
    const db = getDb();

    // Crear usuarios iniciales
    const users = [
      { username: 'admin', password: 'admin123', nombre: 'Administrador', role: 'admin' },
      { username: 'demo', password: 'password', nombre: 'Demo User', role: 'doctor' },
    ];

    for (const userData of users) {
      const exists = await db.queryOne(
        'SELECT * FROM users WHERE username = $1',
        [userData.username]
      );

      if (!exists) {
        const hashedPassword = await hashPassword(userData.password);
        await db.execute(
          `INSERT INTO users (username, password_hash, nombre, role, is_active) 
           VALUES ($1, $2, $3, $4, $5)`,
          [userData.username, hashedPassword, userData.nombre, userData.role, true]
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
