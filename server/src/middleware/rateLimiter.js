/**
 * ShopWise Rate Limiting Protection Middleware
 * Prevents brute-force credential attacks, enumeration, and API DoS.
 */

const { rateLimit } = require('express-rate-limit');

/**
 * Sensitive Authentication Endpoints Rate Limiter
 * Applied to: /api/auth/login, /api/auth/register, /api/auth/forgot-password
 * 15 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.'
  }
});

/**
 * General Public API Rate Limiter
 * Applied globally to all /api/ routes
 * 180 requests per minute per IP
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'test' ? 5000 : 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many API requests from this IP. Please slow down.'
  }
});

/**
 * On-Demand Price Check Rate Limiter
 * Applied to: /api/alerts/check-now
 * Max 6 requests per 10 minutes per IP
 */
const checkNowLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'test' ? 100 : 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'On-demand price checks are rate-limited to 6 every 10 minutes. Please rely on automated background monitoring.'
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  checkNowLimiter
};
