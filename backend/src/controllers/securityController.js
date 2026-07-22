const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SecurityIncident = require('../models/SecurityIncident');
const { createNotification } = require('../services/notificationService');
const { sendMail } = require('../config/mailer');

// GET /api/security/verify-token?token=...
const verifyReportToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Security token is required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sjdb_secret_key_2024');
    const user = await User.findById(decoded.userId).select('name email phone role');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token
    });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid or expired security link' });
  }
};

// POST /api/security/confirm-unauthorized
const confirmUnauthorized = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sjdb_secret_key_2024');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Step 3: Secure the Account
    // 1. Invalidate all active sessions across all devices
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    // 2. Generate emergency password reset OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = resetOtp;
    user.otpExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    await user.save();

    // 3. Create Security Incident Record in Database
    const incident = await SecurityIncident.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      type: 'unauthorized_login_reported',
      status: 'Awaiting Review',
      loginTime: decoded.createdAt ? new Date(decoded.createdAt) : new Date(),
      actionsTaken: [
        'Invalidated all active sessions across all devices',
        'Blocked suspicious token session',
        'Initiated forced password reset OTP',
        'Notified Parish Administrator'
      ],
      reportToken: token,
      reportedAt: new Date()
    });

    // 4. Notify Admin In-App
    createNotification({
      recipient: 'admin',
      title: '⚠️ Security Incident: Unauthorized Login Reported',
      message: `User ${user.name} (${user.email || user.phone}) reported an unauthorized login to their account. Active sessions logged out & password reset triggered.`,
      type: 'system',
      category: 'system',
      priority: 'high',
      actionUrl: '/admin/notifications',
      relatedId: incident._id,
      relatedModel: 'SecurityIncident'
    }).catch(e => console.warn('Security incident admin notification warning:', e.message));

    // 5. Send Emergency Password Reset OTP via Email
    if (user.email) {
      sendMail({
        to: user.email,
        subject: `🔑 Emergency Security Password Reset — St. John de Britto's Church`,
        html: `
          <div style="font-family:Arial,sans-serif; padding:20px; color:#1e293b;">
            <h2 style="color:#b91c1c;">Emergency Account Security Notice</h2>
            <p>Dear ${user.name},</p>
            <p>We received your report of an unauthorized login to your Parish Account. Your account has been immediately secured:</p>
            <ul>
              <li>All active sessions on all devices have been terminated.</li>
              <li>Your previous login tokens are now invalid.</li>
            </ul>
            <p><strong>Your Verification OTP for Password Reset is:</strong></p>
            <div style="background-color:#f1f5f9; font-size:28px; font-weight:bold; letter-spacing:6px; color:#1e3a8a; padding:12px 24px; display:inline-block; border-radius:10px; border:2px dashed #1e3a8a; margin:14px 0;">
              ${resetOtp}
            </div>
            <p style="font-size:12px; color:#64748b;">This OTP expires in 30 minutes.</p>
            <p>Please use this OTP on our website to set a new password and regain access to your account.</p>
            <p>Thank you,<br/>St. John de Britto's Church Security Team</p>
          </div>
        `
      }).catch(e => console.warn('Security reset email warning:', e.message));
    }

    res.json({
      success: true,
      message: 'Account secured successfully! All sessions logged out.',
      resetOtp: process.env.NODE_ENV !== 'production' ? resetOtp : undefined,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/security/incidents (Admin Only)
const getIncidents = async (req, res) => {
  try {
    const incidents = await SecurityIncident.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');
    res.json({ success: true, incidents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/security/incidents/:id (Admin Only)
const updateIncidentStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const incident = await SecurityIncident.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );
    res.json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  verifyReportToken,
  confirmUnauthorized,
  getIncidents,
  updateIncidentStatus
};
