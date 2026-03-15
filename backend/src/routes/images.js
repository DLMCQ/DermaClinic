const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const cloudinary = require('../utils/cloudinary');

const router = express.Router();

// Multer usa memoria (no disco) — el buffer se sube directo a Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
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

// Subir imagen a Cloudinary
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const { type = 'general' } = req.body;

    // Carpeta en Cloudinary según tipo
    let folder = 'dermaclinic';
    if (type === 'patient') {
      folder = 'dermaclinic/patients';
    } else if (type === 'session_before' || type === 'session_after') {
      folder = 'dermaclinic/sessions';
    }

    // Subir buffer a Cloudinary via stream
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      message: 'Imagen subida exitosamente',
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    next(error);
  }
});

// Eliminar imagen de Cloudinary
router.delete('/delete', authenticate, async (req, res, next) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ error: 'public_id es requerido' });
    }

    await cloudinary.uploader.destroy(public_id);

    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
