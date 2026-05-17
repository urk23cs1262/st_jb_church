const AnbiyamMeeting = require('../models/AnbiyamMeeting');

const getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const total = await AnbiyamMeeting.countDocuments(query);
    const meetings = await AnbiyamMeeting.find(query).populate('bookedBy', 'name phone').sort({ date: 1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, meetings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { hostFamily, hostAddress, date, time, prayerIntentions, area, leaderName, leaderPhone } = req.body;
    const meeting = await AnbiyamMeeting.create({ hostFamily, hostAddress, date, time, prayerIntentions, area, leaderName, leaderPhone, bookedBy: req.user._id });
    res.status(201).json({ success: true, meeting });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const update = async (req, res) => {
  try {
    const meeting = await AnbiyamMeeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, meeting });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const remove = async (req, res) => {
  try {
    await AnbiyamMeeting.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Meeting deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAll, create, update, remove };
