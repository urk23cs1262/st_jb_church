const Gallery = require('../models/Gallery');

const getAll = async (req, res) => {
  try {
    const { category, album, page = 1, limit = 30 } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    if (album) query.album = album;
    const total = await Gallery.countDocuments(query);
    const items = await Gallery.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body, uploadedBy: req.user._id };
    if (req.file) data.imageUrl = `/uploads/gallery/${req.file.filename}`;
    const item = await Gallery.create(data);
    res.status(201).json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.imageUrl = `/uploads/gallery/${req.file.filename}`;
    const item = await Gallery.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const remove = async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Gallery item deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAll, create, update, remove };
