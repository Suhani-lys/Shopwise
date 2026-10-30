/**
 * ShopWise Automated Scheduled Price Monitor
 * Periodically monitors active price drop alerts across configured shopping providers,
 * batches product lookups to avoid rate limits, accurately detects genuine price drops,
 * appends historical price observations, and triggers notifications.
 */

const { AlertDAL, ProductDAL } = require('../models/schema');
const productSearchService = require('./productSearchService');
const notificationService = require('./notificationService');
const { extractVariantSignature } = require('./productNormalizer');

class PriceMonitorService {
  constructor() {
    this.intervalMinutes = parseInt(process.env.PRICE_CHECK_INTERVAL_MINUTES || '15', 10);
    this.intervalMs = Math.max(1, this.intervalMinutes) * 60 * 1000;
    this.isCheckInProgress = false;
    this.timerId = null;
    this.lastRunAt = null;
    this.nextRunAt = null;
    this.lastStats = {
      checkedAlerts: 0,
      triggeredAlerts: 0,
      updatedAlerts: 0,
      unavailableAlerts: 0,
      durationMs: 0
    };
  }

  /**
   * Starts the background scheduler
   */
  start() {
    if (this.timerId) return;

    console.log(`[ShopWise Price Monitor] ⏱️ Initializing scheduled price monitoring (Interval: ${this.intervalMinutes} mins)...`);
    this.nextRunAt = new Date(Date.now() + this.intervalMs);

    this.timerId = setInterval(() => {
      this.runCheckCycle().catch(err => {
        console.error('[ShopWise Price Monitor Error] Unhandled cycle error:', err.message);
      });
    }, this.intervalMs);

    // Initial check cycle run 10 seconds after server boot (non-blocking)
    setTimeout(() => {
      this.runCheckCycle().catch(err => {
        console.warn('[ShopWise Price Monitor Boot Check] Warning:', err.message);
      });
    }, 10000);
  }

  /**
   * Stops the background scheduler
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      console.log('[ShopWise Price Monitor] 🛑 Scheduler stopped.');
    }
  }

  /**
   * Diagnostic status of the price monitor
   */
  getStatus() {
    return {
      running: Boolean(this.timerId),
      intervalMinutes: this.intervalMinutes,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
      isCheckInProgress: this.isCheckInProgress,
      lastStats: this.lastStats
    };
  }

