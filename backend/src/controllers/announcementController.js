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
      const clientUrl = process.env.CLIENT_URL?.replace('http://localhost:5173', 'https://st-jb-church.vercel.app') || 'https://st-jb-church.vercel.app';
      const snippet = ann.content ? (ann.content.length > 120 ? ann.content.slice(0, 120) + '...' : ann.content) : '';
      const msg = `📢 *New Church Announcement: ${ann.title}*

${snippet ? `_"${snippet}"_\n\n` : ''}🔗 *Read Full Announcement on Website:*
${clientUrl}/announcements

✝️ _St. John de Britto's Church, Kalayarkoil_`;


      User.find({ isVerified: true }).then(users => {
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

    // Notify all users about Updated Announcement in background
    if (ann && ann.isPublished !== false) {
      const clientUrl = process.env.CLIENT_URL?.replace('http://localhost:5173', 'https://st-jb-church.vercel.app') || 'https://st-jb-church.vercel.app';
      const snippet = ann.content ? (ann.content.length > 120 ? ann.content.slice(0, 120) + '...' : ann.content) : '';
      const msg = `🔄 *Updated Parish Announcement: ${ann.title}*

${snippet ? `_"${snippet}"_\n\n` : ''}🔗 *Read Updated Announcement on Website:*
${clientUrl}/announcements

✝️ _St. John de Britto's Church, Kalayarkoil_`;

      User.find({ isVerified: true }).then(users => {
        users.forEach(user => {
          if (user.phone) {
            sendSMS(user.phone, msg).catch(() => {});
            sendWA(user.phone, msg);
          }
        });
      }).catch(err => console.error("Error notifying users on announcement update:", err));
    }

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
