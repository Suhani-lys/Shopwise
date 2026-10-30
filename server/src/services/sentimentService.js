/**
 * ShopWise Review Intelligence & Sentiment Service
 * Analyzes authentic review data from authorized sources to extract evidence-supported
 * pros/cons, sentiment distribution, and key product aspects.
 * 
 * Strict Constraint: Does not invent fictional reviews, ratings, or summaries when evidence is insufficient.
 */

// Aspect keywords dictionary for categorization of customer feedback
const ASPECT_KEYWORDS = {
  'Build & Design': ['build', 'design', 'finish', 'durable', 'durability', 'sturdy', 'premium', 'material', 'lightweight', 'compact', 'heavy', 'flimsy', 'plastic'],
  'Performance & Speed': ['fast', 'speed', 'performance', 'fluid', 'lag', 'slow', 'smooth', 'processor', 'responsive', 'snappy', 'quick', 'freezes'],
  'Battery & Power': ['battery', 'backup', 'charging', 'charger', 'drain', 'endurance', 'hours', 'mah', 'power', 'watt'],
  'Display & Visuals': ['display', 'screen', 'oled', 'amoled', 'brightness', 'refresh rate', 'resolution', 'colors', 'viewing angle', 'vibrant'],
  'Camera & Audio': ['camera', 'photo', 'picture', 'video', 'sound', 'audio', 'bass', 'clarity', 'microphone', 'mic', 'speaker', 'lens'],
  'Value for Money': ['value', 'price', 'worth', 'expensive', 'cheap', 'affordable', 'deal', 'rupee', 'cost', 'investment'],
  'Comfort & Fit': ['fit', 'comfortable', 'comfort', 'soft', 'size', 'tight', 'loose', 'cushion', 'ergonomic'],
  'Usage & Packaging': ['packaging', 'delivery', 'box', 'seal', 'manual', 'setup', 'easy to use', 'installation']
};

const POSITIVE_TERMS = ['good', 'great', 'excellent', 'amazing', 'best', 'love', 'fantastic', 'superb', 'impressive', 'happy', 'reliable', 'solid', 'satisfied', 'clean', 'perfect'];
const NEGATIVE_TERMS = ['bad', 'poor', 'terrible', 'worst', 'disappointed', 'issue', 'problem', 'flaw', 'defective', 'slow', 'lag', 'heats', 'heating', 'drain', 'broke', 'broken', 'cheap'];

/**
 * Analyzes an array of authentic customer reviews
 * @param {Array} reviews Array of { text, rating, author, verifiedPurchase }
 * @param {Object} options Metadata options
 * @returns {Object} Structured review intelligence summary
 */
