const mongoose = require('mongoose');
const initialSeed = require('../data/seedData.json');

// Mongoose Schemas for Persistent MongoDB Atlas Collections
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
  id: { type: String, required: true, unique: true, index: true },
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
  id: { type: String, required: true, unique: true, index: true },
  productId: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  productImage: String,
  productUrl: String,
  selectedStore: { type: String, default: 'All Stores' },
  initialPrice: Number,
  currentLowestPrice: Number,
  latestPrice: Number,
  targetPrice: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  userEmail: { type: String, required: true, lowercase: true, index: true },
  userId: { type: String, default: null, index: true },
  status: { 
    type: String, 
    enum: ['Active', 'Triggered', 'Paused', 'Expired'], 
    default: 'Active',
    index: true 
  },
  monitoringStatus: {
    type: String,
    enum: ['active', 'paused', 'triggered', 'unavailable'],
    default: 'active'
  },
  lastCheckMessage: String,
  lastCheckedAt: Date,
  triggeredAt: Date,
  notificationStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'unconfigured'],
    default: 'pending'
  },
  notificationError: String,
  notificationSentAt: Date,
  priceHistory: [{
    date: { type: Date, default: Date.now },
    price: Number,
    store: String,
    source: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  userEmail: { type: String, required: true, lowercase: true, index: true },
  alertId: { type: String, index: true },
  productId: String,
  productName: String,
  productImage: String,
  productUrl: String,
  store: String,
  targetPrice: Number,
  currentPrice: Number,
  savingsAmount: Number,
  type: { type: String, default: 'price_drop' },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform(doc, ret) {
      delete ret.password;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compile Mongoose Models
const MongoProduct = mongoose.model('Product', ProductSchema);
const MongoAlert = mongoose.model('Alert', AlertSchema);
const MongoNotification = mongoose.model('Notification', NotificationSchema);
const MongoUser = mongoose.model('User', UserSchema);

/**
 * Helper: asserts that MongoDB connection is active
 */
function assertDBConnected(operationName = 'operation') {
  if (mongoose.connection.readyState !== 1) {
    const err = new Error(`Database connection is unavailable. Cannot execute "${operationName}" without MongoDB persistence.`);
    err.code = 'DATABASE_UNAVAILABLE';
    err.status = 503;
    throw err;
  }
}

/**
 * Persistent Product Data Access Layer (DAL)
 */
const ProductDAL = {
  find: async (query = {}) => {
    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (query.category && query.category !== 'All') {
        filter.category = new RegExp(`^${query.category}$`, 'i');
      }
      if (query.brand && query.brand !== 'All') {
        filter.brand = new RegExp(`^${query.brand}$`, 'i');
      }
      const docs = await MongoProduct.find(filter).lean();
      if (docs.length > 0) return docs;
    }
    // Read-only static fallback when MongoDB is unseeded or temporarily offline
    return initialSeed.filter(item => {
      let matches = true;
      if (query.category && query.category !== 'All') {
        matches = matches && item.category.toLowerCase() === query.category.toLowerCase();
      }
      if (query.brand && query.brand !== 'All') {
        matches = matches && item.brand.toLowerCase() === query.brand.toLowerCase();
      }
      return matches;
    });
  },

  findOne: async (query) => {
    if (mongoose.connection.readyState === 1) {
      const doc = await MongoProduct.findOne(query).lean();
      if (doc) return doc;
    }
    return initialSeed.find(item => {
      if (query.id) return item.id === query.id;
      if (query._id) return item.id === query._id;
      return false;
    }) || null;
  },

  findById: async (id) => {
    if (mongoose.connection.readyState === 1) {
      const prod = await MongoProduct.findOne({ id }).lean();
      if (prod) return prod;
      if (mongoose.Types.ObjectId.isValid(id)) {
        const byOid = await MongoProduct.findById(id).lean();
        if (byOid) return byOid;
      }
    }
    return initialSeed.find(item => item.id === id) || null;
  },

  countDocuments: async () => {
    if (mongoose.connection.readyState === 1) {
      return await MongoProduct.countDocuments();
    }
    return initialSeed.length;
  }
};

/**
 * Persistent Price Alert Data Access Layer (DAL)
 * Enforces strict MongoDB persistence to eliminate silent data loss.
 */
const AlertDAL = {
  find: async (query = {}) => {
    assertDBConnected('Fetch Alerts');
    const filter = {};
    if (query.userEmail) {
      filter.userEmail = query.userEmail.toLowerCase();
    }
    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.productId) {
      filter.productId = query.productId;
    }
    return await MongoAlert.find(filter).sort({ createdAt: -1 }).lean();
  },

  findById: async (id) => {
    assertDBConnected('Get Alert By ID');
    let alert = await MongoAlert.findOne({ id }).lean();
    if (!alert && mongoose.Types.ObjectId.isValid(id)) {
      alert = await MongoAlert.findById(id).lean();
    }
    return alert;
  },

  findActive: async () => {
    assertDBConnected('Fetch Active Alerts');
    return await MongoAlert.find({ status: 'Active' }).lean();
  },

  create: async (alertData) => {
    assertDBConnected('Create Alert');
    const created = new MongoAlert(alertData);
    const saved = await created.save();
    return saved.toObject ? saved.toObject() : saved;
  },

  delete: async (id) => {
    assertDBConnected('Delete Alert');
    let removed = await MongoAlert.findOneAndDelete({ id }).lean();
    if (!removed && mongoose.Types.ObjectId.isValid(id)) {
      removed = await MongoAlert.findByIdAndDelete(id).lean();
    }
    return removed;
  },

  update: async (id, updateData) => {
    assertDBConnected('Update Alert');
    let updated = await MongoAlert.findOneAndUpdate({ id }, updateData, { new: true }).lean();
    if (!updated && mongoose.Types.ObjectId.isValid(id)) {
      updated = await MongoAlert.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }
    return updated;
  },

  pause: async (id) => {
    assertDBConnected('Pause Alert');
    return await AlertDAL.update(id, { status: 'Paused', monitoringStatus: 'paused' });
  },

  resume: async (id) => {
    assertDBConnected('Resume Alert');
    return await AlertDAL.update(id, { status: 'Active', monitoringStatus: 'active' });
  }
};

/**
 * Persistent In-App Notifications Data Access Layer (DAL)
 */
const NotificationDAL = {
  find: async (query = {}) => {
    assertDBConnected('Fetch Notifications');
    const filter = {};
    if (query.userEmail) {
      filter.userEmail = query.userEmail.toLowerCase();
    }
    if (query.userId) {
      filter.userId = query.userId;
    }
    if (typeof query.read === 'boolean') {
      filter.read = query.read;
    }
    return await MongoNotification.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  },

  countUnread: async (userEmail) => {
    assertDBConnected('Count Unread Notifications');
    if (!userEmail) return 0;
    return await MongoNotification.countDocuments({
      userEmail: userEmail.toLowerCase(),
      read: false
    });
  },

  create: async (data) => {
    assertDBConnected('Create Notification');
    const created = new MongoNotification(data);
    const saved = await created.save();
    return saved.toObject ? saved.toObject() : saved;
  },

  markAsRead: async (id, userEmail) => {
    assertDBConnected('Mark Notification Read');
    const filter = { id };
    if (userEmail) filter.userEmail = userEmail.toLowerCase();
    return await MongoNotification.findOneAndUpdate(filter, { read: true }, { new: true }).lean();
  },

  markAllAsRead: async (userEmail) => {
    assertDBConnected('Mark All Notifications Read');
    if (!userEmail) return { modifiedCount: 0 };
    return await MongoNotification.updateMany(
      { userEmail: userEmail.toLowerCase(), read: false },
      { $set: { read: true } }
    );
  },

  delete: async (id, userEmail) => {
    assertDBConnected('Delete Notification');
    const filter = { id };
    if (userEmail) filter.userEmail = userEmail.toLowerCase();
    return await MongoNotification.findOneAndDelete(filter).lean();
  }
};

/**
 * Persistent User Authentication Data Access Layer (DAL)
 * Enforces strict MongoDB persistence for all accounts and sessions.
 */
const UserDAL = {
  create: async (userData) => {
    assertDBConnected('User Registration');
    const created = new MongoUser(userData);
    const saved = await created.save();
    return saved.toObject ? saved.toObject() : saved;
  },

  findByEmail: async (email) => {
    assertDBConnected('User Lookup by Email');
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return await MongoUser.findOne({ email: cleanEmail }).lean();
  },

  findById: async (id) => {
    assertDBConnected('User Lookup by ID');
    if (!id) return null;
    const user = await MongoUser.findOne({ id }).lean();
    if (user) return user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      return await MongoUser.findById(id).lean();
    }
    return null;
  },

  find: async (query = {}) => {
    assertDBConnected('User List');
    return await MongoUser.find(query).lean();
  }
};

module.exports = {
  MongoProduct,
  MongoAlert,
  MongoNotification,
  MongoUser,
  ProductDAL,
  AlertDAL,
  NotificationDAL,
  UserDAL,
  assertDBConnected
};
