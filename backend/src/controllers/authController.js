const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { createNotification } = require('../services/notificationService');

// @POST /api/auth/register
const register = async (req, res) => {
  try {
    let { name, familyName, dob, gender, phone, email, address, parishMemberId, password, subStation, familyRole, familyMembers } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone, and password are required' });
    }

    // Sanitize empty strings for unique fields so they don't trigger E11000 duplicate key errors
    if (email === "") email = undefined;
    if (parishMemberId === "") parishMemberId = undefined;

    const existing = await User.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] });
    if (existing) return res.status(409).json({ success: false, message: 'Phone or email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ 
      name, 
      familyName, 
      dob, 
      gender, 
      phone, 
      email, 
      address, 
      subStation,
      familyRole,
      familyMembers,
      parishMemberId, 
      passwordHash 
    });

    const otp = await sendOTP(user._id, phone, email);
    return res.status(201).json({
      success: true,
      message: 'Registration successful. OTP sent for verification.',
      userId: user._id,
      devOtp: otp,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const result = await verifyOTP(userId, otp);
    if (!result.valid) return res.status(400).json({ success: false, message: result.message });

    const user = await User.findById(userId);
    const token = generateToken(user._id, user.role);

    // Send Welcome Notification
    await createNotification({
      userId: user._id,
      recipient: 'user',
      title: "Welcome to St. John de Britto's Church! ⛪",
      message: `Dear ${user.name}, thank you for registering with our Parish platform. Our website allows you to book Mass intentions, request documents, view daily readings, and stay updated with church events. We are glad to have you with us!`,
      type: 'general',
      category: 'account',
      priority: 'low',
      actionUrl: '/dashboard',
      channels: ['email']
    });

    // Admin in-app notification: new user registered
    createNotification({
      recipient: 'admin',
      title: `👤 New Member Registered`,
      message: `${user.name} has registered and verified their account.${user.familyName ? ' Family: ' + user.familyName : ''}${user.subStation ? ' | Sub-station: ' + user.subStation : ''}`,
      type: 'general',
      category: 'account',
      priority: 'medium',
      actionUrl: '/admin/users',
      relatedId: user._id,
      relatedModel: 'User',
      channels: []
    }).catch(e => console.error('New user admin notification error:', e.message));

    // Check if it's their birthday TODAY and send birthday wish if so
    if (user.dob) {
      const today = new Date();
      const dob = new Date(user.dob);
      if (today.getDate() === dob.getDate() && today.getMonth() === dob.getMonth()) {
        await createNotification({
          userId: user._id,
          isBroadcast: false,
          title: "Birthday Blessings",
          message: `Dear ${user.name}, St. John de Britto's Church wishes you a very Happy Birthday! May God bless you with abundant joy, health, and peace on your special day. ✝️✨`,
          type: 'general',
          channels: ['email']
        });
      }
    }

    return res.json({ 
      success: true, 
      message: 'Verified successfully', 
      token, 
      user: { 
        _id: user._id, 
        name: user.name, 
        role: user.role,
        dob: user.dob
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { login: loginId, password } = req.body;
    if (!loginId || !password) return res.status(400).json({ success: false, message: 'Login and password required' });

    let user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp('^' + loginId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') } },
        { phone: loginId }
      ]
    });

    if (!user && !loginId.includes('@')) {
      const cleanDigits = loginId.replace(/\D/g, '');
      if (cleanDigits.length >= 10) {
        const last10 = cleanDigits.slice(-10);
        user = await User.findOne({ phone: new RegExp(last10 + '$') });
      }
    }

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isVerified) return res.status(403).json({ success: false, message: 'Account not verified. Please verify OTP first.', userId: user._id });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    const token = generateToken(user._id, user.role);
    return res.json({
      success: true,
      token,
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone, 
        role: user.role, 
        profilePhoto: user.profilePhoto,
        dob: user.dob
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/resend-otp
const resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const otp = await sendOTP(user._id, user.phone, user.email);
    res.json({ success: true, message: 'OTP resent successfully', devOtp: otp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { login: loginId } = req.body;
    
    let user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp('^' + loginId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') } },
        { phone: loginId }
      ]
    });

    if (!user && !loginId.includes('@')) {
      const cleanDigits = loginId.replace(/\D/g, '');
      if (cleanDigits.length >= 10) {
        const last10 = cleanDigits.slice(-10);
        user = await User.findOne({ phone: new RegExp(last10 + '$') });
      }
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Always send email OTP; also try SMS if they logged in by phone
    const sendEmail = user.email || null;
    const sendPhone = loginId.includes('@') ? null : user.phone;
    const otp = await sendOTP(user._id, sendPhone, sendEmail);
    res.json({ success: true, message: 'OTP sent to your requested medium', userId: user._id, devOtp: otp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    const result = await verifyOTP(userId, otp);
    if (!result.valid) return res.status(400).json({ success: false, message: result.message });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { passwordHash });
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @GET /api/auth/family-lookup?familyName=...
const lookupFamily = async (req, res) => {
  try {
    const { familyName } = req.query;
    if (!familyName || !familyName.trim()) {
      return res.json({ success: true, families: [] });
    }

    const cleanName = familyName.trim();
    const users = await User.find({
      familyName: { $regex: new RegExp('^' + cleanName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') }
    }).select('name familyName familyRole familyMembers subStation phone email');

    if (!users || users.length === 0) {
      return res.json({ success: true, families: [] });
    }

    const families = users.map(user => {
      const allMembers = [];
      if (user.name) {
        allMembers.push({ name: user.name, role: user.familyRole || 'Head', isRegisteredUser: true });
      }
      if (user.familyMembers && Array.isArray(user.familyMembers)) {
        user.familyMembers.forEach(m => {
          if (m.name) {
            allMembers.push({ name: m.name, role: m.role || 'Member', isRegisteredUser: false });
          }
        });
      }

      return {
        userId: user._id,
        familyName: user.familyName,
        subStation: user.subStation,
        primaryUser: { name: user.name, role: user.familyRole },
        familyMembers: user.familyMembers || [],
        allMembers
      };
    });

    res.json({ success: true, families });
  } catch (err) {
    console.error('lookupFamily error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, verifyOtp, login, resendOtp, forgotPassword, resetPassword, getMe, lookupFamily };

