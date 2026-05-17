const PrayerRequest = require('../models/PrayerRequest');
const User = require('../models/User');
const { notifyAdmins } = require('../services/notificationService');

const getPublic = async (req, res) => {
  try {
    const prayers = await PrayerRequest.find({ isPublic: true, status: 'approved' }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, prayers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const prayers = await PrayerRequest.find(query).populate('userId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, prayers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { intention, isPublic, name, language, prayerLocation, churchLocation, type, preferredDate } = req.body;
    
    const prayer = await PrayerRequest.create({ 
      userId: req.user?._id, 
      intention, 
      isPublic, 
      name: name || req.user?.name || 'Anonymous', 
      language: language || 'en',
      prayerLocation,
      churchLocation,
      type,
      preferredDate
    });
    
    // Notify admins (Async) - Fixed ReferenceError for phone/email
    notifyAdmins({
      title: 'New Prayer Request',
      message: `A new prayer request has been received:\n\n👤 Name: ${name || req.user?.name || 'Anonymous'}\n📝 Type: ${type}\n📍 Location: ${prayerLocation}\n💭 Intention: ${intention}\n\nView details: ${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/prayers`
    }).catch(e => console.error('Prayer notification error:', e.message));

    res.status(201).json({ success: true, prayer });
  } catch (err) { 
    console.error('Prayer creation error:', err);
    res.status(500).json({ success: false, message: err.message }); 
  }
};

const updateStatus = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, prayer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const incrementPrayer = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndUpdate(req.params.id, { $inc: { prayerCount: 1 } }, { new: true });
    res.json({ success: true, prayer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getPublic, getAll, create, updateStatus, incrementPrayer };
