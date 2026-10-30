/**
 * ShopWise Price Drop Alert Controller
 * Manages personalized price drop alerts, ownership authorization,
 * manual monitoring triggers, pause/resume lifecycle, and deletion.
 */

const { AlertDAL, ProductDAL } = require('../models/schema');
const productSearchService = require('../services/productSearchService');
const notificationService = require('../services/notificationService');
const priceMonitorService = require('../services/priceMonitorService');

// GET /api/alerts
async function getAlerts(req, res) {
  try {
    const query = {};

    // Filter strictly by authenticated user or query param. Never return all alerts to unauthenticated callers.
    if (req.user && req.user.email) {
      query.userEmail = req.user.email.toLowerCase();
    } else if (req.query.userEmail && typeof req.query.userEmail === 'string') {
      query.userEmail = req.query.userEmail.trim().toLowerCase();
    } else {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    if (req.query.status) {
      query.status = req.query.status.trim();
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
    const { 
      productId, 
      targetPrice, 
      selectedStore = 'All Stores',
      productName: clientProductName,
      productImage: clientProductImage,
      productUrl: clientProductUrl,
      currentLowestPrice: clientCurrentPrice
    } = req.body;

    let userEmail = req.body.userEmail;
    let userId = null;

    if (req.user) {
      userEmail = req.user.email;
      userId = req.user.id;
    }

    if (!productId || !targetPrice || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, targetPrice, and userEmail.'
      });
    }

    const parsedTarget = parseFloat(targetPrice);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid target price greater than 0.'
      });
    }

    // Resolve product from persistent DB or live provider cache
    let product = await ProductDAL.findById(productId);
    if (!product) {
      product = await productSearchService.getProductById(productId);
    }

    const productName = product?.name || clientProductName || 'Tracked Product';
    const productImage = product?.image || clientProductImage || '';
    const currentPrice = Number(product?.lowestPrice || clientCurrentPrice || parsedTarget);
    const productUrl = product?.url || product?.offers?.[0]?.url || clientProductUrl || '';
    const store = selectedStore !== 'All Stores' ? selectedStore : (product?.lowestStore || 'Best Online Price');

    const isTriggeredImmediately = currentPrice > 0 && currentPrice <= parsedTarget;
    const now = new Date();

    const newAlert = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId,
      productName,
      productImage,
      productUrl,
      selectedStore,
      initialPrice: currentPrice,
      currentLowestPrice: currentPrice,
      latestPrice: currentPrice,
      targetPrice: parsedTarget,
      currency: 'INR',
      userEmail: userEmail.toLowerCase().trim(),
      userId,
      status: isTriggeredImmediately ? 'Triggered' : 'Active',
      monitoringStatus: isTriggeredImmediately ? 'triggered' : 'active',
      lastCheckMessage: isTriggeredImmediately 
        ? `Target reached immediately! Price is ₹${currentPrice.toLocaleString('en-IN')}`
        : `Monitoring active across Indian retailers. Target: ₹${parsedTarget.toLocaleString('en-IN')}`,
      lastCheckedAt: now,
      triggeredAt: isTriggeredImmediately ? now : null,
      notificationStatus: 'pending',
      priceHistory: [{
        date: now,
        price: currentPrice,
        store,
        source: product?.dataSource || 'live'
      }],
      createdAt: now
    };

    // If already at or below target, dispatch real notifications
    if (isTriggeredImmediately) {
      try {
        const notifResult = await notificationService.dispatchPriceDropTrigger({
          alert: newAlert,
          product,
          latestPrice: currentPrice,
          store
        });
        newAlert.notificationStatus = notifResult.email.status;
        if (notifResult.email.status === 'sent') {
          newAlert.notificationSentAt = now;
        } else if (notifResult.email.error) {
          newAlert.notificationError = notifResult.email.error;
        }
      } catch (err) {
        newAlert.notificationStatus = 'failed';
        newAlert.notificationError = err.message;
      }
    }

    const saved = await AlertDAL.create(newAlert);

    res.status(201).json({
      success: true,
      message: isTriggeredImmediately 
        ? `Alert created! The current lowest price (₹${currentPrice.toLocaleString('en-IN')}) already meets your target of ₹${parsedTarget.toLocaleString('en-IN')}!`
        : `Price drop alert activated for ₹${parsedTarget.toLocaleString('en-IN')}. ShopWise will monitor live prices automatically!`,
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

    const existing = await AlertDAL.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // Strict ownership authorization check
    const callerEmail = req.user?.email || (typeof req.query?.userEmail === 'string' ? req.query.userEmail.trim() : (typeof req.body?.userEmail === 'string' ? req.body.userEmail.trim() : null));
    if (!callerEmail || existing.userEmail.toLowerCase() !== callerEmail.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this alert.' });
    }

    const removed = await AlertDAL.delete(id);
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
    const { targetPrice, selectedStore, userEmail } = req.body;

    if (!targetPrice || isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive targetPrice.'
      });
    }

    const existing = await AlertDAL.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // Strict ownership authorization check
    const callerEmail = req.user?.email || (typeof req.query?.userEmail === 'string' ? req.query.userEmail.trim() : (typeof req.body?.userEmail === 'string' ? req.body.userEmail.trim() : null));
    if (!callerEmail || existing.userEmail.toLowerCase() !== callerEmail.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this alert.' });
    }

    const parsedTarget = parseFloat(targetPrice);
    const isTriggered = (existing.latestPrice || existing.currentLowestPrice || 0) <= parsedTarget;

    const updateData = {
      targetPrice: parsedTarget,
      status: isTriggered ? 'Triggered' : 'Active',
      monitoringStatus: isTriggered ? 'triggered' : 'active',
      triggeredAt: isTriggered ? (existing.triggeredAt || new Date()) : null
    };

    if (selectedStore) updateData.selectedStore = selectedStore;
    if (userEmail && typeof userEmail === 'string') updateData.userEmail = userEmail.trim().toLowerCase();

    const updated = await AlertDAL.update(id, updateData);
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

