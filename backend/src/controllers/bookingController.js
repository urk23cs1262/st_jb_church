const Booking = require('../models/Booking');
const { createNotification, notifyAdmins } = require('../services/notificationService');

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query).populate('userId', 'name phone email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, bookings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createBooking = async (req, res) => {
  try {
    const { massDate, massTime, intentionType, intentionDetails, familyName, familyDetails, offertory } = req.body;
    const booking = await Booking.create({ userId: req.user._id, massDate, massTime, intentionType, intentionDetails, familyName, familyDetails, offertory });
    
    // Notify user
    createNotification({ userId: req.user._id, title: 'Mass Booking Received', message: `Your mass booking for ${new Date(massDate).toDateString()} has been received and is pending approval.`, type: 'booking', relatedId: booking._id, channels: ['email'] }).catch(e => console.error('Booking notification error:', e.message));
    
    // Notify admins (Async - don't await to speed up user response)
    notifyAdmins({
      title: 'New Mass Booking',
      message: `A new mass booking has been requested:\n\n👤 User: ${req.user.name}\n📞 Phone: ${req.user.phone || 'N/A'}\n📅 Date: ${new Date(massDate).toDateString()}\n⏰ Time: ${massTime}\n✨ Intention: ${intentionType}\n📝 Details: ${intentionDetails || 'None'}\n\nView details: ${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/bookings`
    }).catch(e => console.error('Booking notification error:', e.message));

    res.status(201).json({ success: true, booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status, adminNote, confirmedBy: req.user._id }, { new: true });
    
    // Notify user (Async)
    createNotification({ 
        userId: booking.userId, 
        title: `Mass Booking ${status}`, 
        message: `Your mass booking for ${new Date(booking.massDate).toDateString()} has been ${status}.${adminNote ? ' Note: ' + adminNote : ''}`, 
        type: 'booking', 
        relatedId: booking._id, 
        channels: ['email'] 
    }).catch(e => console.error('Booking status notification error:', e.message));
    
    res.json({ success: true, booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getMyBookings, getAllBookings, createBooking, updateBookingStatus, deleteBooking };