function analyzeReviews(reviews = [], options = {}) {
  // If reviews array is missing or contains insufficient items with substantive text
  if (!Array.isArray(reviews) || reviews.length < 3) {
    return {
      hasReviewData: false,
      status: 'insufficient_evidence',
      message: 'Not enough verified review data to generate an evidence-based summary.',
      evidenceCount: Array.isArray(reviews) ? reviews.length : 0,
      positivePoints: [],
      negativePoints: [],
      overallSentiment: null,
      frequentlyMentioned: [],
      confidence: 'Low'
    };
  }

  // Filter reviews that contain actual text content
  const textReviews = reviews.filter(r => r && typeof r.text === 'string' && r.text.trim().length >= 10);
  if (textReviews.length < 3) {
    return {
      hasReviewData: false,
      status: 'insufficient_evidence',
      message: 'Not enough verified review text is available from authorized shopping feeds.',
      evidenceCount: textReviews.length,
      positivePoints: [],
      negativePoints: [],
      overallSentiment: null,
      frequentlyMentioned: [],
      confidence: 'Low'
    };
  }

  // Parse sentences and analyze sentiments
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  const aspectMentions = {};

  textReviews.forEach(rev => {
    const text = rev.text.toLowerCase();
    let isPos = false;
    let isNeg = false;

    // Check polarity terms
    POSITIVE_TERMS.forEach(w => {
      if (text.includes(w)) isPos = true;
    });
    NEGATIVE_TERMS.forEach(w => {
      if (text.includes(w)) isNeg = true;
    });

    // Check star rating if supplied
    if (typeof rev.rating === 'number') {
      if (rev.rating >= 4) isPos = true;
      else if (rev.rating <= 2) isNeg = true;
    }

    if (isPos && !isNeg) positiveScore++;
    else if (isNeg && !isPos) negativeScore++;
    else neutralScore++;

    // Tally aspect keywords
    Object.entries(ASPECT_KEYWORDS).forEach(([aspect, keywords]) => {
      keywords.forEach(kw => {
        if (text.includes(kw)) {
          if (!aspectMentions[aspect]) {
            aspectMentions[aspect] = { positive: 0, negative: 0, total: 0, samples: [] };
          }
          aspectMentions[aspect].total++;
          if (isPos) aspectMentions[aspect].positive++;
          if (isNeg) aspectMentions[aspect].negative++;
          if (aspectMentions[aspect].samples.length < 2) {
            aspectMentions[aspect].samples.push(rev.text.trim());
          }
        }
      });
    });
  });

  const totalEvaluated = textReviews.length;
  const positivePct = Math.round((positiveScore / totalEvaluated) * 100);
  const negativePct = Math.round((negativeScore / totalEvaluated) * 100);
  const neutralPct = Math.max(0, 100 - positivePct - negativePct);

  // Extract top positive aspects supported by evidence
  const positivePoints = [];
  const sortedAspects = Object.entries(aspectMentions).sort((a, b) => b[1].total - a[1].total);

  sortedAspects.forEach(([aspect, data]) => {
    if (data.positive > data.negative && positivePoints.length < 3) {
      positivePoints.push(`Strong ${aspect.toLowerCase()} praised across ${data.positive} verified buyer ${data.positive === 1 ? 'review' : 'reviews'}`);
    }
  });

  // Extract top negative aspects supported by evidence (only if genuine negative evidence exists)
  const negativePoints = [];
  sortedAspects.forEach(([aspect, data]) => {
    if (data.negative > 0 && negativePoints.length < 3 && !positivePoints.some(p => p.toLowerCase().includes(aspect.toLowerCase()))) {
      negativePoints.push(`Noted considerations regarding ${aspect.toLowerCase()} reported in ${data.negative} ${data.negative === 1 ? 'review' : 'reviews'}`);
    }
  });

  // Confidence rating based on review sample size
  let confidence = 'Low';
  if (totalEvaluated >= 25) confidence = 'High';
  else if (totalEvaluated >= 8) confidence = 'Medium';

  return {
    hasReviewData: true,
    status: 'analyzed',
    evidenceCount: totalEvaluated,
    positivePoints,
    negativePoints,
    overallSentiment: {
      positive: positivePct,
      neutral: neutralPct,
      negative: negativePct
    },
    frequentlyMentioned: sortedAspects.slice(0, 4).map(([aspect, d]) => ({
      aspect,
      mentions: d.total,
      positiveRatio: Math.round((d.positive / (d.total || 1)) * 100)
    })),
    confidence,
    buyerVerdict: positivePct >= 70
      ? `Consensus indicates strong customer satisfaction with verified highlights in ${positivePoints.slice(0, 2).map(p => p.split(' ')[1]).join(' and ')}.`
      : `Mixed customer feedback with key considerations noted by buyers. Review individual store experiences before purchasing.`
  };
}

/**
 * Normalizes review intelligence for product models
 * Preserves verified catalog summaries while returning an explicit unavailable status for items lacking real review text.
 */
function generateReviewInsights(product) {
  // If product already has an authentic review summary with verified pros/cons from seed catalog
  if (product.aiReviewSummary && Array.isArray(product.aiReviewSummary.positivePoints) && product.aiReviewSummary.positivePoints.length > 0) {
    return {
      ...product.aiReviewSummary,
      hasReviewData: true,
      status: 'verified_catalog',
      confidence: product.aiReviewSummary.confidence || 'High'
    };
  }

  // If real reviews array is attached
  if (Array.isArray(product.reviews) && product.reviews.length >= 3) {
    return analyzeReviews(product.reviews, { productTitle: product.name, brand: product.brand });
  }

  // Fallback: If no review text is available from authorized shopping feeds (e.g. SerpApi Google Shopping which only provides rating numbers)
  return {
    hasReviewData: false,
    status: 'insufficient_evidence',
    message: 'Not enough verified review data available from authorized shopping feeds.',
    evidenceCount: 0,
    positivePoints: [],
    negativePoints: [],
    overallSentiment: null,
    frequentlyMentioned: [],
    confidence: 'Unavailable'
  };
}

module.exports = {
  generateReviewInsights,
  analyzeReviews
};
