const router = require('express').Router();
const { getSettings, getSetting, updateTextSetting, uploadFileSetting, deleteSetting } = require('../controllers/settingsController');
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
router.delete('/:key', protect, adminOnly, deleteSetting);

module.exports = router;
