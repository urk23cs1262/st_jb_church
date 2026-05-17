const mongoose = require('mongoose');

const prayerRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String },
  intention: { type: String, required: true },
  isPublic: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  prayerCount: { type: Number, default: 0 },
  language: { type: String, enum: ['en', 'ta'], default: 'en' },
  // New fields from modern form
  prayerLocation: { type: String, enum: ['personal', 'church'], default: 'personal' },
  churchLocation: { type: String },
  type: { type: String },
  preferredDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PrayerRequest', prayerRequestSchema);
