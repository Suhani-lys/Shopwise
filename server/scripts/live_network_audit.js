const fs = require('fs');
const path = require('path');

// Load environment variables safely
require('../src/config/env');
const mongoose = require('mongoose');
const GoogleShoppingProvider = require('../src/services/providers/googleShoppingProvider');
const productSearchService = require('../src/services/productSearchService');

async function runLiveNetworkAudit() {
  console.log('===============================================================');
  console.log('  🌐 ShopWise Phase 6: Live Network & Persistence Audit');
  console.log('===============================================================\n');

  // --- 1. MongoDB Atlas Live Connection Test ---
  console.log('--- Step 1: Testing MongoDB Atlas Connection ---');
  let dbConnected = false;
  let dbCollections = [];
  let productCount = 0;
  let userCount = 0;
  let alertCount = 0;
  let notifCount = 0;

  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri || mongoUri.includes('replace_')) {
      console.log('MongoDB URI: UNCONFIGURED / PLACEHOLDER');
    } else {
      console.log('Attempting MongoDB connection (masked URI configured)...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
      dbConnected = true;
      console.log(`✅ Connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`);
      
      const cols = await mongoose.connection.db.listCollections().toArray();
      dbCollections = cols.map(c => c.name);
      console.log(`Collections found: [${dbCollections.join(', ')}]`);

      // Count documents in each collection
      if (dbCollections.includes('products')) {
        productCount = await mongoose.connection.db.collection('products').countDocuments();
        console.log(`  - products: ${productCount}`);
      }
      if (dbCollections.includes('users')) {
        userCount = await mongoose.connection.db.collection('users').countDocuments();
        console.log(`  - users: ${userCount}`);
      }
      if (dbCollections.includes('alerts')) {
        alertCount = await mongoose.connection.db.collection('alerts').countDocuments();
        console.log(`  - alerts: ${alertCount}`);
      }
      if (dbCollections.includes('notifications')) {
        notifCount = await mongoose.connection.db.collection('notifications').countDocuments();
        console.log(`  - notifications: ${notifCount}`);
      }
    }
  } catch (err) {
    console.error('❌ MongoDB Atlas connection error:', err.message);
  }

  // --- 2. Live Dynamic Product Search Tests ---
  console.log('\n--- Step 2: Testing Genuine External Search via Google Shopping (SerpApi) ---');
  const googleProvider = new GoogleShoppingProvider();
  console.log(`Provider: ${googleProvider.name}`);
  console.log(`Configured: ${googleProvider.isConfigured()}`);

  const testQueries = [
    'sunscreen',
    'Sony headphones',
    'iPhone',
    'yoga mat',
    'Atomic Habits',
    'xyznonexistentproductquery999123'
  ];

  const searchAuditResults = [];

  for (const query of testQueries) {
    console.log(`\nTesting query: "${query}"...`);
    const t0 = Date.now();
    try {
      // Direct provider test
      let providerRawResults = [];
      let providerCalled = false;
      let providerError = null;

      if (googleProvider.isConfigured()) {
        providerCalled = true;
        try {
          providerRawResults = await googleProvider.search(query);
        } catch (pErr) {
          providerError = pErr.message;
          console.warn(`  [Provider Warning]: ${pErr.message}`);
        }
      }

      // End-to-end Search Service call
      const serviceResponse = await productSearchService.searchProducts({ query });
      const durationMs = Date.now() - t0;

      const retainedByBackend = serviceResponse.total || 0;
      const returnedByApi = serviceResponse.count || 0;
      const firstItem = serviceResponse.data?.[0];

      const record = {
        query,
        providerCalled,
        providerRawCount: providerRawResults.length,
        providerError,
        retainedByBackend,
        returnedByApi,
        durationMs,
        isCached: serviceResponse.meta?.cached || false,
        dataSource: firstItem?.dataSource || 'none',
        sampleItem: firstItem ? {
          name: firstItem.name,
          brand: firstItem.brand,
          lowestPrice: firstItem.lowestPrice,
          lowestStore: firstItem.lowestStore,
          offersCount: firstItem.offers?.length || 0,
          url: firstItem.url?.slice(0, 60) + '...',
          hasRating: firstItem.rating !== null && firstItem.rating !== undefined
        } : null
      };

      searchAuditResults.push(record);

      console.log(`  -> Provider Called: ${providerCalled}`);
      console.log(`  -> Provider Raw Results: ${providerRawResults.length}`);
      console.log(`  -> Retained by Backend: ${retainedByBackend}`);
      console.log(`  -> Data Source: ${record.dataSource}`);
      console.log(`  -> Latency: ${durationMs}ms`);
      if (firstItem) {
        console.log(`  -> First Match: "${firstItem.name}" | ₹${firstItem.lowestPrice} on ${firstItem.lowestStore}`);
      } else {
        console.log('  -> No matching products found (as expected for negative test).');
      }
    } catch (err) {
      console.error(`  -> Failed search test for "${query}":`, err.message);
      searchAuditResults.push({
        query,
        error: err.message
      });
    }
  }

  // Save audit output to json for reporting
  const reportPath = path.resolve(__dirname, '../../scratch/live_audit_report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        collections: dbCollections,
        counts: { products: productCount, users: userCount, alerts: alertCount, notifications: notifCount }
      },
      searches: searchAuditResults
    }, null, 2)
  );

  console.log('\n===============================================================');
  console.log(`  Live Audit Complete! Report saved to ${reportPath}`);
  console.log('===============================================================');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('Disconnected cleanly from MongoDB.');
  }
}

runLiveNetworkAudit().catch(err => {
  console.error('Fatal live audit error:', err);
  process.exit(1);
});

