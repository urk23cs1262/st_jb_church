const { sendMail } = require('../config/mailer');
const { sendSMS, sendWhatsApp } = require('../config/twilio');
const Notification = require('../models/Notification');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

const createNotification = async ({ userId, isBroadcast, title, message, type, category, priority, recipient, actionUrl, relatedId, relatedModel, fileUrl, channels = [] }) => {
  try {
    const notif = await Notification.create({
      userId,
      isBroadcast: isBroadcast || false,
      title,
      message,
      type: type || 'general',
      category: category || type || 'general',
      priority: priority || 'low',
      recipient: recipient || 'user',
      actionUrl,
      relatedId,
      relatedModel,
      fileUrl,
      sentVia: channels
    });

    // ── Email channel ──────────────────────────────────────────────────────
    if (channels.includes('email') && userId) {
      const user = await User.findById(userId);
      if (user?.email) {
        const attachments = [];
        if (fileUrl) {
          const absolutePath = path.join(__dirname, '..', '..', fileUrl);
          if (fs.existsSync(absolutePath)) {
            attachments.push({ filename: path.basename(fileUrl), path: absolutePath });
          }
        }

        sendMail({
          to: user.email,
          subject: `${title} — St. John de Britto's Church`,
          attachments,
          html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f7fb;padding:40px 20px;">
  <div style="max-width:650px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 35px rgba(0,0,0,0.12);border:1px solid #e5e7eb;">
    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#1e3a8a,#7c2d12,#92400e);padding:35px 25px;text-align:center;">
      <div style="width:75px;height:75px;border-radius:50%;overflow:hidden;margin:0 auto 15px;border:3px solid rgba(255,255,255,0.4);">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/St._John_De_Britto.jpg/500px-St._John_De_Britto.jpg" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <h1 style="color:#fbbf24;margin:0;font-size:28px;font-weight:700;">St. John de Britto's Church</h1>
      <p style="color:#ffffff;margin:5px 0 0;font-size:14px;opacity:0.9;">புனித அருளானந்தர் தேவாலயம்</p>
      <div style="width:80px;height:4px;background:#fbbf24;border-radius:999px;margin:15px auto 0;"></div>
    </div>
    <!-- BODY -->
    <div style="padding:40px 35px;color:#374151;line-height:1.8;">
      <h2 style="color:#1e3a8a;margin-top:0;font-size:24px;margin-bottom:20px;">${title}</h2>
      <div style="background:#f9fafb;border-left:5px solid #1e3a8a;padding:22px;border-radius:12px;margin-bottom:30px;">
        <p style="margin:0;font-size:16px;color:#374151;white-space:pre-line;">${message}</p>
      </div>
      ${fileUrl ? `
        <div style="background:#fff7ed;border:1px dashed #d97706;padding:15px;border-radius:10px;text-align:center;margin:20px 0;">
          <p style="margin:0;font-size:14px;color:#92400e;font-weight:bold;">📎 Your document is attached to this email.</p>
        </div>
      ` : ''}
      ${actionUrl ? `
        <div style="text-align:center;margin:25px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}${actionUrl}" style="background:#1e3a8a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">View Details →</a>
        </div>
      ` : ''}
      <!-- BIBLE VERSE -->
      <div style="background:linear-gradient(135deg,#fef3c7,#fff7ed);border:1px solid #fcd34d;padding:25px;border-radius:16px;text-align:center;margin-top:10px;">
        <div style="font-size:36px;color:#d97706;margin-bottom:10px;">✝</div>
        <p style="margin:0;font-size:18px;font-style:italic;color:#92400e;line-height:1.7;">"The Lord is my shepherd; I shall not want."</p>
        <p style="margin-top:10px;color:#b45309;font-weight:700;font-size:13px;">— Psalm 23:1</p>
      </div>
    </div>
    <!-- FOOTER -->
    <div style="background:#111827;padding:28px 20px;text-align:center;color:#d1d5db;font-size:13px;">
      <p style="margin:0 0 8px;">St. John de Britto's Church, Kalayarkoil</p>
      <p style="margin:0 0 15px;">Tamil Nadu - 630551</p>
      <div style="width:100%;height:1px;background:rgba(255,255,255,0.08);margin:18px 0;"></div>
      <p style="margin:0;font-size:12px;color:#9ca3af;">"May the peace of Christ be with you always."</p>
    </div>
  </div>
</div>`,
        }).catch(err => console.error(`❌ Email failed to ${user.email}:`, err.message));
      }
    }

    // ── SMS channel ────────────────────────────────────────────────────────
    if (channels.includes('sms') && userId) {
      const user = await User.findById(userId);
      if (user?.phone) {
        let formattedPhone = user.phone.trim();
        if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
          formattedPhone = `+91${formattedPhone}`;
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = `+${formattedPhone}`;
        }
        sendSMS(formattedPhone, `${title}\n\n${message}`)
          .then(res => console.log(res.success ? `✅ SMS sent to ${formattedPhone}` : `❌ SMS failed: ${res.error}`))
          .catch(err => console.error(`❌ SMS error:`, err.message));
      }
    }

    // ── WhatsApp channel ───────────────────────────────────────────────────
    if (channels.includes('whatsapp') && userId) {
      const user = await User.findById(userId);
      if (user?.phone) {
        let formattedPhone = user.phone.trim();
        if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
          formattedPhone = `+91${formattedPhone}`;
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = `+${formattedPhone}`;
        }
        const fullFileUrl = fileUrl ? `${process.env.BACKEND_URL || 'http://localhost:5000'}${fileUrl}` : null;
        const waMsg = `*${title}*\n\n${message}${actionUrl ? `\n\n🔗 ${process.env.CLIENT_URL || 'http://localhost:5173'}${actionUrl}` : ''}`;
        sendWhatsApp(formattedPhone, waMsg, fullFileUrl)
          .then(res => console.log(res.success ? `✅ WhatsApp sent to ${formattedPhone}` : `❌ WhatsApp failed: ${res.error}`))
          .catch(err => console.error(`❌ WhatsApp error:`, err.message));
      }
    }

    return notif;
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

const notifyAdmins = async ({ title, message, fileUrl }) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const attachments = [];
    if (fileUrl) {
      const absolutePath = path.join(__dirname, '..', '..', fileUrl);
      if (fs.existsSync(absolutePath)) {
        attachments.push({ filename: path.basename(fileUrl), path: absolutePath });
      }
    }

    for (const admin of admins) {
      if (admin.email) {
        await sendMail({
          to: admin.email,
          subject: `🔔 Admin Alert: ${title}`,
          attachments,
          html: `
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <h2 style="color: #1e3a8a; border-bottom: 2px solid #fbbf24; padding-bottom: 10px;">${title}</h2>
  <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
    ${message.replace(/\n/g, '<br>')}
  </div>
  ${fileUrl ? `<p style="font-size: 14px; color: #1e3a8a; font-weight: bold;">📎 The donation receipt is attached to this email.</p>` : ''}
  <p style="font-size: 12px; color: #666;">This is an automated administrative alert from St. John de Britto Church System.</p>
</div>`
        });
      }
      if (admin.phone) {
        const fullFileUrl = fileUrl ? `${process.env.BACKEND_URL || 'http://localhost:5000'}${fileUrl}` : '';
        await sendWhatsApp(admin.phone, `🔔 *${title}*\n\n${message}${fullFileUrl ? `\n\n📄 Receipt: ${fullFileUrl}` : ''}`);
      }
    }
  } catch (err) {
    console.error('Admin notification error:', err.message);
  }
};

module.exports = { createNotification, notifyAdmins };
