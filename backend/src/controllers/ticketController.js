const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { notifyAdmins, createNotification } = require('../services/notificationService');

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

    // ✅ NEW: Confirm to the user that their message was received
    createNotification({
      userId: req.user._id,
      title: 'We Received Your Message ✉️',
      message: `Dear ${req.user.name},\n\nThank you for contacting St. John de Britto's Church. We have received your inquiry:\n\n📌 Subject: ${subject}\n💬 Message: ${message}\n\nOur team will get back to you soon. God bless you!`,
      type: 'ticket',
      relatedId: ticket._id,
      channels: ['email'],
    }).catch(e => console.error('Ticket user notification error:', e.message));

    // Notify admins
    notifyAdmins({
      title: 'New Support Ticket',
      message: `A new inquiry has been received:\n\n👤 User: ${req.user.name}\n📞 Phone: ${req.user.phone || 'N/A'}\n📧 Email: ${req.user.email || 'N/A'}\n📁 Category: ${category || 'General'}\n📌 Subject: ${subject}\n💬 Message: ${message}\n\nView details: ${process.env.CLIENT_URL}/admin/tickets`
    }).catch(e => console.error('Ticket admin notification error:', e.message));

    res.status(201).json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const reply = async (req, res) => {
  try {
    const { message, from } = req.body;
    const ticket = await Ticket.findById(req.params.id).populate('userId', 'name email');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.replies.push({ from: from || 'admin', message, repliedBy: req.user._id });
    if (from === 'admin') ticket.status = 'in_progress';
    await ticket.save();

    // ✅ NEW: Email user when admin replies
    if (from === 'admin' && ticket.userId) {
      createNotification({
        userId: ticket.userId._id || ticket.userId,
        title: 'Reply to Your Inquiry 💬',
        message: `Dear ${ticket.userId.name || 'Parishioner'},\n\nThe parish office has replied to your inquiry:\n\n📌 Subject: ${ticket.subject}\n💬 Reply: ${message}\n\nIf you have further questions, please contact us again.`,
        type: 'ticket',
        relatedId: ticket._id,
        channels: ['email'],
      }).catch(e => console.error('Ticket reply notification error:', e.message));
    }

    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'resolved') update.resolvedAt = new Date();
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true }).populate('userId', 'name');

    // ✅ NEW: Email user when ticket is resolved
    if (status === 'resolved' && ticket.userId) {
      createNotification({
        userId: ticket.userId._id || ticket.userId,
        title: 'Your Inquiry Has Been Resolved ✅',
        message: `Dear ${ticket.userId.name || 'Parishioner'},\n\nYour inquiry regarding "${ticket.subject}" has been marked as resolved by our team.\n\nThank you for contacting St. John de Britto's Church. God bless you!`,
        type: 'ticket',
        relatedId: ticket._id,
        channels: ['email'],
      }).catch(e => console.error('Ticket resolved notification error:', e.message));
    }

    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getMyTickets, getAll, create, reply, updateStatus };