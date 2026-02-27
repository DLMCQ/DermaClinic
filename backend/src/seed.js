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

    // Check if demo user exists
    const demoUser = await db.queryOne(
      'SELECT * FROM users WHERE email = $1',
      ['demo@dermaclinic.com']
    );

    if (demoUser) {
      console.log('✅ Demo user already exists');
      await closeDb();
      return;
    }

    // Create demo user
    const hashedPassword = await hashPassword('password');
    
    await db.execute(
      `INSERT INTO users (email, password_hash, nombre, role, is_active) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['demo@dermaclinic.com', hashedPassword, 'Demo User', 'doctor', true]
    );

    console.log('✅ Demo user created successfully');
    console.log('   Email: demo@dermaclinic.com');
    console.log('   Password: password');
    
    await closeDb();
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
