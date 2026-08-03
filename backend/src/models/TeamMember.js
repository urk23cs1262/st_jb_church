const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  department: { 
    type: String, 
    enum: ['Leadership', 'Administration', 'Ministries', 'Choir Team', 'St. Vincent de Paul Sabai', 'Parish Council', 'Volunteers'],
    default: 'Leadership'
  },
  badge: { type: String, trim: true },
  description: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  image: { type: String, default: '' },
  socialLinks: {
    facebook: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' }
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
