const Event = require('../models/Event');
const User = require('../models/User');
const { sendSMS } = require('../config/twilio');
function sendWA(phone, text) {
  return require('../bot/whatsapp').sendWhatsAppMessage(phone, text).catch(() => {});
}

const getAll = async (req, res) => {
  try {
    const { category, upcoming, featured, page = 1, limit = 20, all } = req.query;
    const query = {};
    if (all !== 'true') query.isPublished = true;
    if (category) query.category = category;
    if (upcoming === 'true') query.date = { $gte: new Date() };
    if (featured === 'true') query.isFeatured = true;
    const total = await Event.countDocuments(query);
    const events = await Event.find(query).sort({ date: 1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, events });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getOne = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (req.file) data.image = `/uploads/events/${req.file.filename}`;
    const event = await Event.create(data);

    // Notify all users in background
    if (event.isPublished !== false) {
      User.find({ isVerified: true }).then(users => {
        const msg = `New Church Event: ${event.title} on ${new Date(event.date).toLocaleDateString()}. Register now!`;
        users.forEach(user => {
          if (user.phone) {
            sendSMS(user.phone, msg).catch(() => {});
            sendWA(user.phone, msg);
          }
        });
      }).catch(err => console.error("Error notifying users:", err));
    }

    res.status(201).json({ success: true, event });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/events/${req.file.filename}`;
    const event = await Event.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, event });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const remove = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const registerForEvent = async (req, res) => {
  try {
    const { name, phone, email, gender, comingFrom } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const alreadyRegistered = event.registrations.some(r => r.userId?.toString() === req.user._id.toString());
    if (alreadyRegistered) return res.status(400).json({ success: false, message: 'Already registered' });
    event.registrations.push({
      userId: req.user._id,
      name: name || req.user.name,
      phone: phone || req.user.phone,
      email: email || req.user.email,
      gender,
      comingFrom,
      registeredAt: new Date()
    });
    await event.save();
    res.json({ success: true, message: 'Registered successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const withdrawRegistration = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    
    const index = event.registrations.findIndex(r => r.userId?.toString() === req.user._id.toString());
    if (index === -1) return res.status(400).json({ success: false, message: 'Not registered for this event' });
    
    event.registrations.splice(index, 1);
    await event.save();
    res.json({ success: true, message: 'Registration withdrawn successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAll, getOne, create, update, remove, registerForEvent, withdrawRegistration };
