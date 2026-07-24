require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

const clearAnnouncements = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sjdb_church');
    console.log('✅ Connected to MongoDB');

    const res1 = await Announcement.deleteMany({});
    console.log(`🗑️ Deleted ${res1.deletedCount} announcements from Announcement collection.`);

    const res2 = await Notification.deleteMany({
      isBroadcast: true,
      $or: [{ category: 'announcements' }, { type: 'announcement' }]
    });
    console.log(`🗑️ Deleted ${res2.deletedCount} broadcast notifications related to announcements.`);

    console.log('✨ All announcements cleared successfully! Starting fresh.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing announcements:', err);
    process.exit(1);
  }
};

clearAnnouncements();
