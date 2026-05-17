const Notification = require('../models/Notification');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ $or: [{ userId: req.user._id }, { isBroadcast: true }] }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const broadcast = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const notif = await Notification.create({ isBroadcast: true, title, message, type: type || 'general' });
    res.status(201).json({ success: true, notification: notif });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getMyNotifications, markRead, markAllRead, broadcast };
