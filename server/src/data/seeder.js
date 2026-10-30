const mongoose = require('mongoose');
require('dotenv').config();
const { MongoProduct } = require('../models/schema');
const seedProducts = require('./seedData.json');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopwise';

async function seedDatabase() {
  try {
    console.log(`[ShopWise Seeder] Connecting to MongoDB: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[ShopWise Seeder] MongoDB connected successfully.');

    console.log('[ShopWise Seeder] Clearing existing products collection...');
    await MongoProduct.deleteMany({});

    console.log(`[ShopWise Seeder] Inserting ${seedProducts.length} products from seedData.json...`);
    await MongoProduct.insertMany(seedProducts);

    console.log('[ShopWise Seeder] Database seeded successfully with initial product catalog!');
    process.exit(0);
  } catch (error) {
    console.error('[ShopWise Seeder Error]', error.message);
    process.exit(1);
  }
}

seedDatabase();
