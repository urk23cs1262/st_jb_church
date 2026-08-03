const mongoose = require('mongoose');
const { autoAssignMemberIds } = require('../services/memberIdService');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sjdb_church');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    // Auto-assign member IDs for any existing users missing them
    autoAssignMemberIds().catch(console.error);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
