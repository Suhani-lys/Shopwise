/**
 * Phase 4 Comprehensive Automated Test Suite
 * Tests Real Review Intelligence, Verifiable Trust Score, Smart Value Score, and Genuine Deal Detection
 */

const assert = require('assert');
const { generateReviewInsights, analyzeReviews } = require('./src/services/sentimentService');
const { analyzeReviewTrust } = require('./src/services/trustScoreService');
const { calculateSmartValueScore } = require('./src/services/smartValueService');
const { calculateGenuinePriceAnalysis, extractVariantSignature, normalizeProduct, deduplicateAndMergeProducts } = require('./src/services/productNormalizer');

let passCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

console.log('===============================================================');
console.log('ShopWise Phase 4: Full Verifiable Intelligence Test Suite');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: Review Text Intelligence & Real Data Boundaries
// -----------------------------------------------------------------------------
console.log('Suite 1: Real Review Intelligence & Aspect Extraction');

test('1.1 Should return hasReviewData=false when product has no review text', () => {
  const item = { id: 'p1', name: 'Sample Item', rating: 4.2, reviewCount: 150 };
  const insights = generateReviewInsights(item);
  assert.strictEqual(insights.hasReviewData, false);
  assert.strictEqual(insights.status, 'insufficient_evidence');
  assert.strictEqual(insights.positivePoints.length, 0);
  assert.strictEqual(insights.negativePoints.length, 0);
  assert.strictEqual(insights.overallSentiment, null);
  assert.ok(insights.message.includes('Not enough verified review data'));
});

test('1.2 Should not invent fictional reviews when reviews array is empty or < 3 items', () => {
  const resultEmpty = analyzeReviews([]);
  assert.strictEqual(resultEmpty.hasReviewData, false);
  assert.strictEqual(resultEmpty.positivePoints.length, 0);

  const resultTwo = analyzeReviews([
    { text: 'Great phone, really fast!', rating: 5 },
    { text: 'Battery lasts all day long.', rating: 5 }
  ]);
  assert.strictEqual(resultTwo.hasReviewData, false);
  assert.strictEqual(resultTwo.status, 'insufficient_evidence');
});

test('1.3 Should reject short or non-substantive review strings (< 10 chars)', () => {
  const shortReviews = [
    { text: 'ok', rating: 4 },
    { text: 'good', rating: 5 },
    { text: 'nice product', rating: 4 } // 12 chars, but only 1 substantive
  ];
  const analyzed = analyzeReviews(shortReviews);
  assert.strictEqual(analyzed.hasReviewData, false);
  assert.strictEqual(analyzed.evidenceCount, 1);
});

test('1.4 Should extract genuine evidence-supported pros and cons from authentic review text', () => {
  // Synthetic test fixture labeled explicitly as test data
  const testReviews = [
    { text: 'The battery backup is amazing and fast charging lasts 2 full days without any drain.', rating: 5 },
    { text: 'Superb battery life and premium build quality with durable metal finish.', rating: 5 },
    { text: 'Display is vibrant and bright OLED screen, but camera photo quality is terrible and poor.', rating: 3 },
    { text: 'Great battery performance and smooth speed. Camera is weak in low light with bad issues.', rating: 4 },
    { text: 'Love the battery endurance. However, the camera lens has poor clarity and problems.', rating: 3 }
  ];

  const analyzed = analyzeReviews(testReviews);
  assert.strictEqual(analyzed.hasReviewData, true);
  assert.strictEqual(analyzed.status, 'analyzed');
  assert.strictEqual(analyzed.evidenceCount, 5);
  // Pros should reflect battery
  assert.ok(analyzed.positivePoints.some(p => p.toLowerCase().includes('battery')));
  // Cons should reflect camera
  assert.ok(analyzed.negativePoints.some(p => p.toLowerCase().includes('camera')));
  // Overall sentiment distribution
  assert.ok(analyzed.overallSentiment.positive > 0);
  assert.ok(analyzed.overallSentiment.negative > 0);
});

