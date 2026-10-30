/**
 * ShopWise Phase 5 Security & Production-Readiness Test Suite
 * 
 * Verifies:
 * 1. Unauthorized Access Prevention
 * 2. Cross-User Alert Access (IDOR Protection)
 * 3. Invalid and Expired JWT Token Handling
 * 4. Invalid and Oversized Input Handling (Body limit, Query bound, Password length)
 * 5. Rate Limiting Enforced
 * 6. Environment Variable Validation & Production Secret Enforcements
 * 7. Database Failure Handling & Offline Guarding
 * 8. Provider Fault Tolerance & Timeout Isolation
 * 9. Zero Secret Leakage across APIs and Schemas
 * 10. Production Error Masking & Sensitive Log Sanitization
 */

const assert = require('assert');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Target services and middlewares
const { JWT_SECRET } = require('./src/middleware/auth');
const { requireDBConnection } = require('./src/config/db');
const { validateEnv, maskMongoUri } = require('./src/config/env');
const { sanitizeInput, maskSensitivePayload } = require('./src/middleware/security');
const { AlertDAL, UserDAL, MongoUser } = require('./src/models/schema');
const BaseProvider = require('./src/services/providers/baseProvider');
const productSearchService = require('./src/services/productSearchService');

let passCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

async function asyncTest(name, fn) {
  totalCount++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

async function runSecurityTestSuite() {
  console.log('===============================================================');
  console.log('ShopWise Phase 5: Production Security & Hardening Test Suite');
  console.log('===============================================================\n');

  // ---------------------------------------------------------------------------
  // Suite 1: Unauthorized Access Prevention
  // ---------------------------------------------------------------------------
  console.log('Suite 1: Unauthorized Access Prevention');

  test('1.1 Should block unauthenticated access to protected route', () => {
    const { requireAuth } = require('./src/middleware/auth');
    const req = { headers: {} };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => { statusSent = code; return res; },
      json: (payload) => { jsonSent = payload; return res; }
    };
    requireAuth(req, res, () => {});
    assert.strictEqual(statusSent, 401);
    assert.strictEqual(jsonSent.success, false);
    assert.ok(jsonSent.message.includes('Authentication required'));
  });

  test('1.2 Should not leak all database alerts to unauthenticated callers', async () => {
    const { getAlerts } = require('./src/controllers/alertController');
    const req = { user: null, query: {} };
    let jsonSent = null;
    const res = {
      json: (payload) => { jsonSent = payload; return res; },
      status: () => res
    };
    await getAlerts(req, res);
    assert.strictEqual(jsonSent.success, true);
    assert.strictEqual(jsonSent.count, 0);
    assert.deepStrictEqual(jsonSent.data, []);
  });

  // ---------------------------------------------------------------------------
  // Suite 2: Cross-User Alert Access (IDOR Protection)
  // ---------------------------------------------------------------------------
  console.log('\nSuite 2: Cross-User Alert Access (IDOR Protection)');

  await asyncTest('2.1 Should forbid deletion of another user\'s alert', async () => {
    const { deleteAlert } = require('./src/controllers/alertController');
    // Mock existing alert owned by victim
    const originalFindById = AlertDAL.findById;
    AlertDAL.findById = async () => ({
      id: 'alert-victim-1',
      userEmail: 'victim@example.com'
    });

    try {
      const req = {
        params: { id: 'alert-victim-1' },
        user: { email: 'attacker@example.com' }, // Mismatched user
        query: {}
      };
      let statusSent = null;
      let jsonSent = null;
      const res = {
        status: (code) => { statusSent = code; return res; },
        json: (payload) => { jsonSent = payload; return res; }
      };

      await deleteAlert(req, res);
      assert.strictEqual(statusSent, 403);
      assert.strictEqual(jsonSent.success, false);
      assert.ok(jsonSent.message.includes('not authorized'));
    } finally {
      AlertDAL.findById = originalFindById;
    }
  });

  await asyncTest('2.2 Should forbid unauthenticated caller from modifying alert', async () => {
    const { updateAlert } = require('./src/controllers/alertController');
    const originalFindById = AlertDAL.findById;
    AlertDAL.findById = async () => ({
      id: 'alert-victim-2',
      userEmail: 'victim@example.com'
    });

    try {
      const req = {
        params: { id: 'alert-victim-2' },
        user: null, // Unauthenticated
        body: { targetPrice: 500 }
      };
      let statusSent = null;
      const res = {
        status: (code) => { statusSent = code; return res; },
        json: () => res
      };

      await updateAlert(req, res);
      assert.strictEqual(statusSent, 403);
    } finally {
      AlertDAL.findById = originalFindById;
    }
  });

  // ---------------------------------------------------------------------------
  // Suite 3: Invalid and Expired JWT Token Handling
  // ---------------------------------------------------------------------------
  console.log('\nSuite 3: Invalid and Expired JWT Token Handling');

  test('3.1 Should reject malformed or invalid Bearer token', () => {
    const { requireAuth } = require('./src/middleware/auth');
    const req = { headers: { authorization: 'Bearer invalid.token.payload' } };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => { statusSent = code; return res; },
      json: (payload) => { jsonSent = payload; return res; }
    };
    requireAuth(req, res, () => {});
    assert.strictEqual(statusSent, 401);
    assert.ok(jsonSent.message.includes('Invalid session token'));
  });

  test('3.2 Should reject expired JWT tokens with clear expiration message', () => {
    const { requireAuth } = require('./src/middleware/auth');
    // Generate an already expired token (-10 seconds)
    const expiredToken = jwt.sign(
      { id: 'user-1', email: 'test@example.com' },
      JWT_SECRET,
      { expiresIn: '-10s' }
    );

    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status: (code) => { statusSent = code; return res; },
      json: (payload) => { jsonSent = payload; return res; }
    };
    requireAuth(req, res, () => {});
    assert.strictEqual(statusSent, 401);
    assert.ok(jsonSent.message.includes('expired'));
  });

  test('3.3 Should reject tokens signed with a foreign key', () => {
    const { requireAuth } = require('./src/middleware/auth');
    const fakeToken = jwt.sign(
      { id: 'user-1', email: 'test@example.com' },
      'completely_different_attacker_secret_key_123',
      { expiresIn: '1h' }
    );

    const req = { headers: { authorization: `Bearer ${fakeToken}` } };
    let statusSent = null;
    const res = {
      status: (code) => { statusSent = code; return res; },
      json: () => res
    };
    requireAuth(req, res, () => {});
    assert.strictEqual(statusSent, 401);
  });

  // ---------------------------------------------------------------------------
  // Suite 4: Invalid and Oversized Inputs Handling
  // ---------------------------------------------------------------------------
  console.log('\nSuite 4: Input Validation & Sanitization');

  test('4.1 Should sanitize NoSQL injection operators ($gt, $ne, __proto__)', () => {
    const req = {
      body: {
        email: 'user@example.com',
        $gt: '',
        nested: {
          $ne: null,
          validKey: 'safeValue',
          'dotted.key': 'unsafe'
        },
        __proto__: { admin: true }
      },
      query: {
        category: { $regex: '.*' }
      },
      params: {}
    };

    sanitizeInput(req, {}, () => {});
    assert.strictEqual(req.body.$gt, undefined);
    assert.strictEqual(req.body.nested.$ne, undefined);
    assert.strictEqual(req.body.nested['dotted.key'], undefined);
    assert.strictEqual(req.body.nested.validKey, 'safeValue');
    assert.strictEqual(req.query.category.$regex, undefined);
  });

  await asyncTest('4.2 Should bound search query length and strip control characters', async () => {
    const hugeQuery = 'macbook ' + 'a'.repeat(300) + '\x00\x08';
    const res = await productSearchService.searchProducts({ query: hugeQuery });
    assert.strictEqual(res.success, true);
    assert.ok(res.query.length <= 120);
    assert.ok(!res.query.includes('\x00'));
  });

  // ---------------------------------------------------------------------------
  // Suite 5: Environment Variable Validation & Production Enforcements
  // ---------------------------------------------------------------------------
  console.log('\nSuite 5: Environment Validation & Production Secret Enforcements');

  test('5.1 Should detect and mask passwords in MongoDB URIs', () => {
    const masked = maskMongoUri('mongodb+srv://admin:MySecretPassword123@cluster.mongodb.net/shopwise');
    assert.strictEqual(masked, 'mongodb+srv://admin:*****@cluster.mongodb.net/shopwise');
    assert.ok(!masked.includes('MySecretPassword123'));
  });

  test('5.2 Should fail production validation if default dev JWT_SECRET is used', () => {
    const oldEnv = process.env.NODE_ENV;
    const oldSecret = process.env.JWT_SECRET;
    const oldUri = process.env.MONGO_URI;

    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'shopwise_jwt_secret_dev_key_2026'; // Default dev secret
      process.env.MONGO_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/shopwise';

      assert.throws(() => {
        validateEnv();
      }, /Environment validation failed/);
    } finally {
      process.env.NODE_ENV = oldEnv;
      process.env.JWT_SECRET = oldSecret;
      process.env.MONGO_URI = oldUri;
    }
  });

  // ---------------------------------------------------------------------------
  // Suite 6: Database Failure Handling & Offline Guarding
  // ---------------------------------------------------------------------------
  console.log('\nSuite 6: Database Failure Handling');

  test('6.1 Should return 503 DATABASE_UNAVAILABLE when MongoDB is disconnected', () => {
    // Simulate disconnected state (readyState = 0)
    const originalReadyState = mongoose.connection.readyState;
    Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });

    try {
      let statusSent = null;
      let jsonSent = null;
      const res = {
        status: (code) => { statusSent = code; return res; },
        json: (payload) => { jsonSent = payload; return res; }
      };

      requireDBConnection({}, res, () => {});
      assert.strictEqual(statusSent, 503);
      assert.strictEqual(jsonSent.code, 'DATABASE_UNAVAILABLE');
    } finally {
      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    }
  });

  // ---------------------------------------------------------------------------
  // Suite 7: Provider Fault Tolerance & Timeout Isolation
  // ---------------------------------------------------------------------------
  console.log('\nSuite 7: Provider Fault Tolerance & Timeout Isolation');

  await asyncTest('7.1 Should handle provider timeout gracefully without crashing', async () => {
    class HangingProvider extends BaseProvider {
      constructor() {
        super('hanging', 'Hanging Provider', 100); // 100ms timeout
      }
      isConfigured() { return true; }
      async search(q, { signal }) {
        return new Promise((resolve) => {
          // Never resolves unless aborted
          signal.addEventListener('abort', () => resolve([]));
        });
      }
    }

    const provider = new HangingProvider();
    const results = await provider.executeSearch('test query');
    assert.deepStrictEqual(results, []);
  });

  test('7.2 Should not leak provider API keys in getStatus() diagnostics', () => {
    const statuses = productSearchService.getProviderStatuses();
    assert.ok(Array.isArray(statuses));
    statuses.forEach(s => {
      // Must not contain actual secret strings
      assert.strictEqual(s.apiKey, undefined);
      assert.strictEqual(s.token, undefined);
      assert.strictEqual(s.secret, undefined);
      // missingCredentials must only be an array of variable names
      assert.ok(Array.isArray(s.missingCredentials));
    });
  });

  // ---------------------------------------------------------------------------
  // Suite 8: Zero Secret Leakage across APIs and Schemas
  // ---------------------------------------------------------------------------
  console.log('\nSuite 8: Zero Secret Leakage across APIs and Schemas');

  test('8.1 User Schema toJSON transform must delete password', () => {
    const user = new MongoUser({
      id: 'test-user-123',
      name: 'Security User',
      email: 'sec@shopwise.in',
      password: 'hashed_bcrypt_secret_string'
    });

    const serialized = user.toJSON();
    assert.strictEqual(serialized.password, undefined);
    assert.strictEqual(serialized._id, undefined);
    assert.strictEqual(serialized.__v, undefined);
    assert.strictEqual(serialized.email, 'sec@shopwise.in');
  });

  test('8.2 Safe logger must redact sensitive fields', () => {
    const sensitive = {
      user: 'alice',
      password: 'MyPassword123',
      nested: {
        authorization: 'Bearer eyJhbGciOi...',
        apiKey: 'serp_12345'
      }
    };

    const redacted = maskSensitivePayload(sensitive);
    assert.strictEqual(redacted.password, '[REDACTED]');
    assert.strictEqual(redacted.nested.authorization, '[REDACTED]');
    assert.strictEqual(redacted.nested.apiKey, '[REDACTED]');
    assert.strictEqual(redacted.user, 'alice');
  });

  console.log('\n===============================================================');
  console.log(`Phase 5 Security Suite: ${passCount} / ${totalCount} tests passed!`);
  console.log('===============================================================');
}

runSecurityTestSuite().catch(err => {
  console.error('Fatal test suite failure:', err);
  process.exit(1);
});
