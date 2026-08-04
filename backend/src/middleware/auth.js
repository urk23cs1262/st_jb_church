const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === 'string') {
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = authHeader;
    }
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sjdb_secret_key_2024');
    req.user = await User.findById(decoded.id).select('-passwordHash -otp -otpExpires');
    if (!req.user || req.user.isActive === false) {
      return res.status(401).json({ success: false, message: 'User account not found or deactivated' });
    }

    // Check session invalidation (tokenVersion)
    if (decoded.tokenVersion !== undefined && req.user.tokenVersion !== undefined && decoded.tokenVersion < req.user.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Session invalidated. Please log in again.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired: ' + err.message });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sjdb_secret_key_2024');
      req.user = await User.findById(decoded.id).select('-passwordHash -otp -otpExpires');
    } catch (err) {}
  }
  next();
};

const adminOnly = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  if (req.user && (role === 'admin' || role === 'priest' || role === 'staff' || req.user.isTechnicalTeam)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign({ id, role, tokenVersion }, process.env.JWT_SECRET || 'sjdb_secret_key_2024', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = { protect, optionalAuth, adminOnly, generateToken };
