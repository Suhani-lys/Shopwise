const { AlertDAL, ProductDAL } = require('../models/schema');

// GET /api/alerts
async function getAlerts(req, res) {
  try {
    const query = {};

    // Filter by authenticated user or query param
    if (req.user && req.user.email) {
      query.userEmail = req.user.email;
    } else if (req.query.userEmail) {
      query.userEmail = req.query.userEmail.trim();
    }

    const alerts = await AlertDAL.find(query);
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('[Alerts GET Error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving alerts', error: error.message });
  }
}

// POST /api/alerts
async function createAlert(req, res) {
  try {
    const { productId, targetPrice } = req.body;
    let userEmail = req.body.userEmail;
    let userId = null;

    if (req.user) {
      userEmail = req.user.email;
      userId = req.user.id;
    }

    if (!productId || !targetPrice || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, targetPrice, and userEmail'
      });
    }

    const product = await ProductDAL.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const parsedTarget = parseFloat(targetPrice);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid target price greater than 0.'
      });
    }

    const isTriggeredImmediately = product.lowestPrice <= parsedTarget;

    const newAlert = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      currentLowestPrice: product.lowestPrice,
      targetPrice: parsedTarget,
      userEmail: userEmail.toLowerCase().trim(),
      userId,
      status: isTriggeredImmediately ? 'Triggered' : 'Active',
      triggeredAt: isTriggeredImmediately ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    };

    const saved = await AlertDAL.create(newAlert);

    res.status(201).json({
      success: true,
      message: isTriggeredImmediately 
        ? `Alert created! The current lowest price (₹${product.lowestPrice.toLocaleString('en-IN')}) already meets or beats your target of ₹${parsedTarget.toLocaleString('en-IN')}!`
        : `Personalized price alert successfully activated for ₹${parsedTarget.toLocaleString('en-IN')}. We will monitor Amazon, Flipkart & Myntra 24/7!`,
      data: saved
    });
  } catch (error) {
    console.error('[Alerts CREATE Error]', error);
    res.status(500).json({ success: false, message: 'Server error creating alert', error: error.message });
  }
}

// DELETE /api/alerts/:id
async function deleteAlert(req, res) {
  try {
    const { id } = req.params;

    // Optional ownership check if authenticated
    if (req.user) {
      const all = await AlertDAL.find();
      const target = all.find(a => a.id === id);
      if (target && target.userEmail && target.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
        return res.status(403).json({ success: false, message: 'You are not authorized to delete this alert.' });
      }
    }

    const removed = await AlertDAL.delete(id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({
      success: true,
      message: 'Alert cancelled successfully',
      data: removed
    });
  } catch (error) {
    console.error('[Alerts DELETE Error]', error);
    res.status(500).json({ success: false, message: 'Server error deleting alert', error: error.message });
  }
}

// PUT /api/alerts/:id
async function updateAlert(req, res) {
  try {
    const { id } = req.params;
    const { targetPrice, userEmail } = req.body;

    if (!targetPrice || isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive targetPrice'
      });
    }

    const alerts = await AlertDAL.find();
    const existing = alerts.find(a => a.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    if (req.user && existing.userEmail && existing.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this alert.' });
    }

    const parsedTarget = parseFloat(targetPrice);
    const isTriggered = (existing.currentLowestPrice || 0) <= parsedTarget;

    const updateData = {
      targetPrice: parsedTarget,
      status: isTriggered ? 'Triggered' : 'Active',
      triggeredAt: isTriggered ? (existing.triggeredAt || new Date().toISOString()) : null
    };

    if (userEmail && typeof userEmail === 'string') {
      updateData.userEmail = userEmail.trim().toLowerCase();
    }

    const updated = await AlertDAL.update(id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Alert not found for update' });
    }

    res.json({
      success: true,
      message: `Target price updated to ₹${parsedTarget.toLocaleString('en-IN')}`,
      data: updated
    });
  } catch (error) {
    console.error('[Alerts UPDATE Error]', error);
    res.status(500).json({ success: false, message: 'Server error updating alert', error: error.message });
  }
}

module.exports = {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert
};
