const User = require('../models/User');
const { sendMail } = require('../config/mailer');
const { sendSMS } = require('../config/twilio');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (userId, phone, email) => {
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await User.findByIdAndUpdate(userId, { otp, otpExpires });

  // Send OTP via SMS to the registered mobile number (Background)
  if (phone) {
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone; // Default to India country code
    }

    const smsBody = `Your St. John de Britto's Church verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

    // Fire and forget (don't await) for instant API response
    sendSMS(formattedPhone, smsBody).then(res => {
      if (res.success) console.log(`✅ OTP SMS sent to ${formattedPhone}`);
      else console.warn(`⚠️ SMS failed for ${formattedPhone}: [${res.code || 'N/A'}] ${res.error}`);
    }).catch(err => console.error(`❌ SMS Error: ${err.message}`));
  }

  // Also send via email if available (Background)
  if (email) {
    // Fire and forget (don't await) for instant API response
    sendMail({
      to: email,
      subject: 'Your OTP — St. John de Britto\'s Church',
      html: `
<div style="background:#f5f7fb; padding:40px 20px; font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.12); border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#1e3a8a,#7c2d12,#92400e); padding:35px 25px; text-align:center;">
      <div style="width:80px; height:80px; margin:0 auto 18px; border-radius:50%; overflow:hidden; border:3px solid rgba(255,255,255,0.3);">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/St._John_De_Britto.jpg/500px-St._John_De_Britto.jpg" style="width:100%;height:100%;object-fit:center;" />
      </div>
      <h1 style="margin:0; color:#fbbf24; font-size:30px; font-weight:700;">St. John de Britto's Church</h1>
    </div>
    <div style="padding:40px 35px; text-align:center;">
      <h2 style="color:#1e3a8a; margin-top:0; font-size:28px; margin-bottom:10px;">Verification Code</h2>
      <p style="color:#4b5563; font-size:16px; line-height:1.7; margin-bottom:30px;">Use the following One-Time Password (OTP) to securely verify your account.</p>
      <div style="background:linear-gradient(135deg,#fef3c7,#fff7ed); border:2px dashed #f59e0b; border-radius:18px; padding:28px 20px; margin:25px 0;">
        <div style="font-size:42px; font-weight:800; letter-spacing:12px; color:#92400e;">${otp}</div>
      </div>
      <p style="color:#dc2626; font-weight:600; margin-top:20px; font-size:14px;">⏳ This OTP is valid for 10 minutes.</p>
      <p style="color:#6b7280; font-size:13px; line-height:1.8; margin-top:12px;">Do not share this code with anyone for security reasons.</p>
      <div style="margin-top:35px; background:#f9fafb; border-left:5px solid #1e3a8a; padding:22px; border-radius:12px;">
        <p style="margin:0; color:#374151; font-style:italic; font-size:17px; line-height:1.8;">“For with God nothing shall be impossible.”</p>
        <p style="margin-top:10px; color:#92400e; font-weight:700; font-size:14px;">— Luke 1:37</p>
      </div>
    </div>
    <div style="background:#111827; padding:25px 20px; text-align:center; color:#d1d5db; font-size:13px;">
      <p style="margin:0 0 8px;">St. John de Britto's Church, Kalayarkoil</p>
      <p style="margin:0;">Tamil Nadu - 630551</p>
      <div style="width:100%; height:1px; background:rgba(255,255,255,0.08); margin:18px 0;"></div>
      <p style="margin:0; color:white; font-size:18px;">This is an automated email. Please do not reply.</p>
      <br><br>
      <p style="margin:0; color:#9ca3af; font-size:12px;">© ${new Date().getFullYear()} St. John de Britto Church. All Rights Reserved.</p>
    </div>
  </div>
</div>`
    }).catch(err => console.error(`❌ Mail Error: ${err.message}`));
  }

  // Dev fallback
  console.log(`📱 OTP for ${phone || email}: ${otp}`);
  return otp;
};

const verifyOTP = async (userId, inputOtp) => {
  const user = await User.findById(userId).select('+otp +otpExpires');
  if (!user || !user.otp) return { valid: false, message: 'No OTP found' };
  if (new Date() > user.otpExpires) return { valid: false, message: 'OTP expired' };
  if (user.otp !== inputOtp) return { valid: false, message: 'Invalid OTP' };

  await User.findByIdAndUpdate(userId, { otp: null, otpExpires: null, isVerified: true });
  return { valid: true };
};

module.exports = { sendOTP, verifyOTP, generateOTP };
