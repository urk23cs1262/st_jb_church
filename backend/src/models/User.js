const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  familyName: { type: String, trim: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  address: { type: String },
  subStation: { type: String, trim: true },
  familyRole: { type: String, trim: true },
  familyMembers: [{
    name: { type: String, trim: true },
    role: { type: String, trim: true }
  }],
  parishMemberId: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  profilePhoto: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  preferredLanguage: { type: String, enum: ['en', 'ta', 'both'], default: 'en' },
  // WhatsApp Bot preferences — defaults to opted-in for website registrants
  whatsappOptIn: { type: Boolean, default: true },
  botPreferences: {
    type: [{
      type: String,
      enum: ['verse', 'saint', 'mass', 'events', 'announcements', 'birthday']
    }],
    default: ['verse', 'saint', 'mass', 'events', 'announcements', 'birthday']
  },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
