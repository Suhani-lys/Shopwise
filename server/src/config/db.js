const mongoose = require('mongoose');
const { config, maskMongoUri } = require('./env');

let isConnected = false;
let lastConnectionError = null;

/**
 * Configure Mongoose event listeners for live connection state tracking
 */
mongoose.connection.on('connected', () => {
  isConnected = true;
  lastConnectionError = null;
  console.log(`[ShopWise DB] ✅ MongoDB Connection Established (${mongoose.connection.host}/${mongoose.connection.name})`);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[ShopWise DB] ⚠️ MongoDB Disconnected.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  lastConnectionError = err.message;
  console.error('[ShopWise DB Error] ❌ MongoDB Connection Error:', err.message);
});

/**
 * Connect to MongoDB (Atlas or local instance)
 * Strict persistence: does not silently fall back to volatile RAM.
 */
const connectDB = async () => {
  const mongoUri = config.MONGO_URI;
  try {
    console.log(`[ShopWise DB] Connecting to database (${config.maskedMongoUri})...`);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      autoIndex: true
    });
    isConnected = true;
    lastConnectionError = null;
    return {
      success: true,
      host: conn.connection.host,
      name: conn.connection.name
    };
  } catch (error) {
    isConnected = false;
    lastConnectionError = error.message;
    console.error('=======================================================');
    console.error('  ❌ ShopWise Database Connection Failed:');
    console.error(`     Error: ${error.message}`);
    console.error(`     Target: ${config.maskedMongoUri}`);
    console.error('');
    console.error('  📋 Troubleshooting Checklist:');
    console.error('     1. Configure MONGO_URI in "server/.env" with your MongoDB Atlas connection string.');
    console.error('     2. Verify your Atlas IP Access List allows connection from your current IP (or 0.0.0.0/0).');
    console.error('     3. Ensure the database user has readWrite permissions.');
    console.error('=======================================================');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Returns detailed database diagnostics
 */
const getDBStatus = () => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    connected: readyState === 1,
    state: states[readyState] || 'unknown',
    readyState,
    host: readyState === 1 ? mongoose.connection.host : null,
    database: readyState === 1 ? mongoose.connection.name : null,
    maskedUri: config.maskedMongoUri,
    lastError: lastConnectionError
  };
};

/**
 * Middleware: requireDBConnection
 * Blocks write and persistence operations when MongoDB is offline,
 * preventing silent user data loss.
 */
const requireDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      message: 'MongoDB connection is currently unavailable. This operation requires database persistence to prevent unpersisted data loss.',
      diagnostics: {
        readyState: mongoose.connection.readyState,
        lastError: lastConnectionError || 'Could not reach MongoDB cluster. Check MONGO_URI in server/.env.'
      }
    });
  }
  next();
};

module.exports = {
  connectDB,
  getDBStatus,
  requireDBConnection,
  isDBConnected: () => mongoose.connection.readyState === 1
};
