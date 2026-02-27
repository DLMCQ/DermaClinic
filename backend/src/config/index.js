require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isLocal = process.env.DATABASE_MODE === 'local';

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isProduction,
  isLocal,

  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
  },

  database: {
    url: process.env.DATABASE_URL,
    localPath: process.env.LOCAL_DB_PATH || './data/dermaclinic.db',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // 2 AM daily
    path: process.env.BACKUP_PATH || '/app/backups',
  },

  uploads: {
    path: process.env.UPLOADS_PATH || '/app/uploads',
    maxSize: 5 * 1024 * 1024, // 5MB
  },
};
