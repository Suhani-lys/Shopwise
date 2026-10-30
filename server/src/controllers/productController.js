const { ProductDAL } = require('../models/schema');
const { calculateSmartValueScore } = require('../services/smartValueService');
const { analyzeReviewTrust } = require('../services/trustScoreService');
const { generateReviewInsights } = require('../services/sentimentService');

// GET /api/products
async function getProducts(req, res) {
  try {
    const { search, category, brand, sort, minRating, maxPrice } = req.query;

    let products = await ProductDAL.find();

    // 1. Text Search Filter (Case-insensitive across Name, Brand, Category, Description)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (category && category !== 'All' && category !== '') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // 3. Brand Filter
    if (brand && brand !== 'All') {
      products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
    }

    // 4. Rating Filter
    if (minRating) {
      const min = parseFloat(minRating);
      if (!isNaN(min)) {
        products = products.filter(p => p.rating >= min);
      }
    }

    // 5. Max Price Filter
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        products = products.filter(p => p.lowestPrice <= max);
      }
    }

    // 6. Sorting
    switch (sort) {
      case 'priceAsc':
        products.sort((a, b) => a.lowestPrice - b.lowestPrice);
        break;
      case 'priceDesc':
        products.sort((a, b) => b.lowestPrice - a.lowestPrice);
        break;
      case 'ratingDesc':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'discountDesc':
        products.sort((a, b) => {
          const discA = a.basePrice ? ((a.basePrice - a.lowestPrice) / a.basePrice) : 0;
          const discB = b.basePrice ? ((b.basePrice - b.lowestPrice) / b.basePrice) : 0;
          return discB - discA;
        });
        break;
      case 'trustDesc':
        products.sort((a, b) => (b.reviewTrustScore?.score || 0) - (a.reviewTrustScore?.score || 0));
        break;
      case 'smartValue':
      default:
        // Sort by Smart Value Score
        products.sort((a, b) => (b.smartValueScore?.score || 0) - (a.smartValueScore?.score || 0));
        break;
    }

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('[Product Controller Error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving products', error: error.message });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await ProductDAL.findById(id);

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

    const allProducts = await ProductDAL.find();
    const selected = allProducts.filter(p => productIds.includes(p.id));

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

      comparativeRecommendation = `ShopWise AI Analysis: If budget and raw hardware value are your primary criteria, ${cheaper.name} is the superior choice, saving ₹${priceDiff.toLocaleString()} while boasting a ${cheaper.smartValueScore?.score || 90}/100 Smart Value Score. However, if you are invested in ${moreExpensive.brand}'s ecosystem or specific features, ${moreExpensive.name} remains a top-tier contender with a ${moreExpensive.reviewTrustScore?.score || 90}% Trust Score.`;
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
  getProductById,
  compareProducts,
  calculateCustomRank
};
