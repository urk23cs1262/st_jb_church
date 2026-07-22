const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sjdb_secret_key_2024');
    req.user = await User.findById(decoded.id).select('-passwordHash -otp -otpExpires');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account inactive' });
    }

    // Check session invalidation (tokenVersion)
    if (decoded.tokenVersion !== undefined && req.user.tokenVersion !== undefined && decoded.tokenVersion < req.user.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Session invalidated due to security update. Please log in again.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign({ id, role, tokenVersion }, process.env.JWT_SECRET || 'sjdb_secret_key_2024', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = { protect, adminOnly, generateToken };
