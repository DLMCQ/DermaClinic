const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const config = require('../config');

// Helmet configuration (security headers)
const helmetConfig = helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false, // Disable in dev for easier debugging
  crossOriginEmbedderPolicy: false, // Allow loading images
});

// Rate limiting para prevenir ataques de fuerza bruta
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: {
    error: 'Demasiadas peticiones desde esta IP, por favor intente más tarde',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => config.isLocal, // No rate limiting en modo local
  trustProxy: 1, // Trust first proxy (Railway uses X-Forwarded-For)
});

// Rate limiting más estricto para login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // solo 5 intentos de login por ventana
  message: {
    error: 'Demasiados intentos de login, por favor intente más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.isLocal,
  trustProxy: 1, // Trust first proxy (Railway uses X-Forwarded-For)
});

// Compression middleware
const compressionConfig = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Nivel de compresión (0-9, 6 es default y balanceado)
});

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  compressionConfig,
};
