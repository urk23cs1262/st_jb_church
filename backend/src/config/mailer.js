const nodemailer = require('nodemailer');

const port = parseInt(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: port,
  secure: port === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`⚠️  Email skipped (SMTP not configured)`);
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"St. John de Britto's Church" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email error: ${err.message}`);
    return { success: false, error: err.message };
  }
};

module.exports = { transporter, sendMail };
