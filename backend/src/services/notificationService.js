const { sendMail } = require('../config/mailer');
const { sendSMS, sendWhatsApp } = require('../config/twilio');
const Notification = require('../models/Notification');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

const createNotification = async ({ userId, isBroadcast, title, message, type, relatedId, relatedModel, fileUrl, channels = [] }) => {
  try {
    const notif = await Notification.create({ userId, isBroadcast, title, message, type, relatedId, relatedModel, fileUrl, sentVia: channels });

    if (channels.includes('email') && userId) {
      const user = await User.findById(userId);
      if (user?.email) {
        const attachments = [];
        if (fileUrl) {
          // Resolve file path (fileUrl is like /uploads/documents/filename.pdf)
          const absolutePath = path.join(__dirname, '..', '..', fileUrl);
          if (fs.existsSync(absolutePath)) {
            attachments.push({
              filename: path.basename(fileUrl),
              path: absolutePath
            });
          }
        }

        await sendMail({
          to: user.email,
          subject: `${title} — St. John de Britto's Church`,
          attachments,
          html: `
<div style="
  font-family: 'Segoe UI', Arial, sans-serif;
  background:#f5f7fb;
  padding:40px 20px;
">

  <div style="
    max-width:650px;
    margin:0 auto;
    background:#ffffff;
    border-radius:20px;
    overflow:hidden;
    box-shadow:0 10px 35px rgba(0,0,0,0.12);
    border:1px solid #e5e7eb;
  ">

    <!-- HEADER -->
    <div style="
      background:linear-gradient(135deg,#1e3a8a,#7c2d12,#92400e);
      padding:35px 25px;
      text-align:center;
      position:relative;
    ">

      <div style="
        width:75px;
        height:75px;
        border-radius:50%;
        overflow:hidden;
        margin:0 auto 15px;
        border:3px solid rgba(255,255,255,0.4);
      ">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/St._John_De_Britto.jpg/500px-St._John_De_Britto.jpg"
          style='width:100%;height:100%;object-fit:cover;'
        />
      </div>

      <h1 style="
        color:#fbbf24;
        margin:0;
        font-size:30px;
        font-weight:700;
        letter-spacing:0.5px;
      ">
        St. John de Britto's Church
      </h1>

      <p style="
        color:#ffffff;
        margin:5px 0 0;
        font-size:15px;
        opacity:0.9;
      ">
        புனித அருளானந்தர் தேவாலயம்
      </p>

      <div style="
        width:80px;
        height:4px;
        background:#fbbf24;
        border-radius:999px;
        margin:15px auto 0;
      "></div>
    </div>

    <!-- BODY -->
    <div style="
      padding:40px 35px;
      color:#374151;
      line-height:1.8;
    ">

      <h2 style="
        color:#1e3a8a;
        margin-top:0;
        font-size:28px;
        margin-bottom:20px;
      ">
        ${title}
      </h2>

      <div style="
        background:#f9fafb;
        border-left:5px solid #1e3a8a;
        padding:22px;
        border-radius:12px;
        margin-bottom:30px;
      ">
        <p style="
          margin:0;
          font-size:16px;
          color:#374151;
        ">
          ${message}
        </p>
      </div>

      ${fileUrl ? `
        <div style="background:#fff7ed; border:1px dashed #d97706; padding:15px; border-radius:10px; text-align:center; margin:20px 0;">
          <p style="margin:0; font-size:14px; color:#92400e; font-weight:bold;">
            📎 Your document is attached to this email.
          </p>
        </div>
      ` : ''}

      <!-- BIBLE VERSE -->
      <div style="
        background:linear-gradient(135deg,#fef3c7,#fff7ed);
        border:1px solid #fcd34d;
        padding:25px;
        border-radius:16px;
        text-align:center;
        margin-top:10px;
      ">

        <div style="
          font-size:40px;
          color:#d97706;
          line-height:1;
          margin-bottom:12px;
        ">
          ✝
        </div>

        <p style="
          margin:0;
          font-size:20px;
          font-style:italic;
          color:#92400e;
          line-height:1.7;
          font-weight:500;
        ">
          "The Lord is my shepherd; I shall not want."
        </p>

        <p style="
          margin-top:12px;
          color:#b45309;
          font-weight:700;
          letter-spacing:1px;
          font-size:14px;
        ">
          — Psalm 23:1
        </p>

      </div>

      

    </div>

    <!-- FOOTER -->
      <div style="
      background:#111827;
      padding:28px 20px;
      text-align:center;
      color:#d1d5db;
      font-size:13px;
    ">

      <p style="margin:0 0 8px;">
        St. John de Britto's Church, Kalayarkoil
      </p>

      <p style="margin:0 0 15px;">
        Tamil Nadu - 630551
      </p>

      <div style="
        width:100%;
        height:1px;
        background:rgba(255,255,255,0.08);
        margin:18px 0;
      "></div>

      <p style="
        margin:0;
        font-size:12px;
        color:#9ca3af;
      ">
        “May the peace of Christ be with you always.”
      </p>

    </div>

  </div>

</div>
`,
        });
      }
    }

    if (channels.includes('sms') && userId) {
      const user = await User.findById(userId);
      if (user?.phone) {
        // Format phone number (ensure +91 for India if only 10 digits)
        let formattedPhone = user.phone.trim();
        if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
          formattedPhone = `+91${formattedPhone}`;
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = `+${formattedPhone}`;
        }

        const msgBody = message; // Send ONLY the message body, without the title header for SMS

        if (channels.includes('whatsapp')) {
          const fullFileUrl = fileUrl ? `${process.env.BACKEND_URL || 'http://localhost:5000'}${fileUrl}` : null;
          await sendWhatsApp(formattedPhone, msgBody, fullFileUrl)
            .then(res => console.log(res.success ? `✅ WhatsApp sent to ${formattedPhone}` : `❌ WhatsApp failed: ${res.error}`));
        } else {
          await sendSMS(formattedPhone, msgBody)
            .then(res => console.log(res.success ? `✅ SMS sent to ${formattedPhone} (SID: ${res.sid})` : `❌ SMS failed: ${res.error}`));
        }
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
