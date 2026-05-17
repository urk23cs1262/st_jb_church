const router = require('express').Router();
const { getSettings, getSetting, updateTextSetting, uploadFileSetting } = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes - frontend widgets read these
router.get('/', getSettings);
router.get('/:key', getSetting);

// Admin routes
router.post('/text', protect, adminOnly, updateTextSetting);
router.post('/file', protect, adminOnly, (req, res, next) => {
  req.uploadFolder = 'settings';
  next();
}, upload.single('file'), uploadFileSetting);

module.exports = router;