test('1.5 Should preserve verified seed catalog summaries when present', () => {
  const seedItem = {
    id: 'seed-1',
    name: 'Sony WH-1000XM4',
    aiReviewSummary: {
      positivePoints: ['Industry leading noise cancellation', 'Exceptional 30-hour battery life'],
      negativePoints: ['Call quality could be crisper in windy environments'],
      overallSentiment: { positive: 88, neutral: 8, negative: 4 },
      confidence: 'High'
    }
  };
  const insights = generateReviewInsights(seedItem);
  assert.strictEqual(insights.hasReviewData, true);
  assert.strictEqual(insights.status, 'verified_catalog');
  assert.strictEqual(insights.positivePoints.length, 2);
  assert.strictEqual(insights.negativePoints.length, 1);
});

// -----------------------------------------------------------------------------
// Suite 2: Verifiable Review Trust Score
// -----------------------------------------------------------------------------
console.log('\nSuite 2: Review Trust Score & Unsupported Value Removal');

test('2.1 Should return isScoreAvailable=false when rating is missing or NaN', () => {
  const missingRating = { id: 'p2', name: 'Item Without Rating', rating: null, reviewCount: 120 };
  const result1 = analyzeReviewTrust(missingRating);
  assert.strictEqual(result1.isScoreAvailable, false);
  assert.strictEqual(result1.grade, 'Unavailable');
  assert.strictEqual(result1.confidence, 'Insufficient Data');

  const nanRating = { id: 'p2b', name: 'Item NaN Rating', rating: NaN, reviewCount: 120 };
  const result2 = analyzeReviewTrust(nanRating);
  assert.strictEqual(result2.isScoreAvailable, false);
});

test('2.2 Should return isScoreAvailable=false when review count is missing', () => {
  const missingCount = { id: 'p3', name: 'Item Without Count', rating: 4.5, reviewCount: null };
  const result = analyzeReviewTrust(missingCount);
  assert.strictEqual(result.isScoreAvailable, false);
  assert.strictEqual(result.grade, 'Unavailable');
});

test('2.3 Should mark trust score as Unavailable when sample size is inadequate (< 5 reviews)', () => {
  const tinyCount = { id: 'p4', name: 'Niche Item', rating: 5.0, reviewCount: 4 };
  const result = analyzeReviewTrust(tinyCount);
  assert.strictEqual(result.isScoreAvailable, false);
  assert.strictEqual(result.grade, 'Unavailable');
  assert.ok(result.methodology.includes('minimum of 5 recorded reviews'));
});

test('2.4 Should compute Bayesian-weighted score for valid ratings without fake 14.2% fraud claims', () => {
  const validProduct = {
    id: 'p5',
    name: 'Popular Phone',
    rating: 4.4,
    reviewCount: 4200,
    offers: [
      { store: 'Amazon', sellerRating: 4.5 },
      { store: 'Flipkart', sellerRating: 4.4 }
    ]
  };

  const trust = analyzeReviewTrust(validProduct);
  assert.strictEqual(trust.isScoreAvailable, true);
  assert.ok(typeof trust.score === 'number');
  assert.ok(trust.score >= 70 && trust.score <= 99);
  assert.strictEqual(trust.sampleTier, 'Robust Sample');
  assert.strictEqual(trust.confidence, 'High');
  // Confirm no fabricated fake-review claims
  assert.strictEqual(trust.fakeReviewsFilteredRatio, undefined);
  assert.ok(trust.methodology.includes('Bayesian rating adjustment'));
});

test('2.5 Should apply sample uncertainty penalty for preliminary samples (< 15 reviews)', () => {
  const smallSampleProduct = {
    id: 'p6',
    name: 'New Release',
    rating: 4.8,
    reviewCount: 12
  };
  const trust = analyzeReviewTrust(smallSampleProduct);
  assert.strictEqual(trust.isScoreAvailable, true);
  assert.strictEqual(trust.confidence, 'Low');
  assert.ok(trust.sampleTier.includes('< 15 ratings'));
});

