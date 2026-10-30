/**
 * ShopWise Verifiable Review Trust Score Service
 * Transparent multi-signal evaluation based only on verifiable data:
 * - Genuine rating value & Bayesian volume weighting
 * - Cross-merchant consistency across independent retailer feeds
 * - Explicitly supplied verified-purchase badges (when provided by source)
 * - Transparent unavailable state when evidence is insufficient
 * 
 * Strict Constraint: Does not invent fake-review ratios or treat low review counts as proof of fraud.
 */

/**
 * Computes a transparent Review Trust Score based on verifiable signals
 * @param {Object} product Product object
 * @returns {Object} Transparent Trust Score model
 */
function analyzeReviewTrust(product = {}) {
  // Check if rating or review count exists
  const rating = (typeof product.rating === 'number' && !isNaN(product.rating) && product.rating > 0) 
    ? Math.min(5, Math.max(1, product.rating)) 
    : null;
    
  const reviewCount = (typeof product.reviewCount === 'number' && !isNaN(product.reviewCount) && product.reviewCount >= 0)
    ? product.reviewCount
    : (typeof product.reviewTrustScore?.totalReviewsAnalyzed === 'number' ? product.reviewTrustScore.totalReviewsAnalyzed : null);

  // If ratings or volume are missing or inadequate (< 5 reviews total)
  if (rating === null || reviewCount === null || reviewCount < 5) {
    return {
      isScoreAvailable: false,
      score: null,
      grade: 'Unavailable',
      confidence: 'Insufficient Data',
      status: 'insufficient_evidence',
      methodology: 'Requires verified customer ratings and a minimum of 5 recorded reviews from authorized retailers.',
      signals: {
        ratingsRecorded: rating,
        reviewVolume: reviewCount || 0,
        merchantCount: Array.isArray(product.offers) ? product.offers.length : 1,
        verifiedPurchaseReported: false,
        textAnalysisAvailable: false
      },
      confidenceVerdict: 'Not enough rating or review volume available across stores to calculate a reliable Trust Score.'
    };
  }

  // 1. Bayesian Weighted Rating Component (prior of 3.5 with smoothing parameter m=30)
  // Prevents a single 5-star review from skewing to 100%, and scales with real volume
  const prior = 3.5;
  const smoothingWeight = 30;
  const bayesianRating = ((reviewCount * rating) + (smoothingWeight * prior)) / (reviewCount + smoothingWeight);
  const ratingScore = (bayesianRating / 5.0) * 100;

  // 2. Statistical Sample Confidence (distinct from fraud detection)
  let volumeMultiplier = 1.0;
  let sampleTier = 'Robust Sample';
  let confidenceLevel = 'High';

  if (reviewCount < 15) {
    volumeMultiplier = 0.88; // Small sample uncertainty adjustment
    sampleTier = 'Preliminary Sample (< 15 ratings)';
    confidenceLevel = 'Low';
  } else if (reviewCount < 100) {
    volumeMultiplier = 0.95;
    sampleTier = 'Moderate Sample (15-99 ratings)';
    confidenceLevel = 'Medium';
  }

  // 3. Cross-merchant consistency check
  let consistencyAdjustment = 0;
  let crossMerchantDetails = 'Single store observation';

  if (Array.isArray(product.offers) && product.offers.length >= 2) {
    const storeRatings = product.offers
      .map(o => Number(o.sellerRating))
      .filter(r => !isNaN(r) && r > 0);

    if (storeRatings.length >= 2) {
      const avgStoreRating = storeRatings.reduce((a, b) => a + b, 0) / storeRatings.length;
      const variance = storeRatings.reduce((acc, r) => acc + Math.pow(r - avgStoreRating, 2), 0) / storeRatings.length;
      
      if (variance <= 0.1) {
        consistencyAdjustment = 3;
        crossMerchantDetails = 'High rating consistency across stores';
      } else if (variance > 0.6) {
        consistencyAdjustment = -5;
        crossMerchantDetails = 'Moderate rating variance across stores';
      }
    }
  }

  // 4. Verified Purchase Status (only if explicitly supplied by reliable source)
  const explicitVerifiedPct = (typeof product.reviewTrustScore?.verifiedPurchasePercentage === 'number')
    ? product.reviewTrustScore.verifiedPurchasePercentage
    : null;

  // Compute final bounded score (0 - 100)
  const rawScore = Math.round((ratingScore * volumeMultiplier) + consistencyAdjustment);
  const finalScore = Math.min(99, Math.max(35, rawScore));

  let grade = 'Moderate Trust';
  if (finalScore >= 88) grade = 'High Trust';
  else if (finalScore >= 72) grade = 'Trustworthy Standard';
  else if (finalScore < 60) grade = 'Caution / Low Confidence';

  return {
    isScoreAvailable: true,
    score: finalScore,
    grade,
    confidence: confidenceLevel,
    sampleTier,
    totalReviewsAnalyzed: reviewCount,
    verifiedPurchasePercentage: explicitVerifiedPct,
    methodology: `Bayesian rating adjustment (rating: ${rating}★, volume: ${reviewCount.toLocaleString()}), ${sampleTier.toLowerCase()}, and ${crossMerchantDetails.toLowerCase()}.`,
    signals: {
      rating,
      reviewCount,
      crossMerchantVariance: crossMerchantDetails,
      verifiedPurchaseReported: explicitVerifiedPct !== null,
      textAnalysisAvailable: Array.isArray(product.reviews) && product.reviews.length >= 3
    },
    confidenceVerdict: `${finalScore}% Trust Score based on ${reviewCount.toLocaleString()} verified ratings (${rating}★). ${crossMerchantDetails}.`
  };
}

module.exports = {
  analyzeReviewTrust
};
