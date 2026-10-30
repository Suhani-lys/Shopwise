/**
 * ShopWise Database Seeder
 * Populates MongoDB with the product catalog from seedData.json idempotently.
 * Uses bulkWrite with upsert: true to prevent duplicate records and preserves existing collections.
 */
const mongoose = require('mongoose');
const { config, maskMongoUri } = require('../config/env');
const { MongoProduct } = require('../models/schema');
const seedProducts = require('./seedData.json');

async function seedDatabase() {
  const startTime = Date.now();
  console.log('=======================================================');
  console.log('  🌱 ShopWise Database Seeder');
  console.log(`  📡 Target: ${config.maskedMongoUri}`);
  console.log('=======================================================');

  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`[Seeder] ✅ Connected to: ${mongoose.connection.host}/${mongoose.connection.name}`);

    console.log(`[Seeder] Preparing ${seedProducts.length} products for idempotent upsert...`);

    // Build idempotent bulk operations by product ID
    const bulkOps = seedProducts.map(product => ({
      updateOne: {
        filter: { id: product.id },
        update: { $set: product },
        upsert: true
      }
    }));

    const result = await MongoProduct.bulkWrite(bulkOps, { ordered: false });

    const totalInDB = await MongoProduct.countDocuments();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('=======================================================');
    console.log('  ✅ Seeding Completed Successfully:');
    console.log(`     - Upserted (New):   ${result.upsertedCount}`);
    console.log(`     - Updated/Matched:  ${result.matchedCount}`);
    console.log(`     - Modified:         ${result.modifiedCount}`);
    console.log(`     - Total in Catalog: ${totalInDB} products`);
    console.log(`     - Time Taken:       ${duration}s`);
    console.log('=======================================================');

    await mongoose.disconnect();
    console.log('[Seeder] Disconnected cleanly from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('=======================================================');
    console.error('  ❌ Seeder Execution Failed:');
    console.error(`     Error: ${error.message}`);
    console.error('  Troubleshooting:');
    console.error('     - Check that your MongoDB Atlas cluster is online.');
    console.error('     - Check network connectivity and IP access list (0.0.0.0/0).');
    console.error('     - Verify credentials in server/.env.');
    console.error('=======================================================');
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect error
    }
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
