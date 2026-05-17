const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isBroadcast: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['booking', 'document', 'event', 'announcement', 'ticket', 'donation', 'general'], default: 'general' },
  isRead: { type: Boolean, default: false },
  sentVia: [{ type: String, enum: ['email', 'sms', 'whatsapp', 'push'] }],
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String },
  fileUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
