const fs = require('fs');
const Priest = require('../models/Priest');
const { createNotification } = require('../services/notificationService');

const getAll = async (req, res) => {
  try {
    const priests = await Priest.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, priests });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const processPhoto = (file) => {
  if (!file) return null;
  try {
    const fileBuffer = fs.readFileSync(file.path);
    const mime = file.mimetype || 'image/jpeg';
    const base64 = `data:${mime};base64,${fileBuffer.toString('base64')}`;
    try { fs.unlinkSync(file.path); } catch (e) {}
    return base64;
  } catch (e) {
    console.error('Error processing priest photo:', e.message);
    return `/uploads/priests/${file.filename}`;
  }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.photo = processPhoto(req.file);
    }
    const priest = await Priest.create(data);

    // Send broadcast notification to all users
    createNotification({
      isBroadcast: true,
      recipient: 'user',
      title: `⛪ New Priest Profile Added: ${priest.name}`,
      message: `Rev. Fr. ${priest.name} (${priest.role || 'Parish Clergy'}) has been added to our church directory.`,
      type: 'general',
      category: 'general',
      actionUrl: '/priests'
    }).catch(e => console.warn('Priest notification error:', e.message));

    res.status(201).json({ success: true, priest });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.body.removePhoto === 'true') {
      data.photo = '';
    } else if (req.file) {
      data.photo = processPhoto(req.file);
    } else {
      delete data.photo; // Keep existing photo in database
    }
    const priest = await Priest.findByIdAndUpdate(req.params.id, data, { new: true });

    // Send broadcast notification to all users
    if (priest) {
      createNotification({
        isBroadcast: true,
        recipient: 'user',
        title: `⛪ Priest Details Updated: ${priest.name}`,
        message: `Rev. Fr. ${priest.name}'s profile details have been updated.`,
        type: 'general',
        category: 'general',
        actionUrl: '/priests'
      }).catch(e => console.warn('Priest update notification error:', e.message));
    }

    res.json({ success: true, priest });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const remove = async (req, res) => {
  try {
    await Priest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Priest deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAll, create, update, remove };
