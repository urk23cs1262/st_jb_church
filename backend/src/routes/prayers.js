const router = require('express').Router();
const { getPublic, getAll, create, updateStatus, incrementPrayer } = require('../controllers/prayerController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/public', getPublic);
router.get('/', protect, adminOnly, getAll);
router.post('/', create);
router.put('/:id/status', protect, adminOnly, updateStatus);
router.post('/:id/pray', incrementPrayer);

module.exports = router;
