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
      { email: 'admin@dermaclinic.com', password: 'admin123', nombre: 'Administrador', role: 'admin' },
      { email: 'demo@dermaclinic.com', password: 'password', nombre: 'Demo User', role: 'doctor' },
    ];

    for (const userData of users) {
      const exists = await db.queryOne(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );

      if (!exists) {
        const hashedPassword = await hashPassword(userData.password);
        await db.execute(
          `INSERT INTO users (email, password_hash, nombre, role, is_active) 
           VALUES ($1, $2, $3, $4, $5)`,
          [userData.email, hashedPassword, userData.nombre, userData.role, true]
        );
        console.log(`✅ Usuario creado: ${userData.email}`);
      }
    }
    
    await closeDb();
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
