const express = require('express');
const router = express.Router();
const { getStatus, getSubscribers, getStats, triggerBroadcast, sendCustomMessage } = require('../controllers/botController');
const { protect, adminOnly } = require('../middleware/auth');

// All endpoints are admin-protected (no Twilio webhook needed — Baileys listens directly)
router.get('/status', protect, adminOnly, getStatus);
router.get('/subscribers', protect, adminOnly, getSubscribers);
router.get('/stats', protect, adminOnly, getStats);
router.post('/broadcast/now', protect, adminOnly, triggerBroadcast);
router.post('/send', protect, adminOnly, sendCustomMessage);

module.exports = router;
