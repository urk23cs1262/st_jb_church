const router = require('express').Router();
const { getMyNotifications, markRead, markAllRead, broadcast } = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getMyNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);
router.post('/broadcast', protect, adminOnly, broadcast);

module.exports = router;
