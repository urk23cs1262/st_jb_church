const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Document = require('../models/Document');
const Donation = require('../models/Donation');
const Ticket = require('../models/Ticket');
const Announcement = require('../models/Announcement');
const PrayerRequest = require('../models/PrayerRequest');
const DailyVerse = require('../models/DailyVerse');

let timelineResetCutoff = new Date(); // Start timeline fresh from now

const resetTimeline = async (req, res) => {
  try {
    timelineResetCutoff = new Date();
    res.json({ success: true, message: 'Activity timeline cleared successfully. Starting fresh from now!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalUsers,
      totalAdmins,
      newMembersThisMonth,
      todayBookings,
      totalEvents,
      upcomingEventsCount,
      activeAnnouncementsCount,
      pendingBookings,
      pendingDocuments,
      openTickets,
      pendingPrayers,
      donationsTodayAgg,
      donationsMonthAgg,
      donationsYearAgg,
      totalDonationsAgg,
      recentUsers,
      upcomingEvents,
      recentBookings,
      recentDonations,
      recentTickets,
      recentAnnouncements,
      todayVerse,
      allUsersForSpecialDays
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Booking.countDocuments({
        $or: [
          { massDate: { $gte: startOfToday, $lte: endOfToday } },
          { createdAt: { $gte: startOfToday, $lte: endOfToday } }
        ]
      }),
      Event.countDocuments({ isPublished: true }),
      Event.countDocuments({ date: { $gte: startOfToday }, isPublished: true }),
      Announcement.countDocuments({ isPublished: { $ne: false } }),
      Booking.countDocuments({ status: 'pending' }),
      Document.countDocuments({ status: 'pending' }),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress', 'pending'] } }),
      PrayerRequest.countDocuments({ status: 'pending' }),
      Donation.aggregate([
        { $match: { createdAt: { $gte: startOfToday, $lte: endOfToday } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Donation.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Donation.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Donation.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      User.find({ createdAt: { $gte: timelineResetCutoff } }).select('name email phone parishMemberId familyId createdAt profilePhoto').sort({ createdAt: -1 }).limit(10),
      Event.find({ date: { $gte: startOfToday }, isPublished: true }).sort({ date: 1 }).limit(5),
      Booking.find({ createdAt: { $gte: timelineResetCutoff } }).populate('userId', 'name').sort({ createdAt: -1 }).limit(10),
      Donation.find({ createdAt: { $gte: timelineResetCutoff } }).populate('userId', 'name').sort({ createdAt: -1 }).limit(10),
      Ticket.find({ createdAt: { $gte: timelineResetCutoff } }).populate('userId', 'name').sort({ createdAt: -1 }).limit(5),
      Announcement.find({ createdAt: { $gte: timelineResetCutoff } }).sort({ createdAt: -1 }).limit(5),
      DailyVerse.findOne().sort({ createdAt: -1 }),
      User.find().select('name phone dob weddingDate profilePhoto parishMemberId familyId')
    ]);

    // Calculate Birthdays and Anniversaries accurately in current month
    const currentMonth = now.getMonth();
    
    const upcomingBirthdays = allUsersForSpecialDays.filter(u => {
      if (!u.dob) return false;
      const d = new Date(u.dob);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth;
    }).slice(0, 5);

    const upcomingAnniversaries = allUsersForSpecialDays.filter(u => {
      if (!u.weddingDate) return false;
      const d = new Date(u.weddingDate);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth;
    }).slice(0, 5);

    // Build timeline activities accurately
    const activities = [];

    recentUsers.forEach(u => {
      activities.push({
        id: `user-${u._id}`,
        type: 'member',
        icon: '👤',
        title: 'New Member Registered',
        description: `${u.name} registered as a parish member`,
        time: u.createdAt
      });
    });

    recentBookings.forEach(b => {
      const person = b.personName || b.familyName || b.userId?.name || 'Member';
      activities.push({
        id: `booking-${b._id}`,
        type: 'booking',
        icon: '🛐',
        title: 'Mass Booking Requested',
        description: `Booking for ${b.intentionType || 'Mass'} (${person})`,
        time: b.createdAt
      });
    });

    recentDonations.forEach(d => {
      const donor = d.donorName || d.userId?.name || 'Anonymous';
      activities.push({
        id: `donation-${d._id}`,
        type: 'donation',
        icon: '💰',
        title: 'Donation Received',
        description: `₹${d.amount} donated by ${donor} for ${d.type || 'General'}`,
        time: d.createdAt
      });
    });

    recentTickets.forEach(t => {
      const requester = t.userId?.name || t.name || 'Member';
      activities.push({
        id: `ticket-${t._id}`,
        type: 'ticket',
        icon: '🎫',
        title: 'Support Ticket Raised',
        description: `${t.subject || 'Ticket'} submitted by ${requester}`,
        time: t.createdAt
      });
    });

    recentAnnouncements.forEach(a => {
      activities.push({
        id: `announcement-${a._id}`,
        type: 'announcement',
        icon: '📢',
        title: 'Announcement Published',
        description: a.title,
        time: a.createdAt
      });
    });

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers + totalAdmins,
        registeredMembersOnly: totalUsers,
        totalAdmins,
        newMembersThisMonth,
        todayBookings,
        totalEvents,
        upcomingEventsCount,
        activeAnnouncementsCount,
        pendingBookings,
        pendingDocuments,
        openTickets,
        pendingMessages: pendingPrayers + openTickets,
        donationsToday: donationsTodayAgg[0]?.total || 0,
        donationsThisMonth: donationsMonthAgg[0]?.total || 0,
        donationsThisYear: donationsYearAgg[0]?.total || 0,
        totalDonations: totalDonationsAgg[0]?.total || 0
      },
      recentUsers,
      upcomingEvents,
      upcomingBirthdays,
      upcomingAnniversaries,
      todayVerse,
      recentActivities: activities.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, resetTimeline };
