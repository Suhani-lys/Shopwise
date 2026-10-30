const { ProductDAL } = require('../models/schema');
const searchService = require('../services/productSearchService');
const { calculateSmartValueScore } = require('../services/smartValueService');
const { analyzeReviewTrust } = require('../services/trustScoreService');
const { generateReviewInsights } = require('../services/sentimentService');

// GET /api/products (Dynamic search across operational providers + local catalog)
async function getProducts(req, res) {
  try {
    const searchResponse = await searchService.searchProducts(req.query);
    res.json(searchResponse);
  } catch (error) {
    console.error('[Product Controller Error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving products', error: error.message });
  }
}

// GET /api/products/providers (Inspect active vs unconfigured shopping providers)
function getProviders(req, res) {
  res.json({
    success: true,
    providers: searchService.getProviderStatuses()
  });
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    let product = await searchService.getProductById(id);

    if (!product) {
      product = await ProductDAL.findById(id);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Enrich with dynamic services if needed
    const trustAnalysis = analyzeReviewTrust(product);
    const reviewInsights = generateReviewInsights(product);
    const smartValue = calculateSmartValueScore(product);

    res.json({
      success: true,
      data: {
        ...product,
        reviewTrustScore: {
          ...product.reviewTrustScore,
          ...trustAnalysis
        },
        aiReviewSummary: {
          ...product.aiReviewSummary,
          ...reviewInsights
        },
        smartValueScore: {
          ...product.smartValueScore,
          ...smartValue
        }
      }
    });
  } catch (error) {
    console.error('[Product By ID Error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving product', error: error.message });
  }
}

// POST /api/products/compare
async function compareProducts(req, res) {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of product IDs to compare' });
    }

    const selected = [];
    for (const pid of productIds) {
      let prod = await searchService.getProductById(pid);
      if (!prod) {
        prod = await ProductDAL.findById(pid);
      }
      if (prod) selected.push(prod);
    }

    if (selected.length === 0) {
      return res.status(404).json({ success: false, message: 'None of the requested products were found' });
    }

    // AI Comparative Verdict Generation
    let comparativeRecommendation = '';
    if (selected.length >= 2) {
      const p1 = selected[0];
      const p2 = selected[1];
      const priceDiff = Math.abs(p1.lowestPrice - p2.lowestPrice);
      const cheaper = p1.lowestPrice < p2.lowestPrice ? p1 : p2;
      const moreExpensive = p1.lowestPrice < p2.lowestPrice ? p2 : p1;

      const cheaperSvs = cheaper.smartValueScore?.score ? `${cheaper.smartValueScore.score}/100 Smart Value Score` : 'competitive entry pricing';
      const expensiveTrust = moreExpensive.reviewTrustScore?.isScoreAvailable ? `${moreExpensive.reviewTrustScore.score}% Review Trust Score` : 'established brand ecosystem';
      comparativeRecommendation = `ShopWise Comparison Summary: If budget and price advantage are your primary criteria, ${cheaper.name} offers the lowest entry price, saving ₹${priceDiff.toLocaleString()} with ${cheaperSvs}. On the other hand, ${moreExpensive.name} caters to buyers prioritizing ${moreExpensive.brand}'s premium specifications and ${expensiveTrust}.`;
    }

    res.json({
      success: true,
      count: selected.length,
      data: {
        products: selected,
        aiVerdict: comparativeRecommendation
      }
    });
  } catch (error) {
    console.error('[Compare Error]', error);
    res.status(500).json({ success: false, message: 'Server error comparing products', error: error.message });
  }
}

// POST /api/products/smart-rank
async function calculateCustomRank(req, res) {
  try {
    const { weights, category } = req.body;
    let products = await ProductDAL.find();

    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Recalculate smart value score for each product using custom user weights
    const reranked = products.map(product => {
      const recalculated = calculateSmartValueScore(product, weights);
      return {
        ...product,
        smartValueScore: recalculated
      };
    });

    // Sort descending by new score
    reranked.sort((a, b) => b.smartValueScore.score - a.smartValueScore.score);

    res.json({
      success: true,
      weightsApplied: weights,
      count: reranked.length,
      data: reranked
    });
  } catch (error) {
    console.error('[Smart Rank Error]', error);
    res.status(500).json({ success: false, message: 'Server error re-ranking products', error: error.message });
  }
}

module.exports = {
  getProducts,
  getProviders,
  getProductById,
  compareProducts,
  calculateCustomRank
};
