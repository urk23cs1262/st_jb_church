const SiteSettings = require('../models/SiteSettings');

// GET all settings (public - needed by frontend widgets)
const getSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.find();
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json({ success: true, settings: map });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single setting by key (public)
const getSetting = async (req, res) => {
  try {
    const setting = await SiteSettings.findOne({ key: req.params.key });
    res.json({ success: true, value: setting?.value || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPSERT a text setting (admin only)
const updateTextSetting = async (req, res) => {
  try {
    const { key, value, label } = req.body;
    if (!key || !value) return res.status(400).json({ success: false, message: 'key and value required' });
    const setting = await SiteSettings.findOneAndUpdate(
      { key },
      { key, value, label: label || key, type: 'text' },
      { upsert: true, new: true }
    );
    res.json({ success: true, setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPLOAD a file setting (admin only)
const uploadFileSetting = async (req, res) => {
  try {
    const { key, label } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'key required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'file required' });

    const filePath = `/uploads/settings/${req.file.filename}`;
    const setting = await SiteSettings.findOneAndUpdate(
      { key },
      { key, value: filePath, label: label || key, type: 'file' },
      { upsert: true, new: true }
    );
    res.json({ success: true, setting, filePath });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSettings, getSetting, updateTextSetting, uploadFileSetting };
