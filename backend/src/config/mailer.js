const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {

    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((err) => {
    if (err) {
      console.error('❌ SMTP FAILED:', err.message);
    } else {
      console.log('✅ SMTP connected — email is ready');
    }
  });
} else {
  console.warn('⚠️  SMTP not configured — emails will be skipped');
}

const stripHtml = (html) => {
  return html
    .replace(/<style([\s\S]*?)<\/style>/gi, '')
    .replace(/<script([\s\S]*?)<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`⚠️  Email skipped: ${subject} → ${to}`);
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    const fromEmail = process.env.SMTP_FROM || 'arndas777@gmail.com';
    const info = await transporter.sendMail({
      from: `"St. John de Britto's Church" <${fromEmail}>`,
      to,
      subject,
      html,
      text: stripHtml(html), // Plain-text fallback for higher inbox delivery (bypasses Promotions filters)
      attachments,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email error to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

module.exports = { transporter, sendMail };