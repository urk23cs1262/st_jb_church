const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Document = require('../models/Document');
const Donation = require('../models/Donation');
const Ticket = require('../models/Ticket');
const Announcement = require('../models/Announcement');
const PrayerRequest = require('../models/PrayerRequest');

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, totalEvents, pendingBookings, pendingDocuments,
      openTickets, totalDonationsAgg, recentUsers, upcomingEvents,
      bookingsByStatus, donationsByType
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Event.countDocuments({ isPublished: true }),
      Booking.countDocuments({ status: 'pending' }),
      Document.countDocuments({ status: 'pending' }),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Donation.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      User.find().select('name email phone createdAt').sort({ createdAt: -1 }).limit(5),
      Event.find({ date: { $gte: new Date() }, isPublished: true }).sort({ date: 1 }).limit(5),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Donation.aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        pendingBookings,
        pendingDocuments,
        openTickets,
        totalDonations: totalDonationsAgg[0]?.total || 0,
      },
      recentUsers,
      upcomingEvents,
      bookingsByStatus,
      donationsByType,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats };
