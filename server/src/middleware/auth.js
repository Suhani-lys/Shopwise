const jwt = require('jsonwebtoken');
const { UserDAL } = require('../models/schema');

const JWT_SECRET = process.env.JWT_SECRET || 'shopwise_jwt_secret_dev_key_2026';

/**
 * Middleware: requireAuth
 * Requires valid JWT Bearer token. Sets req.user or returns 401.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please log in.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid session token. Please log in again.'
      });
    }

    const user = await UserDAL.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service error'
    });
  }
}

/**
 * Middleware: optionalAuth
 * Attempts to parse JWT Bearer token if provided, but does not block if absent.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const user = await UserDAL.findById(decoded.id);
          if (user) {
            req.user = {
              id: user.id,
              name: user.name,
              email: user.email,
              createdAt: user.createdAt
            };
          }
        } catch {
          // Token invalid or expired, continue without attaching user
        }
      }
    }
    next();
  } catch {
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  JWT_SECRET
};
