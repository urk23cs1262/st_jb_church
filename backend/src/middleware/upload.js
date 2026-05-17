const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.uploadFolder || 'general';
    const dest = path.join(__dirname, '../../uploads', folder);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf|mp4|mov|mp3|mpeg|ogg|wav/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  // Allow audio mime types too
  const allowedMimes = /image\/|audio\/|video\/|application\/pdf/;
  const mime = allowedMimes.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('File type not allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for audio files
  fileFilter,
});

module.exports = upload;
