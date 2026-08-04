const router = require('express').Router();
const { getDashboardStats, resetTimeline } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.post('/reset-timeline', protect, adminOnly, resetTimeline);

module.exports = router;
