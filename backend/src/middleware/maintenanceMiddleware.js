const jwt = require('jsonwebtoken');
const MaintenanceSetting = require('../models/MaintenanceSetting');
const User = require('../models/User');

const maintenanceMiddleware = async (req, res, next) => {
  try {
    // Endpoints that MUST always be accessible even during maintenance
    const allowedPathPrefixes = [
      '/api/auth',
      '/api/maintenance'
    ];

    const isAllowedPath = allowedPathPrefixes.some(prefix => req.originalUrl.startsWith(prefix));
    if (isAllowedPath) {
      return next();
    }

    const settings = await MaintenanceSetting.findOne({ key: 'site_maintenance' });
    if (!settings || !settings.isEnabled) {
      return next();
    }

    // Check if request carries admin/technical team JWT auth token
    let token;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sjdb_secret_key_2024');
        const user = await User.findById(decoded.id).select('role isTechnicalTeam');
        if (user) {
          const userRole = (user.role || '').toLowerCase();
          const isAdmin = ['admin', 'priest'].includes(userRole);
          const isTech = Boolean(user.isTechnicalTeam) || (userRole === 'staff');
          
          if ((isAdmin && settings.allowAdminLogin !== false) || (isTech && settings.allowTechTeam !== false)) {
            return next();
          }
        }
      } catch (authErr) {
        // Invalid token, proceed to block
      }
    }

    // Increment analytics blocked counter asynchronously
    MaintenanceSetting.updateOne({ key: 'site_maintenance' }, { $inc: { accessAttemptsCount: 1 } }).catch(() => {});

    // Return 503 Service Unavailable
    return res.status(503).json({
      success: false,
      maintenance: true,
      code: 'SERVICE_UNAVAILABLE',
      title: settings.title || 'Website Under Maintenance',
      message: settings.message || 'We are making improvements to serve you better. Please visit again shortly.',
      category: settings.category,
      expectedCompletion: settings.expectedCompletion,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail
    });
  } catch (err) {
    console.error('Error in maintenance middleware:', err);
    next();
  }
};

module.exports = maintenanceMiddleware;
