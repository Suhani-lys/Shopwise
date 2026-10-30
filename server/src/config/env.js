/**
 * ShopWise Environment Configuration & Validation Module
 * Validates critical environment variables at startup and masks credentials for safe logging.
 */
require('dotenv').config();

function maskMongoUri(uri) {
  if (!uri) return 'not_configured';
  try {
    // Mask password in mongodb:// or mongodb+srv:// URIs up to the host separator:
    // e.g. mongodb+srv://username:password@cluster.net/db -> mongodb+srv://username:*****@cluster.net/db
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)(.*)(@[^/@]+(?:\/|$))/, '$1*****$3');
  } catch {
    return 'configured_masked';
  }
}

function validateEnv() {
  const issues = [];
  const warnings = [];

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
    issues.push(`Invalid PORT specified: "${process.env.PORT}". Must be a valid port number (1-65535).`);
  }

  const NODE_ENV = process.env.NODE_ENV || 'development';
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopwise';

  if (!MONGO_URI.startsWith('mongodb://') && !MONGO_URI.startsWith('mongodb+srv://')) {
    issues.push('Invalid MONGO_URI format. Must start with "mongodb://" (local) or "mongodb+srv://" (MongoDB Atlas).');
  }

  if (NODE_ENV === 'production') {
    if (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost')) {
      issues.push('Production environment detected but MONGO_URI points to localhost. Use MongoDB Atlas cluster URI for production persistence.');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'shopwise_jwt_secret_dev_key_2026' || process.env.JWT_SECRET.length < 32) {
      issues.push('Production environment requires a strong, unique JWT_SECRET of at least 32 characters. Do not use the default dev key.');
    }
    if (!process.env.CLIENT_URL && !process.env.ALLOWED_ORIGINS) {
      warnings.push('Neither CLIENT_URL nor ALLOWED_ORIGINS is configured. Cross-origin requests from web browsers may be blocked.');
    }
  } else {
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET is not set in environment. Falling back to development key. Set a secure key in server/.env for production.');
    }
    if (!process.env.MONGO_URI) {
      warnings.push('MONGO_URI is not set in environment. Using default "mongodb://127.0.0.1:27017/shopwise". Configure MongoDB Atlas in server/.env for cloud persistence.');
    }
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'shopwise_jwt_secret_dev_key_2026';
  const CLIENT_URL = process.env.CLIENT_URL || process.env.ALLOWED_ORIGINS || 'http://localhost:5173';

  if (issues.length > 0) {
    console.error('=======================================================');
    console.error('  ❌ ENVIRONMENT CONFIGURATION ERROR:');
    issues.forEach(issue => console.error(`   - ${issue}`));
    console.error('=======================================================');
    if (NODE_ENV === 'production') {
      throw new Error(`Environment validation failed with ${issues.length} critical issues.`);
    }
  }

  if (warnings.length > 0 && NODE_ENV !== 'test') {
    console.warn('[ShopWise Env Notice]');
    warnings.forEach(w => console.warn(`   ⚠️ ${w}`));
  }

  return {
    PORT,
    NODE_ENV,
    MONGO_URI,
    JWT_SECRET,
    CLIENT_URL,
    maskedMongoUri: maskMongoUri(MONGO_URI),
    isValid: issues.length === 0,
    issues,
    warnings
  };
}

const config = validateEnv();

module.exports = {
  config,
  validateEnv,
  maskMongoUri
};