test('2.6 Should evaluate cross-merchant rating consistency when multiple stores present', () => {
  const consistentStores = {
    rating: 4.5,
    reviewCount: 500,
    offers: [
      { store: 'Amazon', sellerRating: 4.5 },
      { store: 'Flipkart', sellerRating: 4.5 },
      { store: 'Croma', sellerRating: 4.6 }
    ]
  };
  const resultConsistent = analyzeReviewTrust(consistentStores);
  assert.strictEqual(resultConsistent.signals.crossMerchantVariance, 'High rating consistency across stores');

  const divergentStores = {
    rating: 4.0,
    reviewCount: 500,
    offers: [
      { store: 'Amazon', sellerRating: 4.8 },
      { store: 'Flipkart', sellerRating: 2.5 }
    ]
  };
  const resultDivergent = analyzeReviewTrust(divergentStores);
  assert.strictEqual(resultDivergent.signals.crossMerchantVariance, 'Moderate rating variance across stores');
});

// -----------------------------------------------------------------------------
// Suite 3: Smart Value Score (MCDA) & Dynamic Normalization
// -----------------------------------------------------------------------------
console.log('\nSuite 3: Smart Value Score (MCDA) & Dynamic Normalization');

test('3.1 Should dynamically exclude missing specs without defaulting to 90', () => {
  const itemNoSpecs = {
    id: 'p7',
    name: 'Simple Cotton T-Shirt',
    lowestPrice: 499,
    basePrice: 999,
    rating: 4.2,
    reviewTrustScore: { isScoreAvailable: true, score: 80 },
    specs: null // No hardware specs
  };

  const svs = calculateSmartValueScore(itemNoSpecs);
  assert.strictEqual(svs.status, 'calculated');
  assert.strictEqual(svs.breakdown.hardwareSpecsPerRupee, null);
  assert.strictEqual(svs.componentDetails.hardwareSpecsPerRupee.available, false);
  // Must use only 3 active components (Price, Rating, Trust)
  assert.strictEqual(svs.activeComponentsCount, 3);
  assert.ok(svs.explanation.includes('Missing signals (hardware specs per rupee) were excluded'));
});

test('3.2 Should ignore trivial spec placeholders like { Brand: X, Category: Y }', () => {
  const itemTrivialSpecs = {
    lowestPrice: 1500,
    basePrice: 2000,
    rating: 4.0,
    reviewTrustScore: { isScoreAvailable: true, score: 75 },
    specs: {
      Brand: 'Generic',
      Category: 'Fashion',
      Availability: 'In Stock'
    }
  };
  const svs = calculateSmartValueScore(itemTrivialSpecs);
  assert.strictEqual(svs.breakdown.hardwareSpecsPerRupee, null);
  assert.strictEqual(svs.componentDetails.hardwareSpecsPerRupee.available, false);
});

test('3.3 Should reward real technical specs when comprehensive attributes exist', () => {
  const itemWithSpecs = {
    id: 'p8',
    name: 'Gaming Laptop',
    lowestPrice: 65000,
    basePrice: 75000,
    rating: 4.5,
    reviewTrustScore: { isScoreAvailable: true, score: 85 },
    specs: {
      'Processor': 'Intel Core i7-13700H',
      'RAM': '16GB DDR5',
      'Storage': '1TB NVMe SSD',
      'Graphics': 'NVIDIA RTX 4060 8GB',
      'Display': '15.6" 144Hz IPS',
      'Battery': '80Whr'
    }
  };

  const svs = calculateSmartValueScore(itemWithSpecs);
  assert.strictEqual(svs.componentDetails.hardwareSpecsPerRupee.available, true);
  assert.strictEqual(svs.componentDetails.hardwareSpecsPerRupee.score, 90);
  assert.strictEqual(svs.activeComponentsCount, 4);
});

