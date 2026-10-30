/**
 * ShopWise Production Security Middleware Suite
 * Provides:
 * 1. HTTP Security Headers via Helmet (CSP, HSTS, X-Content-Type-Options, etc.)
 * 2. NoSQL Injection Prevention & Input Sanitization
 * 3. Request Correlation ID Generation (X-Request-Id)
 * 4. Privacy-Preserving Structured Request Logging
 * 5. Environment-Driven CORS Configuration
 */

const helmet = require('helmet');
const crypto = require('crypto');

/**
 * 1. Security Headers Configuration (Helmet)
 */
const helmetSecurity = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'https://images.unsplash.com',
        'https://encrypted-tbn0.gstatic.com',
        'https://m.media-amazon.com',
        'https://rukminim1.flixcart.com',
        'https://rukminim2.flixcart.com'
      ],
      connectSrc: ["'self'", 'https://serpapi.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // Allows cross-origin product images
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

/**
 * 2. NoSQL Operator & Prototype Injection Sanitizer
 * Recursively inspects objects and removes keys starting with '$' or containing '.'
 */
function sanitizeValue(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  const clean = {};
  for (const [key, val] of Object.entries(value)) {
    // Prevent MongoDB query selector injection ($gt, $ne, $where, etc.) and prototype pollution
    if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor') {
      continue;
    }
    clean[key] = sanitizeValue(val);
  }
  return clean;
}

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}

/**
 * 3. Request Correlation ID
 * Assigns or propagates X-Request-Id header for tracing and debugging without leaking sensitive data
 */
function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const reqId = (incomingId && typeof incomingId === 'string' && incomingId.length <= 64)
    ? incomingId.replace(/[^a-zA-Z0-9_-]/g, '')
    : `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
}

/**
 * 4. Safe Logging Formatter
 * Sanitizes sensitive fields so passwords, tokens, and authorization headers are never logged
 */
const SENSITIVE_FIELDS = ['password', 'confirmPassword', 'token', 'jwt', 'secret', 'apiKey', 'authorization'];

function maskSensitivePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(clone)) {
    if (SENSITIVE_FIELDS.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
      clone[key] = '[REDACTED]';
    } else if (typeof clone[key] === 'object') {
      clone[key] = maskSensitivePayload(clone[key]);
    }
  }
  return clone;
}

/**
 * 5. Environment-Driven CORS Configuration
 */
function getCorsOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOriginsStr = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '';
  
  const configuredOrigins = allowedOriginsStr
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  // Standard local origins for development
  const localOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  const allowed = isProd && configuredOrigins.length > 0 
    ? configuredOrigins 
    : [...localOrigins, ...configuredOrigins];

  return {
    origin: function (origin, callback) {
      // Allow non-browser requests (e.g. mobile apps, curl, server-to-server health checks)
      if (!origin) return callback(null, true);
      
      if (!isProd || allowed.includes(origin) || allowed.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy violation: origin "${origin}" is not authorized.`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 86400 // 24 hours preflight cache
  };
}

module.exports = {
  helmetSecurity,
  sanitizeInput,
  requestIdMiddleware,
  maskSensitivePayload,
  getCorsOptions
};
