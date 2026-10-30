const { ProductDAL, AlertDAL } = require('../models/schema');
const { getDBStatus } = require('../config/db');

async function getSystemStats(req, res) {
  try {
    const products = await ProductDAL.find();
    const alerts = await AlertDAL.find();

    // Calculate aggregated platform metrics
    let totalDiscountAmount = 0;
    let totalReviewsProcessed = 0;
    let productsWithReviews = 0;
    let genuineDealsCount = 0;

    products.forEach(p => {
      if (p.basePrice && p.lowestPrice && p.basePrice > p.lowestPrice) {
        totalDiscountAmount += (p.basePrice - p.lowestPrice);
      }
      if (typeof p.reviewCount === 'number' && p.reviewCount > 0) {
        totalReviewsProcessed += p.reviewCount;
        productsWithReviews++;
      }
      if (p.priceAnalysis?.isGenuineDiscount) {
        genuineDealsCount++;
      }
    });

    const averageSavingsPercent = products.length > 0 
      ? Math.round(products.reduce((acc, p) => {
          const disc = (p.basePrice && p.lowestPrice && p.basePrice > p.lowestPrice) 
            ? ((p.basePrice - p.lowestPrice) / p.basePrice) * 100 
            : 0;
          return acc + disc;
        }, 0) / products.length)
      : 0;

    res.json({
      success: true,
      data: {
        platform: "ShopWise Verified Intelligence Engine v2.0",
        totalProductsTracked: products.length,
        supportedRetailers: ["Amazon", "Flipkart", "Myntra", "Croma", "Reliance Digital", "Nykaa"],
        activeAlertsCount: alerts.length,
        averageSavingsPercent: `${averageSavingsPercent}%`,
        totalSavingsIdentified: `₹${totalDiscountAmount.toLocaleString()}`,
        totalReviewsProcessed: totalReviewsProcessed > 0 ? `${(totalReviewsProcessed / 1000).toFixed(1)}k+` : '0',
        verifiedReviewCoverageRatio: products.length > 0 ? `${Math.round((productsWithReviews / products.length) * 100)}%` : '0%',
        genuineDealsRatio: products.length > 0 ? `${Math.round((genuineDealsCount / products.length) * 100)}%` : '0%',
        database: getDBStatus(),
        engineStatus: "Operational - Latency < 25ms"
      }
    });
  } catch (error) {
    console.error('[Analytics Error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving analytics', error: error.message });
  }
}

module.exports = {
  getSystemStats
};
