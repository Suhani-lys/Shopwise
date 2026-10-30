const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB, getDBStatus } = require('./config/db');
const {
  getProducts,
  getProductById,
  compareProducts,
  calculateCustomRank
} = require('./controllers/productController');
const {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert
} = require('./controllers/alertController');
const {
  register,
  login,
  getMe,
  logout,
  forgotPassword
} = require('./controllers/authController');
const { requireAuth, optionalAuth } = require('./middleware/auth');
const { getSystemStats } = require('./controllers/analyticsController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend development server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Connect Database (with automatic graceful fallback)
connectDB();

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'ShopWise Backend REST Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: getDBStatus()
  });
});

// Platform Analytics & Metrics
app.get('/api/stats', getSystemStats);

// Authentication Endpoints
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', requireAuth, getMe);
app.post('/api/auth/logout', logout);
app.post('/api/auth/forgot-password', forgotPassword);

// Product Catalog & Smart Comparison Endpoints
app.get('/api/products', getProducts);
app.get('/api/products/:id', getProductById);
app.post('/api/products/compare', compareProducts);
app.post('/api/products/smart-rank', calculateCustomRank);

// Personalized Price Drop Alerts Endpoints
app.get('/api/alerts', optionalAuth, getAlerts);
app.post('/api/alerts', optionalAuth, createAlert);
app.put('/api/alerts/:id', optionalAuth, updateAlert);
app.delete('/api/alerts/:id', optionalAuth, deleteAlert);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found on ShopWise Server` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start Server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  🚀 ShopWise Production Backend Server running on port ${PORT}`);
    console.log(`  📡 API Health: http://localhost:${PORT}/api/health`);
    console.log(`  🛍️ Products API: http://localhost:${PORT}/api/products`);
    console.log(`  📊 Platform Stats: http://localhost:${PORT}/api/stats`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const ALT_PORT = Number(PORT) + 1;
      console.warn(`Port ${PORT} is in use, retrying on port ${ALT_PORT}...`);
      app.listen(ALT_PORT, () => {
        console.log(`ShopWise Backend Server running on port ${ALT_PORT}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

module.exports = app;
