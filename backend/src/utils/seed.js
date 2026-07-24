require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Priest = require('../models/Priest');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sjdb_church');
  console.log('✅ Connected to MongoDB');

  // Create admin user
  const adminHash = await bcrypt.hash('admin@123', 12);
  await User.findOneAndUpdate({ phone: '9999999999' }, {
    name: 'Parish Admin', phone: '9999999999', email: 'admin@sjdb.in',
    passwordHash: adminHash, role: 'admin', isVerified: true
  }, { upsert: true });
  console.log('✅ Admin created — Phone: 9999999999, Password: admin@123');

  // Create test user
  const userHash = await bcrypt.hash('user@123', 12);
  await User.findOneAndUpdate({ phone: '8888888888' }, {
    name: 'John Xavier', phone: '8888888888', email: 'john@example.com',
    passwordHash: userHash, role: 'user', isVerified: true
  }, { upsert: true });
  console.log('✅ Test user created — Phone: 8888888888, Password: user@123');

  // Create priests
  await Priest.deleteMany({});
  await Priest.insertMany([
    { name: 'Rev. Fr. A. Arockiaraj', designation: 'Parish Priest', isCurrent: true, order: 1, bio: 'Currently serving as Parish Priest', phone: '+91 98765 00001', email: 'priest@sjdb.in' },
    { name: 'Rev. Fr. S. Raj Kumar', designation: 'Assistant Priest', isCurrent: true, order: 2, bio: 'Assisting in pastoral ministry', phone: '+91 98765 00002' },
    { name: 'Rev. Fr. M. Xavier', designation: 'Former Parish Priest', isCurrent: false, order: 3, startDate: '2010-01-01', endDate: '2018-12-31', bio: 'Served with great devotion for 8 years.' },
    { name: 'Rev. Fr. P. Antony', designation: 'Former Parish Priest', isCurrent: false, order: 4, startDate: '2002-01-01', endDate: '2009-12-31', bio: 'Led the parish through significant growth.' },
  ]);
  console.log('✅ Priests seeded');

  // Create sample events
  await Event.deleteMany({});
  const now = new Date();
  await Event.insertMany([
    { title: 'Feast of St. John de Britto', description: 'Annual patron saint feast celebration', date: new Date(now.getFullYear(), 1, 4), time: '8:00 AM', venue: 'Church Premises', category: 'feast', isFeatured: true, isPublished: true },
    { title: 'Youth Ministry Meeting', description: 'Monthly youth group meeting and prayer', date: new Date(now.setDate(now.getDate() + 7)), time: '5:00 PM', venue: 'Community Hall', category: 'youth', isPublished: true },
    { title: 'Sunday Holy Mass', description: 'Regular Sunday parish mass', date: new Date(), time: '10:00 AM', venue: 'Main Church', category: 'mass', isPublished: true },
  ]);
  console.log('✅ Events seeded');

  // Create sample announcements
  await Announcement.deleteMany({});
  console.log('✅ Announcements cleared');

  console.log('\n🎉 Database seeded successfully!\n');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
