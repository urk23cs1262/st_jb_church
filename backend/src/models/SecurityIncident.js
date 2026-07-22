const mongoose = require('mongoose');

const securityIncidentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userEmail: { type: String },
  userPhone: { type: String },

  // Incident Classification
  type: {
    type: String,
    enum: ['unauthorized_login_reported', 'suspicious_activity', 'multiple_failed_logins'],
    default: 'unauthorized_login_reported'
  },
  status: {
    type: String,
    enum: ['Awaiting Review', 'Investigating', 'Resolved', 'Dismissed'],
    default: 'Awaiting Review'
  },

  // Login session snapshot
  loginTime: { type: Date, default: Date.now },
  device: { type: String },
  os: { type: String },
  ipAddress: { type: String },
  location: { type: String },
  loginMethod: { type: String, default: 'Password' },

  // Security actions taken
  actionsTaken: [{ type: String }],
  reportToken: { type: String },
  reportedAt: { type: Date, default: Date.now },
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SecurityIncident', securityIncidentSchema);
