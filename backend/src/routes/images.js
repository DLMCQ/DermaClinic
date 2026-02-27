const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Solo disponible en modo cloud
const cloudOnly = (req, res, next) => {
  if (config.isLocal) {
    return res.status(404).json({
      error: 'Upload de imágenes a volumen solo disponible en modo cloud. En modo local use base64.',
    });
  }
  next();
};

// Determinar directorio de uploads según entorno
const getUploadDir = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/app/uploads'; // Railway Volume
  }
  // En desarrollo local (probando modo cloud), usar carpeta local
  const localUploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }
  return localUploadDir;
};

// Configurar multer para Railway Volumes o carpeta local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { type, entityId } = req.body;

    if (!type || !entityId) {
      return cb(new Error('Faltan parámetros: type y entityId son requeridos'));
    }

    const uploadDir = getUploadDir();
    let dir;

    if (type === 'patient') {
      dir = path.join(uploadDir, 'patients', entityId);
    } else if (type === 'session_before' || type === 'session_after') {
      dir = path.join(uploadDir, 'sessions', entityId);
    } else {
      return cb(new Error('Tipo inválido. Use: patient, session_before, session_after'));
    }

    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const { type } = req.body;
    const ext = path.extname(file.originalname);

    if (type === 'patient') {
      cb(null, `profile${ext}`);
    } else if (type === 'session_before') {
      cb(null, `before${ext}`);
    } else if (type === 'session_after') {
      cb(null, `after${ext}`);
    } else {
      cb(new Error('Tipo inválido'));
    }
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
});

// Upload de imagen
router.post('/upload', cloudOnly, authenticate, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No se subió ningún archivo',
      });
    }

    const { type, entityId } = req.body;

    // Construir path relativo para guardar en DB
    let relativePath;
    if (type === 'patient') {
      relativePath = `/uploads/patients/${entityId}/profile${path.extname(req.file.originalname)}`;
    } else if (type === 'session_before') {
      relativePath = `/uploads/sessions/${entityId}/before${path.extname(req.file.originalname)}`;
    } else if (type === 'session_after') {
      relativePath = `/uploads/sessions/${entityId}/after${path.extname(req.file.originalname)}`;
    }

    res.json({
      message: 'Imagen subida exitosamente',
      path: relativePath,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
});

// Servir imágenes estáticas
// En producción Railway, esto servirá desde /app/uploads
// En desarrollo local con modo cloud, desde ./backend/uploads
router.use('/uploads', express.static(getUploadDir()));

// Eliminar imagen
router.delete('/delete', cloudOnly, authenticate, async (req, res, next) => {
  try {
    const { path: imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({
        error: 'Path de imagen es requerido',
      });
    }

    // Validar que el path está dentro de uploads
    if (!imagePath.startsWith('/uploads/')) {
      return res.status(400).json({
        error: 'Path inválido',
      });
    }

    const uploadDir = getUploadDir();
    const fullPath = path.join(uploadDir, imagePath.replace('/uploads/', ''));

    // Verificar que el archivo existe
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        error: 'Imagen no encontrada',
      });
    }

    // Eliminar archivo
    fs.unlinkSync(fullPath);

    res.json({
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
});

// Obtener información de imagen
router.get('/info', cloudOnly, authenticate, async (req, res, next) => {
  try {
    const { path: imagePath } = req.query;

    if (!imagePath) {
      return res.status(400).json({
        error: 'Path de imagen es requerido',
      });
    }

    if (!imagePath.startsWith('/uploads/')) {
      return res.status(400).json({
        error: 'Path inválido',
      });
    }

    const uploadDir = getUploadDir();
    const fullPath = path.join(uploadDir, imagePath.replace('/uploads/', ''));

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        error: 'Imagen no encontrada',
      });
    }

    const stats = fs.statSync(fullPath);

    res.json({
      path: imagePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