test('3.4 Should dynamically re-weight when trust score is unavailable', () => {
  const itemNoTrust = {
    id: 'p9',
    name: 'New Unrated Item',
    lowestPrice: 1200,
    basePrice: 2000,
    rating: 4.0,
    reviewTrustScore: { isScoreAvailable: false, score: null },
    specs: null
  };

  const svs = calculateSmartValueScore(itemNoTrust);
  assert.strictEqual(svs.status, 'calculated');
  assert.strictEqual(svs.breakdown.reviewTrustConfidence, null);
  assert.strictEqual(svs.breakdown.hardwareSpecsPerRupee, null);
  assert.strictEqual(svs.activeComponentsCount, 2); // Price + Rating only
  assert.ok(typeof svs.score === 'number' && svs.score > 0);
});

test('3.5 Should return status=insufficient_data when 0 components are available', () => {
  const emptyItem = {
    lowestPrice: 0,
    basePrice: 0,
    rating: null,
    reviewTrustScore: { isScoreAvailable: false },
    specs: null
  };
  const svs = calculateSmartValueScore(emptyItem);
  assert.strictEqual(svs.status, 'insufficient_data');
  assert.strictEqual(svs.score, null);
  assert.strictEqual(svs.tier, 'Score Unavailable');
});

// -----------------------------------------------------------------------------
// Suite 4: Genuine Deal Detection & Price History Integrity
// -----------------------------------------------------------------------------
console.log('\nSuite 4: Genuine Deal Detection & Historical Averages');

test('4.1 Should mark deal as insufficient_history when price observations < 3', () => {
  const singleHistory = [
    { date: 'Today', price: 999 }
  ];
  const analysis = calculateGenuinePriceAnalysis(singleHistory, 999, 1499);
  assert.strictEqual(analysis.isGenuineDiscount, false);
  assert.strictEqual(analysis.dealStatus, 'insufficient_history');
  assert.strictEqual(analysis.averagePrice, null);
  assert.strictEqual(analysis.currentVsAveragePercent, null);
  assert.ok(analysis.dealVerdict.includes('Insufficient price history'));
});

test('4.2 Should detect genuine deal when price is >= 8% below 3+ recorded historical average', () => {
  const multiHistory = [
    { date: '2026-08-01', price: 20000 },
    { date: '2026-09-01', price: 21000 },
    { date: '2026-10-01', price: 20500 },
    { date: '2026-10-25', price: 17000 } // current price: ~17% below average
  ];
  const analysis = calculateGenuinePriceAnalysis(multiHistory, 17000, 24000);
  assert.strictEqual(analysis.isGenuineDiscount, true);
  assert.strictEqual(analysis.dealStatus, 'all_time_low');
  assert.strictEqual(analysis.dealBadge, 'All-Time Low');
  assert.ok(analysis.averagePrice > 19000);
  assert.ok(analysis.currentVsAveragePercent <= -8);
  assert.ok(analysis.dealVerdict.includes('Genuine Deal!'));
});

test('4.3 Should not mark as genuine deal when price drop from MRP is merely standard pricing', () => {
  const steadyHistory = [
    { date: '2026-08-01', price: 1500 },
    { date: '2026-09-01', price: 1500 },
    { date: '2026-10-01', price: 1500 }
  ];
  // 1500 vs MRP 2000 is 25% off MRP, but identical to historical average!
  const analysis = calculateGenuinePriceAnalysis(steadyHistory, 1500, 2000);
  assert.strictEqual(analysis.isGenuineDiscount, false);
  assert.strictEqual(analysis.dealStatus, 'regular_price');
  assert.strictEqual(analysis.dealBadge, '25% Off MRP'); // Ordinary MRP badge, not Genuine Deal
  assert.strictEqual(analysis.currentVsAveragePercent, 0);
});

