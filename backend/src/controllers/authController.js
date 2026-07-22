const bcrypt = require('bcryptjs');
const User = require('../models/User');
const SecurityIncident = require('../models/SecurityIncident');
const { generateToken } = require('../middleware/auth');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { createNotification } = require('../services/notificationService');
const { sendLoginAlertEmail, sendPasswordUpdatedEmail } = require('../services/loginSecurityService');

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
    const token = generateToken(user._id, user.role, user.tokenVersion || 0);

    // Trigger Login Alert Email
    sendLoginAlertEmail({ user, req, loginMethod: 'OTP' }).catch(e => console.error('Login alert email error:', e));

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

    if (!user) return res.status(401).json({ success: false, message: 'Incorrect password or user not found. Please try again.' });

    const now = new Date();

    // 1. Check if Account is Suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        isSuspended: true,
        canResetPassword: true,
        message: 'Your account has been automatically suspended due to repeated failed login attempts for your security. Please contact the administrator to restore access.'
      });
    }

    // 2. Check if Account is Temporarily Locked (15-min lockout)
    if (user.isLockedUntil) {
      if (now < new Date(user.isLockedUntil)) {
        const remainingMins = Math.max(1, Math.ceil((new Date(user.isLockedUntil) - now) / (60 * 1000)));
        return res.status(429).json({
          success: false,
          isLockedOut: true,
          lockedUntil: user.isLockedUntil,
          canResetPassword: true,
          message: `Your account is temporarily locked for 15 minutes due to multiple failed login attempts. Please try again in ${remainingMins} minute(s) or reset your password.`
        });
      } else {
        // Lockout expired, clear lockout flag
        await User.findByIdAndUpdate(user._id, { isLockedUntil: null });
      }
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    // 3. Password Mismatch Handling (Progressive Lockout & Suspension)
    if (!match) {
      // 24-hour lockout counter window reset check
      const dayMs = 24 * 60 * 60 * 1000;
      let lockoutCount = user.lockoutCount || 0;
      let firstLockoutAt = user.firstLockoutAt || null;

      if (firstLockoutAt && (now - new Date(firstLockoutAt)) > dayMs) {
        lockoutCount = 0;
        firstLockoutAt = null;
      }

      // 30-minute failed attempt window reset check
      const windowMs = 30 * 60 * 1000;
      let failedAttempts = (user.failedLoginAttempts || 0) + 1;
      let firstAttempt = user.firstFailedAttempt || now;

      if (user.firstFailedAttempt && (now - new Date(user.firstFailedAttempt)) > windowMs) {
        failedAttempts = 1;
        firstAttempt = now;
      }

      const updateFields = {
        failedLoginAttempts: failedAttempts,
        firstFailedAttempt: firstAttempt,
        lastFailedAttempt: now,
        lockoutCount,
        firstLockoutAt
      };

      const { parseUserAgent, parseClientIpAndLocation, sendUserSuspensionEmail, sendAdminSuspensionIncidentEmail, sendUserTemporaryLockoutEmail } = require('../services/loginSecurityService');
      const ipDetails = parseClientIpAndLocation(req);
      const uaDetails = parseUserAgent(req.headers['user-agent']);

      // 🛑 RULE: 10 Failed Attempts OR 2 Lockouts within 24h = AUTOMATIC ACCOUNT SUSPENSION
      if (failedAttempts >= 10 || lockoutCount >= 2) {
        updateFields.isSuspended = true;
        updateFields.suspendedAt = now;
        updateFields.suspensionReason = `Exceeded failed attempt threshold (${failedAttempts} attempts / ${lockoutCount} lockouts within 24h)`;

        await User.findByIdAndUpdate(user._id, updateFields);

        // Record Security Incident
        const incident = await SecurityIncident.create({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          type: 'brute_force_suspension',
          status: 'Awaiting Review',
          failedAttempts,
          threshold: 10,
          firstFailedAttempt: firstAttempt,
          lastFailedAttempt: now,
          loginTime: now,
          device: uaDetails.device,
          browser: uaDetails.browser,
          os: uaDetails.os,
          ipAddress: ipDetails.ip,
          location: ipDetails.location,
          loginMethod: 'Password',
          actionsTaken: [
            `Automatically suspended user account after ${failedAttempts} failed login attempts`,
            'Blocked future login attempts pending administrator review',
            'Logged incident in security audit registry',
            'Dispatched email notification to user & parish administrator'
          ]
        });

        // Send Email Alerts & Notifications
        sendUserSuspensionEmail({ user, incident, ipDetails }).catch(e => console.warn('User suspension email error:', e.message));
        sendAdminSuspensionIncidentEmail({ user, incident, ipDetails }).catch(e => console.warn('Admin suspension email error:', e.message));

        createNotification({
          recipient: 'admin',
          title: '🚨 Security Incident: Account Suspended',
          message: `User ${user.name} (${user.email || user.phone}) has been automatically suspended after ${failedAttempts} failed login attempts.`,
          type: 'system',
          category: 'system',
          priority: 'high',
          actionUrl: `/admin/notifications?incidentId=${incident._id}`,
          relatedId: incident._id,
          relatedModel: 'SecurityIncident'
        }).catch(e => console.warn('Suspension admin notification error:', e.message));

        return res.status(403).json({
          success: false,
          isSuspended: true,
          canResetPassword: true,
          message: 'Your account has been automatically suspended due to repeated failed login attempts for your security. Please contact the administrator to restore access.'
        });

      } 
      // 🔒 RULE: 5 Failed Attempts = 15-MINUTE TEMPORARY LOCKOUT
      else if (failedAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        updateFields.isLockedUntil = lockUntil;
        updateFields.lockoutCount = lockoutCount + 1;
        updateFields.firstLockoutAt = firstLockoutAt || now;

        await User.findByIdAndUpdate(user._id, updateFields);

        // Send Lockout Email & Notification to User
        sendUserTemporaryLockoutEmail({ user, lockMinutes: 15, ipDetails }).catch(e => console.warn('Lockout email error:', e.message));

        createNotification({
          userId: user._id,
          recipient: 'user',
          title: 'Account Temporarily Locked 🔒',
          message: 'Your account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts. You can try again in 15 minutes or reset your password.',
          type: 'general',
          category: 'account',
          priority: 'high',
          actionUrl: '/login',
          channels: ['email', 'push']
        }).catch(e => console.warn('Lockout user notification error:', e.message));

        return res.status(429).json({
          success: false,
          isLockedOut: true,
          lockedUntil: lockUntil,
          canResetPassword: true,
          message: 'Your account has been temporarily locked for 15 minutes due to multiple failed login attempts. Please check your email or reset your password.'
        });

      } 
      // ⚠️ RULE: 4 Failed Attempts = WARNING MESSAGE
      else if (failedAttempts === 4) {
        await User.findByIdAndUpdate(user._id, updateFields);
        return res.status(401).json({
          success: false,
          message: 'You have 1 attempt remaining before your account is temporarily locked for 15 minutes.'
        });

      } 
      // ℹ️ RULE: 1 - 3 Failed Attempts = STANDARD ERROR MESSAGE
      else {
        await User.findByIdAndUpdate(user._id, updateFields);
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please try again.'
        });
      }
    }

    if (!user.isVerified) return res.status(403).json({ success: false, message: 'Account not verified. Please verify OTP first.', userId: user._id });

    // Successful login: Reset all failed attempt & lockout counters
    await User.findByIdAndUpdate(user._id, {
      lastLogin: now,
      lastSuccessfulLogin: now,
      failedLoginAttempts: 0,
      firstFailedAttempt: null,
      lastFailedAttempt: null,
      isLockedUntil: null,
      lockoutCount: 0,
      firstLockoutAt: null
    });

    const token = generateToken(user._id, user.role, user.tokenVersion || 0);

    // Trigger Login Security Alert Email
    sendLoginAlertEmail({ user, req, loginMethod: 'Password' }).catch(e => console.error('Login alert email error:', e));

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
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Reject if new password matches old password BEFORE verifying/clearing OTP!
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your old password. Please enter a different password.'
      });
    }

    // Now verify and consume the OTP after password validation passes
    const result = await verifyOTP(userId, otp);
    if (!result.valid) return res.status(400).json({ success: false, message: result.message });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, {
      passwordHash,
      $inc: { tokenVersion: 1 }
    });

    // Send "Password Updated Successfully" Security Confirmation Email
    sendPasswordUpdatedEmail({ user }).catch(e => console.warn('Password updated email error:', e.message));

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

