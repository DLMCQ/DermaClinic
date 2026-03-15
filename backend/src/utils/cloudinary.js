const { v2: cloudinary } = require('cloudinary');

// Cloudinary se configura con CLOUDINARY_URL (formato: cloudinary://KEY:SECRET@CLOUD_NAME)
// o con las variables individuales:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;
