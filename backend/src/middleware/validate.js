const Joi = require('joi');

// Middleware factory para validar requests con Joi schemas
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Mostrar todos los errores, no solo el primero
      stripUnknown: true, // Remover campos no definidos en el schema
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation error',
        details: errors,
      });
    }

    // Reemplazar body con valores validados y sanitizados
    req.body = value;
    next();
  };
}

// Schemas de validación comunes

const schemas = {
  // Autenticación
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email debe ser válido',
      'any.required': 'Email es requerido',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password debe tener al menos 6 caracteres',
      'any.required': 'Password es requerido',
    }),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token es requerido',
    }),
  }),

  // Usuarios
  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    nombre: Joi.string().min(2).max(255).required(),
    role: Joi.string().valid('admin', 'doctor').required(),
  }),

  updateUser: Joi.object({
    email: Joi.string().email(),
    password: Joi.string().min(8),
    nombre: Joi.string().min(2).max(255),
    role: Joi.string().valid('admin', 'doctor'),
    is_active: Joi.boolean(),
  }).min(1), // Al menos un campo debe estar presente

  // Pacientes
  createPaciente: Joi.object({
    nombre: Joi.string().min(2).max(255).required(),
    dni: Joi.string().min(6).max(50).required(),
    fecha_nacimiento: Joi.date().iso().optional().allow(null, ''),
    telefono: Joi.string().max(50).optional().allow(null, ''),
    email: Joi.string().email().optional().allow(null, ''),
    direccion: Joi.string().optional().allow(null, ''),
    obra_social: Joi.string().max(255).optional().allow(null, ''),
    nro_afiliado: Joi.string().max(100).optional().allow(null, ''),
    motivo_consulta: Joi.string().optional().allow(null, ''),
    foto_url: Joi.string().optional().allow(null, ''), // base64 en modo local
    foto_path: Joi.string().optional().allow(null, ''), // path en modo cloud
  }),

  updatePaciente: Joi.object({
    nombre: Joi.string().min(2).max(255),
    dni: Joi.string().min(6).max(50),
    fecha_nacimiento: Joi.date().iso().allow(null, ''),
    telefono: Joi.string().max(50).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    direccion: Joi.string().allow(null, ''),
    obra_social: Joi.string().max(255).allow(null, ''),
    nro_afiliado: Joi.string().max(100).allow(null, ''),
    motivo_consulta: Joi.string().allow(null, ''),
    foto_url: Joi.string().allow(null, ''),
    foto_path: Joi.string().allow(null, ''),
  }).min(1),

  // Sesiones
  createSesion: Joi.object({
    paciente_id: Joi.string().uuid().required(),
    fecha: Joi.date().iso().required(),
    tratamiento: Joi.string().min(1).max(255).required(),
    productos: Joi.string().optional().allow(null, ''),
    notas: Joi.string().optional().allow(null, ''),
    imagen_antes: Joi.string().optional().allow(null, ''),
    imagen_despues: Joi.string().optional().allow(null, ''),
  }),

  updateSesion: Joi.object({
    fecha: Joi.date().iso(),
    tratamiento: Joi.string().min(1).max(255),
    productos: Joi.string().allow(null, ''),
    notas: Joi.string().allow(null, ''),
    imagen_antes: Joi.string().allow(null, ''),
    imagen_despues: Joi.string().allow(null, ''),
  }).min(1),

  // Citas
  createAppointment: Joi.object({
    paciente_id: Joi.string().uuid().required(),
    doctor_id: Joi.string().uuid().optional(),
    fecha_hora: Joi.date().iso().required(),
    duracion_minutos: Joi.number().integer().min(15).max(480).default(60),
    tratamiento_planeado: Joi.string().max(255).optional().allow(null, ''),
    notas: Joi.string().optional().allow(null, ''),
    estado: Joi.string().valid('pendiente', 'confirmada', 'completada', 'cancelada').default('pendiente'),
  }),

  updateAppointment: Joi.object({
    paciente_id: Joi.string().uuid(),
    doctor_id: Joi.string().uuid().allow(null),
    fecha_hora: Joi.date().iso(),
    duracion_minutos: Joi.number().integer().min(15).max(480),
    tratamiento_planeado: Joi.string().max(255).allow(null, ''),
    notas: Joi.string().allow(null, ''),
    estado: Joi.string().valid('pendiente', 'confirmada', 'completada', 'cancelada'),
    recordatorio_enviado: Joi.boolean(),
  }).min(1),
};

module.exports = { validate, schemas };