  /**
   * Executes a single automated monitoring cycle across all active alerts
   */
  async runCheckCycle(userId = null) {
    if (this.isCheckInProgress) {
      console.warn('[ShopWise Price Monitor] ⚠️ Check cycle already in progress, skipping overlapping run.');
      return { skipped: true, reason: 'Already in progress' };
    }

    this.isCheckInProgress = true;
    const t0 = Date.now();
    const stats = {
      checkedAlerts: 0,
      triggeredAlerts: 0,
      updatedAlerts: 0,
      unavailableAlerts: 0,
      durationMs: 0
    };

    try {
      // 1. Fetch active alerts from persistent database
      const filter = { status: 'Active' };
      if (userId) filter.userId = userId;

      const activeAlerts = await AlertDAL.find(filter);
      stats.checkedAlerts = activeAlerts.length;

      if (activeAlerts.length === 0) {
        this.lastRunAt = new Date();
        this.nextRunAt = new Date(Date.now() + this.intervalMs);
        return { success: true, count: 0, message: 'No active alerts to monitor.' };
      }

      console.log(`[ShopWise Price Monitor] 🔍 Monitoring ${activeAlerts.length} active alerts...`);

      // 2. Group alerts by productId to batch external queries & avoid duplicate API calls
      const alertGroups = new Map();
      for (const alert of activeAlerts) {
        const key = alert.productId || alert.productName;
        if (!alertGroups.has(key)) {
          alertGroups.set(key, []);
        }
        alertGroups.get(key).push(alert);
      }

      // 3. Process each distinct product group
      for (const [groupKey, groupAlerts] of alertGroups.entries()) {
        const sampleAlert = groupAlerts[0];
        let verifiedProduct = null;

        try {
          // A. Try direct ID lookup from search service (checks cache & catalog)
          if (sampleAlert.productId) {
            verifiedProduct = await productSearchService.getProductById(sampleAlert.productId);
          }

          // B. If not found or if dynamic external item, query operational providers
          if (!verifiedProduct && sampleAlert.productName) {
            const searchRes = await productSearchService.searchProducts({
              query: sampleAlert.productName,
              limit: 5
            });

            if (searchRes.success && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
              // Find matching variant
              const sampleSig = extractVariantSignature(sampleAlert.productName);
              verifiedProduct = searchRes.data.find(cand => {
                if (cand.id === sampleAlert.productId) return true;
                const candSig = extractVariantSignature(cand.name, cand.brand);
                return candSig.variantKey === sampleSig.variantKey;
              }) || searchRes.data[0];
            }
          }
        } catch (err) {
          console.warn(`[ShopWise Price Monitor] Failed query for "${sampleAlert.productName}": ${err.message}`);
        }

        // C. Process verified results for every alert in the group
        const now = new Date();
        if (verifiedProduct && typeof verifiedProduct.lowestPrice === 'number' && verifiedProduct.lowestPrice > 0) {
          for (const alert of groupAlerts) {
            // Determine price on selected store or lowest overall store
            let targetStore = alert.selectedStore || 'All Stores';
            let storePrice = verifiedProduct.lowestPrice;
            let storeName = verifiedProduct.lowestStore || 'Online Store';
            let storeUrl = verifiedProduct.url || '';

            if (targetStore && targetStore !== 'All Stores' && Array.isArray(verifiedProduct.offers)) {
              const matchedOffer = verifiedProduct.offers.find(
                o => o.store.toLowerCase() === targetStore.toLowerCase()
              );
              if (matchedOffer) {
                storePrice = matchedOffer.price;
                storeName = matchedOffer.store;
                storeUrl = matchedOffer.url || storeUrl;
              }
            }

            const isTargetReached = storePrice <= alert.targetPrice;

            // Append historical price observation if price changed or first check
            const history = Array.isArray(alert.priceHistory) ? [...alert.priceHistory] : [];
            const lastPoint = history[history.length - 1];
            if (!lastPoint || lastPoint.price !== storePrice) {
              history.push({
                date: now,
                price: storePrice,
                store: storeName,
                source: verifiedProduct.dataSource || 'live'
              });
              // Keep maximum 30 observations per alert
              if (history.length > 30) history.shift();
            }

            const updateFields = {
              currentLowestPrice: storePrice,
              latestPrice: storePrice,
              productUrl: storeUrl || alert.productUrl,
              lastCheckedAt: now,
              priceHistory: history
            };

            if (isTargetReached) {
              // Trigger Alert
              updateFields.status = 'Triggered';
              updateFields.monitoringStatus = 'triggered';
              updateFields.triggeredAt = now;
              updateFields.lastCheckMessage = `Target reached! Price dropped to ₹${storePrice.toLocaleString('en-IN')} on ${storeName}.`;

              // Dispatch real notifications (In-App + Email)
              try {
                const notifResult = await notificationService.dispatchPriceDropTrigger({
                  alert: { ...alert, ...updateFields },
                  product: verifiedProduct,
                  latestPrice: storePrice,
                  store: storeName
                });

                updateFields.notificationStatus = notifResult.email.status;
                if (notifResult.email.status === 'sent') {
                  updateFields.notificationSentAt = now;
                } else if (notifResult.email.error) {
                  updateFields.notificationError = notifResult.email.error;
                }
              } catch (notifErr) {
                console.error('[ShopWise Price Monitor Notification Error]', notifErr.message);
                updateFields.notificationStatus = 'failed';
                updateFields.notificationError = notifErr.message;
              }

              stats.triggeredAlerts++;
            } else {
              // Price verified but target not yet reached
              updateFields.monitoringStatus = 'active';
              updateFields.lastCheckMessage = `Verified ₹${storePrice.toLocaleString('en-IN')} on ${storeName} (Target: ₹${alert.targetPrice.toLocaleString('en-IN')}).`;
              stats.updatedAlerts++;
            }

            await AlertDAL.update(alert.id, updateFields);
          }
        } else {
          // Provider could not find the product or experienced an error
          for (const alert of groupAlerts) {
            await AlertDAL.update(alert.id, {
              lastCheckedAt: now,
              monitoringStatus: 'unavailable',
              lastCheckMessage: 'Shopping providers temporarily could not verify live pricing. Retrying next cycle.'
            });
            stats.unavailableAlerts++;
          }
        }
      }

      stats.durationMs = Date.now() - t0;
      this.lastStats = stats;
      this.lastRunAt = new Date();
      this.nextRunAt = new Date(Date.now() + this.intervalMs);

      console.log(`[ShopWise Price Monitor] ✅ Cycle complete in ${stats.durationMs}ms (Checked: ${stats.checkedAlerts}, Triggered: ${stats.triggeredAlerts}, Updated: ${stats.updatedAlerts}, Unavailable: ${stats.unavailableAlerts})`);
      return { success: true, stats };
    } finally {
      this.isCheckInProgress = false;
    }
  }
}

// Export singleton instance
const priceMonitorService = new PriceMonitorService();
module.exports = priceMonitorService;
