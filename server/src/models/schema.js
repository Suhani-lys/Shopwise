const mongoose = require('mongoose');
const initialSeed = require('../data/seedData.json');

// Mongoose Schemas for MongoDB mode
const OfferSchema = new mongoose.Schema({
  store: { type: String, required: true },
  storeLogo: String,
  price: { type: Number, required: true },
  mrp: Number,
  discountPercent: Number,
  deliveryCharge: { type: Number, default: 0 },
  totalCost: Number,
  deliveryTime: String,
  bankOffer: String,
  seller: String,
  sellerRating: Number,
  inStock: { type: Boolean, default: true },
  url: String
});

const PricePointSchema = new mongoose.Schema({
  date: String,
  price: Number,
  event: String
});

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  image: String,
  description: String,
  specs: mongoose.Schema.Types.Mixed,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  basePrice: Number,
  lowestPrice: Number,
  lowestStore: String,
  offers: [OfferSchema],
  priceHistory: [PricePointSchema],
  priceAnalysis: mongoose.Schema.Types.Mixed,
  aiReviewSummary: mongoose.Schema.Types.Mixed,
  reviewTrustScore: mongoose.Schema.Types.Mixed,
  smartValueScore: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const AlertSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  productName: String,
  productImage: String,
  currentLowestPrice: Number,
  targetPrice: { type: Number, required: true },
  userEmail: { type: String, required: true },
  userId: { type: String, default: null },
  status: { type: String, enum: ['Active', 'Triggered', 'Expired'], default: 'Active' },
  triggeredAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Real Mongo Models
const MongoProduct = mongoose.model('Product', ProductSchema);
const MongoAlert = mongoose.model('Alert', AlertSchema);
const MongoUser = mongoose.model('User', UserSchema);

// In-Memory / File-Persisted Fallback Store
// Deep cloned initial data so mutations don't alter seed file
let memoryProducts = JSON.parse(JSON.stringify(initialSeed));
let memoryUsers = [
  {
    id: "user-demo-1",
    name: "Demo Shopper",
    email: "student@university.edu",
    password: "$2b$10$0iJf5ZoEizv5sz3fvPU2PuLze.jsoIaWHv5JRna1rk2hsfemOdKjS", // ShopWise123!
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: "user-demo-2",
    name: "Alex Johnson",
    email: "alex@shopwise.in",
    password: "$2b$10$0iJf5ZoEizv5sz3fvPU2PuLze.jsoIaWHv5JRna1rk2hsfemOdKjS", // ShopWise123!
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

let memoryAlerts = [
  {
    id: "alert-demo-1",
    productId: "iphone-14-128gb",
    productName: "Apple iPhone 14 (128 GB)",
    productImage: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    currentLowestPrice: 49999,
    targetPrice: 48000,
    userEmail: "student@university.edu",
    userId: "user-demo-1",
    status: "Active",
    createdAt: new Date().toISOString()
  },
  {
    id: "alert-demo-2",
    productId: "samsung-galaxy-s23-5g",
    productName: "Samsung Galaxy S23 5G (128 GB)",
    productImage: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
    currentLowestPrice: 48999,
    targetPrice: 50000,
    userEmail: "mentor@college.ac.in",
    userId: null,
    status: "Triggered",
    triggeredAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

// Unified Data Access Layer (automatically branches based on connection state)
const ProductDAL = {
  find: async (query = {}) => {
    if (mongoose.connection.readyState === 1) {
      return await MongoProduct.find(query).lean();
    }
    // Filter memory products
    return memoryProducts.filter(item => {
      let matches = true;
      if (query.category && query.category !== 'All') {
        matches = matches && item.category.toLowerCase() === query.category.toLowerCase();
      }
      if (query.brand) {
        matches = matches && item.brand.toLowerCase() === query.brand.toLowerCase();
      }
      return matches;
    });
  },

  findOne: async (query) => {
    if (mongoose.connection.readyState === 1) {
      return await MongoProduct.findOne(query).lean();
    }
    return memoryProducts.find(item => {
      if (query.id) return item.id === query.id;
      if (query._id) return item.id === query._id || item._id === query._id;
      return false;
    }) || null;
  },

  findById: async (id) => {
    if (mongoose.connection.readyState === 1) {
      const prod = await MongoProduct.findOne({ id }).lean();
      if (prod) return prod;
      return await MongoProduct.findById(id).lean();
    }
    return memoryProducts.find(item => item.id === id) || null;
  },

  countDocuments: async () => {
    if (mongoose.connection.readyState === 1) {
      return await MongoProduct.countDocuments();
    }
    return memoryProducts.length;
  },

  seedMemory: (products) => {
    memoryProducts = [...products];
  }
};

const AlertDAL = {
  find: async (query = {}) => {
    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (query.userEmail) {
        filter.userEmail = query.userEmail.toLowerCase();
      }
      if (query.userId) {
        filter.userId = query.userId;
      }
      return await MongoAlert.find(filter).sort({ createdAt: -1 }).lean();
    }
    let list = [...memoryAlerts];
    if (query.userEmail) {
      const target = query.userEmail.toLowerCase();
      list = list.filter(a => a.userEmail && a.userEmail.toLowerCase() === target);
    }
    if (query.userId) {
      list = list.filter(a => a.userId === query.userId);
    }
    return list.reverse();
  },

  create: async (alertData) => {
    if (mongoose.connection.readyState === 1) {
      const created = new MongoAlert(alertData);
      return await created.save();
    }
    memoryAlerts.push(alertData);
    return alertData;
  },

  delete: async (id) => {
    if (mongoose.connection.readyState === 1) {
      return await MongoAlert.findOneAndDelete({ id });
    }
    const idx = memoryAlerts.findIndex(a => a.id === id);
    if (idx !== -1) {
      const removed = memoryAlerts.splice(idx, 1);
      return removed[0];
    }
    return null;
  },

  update: async (id, updateData) => {
    if (mongoose.connection.readyState === 1) {
      return await MongoAlert.findOneAndUpdate({ id }, updateData, { new: true }).lean();
    }
    const alert = memoryAlerts.find(a => a.id === id);
    if (alert) {
      Object.assign(alert, updateData);
      return alert;
    }
    return null;
  }
};

const UserDAL = {
  create: async (userData) => {
    if (mongoose.connection.readyState === 1) {
      const created = new MongoUser(userData);
      return await created.save();
    }
    memoryUsers.push(userData);
    return userData;
  },

  findByEmail: async (email) => {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    if (mongoose.connection.readyState === 1) {
      return await MongoUser.findOne({ email: cleanEmail }).lean();
    }
    return memoryUsers.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  findById: async (id) => {
    if (!id) return null;
    if (mongoose.connection.readyState === 1) {
      const u = await MongoUser.findOne({ id }).lean();
      if (u) return u;
      return await MongoUser.findById(id).lean();
    }
    return memoryUsers.find(u => u.id === id) || null;
  },

  find: async (query = {}) => {
    if (mongoose.connection.readyState === 1) {
      return await MongoUser.find(query).lean();
    }
    return [...memoryUsers];
  }
};

module.exports = {
  MongoProduct,
  MongoAlert,
  MongoUser,
  ProductDAL,
  AlertDAL,
  UserDAL,
  getMemoryProducts: () => memoryProducts,
  getMemoryAlerts: () => memoryAlerts,
  getMemoryUsers: () => memoryUsers
};
