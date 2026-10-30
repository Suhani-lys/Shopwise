/**
 * Smart Value Score (SVS) Engine
 * Proprietary multi-factor ranking algorithm that balances price advantage,
 * user satisfaction ratings, review trust integrity, and hardware specification value.
 */

function calculateSmartValueScore(product, userWeights = {}) {
  // Default balanced weights
  const weights = {
    priceCompetitiveness: userWeights.price || 0.35,
    ratingsAndSatisfaction: userWeights.rating || 0.25,
    reviewTrustConfidence: userWeights.trust || 0.25,
    hardwareSpecsPerRupee: userWeights.specs || 0.15
  };

  // 1. Price Competitiveness Factor (0 - 100)
  // Higher discount from base MRP and lower current price vs average gives high score
  const discountPercent = product.basePrice 
    ? Math.min(100, Math.max(0, ((product.basePrice - product.lowestPrice) / product.basePrice) * 100))
    : 20;
  const priceScore = Math.min(99, Math.max(70, Math.round(70 + (discountPercent * 0.8))));

  // 2. Rating & Satisfaction Factor (0 - 100)
  const ratingScore = Math.min(99, Math.max(60, Math.round((product.rating / 5.0) * 100)));

  // 3. Review Trust Score Factor (0 - 100)
  const trustScore = product.reviewTrustScore ? product.reviewTrustScore.score : 85;

  // 4. Specs Per Rupee (derived from category standards)
  const specsScore = product.smartValueScore?.breakdown?.hardwareSpecsPerRupee || 90;

  // Weighted Sum Calculation
  const totalWeight = weights.priceCompetitiveness + weights.ratingsAndSatisfaction + weights.reviewTrustConfidence + weights.hardwareSpecsPerRupee;
  const compositeScore = Math.round(
    (priceScore * weights.priceCompetitiveness +
     ratingScore * weights.ratingsAndSatisfaction +
     trustScore * weights.reviewTrustConfidence +
     specsScore * weights.hardwareSpecsPerRupee) / totalWeight
  );

  let tier = 'Great Value';
  if (compositeScore >= 93) tier = 'Editor\'s Choice / Top Value';
  else if (compositeScore >= 88) tier = 'High Value Pick';
  else if (compositeScore >= 80) tier = 'Recommended Standard';

  return {
    score: compositeScore,
    tier,
    breakdown: {
      priceCompetitiveness: priceScore,
      ratingsAndSatisfaction: ratingScore,
      reviewTrustConfidence: trustScore,
      hardwareSpecsPerRupee: specsScore
    },
    weightsUsed: weights,
    explanation: `Calculated ${compositeScore}/100 using customized weights (Price: ${Math.round(weights.priceCompetitiveness * 100)}%, Ratings: ${Math.round(weights.ratingsAndSatisfaction * 100)}%, Trust: ${Math.round(weights.reviewTrustConfidence * 100)}%, Specs: ${Math.round(weights.hardwareSpecsPerRupee * 100)}%).`
  };
}

module.exports = {
  calculateSmartValueScore
};
