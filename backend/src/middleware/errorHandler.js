const config = require('../config');

// Middleware global de manejo de errores
function errorHandler(err, req, res, next) {
  // Log del error (en producción usarías un logger como Winston)
  console.error('[Error Handler]', {
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Errores de validación JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
    });
  }

  // Errores de validación de Joi (aunque ya manejados en validate.js, por si acaso)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.details,
    });
  }

  // Errores de base de datos
  if (err.code) {
    // PostgreSQL error codes
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Ya existe un registro con estos datos',
          detail: err.detail || 'Violación de constraint único',
        });

      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Referencia inválida',
          detail: 'El registro relacionado no existe',
        });

      case '23502': // Not null violation
        return res.status(400).json({
          error: 'Campo requerido faltante',
          detail: err.column ? `El campo ${err.column} es requerido` : undefined,
        });

      case '22P02': // Invalid text representation
        return res.status(400).json({
          error: 'Formato de dato inválido',
        });

      default:
        // Otros errores de DB - no exponer detalles en producción
        if (config.isDevelopment) {
          return res.status(500).json({
            error: 'Error de base de datos',
            code: err.code,
            detail: err.detail,
          });
        }
    }
  }

  // Errores de Multer (upload de archivos)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        detail: 'El tamaño máximo permitido es 5MB',
      });
    }

    return res.status(400).json({
      error: 'Error al subir archivo',
      detail: err.message,
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    // Solo mostrar stack trace en desarrollo
    ...(config.isDevelopment && { stack: err.stack }),
  });
}

// Middleware para rutas no encontradas (404)
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
  });
}

module.exports = { errorHandler, notFoundHandler };
