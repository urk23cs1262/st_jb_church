const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { sendSMS } = require('../config/twilio');
function sendWA(phone, text) {
  return require('../bot/whatsapp').sendWhatsAppMessage(phone, text).catch(() => {});
}

const getAll = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const query = { isPublished: true };
    if (type) query.type = type;
    const now = new Date();
    query.$or = [{ expiresAt: { $gt: now } }, { expiresAt: null }];
    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, announcements });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body, publishedBy: req.user._id };
    if (req.file) data.attachment = `/uploads/announcements/${req.file.filename}`;
    const ann = await Announcement.create(data);
    
    // Notify all users in background
    if (ann.isPublished !== false) {
      User.find({ isVerified: true }).then(users => {
        const msg = `New Church Announcement: ${ann.title}. Read more on the website!`;
        users.forEach(user => {
          if (user.phone) {
            sendSMS(user.phone, msg).catch(() => {});
            sendWA(user.phone, msg);
          }
        });
      }).catch(err => console.error("Error notifying users:", err));
    }

    res.status(201).json({ success: true, announcement: ann });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.attachment = `/uploads/announcements/${req.file.filename}`;
    const ann = await Announcement.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, announcement: ann });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const remove = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAll, create, update, remove };