test('4.4 Should filter out corrupted or invalid historical price points', () => {
  const dirtyHistory = [
    { date: '2026-08-01', price: 1000 },
    { date: '2026-08-15', price: null },
    { date: '2026-09-01', price: -50 },
    { date: '2026-09-15', price: 'NaN' }
  ];
  // Only 1 valid point exists -> must report insufficient history
  const analysis = calculateGenuinePriceAnalysis(dirtyHistory, 900, 1200);
  assert.strictEqual(analysis.isGenuineDiscount, false);
  assert.strictEqual(analysis.dealStatus, 'insufficient_history');
});

// -----------------------------------------------------------------------------
// Suite 5: Product Variant Integrity & Cross-Store Deduplication
// -----------------------------------------------------------------------------
console.log('\nSuite 5: Product Variant Extraction & Separation');

test('5.1 Should separate phone storage variants', () => {
  const sig1 = extractVariantSignature('Apple iPhone 15 (128 GB) - Blue', 'Apple');
  const sig2 = extractVariantSignature('Apple iPhone 15 (256 GB) - Blue', 'Apple');
  assert.notStrictEqual(sig1.variantKey, sig2.variantKey);
  assert.strictEqual(sig1.storage, '128GB');
  assert.strictEqual(sig2.storage, '256GB');
});

test('5.2 Should separate laptop RAM variants', () => {
  const sig1 = extractVariantSignature('Asus Vivobook 16 8GB RAM 512GB SSD', 'Asus');
  const sig2 = extractVariantSignature('Asus Vivobook 16 16GB RAM 512GB SSD', 'Asus');
  assert.notStrictEqual(sig1.variantKey, sig2.variantKey);
  assert.strictEqual(sig1.ram, '8GBRAM');
  assert.strictEqual(sig2.ram, '16GBRAM');
});

test('5.3 Should separate display size variants', () => {
  const sig1 = extractVariantSignature('LG 43 inch 4K Smart TV', 'LG');
  const sig2 = extractVariantSignature('LG 55 inch 4K Smart TV', 'LG');
  assert.notStrictEqual(sig1.variantKey, sig2.variantKey);
  assert.strictEqual(sig1.display, '43INCH');
  assert.strictEqual(sig2.display, '55INCH');
});

test('5.4 Should merge identical model & variant offers across different stores', () => {
  const itemAmazon = normalizeProduct({
    name: 'Sony WH-1000XM5 Wireless Headphones Black',
    brand: 'Sony',
    category: 'Electronics',
    price: 26990,
    store: 'Amazon'
  }, 'Amazon');

  const itemFlipkart = normalizeProduct({
    name: 'Sony WH-1000XM5 Wireless Headphones Black',
    brand: 'Sony',
    category: 'Electronics',
    price: 25990,
    store: 'Flipkart'
  }, 'Flipkart');

  const merged = deduplicateAndMergeProducts([itemAmazon, itemFlipkart]);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].offers.length, 2);
});

// -----------------------------------------------------------------------------
// Suite 6: Full Canonical Product Normalizer Pipeline
// -----------------------------------------------------------------------------
console.log('\nSuite 6: End-to-End Product Normalizer Integration');

test('6.1 Should normalize raw provider item with transparent scores and deal analysis', () => {
  const rawItem = {
    title: 'Minimalist Stainless Steel Water Bottle 1L',
    brand: 'Milton',
    category: 'Home & Kitchen',
    price: 699,
    mrp: 999,
    rating: 4.3,
    reviewCount: 350,
    store: 'Amazon',
    url: 'https://example.com/bottle'
  };

  const product = normalizeProduct(rawItem, 'Amazon');
  assert.strictEqual(product.category, 'Home & Kitchen');
  assert.strictEqual(product.lowestPrice, 699);
  assert.strictEqual(product.priceAnalysis.dealStatus, 'insufficient_history');
  assert.strictEqual(product.reviewTrustScore.isScoreAvailable, true);
  assert.strictEqual(product.aiReviewSummary.hasReviewData, false); // No text reviews in raw item
  assert.strictEqual(product.smartValueScore.status, 'calculated');
});

console.log('\n===============================================================');
console.log(`Results: ${passCount} / ${totalCount} tests passed successfully!`);
console.log('===============================================================');
