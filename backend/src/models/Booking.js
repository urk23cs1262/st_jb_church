const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  massDate: { type: Date, required: true },
  massTime: { type: String },
  intentionType: {
    type: String,
    enum: ['birthday', 'death_anniversary', 'thanksgiving', 'healing', 'special', 'wedding_anniversary', 'other'],
    required: true,
  },
  intentionDetails: { type: String },
  familyName: { type: String },
  familyDetails: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  adminNote: { type: String },
  offertory: { type: Number, default: 0 },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