// PATCH /api/alerts/:id/pause
async function pauseAlert(req, res) {
  try {
    const { id } = req.params;
    const existing = await AlertDAL.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const callerEmail = req.user?.email || (typeof req.query?.userEmail === 'string' ? req.query.userEmail.trim() : (typeof req.body?.userEmail === 'string' ? req.body.userEmail.trim() : null));
    if (!callerEmail || existing.userEmail.toLowerCase() !== callerEmail.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to pause this alert.' });
    }

    const updated = await AlertDAL.pause(id);
    res.json({
      success: true,
      message: 'Price monitoring paused for this alert.',
      data: updated
    });
  } catch (error) {
    console.error('[Alerts PAUSE Error]', error);
    res.status(500).json({ success: false, message: 'Server error pausing alert', error: error.message });
  }
}

// PATCH /api/alerts/:id/resume
async function resumeAlert(req, res) {
  try {
    const { id } = req.params;
    const existing = await AlertDAL.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const callerEmail = req.user?.email || (typeof req.query?.userEmail === 'string' ? req.query.userEmail.trim() : (typeof req.body?.userEmail === 'string' ? req.body.userEmail.trim() : null));
    if (!callerEmail || existing.userEmail.toLowerCase() !== callerEmail.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to resume this alert.' });
    }

    const updated = await AlertDAL.resume(id);
    res.json({
      success: true,
      message: 'Price monitoring resumed. Alert is now actively tracking.',
      data: updated
    });
  } catch (error) {
    console.error('[Alerts RESUME Error]', error);
    res.status(500).json({ success: false, message: 'Server error resuming alert', error: error.message });
  }
}

// POST /api/alerts/check-now
async function checkAlertsNow(req, res) {
  try {
    const userId = req.user?.id || null;
    const result = await priceMonitorService.runCheckCycle(userId);

    res.json({
      success: true,
      message: 'On-demand price monitoring check cycle completed.',
      result
    });
  } catch (error) {
    console.error('[Alerts CHECK-NOW Error]', error);
    res.status(500).json({ success: false, message: 'Price monitoring execution failed', error: error.message });
  }
}

module.exports = {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  pauseAlert,
  resumeAlert,
  checkAlertsNow
};
