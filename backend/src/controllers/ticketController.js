const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { notifyAdmins } = require('../services/notificationService');

const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query).populate('userId', 'name phone email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, tickets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;
    const ticket = await Ticket.create({ userId: req.user._id, subject, message, category, priority });
    
    // Notify admins
    await notifyAdmins({
      title: 'New Support Ticket',
      message: `A new inquiry has been received:\n\n👤 User: ${req.user.name}\n📞 Phone: ${req.user.phone || 'N/A'}\n📧 Email: ${req.user.email}\n📁 Category: ${category || 'General'}\n📌 Subject: ${subject}\n💬 Message: ${message}\n\nView details: ${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/tickets`
    });

    res.status(201).json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const reply = async (req, res) => {
  try {
    const { message, from } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    ticket.replies.push({ from: from || 'admin', message, repliedBy: req.user._id });
    if (from === 'admin') ticket.status = 'in_progress';
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'resolved') update.resolvedAt = new Date();
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getMyTickets, getAll, create, reply, updateStatus };
