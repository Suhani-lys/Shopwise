/**
 * ShopWise Production-Ready Backend Server
 * Express API with persistent MongoDB Atlas storage, security hardening,
 * rate limiting, NoSQL injection protection, live aggregator providers,
 * and background automated price monitoring scheduler.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { config } = require('./config/env');
const { connectDB, getDBStatus, requireDBConnection } = require('./config/db');

// Security & Resilience Middlewares
const {
  helmetSecurity,
  sanitizeInput,
  requestIdMiddleware,
  getCorsOptions
} = require('./middleware/security');
const {
  authLimiter,
  apiLimiter,
  checkNowLimiter
} = require('./middleware/rateLimiter');

// Controllers & Services
const {
  getProducts,
  getProductById,
  compareProducts,
  getProviders,
  calculateCustomRank
} = require('./controllers/productController');
const {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  pauseAlert,
  resumeAlert,
  checkAlertsNow
} = require('./controllers/alertController');
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('./controllers/notificationController');
const {
  register,
  login,
  getMe,
  logout,
  forgotPassword
} = require('./controllers/authController');
const { requireAuth, optionalAuth } = require('./middleware/auth');
const { getSystemStats } = require('./controllers/analyticsController');
const priceMonitorService = require('./services/priceMonitorService');

const app = express();
const PORT = config.PORT || process.env.PORT || 5000;

// 1. Security HTTP Headers (Helmet: CSP, HSTS, X-Content-Type-Options, etc.)
app.use(helmetSecurity);

// 2. CORS: Restricted to explicitly configured frontend origins with dev fallback
app.use(cors(getCorsOptions()));

// 3. Request Correlation ID
app.use(requestIdMiddleware);

// 4. Request Body Size Limits & Parsers (prevents memory exhaustion DoS)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 5. NoSQL Injection Prevention & Input Sanitization
app.use(sanitizeInput);

// 6. Privacy-Conscious HTTP Request Logger
if (config.NODE_ENV !== 'test') {
  morgan.token('req-id', (req) => req.id || '-');
  app.use(morgan('[:date[iso]] :req-id :method :url :status :response-time ms'));
}

// 7. Connect Persistent Database (MongoDB Atlas)
connectDB();

// Health check (used by load balancers and uptime monitors)
app.get('/health', (req, res) => res.status(200).send('OK'));

// 8. Global API Rate Limiting (180 requests/min/IP)
app.use('/api', apiLimiter);

// -----------------------------------------------------------------------------
// Health Check & Diagnostics Endpoints (Safe: Zero Secret Leakage)
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  const statusCode = dbStatus.connected ? 200 : 503;
  res.status(statusCode).json({
    status: dbStatus.connected ? 'ONLINE' : 'DEGRADED',
    service: 'ShopWise Backend REST Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.connected,
      state: dbStatus.state,
      host: dbStatus.host
    }
  });
});

// Platform Aggregate Metrics
app.get('/api/stats', getSystemStats);

// -----------------------------------------------------------------------------
// Authentication Endpoints (Guarded: DB required + Rate Limited)
// -----------------------------------------------------------------------------
app.post('/api/auth/register', requireDBConnection, authLimiter, register);
app.post('/api/auth/login', requireDBConnection, authLimiter, login);
app.get('/api/auth/me', requireDBConnection, requireAuth, getMe);
app.post('/api/auth/logout', logout);
app.post('/api/auth/forgot-password', authLimiter, forgotPassword);

// -----------------------------------------------------------------------------
// Product Catalog & Smart Comparison Endpoints
// -----------------------------------------------------------------------------
app.get('/api/products', getProducts);
app.get('/api/products/providers', getProviders);
app.get('/api/products/:id', getProductById);
app.post('/api/products/compare', compareProducts);
app.post('/api/products/smart-rank', calculateCustomRank);

// -----------------------------------------------------------------------------
// Personalized Price Drop Alerts Endpoints (Guarded: DB + Ownership Required)
// -----------------------------------------------------------------------------
app.get('/api/alerts', requireDBConnection, optionalAuth, getAlerts);
app.post('/api/alerts', requireDBConnection, optionalAuth, createAlert);
app.put('/api/alerts/:id', requireDBConnection, optionalAuth, updateAlert);
app.delete('/api/alerts/:id', requireDBConnection, optionalAuth, deleteAlert);
app.patch('/api/alerts/:id/pause', requireDBConnection, optionalAuth, pauseAlert);
app.patch('/api/alerts/:id/resume', requireDBConnection, optionalAuth, resumeAlert);
app.post('/api/alerts/check-now', requireDBConnection, checkNowLimiter, optionalAuth, checkAlertsNow);

// -----------------------------------------------------------------------------
// Persistent In-App Notifications Endpoints
// -----------------------------------------------------------------------------
app.get('/api/notifications', requireDBConnection, optionalAuth, getNotifications);
app.patch('/api/notifications/read-all', requireDBConnection, optionalAuth, markAllNotificationsAsRead);
app.patch('/api/notifications/:id/read', requireDBConnection, optionalAuth, markNotificationAsRead);
app.delete('/api/notifications/:id', requireDBConnection, optionalAuth, deleteNotification);

// -----------------------------------------------------------------------------
// 404 & Global Error Handlers (Hides stack traces and paths in production)
// -----------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${req.originalUrl} not found on ShopWise Server`
  });
});

app.use((err, req, res, next) => {
  // Safe logging with correlation ID
  console.error(`[Server Error ${req.id || 'N/A'}]`, err.message);

  const status = err.status || (err.code === 'DATABASE_UNAVAILABLE' ? 503 : (err.type === 'entity.too.large' ? 413 : 500));
  const isProd = config.NODE_ENV === 'production';

  res.status(status).json({
    success: false,
    code: err.code || (err.type === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_SERVER_ERROR'),
    message: isProd && status === 500 ? 'An unexpected internal error occurred. Please try again later.' : err.message,
    requestId: req.id || null
  });
});

// -----------------------------------------------------------------------------
// Graceful Server Startup & Shutdown Lifecycle
// -----------------------------------------------------------------------------
let activeServer = null;

if (require.main === module) {
  activeServer = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  🚀 ShopWise Production Backend Server running on port ${PORT}`);
    console.log(`  🔒 Environment: ${config.NODE_ENV}`);
    console.log(`  🛡️ Security: Helmet, Rate Limiter, NoSQL Sanitizer Active`);
    console.log(`  📡 API Health: http://localhost:${PORT}/api/health`);
    console.log(`  🛍️ Products API: http://localhost:${PORT}/api/products`);
    console.log(`  📊 Platform Stats: http://localhost:${PORT}/api/stats`);
    console.log(`=======================================================`);

    // Start background automated price monitoring scheduler
    priceMonitorService.start();
  });

  activeServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const ALT_PORT = Number(PORT) + 1;
      console.warn(`Port ${PORT} is in use, retrying on port ${ALT_PORT}...`);
      activeServer = app.listen(ALT_PORT, () => {
        console.log(`ShopWise Backend Server running on port ${ALT_PORT}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });

  // Graceful Shutdown on SIGTERM and SIGINT
  const handleShutdown = async (signal) => {
    console.log(`\n[ShopWise Server] 🛑 Received ${signal}. Initiating graceful shutdown...`);

    // 1. Stop background scheduler
    priceMonitorService.stop();

    // 2. Stop accepting new HTTP requests
    if (activeServer) {
      activeServer.close(() => {
        console.log('[ShopWise Server] HTTP connection listener closed.');
      });
    }

    // 3. Close database connection
    try {
      await mongoose.connection.close(false);
      console.log('[ShopWise Server] MongoDB connection closed safely.');
    } catch (dbErr) {
      console.error('[ShopWise Server] Error closing MongoDB connection:', dbErr.message);
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

module.exports = app;
