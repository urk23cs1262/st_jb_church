const Priest = require('../models/Priest');

const getAll = async (req, res) => {
  try {
    const priests = await Priest.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, priests });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = `/uploads/priests/${req.file.filename}`;
    const priest = await Priest.create(data);
    res.status(201).json({ success: true, priest });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = `/uploads/priests/${req.file.filename}`;
    const priest = await Priest.findByIdAndUpdate(req.params.id, data, { new: true });
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
