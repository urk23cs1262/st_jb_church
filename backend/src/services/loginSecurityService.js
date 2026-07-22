const jwt = require('jsonwebtoken');
const { sendMail } = require('../config/mailer');

// Parse User-Agent string into friendly Device, OS, and Browser names
function parseUserAgent(ua = '') {
  let os = 'Unknown OS';
  let device = 'Desktop Device';
  let browser = 'Web Browser';

  if (/windows/i.test(ua)) {
    os = 'Windows';
    device = 'Windows PC / Laptop';
  } else if (/macintosh|mac os/i.test(ua)) {
    os = 'macOS';
    device = 'Mac Workstation';
  } else if (/iphone/i.test(ua)) {
    os = 'iOS';
    device = 'iPhone';
  } else if (/ipad/i.test(ua)) {
    os = 'iPadOS';
    device = 'iPad Tablet';
  } else if (/android/i.test(ua)) {
    os = 'Android';
    device = 'Android Smartphone';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
    device = 'Linux Workstation';
  }

  if (/edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/opera|opr/i.test(ua)) {
    browser = 'Opera';
  }

  return { os, device: `${device} (${browser})`, browser };
}

// Format client IP and Location
function parseClientIpAndLocation(req) {
  let ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1').split(',')[0].trim();

  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1')) {
    ip = '127.0.0.1';
    return { ip, location: 'Local Network (Dev)' };
  }

  // Generic clean location fallback
  return { ip, location: 'Coimbatore, Tamil Nadu, India' };
}

// Generate a signed, 24-hour report token for security verification
function generateSecurityReportToken(userId) {
  return jwt.sign(
    { userId, purpose: 'report_unauthorized', createdAt: Date.now() },
    process.env.JWT_SECRET || 'sjdb_secret_key_2024',
    { expiresIn: '24h' }
  );
}

// Asynchronously send successful login alert email
async function sendLoginAlertEmail({ user, req, loginMethod = 'Password' }) {
  if (!user || !user.email) return;

  try {
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    const ipInfo = parseClientIpAndLocation(req);
    const securityToken = generateSecurityReportToken(user._id);

    const clientUrl = (process.env.CLIENT_URL || 'https://st-jb-church.vercel.app').replace('http://localhost:5173', 'https://st-jb-church.vercel.app');
    const reportUrl = `${clientUrl}/security/report-unauthorized?token=${securityToken}&userId=${user._id}`;

    const formattedTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';

    const emailHtml = `
<div style="background-color:#f1f5f9; padding:20px 10px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a8a,#1e1b4b,#7c2d12); padding:28px 22px; text-align:center;">
      <div style="display:inline-block; background-color:rgba(255,255,255,0.15); padding:8px 16px; border-radius:30px; margin-bottom:8px;">
        <span style="color:#fbbf24; font-size:12px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">🚨 SECURITY ALERT</span>
      </div>
      <h1 style="margin:4px 0 0; color:#ffffff; font-size:22px; font-weight:800; line-height:1.3;">New Login Detected</h1>
      <p style="margin:4px 0 0; color:#e2e8f0; opacity:0.9; font-size:13px;">St. John de Britto's Church</p>
    </div>

    <!-- Body Content -->
    <div style="padding:26px 22px;">
      <p style="color:#1e293b; font-size:15px; font-weight:700; margin-top:0;">Dear ${user.name},</p>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin-bottom:20px;">
        A new successful login to your Parish Account was detected.
      </p>

      <!-- Details Box -->
      <div style="background-color:#f8fafc; border:1px solid #cbd5e1; border-radius:14px; padding:16px 18px; margin-bottom:24px;">
        <h3 style="margin:0 0 12px; color:#1e3a8a; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; border-b:1px solid #e2e8f0; padding-bottom:8px;">
          Login Details
        </h3>
        
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#334155;">
          <tr>
            <td style="padding:6px 0; color:#64748b; font-weight:600; width:40%;">Date & Time:</td>
            <td style="padding:6px 0; font-weight:700; color:#0f172a;">${formattedTime}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#64748b; font-weight:600;">Device / Browser:</td>
            <td style="padding:6px 0; font-weight:700; color:#0f172a;">${uaInfo.device}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#64748b; font-weight:600;">Operating System:</td>
            <td style="padding:6px 0; font-weight:700; color:#0f172a;">${uaInfo.os}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#64748b; font-weight:600;">IP Address:</td>
            <td style="padding:6px 0; font-weight:700; color:#0f172a; font-family:monospace;">${ipInfo.ip}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#64748b; font-weight:600;">Approx. Location:</td>
            <td style="padding:6px 0; font-weight:700; color:#0f172a;">${ipInfo.location}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#64748b; font-weight:600;">Login Method:</td>
            <td style="padding:6px 0; font-weight:700; color:#1e3a8a;">${loginMethod}</td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align:center; margin-bottom:26px;">
        <p style="color:#64748b; font-size:12px; margin-bottom:12px; font-style:italic;">
          If this login was performed by you, no action is required.
        </p>
        <a href="${reportUrl}" style="display:inline-block; background-color:#dc2626; color:#ffffff; font-weight:800; font-size:14px; text-decoration:none; padding:14px 28px; border-radius:12px; box-shadow:0 4px 14px rgba(220,38,38,0.3); border:1px solid #b91c1c;">
          🚨 Wasn't You? Click Here
        </a>
      </div>

      <div style="background-color:#fffbe6; border-left:4px solid #d97706; padding:12px 14px; border-radius:8px; margin-bottom:20px; font-size:12px; color:#92400e; line-height:1.5;">
        <strong>If you do not recognize this login, we recommend that you:</strong>
        <ul style="margin:6px 0 0; padding-left:18px;">
          <li>Click the <strong>"Wasn't You?"</strong> button above to secure your account immediately.</li>
          <li>Change your password immediately.</li>
          <li>Review your recent account activity.</li>
        </ul>
      </div>

      <p style="color:#64748b; font-size:12px; line-height:1.5; margin-bottom:0;">
        Keeping your account secure is important to us.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color:#0f172a; padding:18px 22px; text-align:center; color:#94a3b8; font-size:12px;">
      <p style="margin:0; font-weight:700; color:#f8fafc;">St. John de Britto's Church, Kalayarkoil</p>
      <p style="margin:4px 0 0; color:#64748b; font-size:11px;">Parish Management System • <a href="${clientUrl}" style="color:#fbbf24; text-decoration:none;">Website</a></p>
    </div>

  </div>
</div>
    `;

    sendMail({
      to: user.email,
      subject: `🚨 Security Alert: New Login Detected — St. John de Britto's Church`,
      html: emailHtml
    }).then(res => {
      if (res.success) console.log(`📧 Login alert email sent to ${user.email}`);
      else console.warn(`⚠️ Login alert email skipped/failed for ${user.email}: ${res.error}`);
    }).catch(err => console.error('❌ Login alert email error:', err.message));

  } catch (err) {
    console.error('❌ sendLoginAlertEmail error:', err.message);
  }
}

module.exports = {
  parseUserAgent,
  parseClientIpAndLocation,
  generateSecurityReportToken,
  sendLoginAlertEmail
};
