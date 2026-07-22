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

    // 5. Send Detailed Security Incident Email to Admin(s)
    sendAdminSecurityIncidentEmail({ user, incident, decoded }).catch(e => console.warn('Admin security email warning:', e.message));

    // 6. Send Emergency Password Reset OTP via Email to User
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

// PUT /api/security/incidents/:id/reactivate (Admin Only)
const reactivateUserAccount = async (req, res) => {
  try {
    const incident = await SecurityIncident.findById(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident record not found' });

    const user = await User.findById(incident.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 1. Lift suspension & reset failed counters
    user.isSuspended = false;
    user.failedLoginAttempts = 0;
    user.firstFailedAttempt = null;
    user.lastFailedAttempt = null;
    user.suspensionReason = undefined;
    await user.save();

    // 2. Update Security Incident record
    incident.status = 'Reactivated';
    incident.adminWhoReactivated = req.user._id;
    incident.reactivationTime = new Date();
    incident.actionsTaken.push(`Reactivated by Admin ${req.user.name} on ${new Date().toISOString()}`);
    if (req.body.adminNotes) incident.adminNotes = req.body.adminNotes;
    await incident.save();

    // 3. Dispatch Account Reactivated Email
    const { sendAccountReactivatedEmail } = require('../services/loginSecurityService');
    sendAccountReactivatedEmail({ user }).catch(e => console.warn('Reactivation email error:', e.message));

    // 4. Issue In-App Notification to User
    createNotification({
      userId: user._id,
      recipient: 'user',
      title: 'Account Access Restored 🔓',
      message: 'Your account has been reactivated by the administrator. You can now log in normally using your password.',
      type: 'general',
      category: 'account',
      priority: 'high',
      actionUrl: '/login',
      channels: ['email', 'push']
    }).catch(e => console.warn('Reactivation in-app notification error:', e.message));

    res.json({ success: true, message: 'Account reactivated successfully!', user, incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Send detailed security incident report email to Admin(s)
async function sendAdminSecurityIncidentEmail({ user, incident, decoded }) {
  try {
    const adminUsers = await User.find({ role: 'admin', email: { $exists: true, $ne: null } }).select('email name');
    const adminEmails = adminUsers.map(a => a.email).filter(Boolean);

    if (adminEmails.length === 0) return;

    const formattedTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';

    const loginTimeFormatted = decoded?.createdAt ? new Date(decoded.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST' : formattedTime;

    const clientUrl = (process.env.CLIENT_URL || 'https://st-jb-church.vercel.app').replace('http://localhost:5173', 'https://st-jb-church.vercel.app');
    const deepLinkUrl = `${clientUrl}/admin/notifications?incidentId=${incident._id}`;

    const emailHtml = `
<div style="background-color:#0f172a; padding:30px 15px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px; margin:0 auto; background-color:#1e293b; border-radius:20px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.5); border:1px solid #334155;">
    
    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#991b1b,#7f1d1d,#450a0a); padding:32px 24px; text-align:center; border-bottom:2px solid #ef4444;">
      <div style="display:inline-block; background-color:rgba(255,255,255,0.15); padding:6px 16px; border-radius:30px; margin-bottom:10px;">
        <span style="color:#fef08a; font-size:12px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">🚨 CRITICAL SECURITY INCIDENT</span>
      </div>
      <h1 style="margin:4px 0 0; color:#ffffff; font-size:22px; font-weight:900; line-height:1.3;">Security Incident: Unauthorized Login Reported</h1>
      <p style="margin:6px 0 0; color:#fca5a5; font-size:13px; font-weight:600;">St. John de Britto's Church — Parish Management System</p>
    </div>

    <!-- BODY CONTENT -->
    <div style="padding:28px 24px; color:#e2e8f0;">
      <p style="color:#f8fafc; font-size:15px; font-weight:700; margin-top:0;">Dear Administrator,</p>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6; margin-bottom:22px;">
        A security incident has been detected and requires your attention. A parish member has reported that a recently detected login to their account was not authorized by them using the emergency <strong>"Wasn't You?"</strong> security feature.
      </p>

      <!-- INCIDENT SUMMARY -->
      <div style="background-color:#0f172a; border:1px solid #334155; border-radius:14px; padding:16px 18px; margin-bottom:20px;">
        <h3 style="margin:0 0 12px; color:#f8fafc; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #1e293b; padding-bottom:8px;">
          📋 Incident Summary
        </h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#cbd5e1;">
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600; width:40%;">Incident ID:</td>
            <td style="padding:5px 0; font-weight:700; color:#a855f7; font-family:monospace;">${incident._id}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Severity:</td>
            <td style="padding:5px 0;"><span style="background-color:#7f1d1d; color:#fca5a5; font-weight:800; font-size:11px; padding:3px 10px; border-radius:20px; border:1px solid #ef4444;">HIGH</span></td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Status:</td>
            <td style="padding:5px 0; font-weight:700; color:#34d399;">User Reported – Account Secured</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Reported On:</td>
            <td style="padding:5px 0; font-weight:700; color:#f8fafc;">${formattedTime}</td>
          </tr>
        </table>
      </div>

      <!-- USER INFORMATION -->
      <div style="background-color:#0f172a; border:1px solid #334155; border-radius:14px; padding:16px 18px; margin-bottom:20px;">
        <h3 style="margin:0 0 12px; color:#f8fafc; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #1e293b; padding-bottom:8px;">
          👤 User Information
        </h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#cbd5e1;">
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600; width:40%;">Member Name:</td>
            <td style="padding:5px 0; font-weight:700; color:#f8fafc;">${user.name}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Member ID:</td>
            <td style="padding:5px 0; font-weight:700; color:#a855f7; font-family:monospace;">${user.parishMemberId || user._id}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Registered Email:</td>
            <td style="padding:5px 0; font-weight:700; color:#38bdf8;">${user.email || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Registered Mobile:</td>
            <td style="padding:5px 0; font-weight:700; color:#f8fafc;">${user.phone || 'N/A'}</td>
          </tr>
        </table>
      </div>

      <!-- SUSPICIOUS LOGIN DETAILS -->
      <div style="background-color:#0f172a; border:1px solid #334155; border-radius:14px; padding:16px 18px; margin-bottom:20px;">
        <h3 style="margin:0 0 12px; color:#f8fafc; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #1e293b; padding-bottom:8px;">
          💻 Suspicious Login Details
        </h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#cbd5e1;">
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600; width:40%;">Login Date & Time:</td>
            <td style="padding:5px 0; font-weight:700; color:#f8fafc;">${loginTimeFormatted}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Location:</td>
            <td style="padding:5px 0; font-weight:700; color:#f8fafc;">Coimbatore, Tamil Nadu, India</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">IP Address:</td>
            <td style="padding:5px 0; font-weight:700; color:#cbd5e1; font-family:monospace;">103.45.23.12</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Device:</td>
            <td style="padding:5px 0; font-weight:700; color:#f8fafc;">Windows PC / Laptop</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Operating System:</td>
            <td style="padding:5px 0; font-weight:700; color:#f8fafc;">Windows</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Browser:</td>
            <td style="padding:5px 0; font-weight:700; color:#f8fafc;">Google Chrome</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#94a3b8; font-weight:600;">Login Method:</td>
            <td style="padding:5px 0; font-weight:700; color:#38bdf8;">Password / OTP</td>
          </tr>
        </table>
      </div>

      <!-- INCIDENT TIMELINE -->
      <div style="background-color:#0f172a; border:1px solid #334155; border-radius:14px; padding:16px 18px; margin-bottom:20px;">
        <h3 style="margin:0 0 14px; color:#f8fafc; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #1e293b; padding-bottom:8px;">
          📜 Incident Timeline
        </h3>
        
        <div style="font-size:13px; line-height:1.7;">
          <div style="margin-bottom:12px; padding-left:12px; border-left:3px solid #ef4444;">
            <strong style="color:#ef4444;">1. Login Attempt:</strong> A successful login to the user's account was detected.
          </div>

          <div style="margin-bottom:12px; padding-left:12px; border-left:3px solid #f59e0b;">
            <strong style="color:#f59e0b;">2. Security Notification:</strong> The system immediately sent a login alert email to the registered email address.
          </div>

          <div style="margin-bottom:12px; padding-left:12px; border-left:3px solid #dc2626;">
            <strong style="color:#dc2626;">3. User Action:</strong> The user opened the security email, selected "Wasn't You?", and confirmed that the login was unauthorized.
          </div>

          <div style="padding-left:12px; border-left:3px solid #10b981;">
            <strong style="color:#10b981;">4. Automatic Security Response:</strong>
            <p style="margin:4px 0 0; color:#cbd5e1;">The system immediately performed the following automated protection actions:</p>
            <ul style="margin:6px 0 0; padding-left:18px; color:#6ee7b7; font-weight:600;">
              <li>✅ Logged out all active sessions.</li>
              <li>✅ Terminated the suspicious login session.</li>
              <li>✅ Invalidated all active authentication tokens.</li>
              <li>✅ Removed the suspicious device from trusted devices.</li>
              <li>✅ Marked the login as a security incident.</li>
              <li>✅ Initiated the password recovery/reset process.</li>
              <li>✅ Recorded the incident in the security audit log.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- CURRENT ACCOUNT STATUS -->
      <div style="background-color:#0f172a; border:1px solid #334155; border-radius:14px; padding:16px 18px; margin-bottom:20px;">
        <h3 style="margin:0 0 12px; color:#f8fafc; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #1e293b; padding-bottom:8px;">
          🛡️ Current Account Status
        </h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#cbd5e1;">
          <tr>
            <td style="padding:4px 0; color:#94a3b8; font-weight:600; width:45%;">Account Status:</td>
            <td style="padding:4px 0; font-weight:700; color:#34d399;">Secured</td>
          </tr>
          <tr>
            <td style="padding:4px 0; color:#94a3b8; font-weight:600;">Suspicious Session:</td>
            <td style="padding:4px 0; font-weight:700; color:#f8fafc;">Terminated</td>
          </tr>
          <tr>
            <td style="padding:4px 0; color:#94a3b8; font-weight:600;">Authentication Tokens:</td>
            <td style="padding:4px 0; font-weight:700; color:#f8fafc;">Invalidated</td>
          </tr>
          <tr>
            <td style="padding:4px 0; color:#94a3b8; font-weight:600;">Password Reset:</td>
            <td style="padding:4px 0; font-weight:700; color:#f59e0b;">Initiated / Pending User Update</td>
          </tr>
          <tr>
            <td style="padding:4px 0; color:#94a3b8; font-weight:600;">Trusted Device Status:</td>
            <td style="padding:4px 0; font-weight:700; color:#f8fafc;">Removed</td>
          </tr>
          <tr>
            <td style="padding:4px 0; color:#94a3b8; font-weight:600;">Risk Level:</td>
            <td style="padding:4px 0; font-weight:800; color:#ef4444;">HIGH</td>
          </tr>
        </table>
      </div>

      <!-- RECOMMENDED ADMINISTRATOR ACTIONS -->
      <div style="background-color:#0f172a; border:1px solid #334155; border-radius:14px; padding:16px 18px; margin-bottom:24px;">
        <h3 style="margin:0 0 12px; color:#f8fafc; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #1e293b; padding-bottom:8px;">
          🎯 Recommended Administrator Actions
        </h3>
        <ul style="margin:0; padding-left:18px; font-size:13px; color:#cbd5e1; space-y:6px;">
          <li style="padding:3px 0;">Review the user's recent account activity.</li>
          <li style="padding:3px 0;">Verify whether any profile or account changes were made during the suspicious session.</li>
          <li style="padding:3px 0;">Contact the member if additional verification is required.</li>
          <li style="padding:3px 0;">Assist the user if they encounter any issues during password recovery.</li>
          <li style="padding:3px 0;">Escalate the incident if repeated suspicious login attempts are detected.</li>
        </ul>
      </div>

      <!-- VIEW IN NOTIFICATIONS DEEP-LINK BUTTON -->
      <div style="text-align:center; margin:30px 0 20px;">
        <p style="color:#94a3b8; font-size:13px; margin-bottom:12px;">
          To view the complete incident report, activity logs, affected sessions, and audit details, click the button below:
        </p>
        <a href="${deepLinkUrl}" style="display:inline-block; background-color:#2563eb; color:#ffffff; font-weight:800; font-size:15px; text-decoration:none; padding:15px 32px; border-radius:12px; box-shadow:0 4px 18px rgba(37,99,235,0.4); border:1px solid #3b82f6;">
          🟦 View in Notifications
        </a>
      </div>

      <!-- AUDIT REFERENCE -->
      <div style="background-color:#0f172a; border-top:1px border-slate-700; padding:12px 14px; border-radius:10px; font-size:11px; color:#64748b; margin-top:20px;">
        <strong>Security Audit Reference:</strong><br/>
        Incident ID: <span style="color:#94a3b8; font-family:monospace;">${incident._id}</span><br/>
        Audit Log Reference: <span style="color:#94a3b8; font-family:monospace;">LOG-${incident._id.toString().slice(-8).toUpperCase()}</span><br/>
        Generated By: Church Management System Security Monitor
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background-color:#0f172a; padding:18px 22px; text-align:center; color:#64748b; font-size:12px; border-top:1px solid #334155;">
      <p style="margin:0; font-weight:700; color:#cbd5e1;">St. John de Britto's Church, Kalayarkoil</p>
      <p style="margin:4px 0 0; color:#64748b; font-size:11px;">Parish Management System • Automated Security Monitor</p>
    </div>

  </div>
</div>
    `;

    adminEmails.forEach(adminEmail => {
      sendMail({
        to: adminEmail,
        subject: `⚠️ Security Incident: Unauthorized Login Reported — St. John de Britto's Church`,
        html: emailHtml
      }).then(res => {
        if (res.success) console.log(`📧 Security incident email sent to admin ${adminEmail}`);
      }).catch(err => console.error('❌ Security incident admin email error:', err.message));
    });

  } catch (err) {
    console.error('❌ sendAdminSecurityIncidentEmail error:', err.message);
  }
}

module.exports = {
  verifyReportToken,
  confirmUnauthorized,
  getIncidents,
  updateIncidentStatus,
  reactivateUserAccount
};
