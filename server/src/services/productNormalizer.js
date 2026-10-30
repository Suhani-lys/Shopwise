/**
 * ShopWise Product Normalizer Service
 * Normalizes multi-vendor e-commerce payloads into ShopWise's canonical format.
 * Implements strict variant-aware product deduplication and multi-store offer aggregation.
 */

const { calculateSmartValueScore } = require('./smartValueService');
const { analyzeReviewTrust } = require('./trustScoreService');
const { generateReviewInsights } = require('./sentimentService');

// Canonical 6 categories
const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Beauty & Skincare',
  'Home & Kitchen',
  'Sports & Fitness',
  'Books & Stationery'
];

/**
 * Maps raw merchant category or product title keywords to ShopWise's 6 canonical categories
 */
function inferCategory(rawCategory = '', title = '') {
  const raw = (rawCategory || '').trim();
  const name = (title || '').trim();
  const combined = `${raw} ${name}`.toLowerCase();

  // 1. Direct canonical match if rawCategory matches one of the 6 categories exactly
  for (const cat of CATEGORIES) {
    if (raw.toLowerCase() === cat.toLowerCase()) return cat;
  }

  // 2. Electronics & Computing (Must precede Books so MacBook, Notebook PC, Chromebook are not misclassified as Books)
  if (/laptop|macbook|notebook\s*(?:pc|pro|air)?|chromebook|computer|desktop|monitor|tablet|ipad|kindle|mobile|phone|smartphone|iphone|galaxy\s*(?:s\d+|z\s*flip|z\s*fold|a\d+)?|oneplus|redmi|xiaomi|headphone|earphone|earbud|airpod|headset|audio|speaker|soundbar|smartwatch|smart\s*watch|apple\s*watch|galaxy\s*watch|television|smart\s*tv|\boled\b|\bqled\b|camera|dslr|gadget|charger|adapter|power\s*bank|hard\s*drive|ssd\b/i.test(combined)) {
    return 'Electronics';
  }

  // 3. Beauty & Skincare
  if (/beauty|skincare|serum|sunscreen|sunblock|moisturiz|lotion|cream|shampoo|conditioner|lipstick|makeup|cosmetic|perfume|fragrance|face\s*wash|cleanser|body\s*wash|hair\s*oil|toner|sheet\s*mask/i.test(combined)) {
    return 'Beauty & Skincare';
  }

  // 4. Sports & Fitness
  if (/sport|fitness|gym|yoga|dumbell|dumbbell|barbell|treadmill|exercise|protein|whey|creatine|bcaa|supplement|resistance\s*band|badminton|cricket|racket|shuttlecock|football|basketball|skipping\s*rope|sipper/i.test(combined)) {
    return 'Sports & Fitness';
  }

  // 5. Books & Stationery (Word boundaries to avoid matching macbook, notebook etc)
  if (/\b(?:book|books|novel|novels|stationery|paperback|hardcover|author|publisher|pen|pens|pencil|pencils|notepad|diary|journal|reading|biography|textbook|habits)\b/i.test(combined)) {
    return 'Books & Stationery';
  }

  // 6. Home & Kitchen
  if (/home|kitchen|cooker|blender|mixer|grinder|air\s*fryer|fryer|vacuum|cleaner|pot\b|pan\b|cookware|mattress|bedsheet|furniture|curtain|mop\b|toaster|microwave|oven|refrigerator|water\s*purifier|geyser/i.test(combined)) {
    return 'Home & Kitchen';
  }

  // 7. Fashion
  if (/fashion|clothing|apparel|shirt|t-shirt|tshirt|jeans|dress|trouser|pant|saree|kurta|kurti|shoes|shoe|sneaker|sneakers|footwear|sandal|boot|hoodie|jacket|sweater|watch|handbag|wallet/i.test(combined)) {
    return 'Fashion';
  }

  // Default fallback
  return 'Electronics';
}

/**
 * Extracts normalized model and variant signature to avoid merging different variants
 * (e.g. keeps iPhone 14 128GB and iPhone 14 256GB separate).
 */
function extractVariantSignature(title = '', brand = '') {
  const t = title.toLowerCase();

  // Storage variant extraction (e.g. 64gb, 128gb, 256gb, 512gb, 1tb)
  const storageMatch = t.match(/\b(16|32|64|128|256|512)\s*(?:gb|gigabyte)\b|\b(1|2)\s*(?:tb|terabyte)\b/i);
  const storage = storageMatch ? storageMatch[0].replace(/\s+/g, '').toUpperCase() : '';

  // RAM variant extraction (e.g. 8gb ram, 16gb ram)
  const ramMatch = t.match(/\b(4|6|8|12|16|24|32|64)\s*gb\s*ram\b/i);
  const ram = ramMatch ? ramMatch[0].replace(/\s+/g, '').toUpperCase() : '';

  // Size variant extraction (clothing / shoes / displays)
  const displayMatch = t.match(/\b(13|14|15|16|17|24|27|32|40|43|50|55|65)\s*(?:inch|"-inch|")/i);
  const display = displayMatch ? `${displayMatch[1]}INCH` : '';

  const watchSizeMatch = t.match(/\b(40|41|42|44|45|46|49)\s*mm\b/i);
  const watchSize = watchSizeMatch ? `${watchSizeMatch[1]}MM` : '';

  // Clean base name for matching: removes special chars and variant descriptors
  let cleanName = t
    .replace(new RegExp(brand.toLowerCase(), 'g'), '')
    .replace(/\b(16|32|64|128|256|512)\s*(?:gb|gigabyte)\b/gi, '')
    .replace(/\b(1|2)\s*(?:tb|terabyte)\b/gi, '')
    .replace(/\b(4|6|8|12|16|24|32|64)\s*gb\s*ram\b/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Pick first 4 significant tokens of the base model name
  const tokens = cleanName.split(' ').filter(w => w.length > 1).slice(0, 4).join(' ');

  const variantKey = [tokens, storage, ram, display, watchSize].filter(Boolean).join('_');
  return {
    variantKey,
    storage,
    ram,
    display: display || watchSize
  };
}

/**
 * Creates URL-safe identifier from title or SKU
 */
function createProductSlug(title = '', sku = '') {
  if (sku) {
    const cleanSku = sku.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    if (cleanSku.length >= 3) return cleanSku;
  }
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Calculates genuine deal status and historical average from verified multi-point observations
 * Strict Constraint: Requires at least 3 valid historical points before certifying a genuine deal.
 */
function calculateGenuinePriceAnalysis(priceHistory = [], currentPrice = 0, mrp = 0) {
  const validHistory = Array.isArray(priceHistory)
    ? priceHistory.filter(pt => pt && typeof pt.price === 'number' && !isNaN(pt.price) && pt.price > 0)
    : [];

  const effectiveMrp = mrp > currentPrice ? mrp : null;
  const discountFromMrp = effectiveMrp ? Math.round(((effectiveMrp - currentPrice) / effectiveMrp) * 100) : 0;

  // Inadequate historical observations (< 3 data points)
  if (validHistory.length < 3) {
    return {
      isGenuineDiscount: false,
      dealStatus: 'insufficient_history',
      dealBadge: discountFromMrp > 0 ? `${discountFromMrp}% Off MRP` : null,
      dealVerdict: 'Insufficient price history to verify deal genuineness (minimum 3 recorded observations required).',
      currentPrice,
      mrp: effectiveMrp,
      discountFromMrpPercent: discountFromMrp,
      averagePrice: null,
      currentVsAveragePercent: null,
      allTimeLow: null,
      allTimeHigh: null,
      observationPeriod: 'Single live price observation',
      recordedPointsCount: validHistory.length,
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate genuine historical metrics
  const prices = validHistory.map(p => p.price);
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / prices.length);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const diffPct = Math.round(((currentPrice - avg) / avg) * 100);

  // A genuine deal must be at least 8% below the legitimate multi-point historical average
  const isGenuine = diffPct <= -8;
  const isAllTimeLow = currentPrice <= min;

  const firstDate = validHistory[0].date || 'Initial Observation';
  const lastDate = validHistory[validHistory.length - 1].date || 'Latest Observation';
  const observationPeriod = `${firstDate} to ${lastDate}`;

  let dealStatus = 'regular_price';
  let dealBadge = discountFromMrp > 0 ? `${discountFromMrp}% Off MRP` : null;
  let verdict = `Current price of ₹${currentPrice.toLocaleString()} is consistent with the recorded historical average (₹${avg.toLocaleString()}).`;

  if (isGenuine) {
    dealStatus = isAllTimeLow ? 'all_time_low' : 'genuine_deal';
    dealBadge = isAllTimeLow ? 'All-Time Low' : 'Genuine Deal';
    verdict = `Genuine Deal! Current price of ₹${currentPrice.toLocaleString()} is ${Math.abs(diffPct)}% below the historical average of ₹${avg.toLocaleString()}${isAllTimeLow ? ' (matches all-time recorded low)' : ''}.`;
  } else if (diffPct > 5) {
    dealStatus = 'above_average';
    verdict = `Current price is ${diffPct}% above the historical recorded average of ₹${avg.toLocaleString()}.`;
  }

  return {
    isGenuineDiscount: isGenuine,
    dealStatus,
    dealBadge,
    dealVerdict: verdict,
    currentPrice,
    mrp: effectiveMrp,
    discountFromMrpPercent: discountFromMrp,
    averagePrice: avg,
    currentVsAveragePercent: diffPct,
    allTimeLow: min,
    allTimeHigh: max,
    observationPeriod,
    recordedPointsCount: validHistory.length,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Normalizes a single provider item into ShopWise's canonical format
 */
function normalizeProduct(raw = {}, providerName = 'Store') {
  const title = (raw.name || raw.title || 'Product').trim();
  const brand = (raw.brand || raw.merchant || 'General').trim();
  const category = inferCategory(raw.category, title);
  const currentPrice = Math.max(0, Number(raw.price || raw.lowestPrice || raw.currentPrice || 0));
  const mrp = Math.max(currentPrice, Number(raw.mrp || raw.basePrice || raw.originalPrice || currentPrice));
  
  const discountPercent = mrp > currentPrice 
    ? Math.round(((mrp - currentPrice) / mrp) * 100) 
    : (Number(raw.discountPercent) || 0);

  const deliveryCharge = Number(raw.deliveryCharge !== undefined ? raw.deliveryCharge : 0);
  const totalCost = currentPrice + deliveryCharge;
  const storeName = raw.store || providerName;
  const productUrl = raw.url || raw.productUrl || raw.affiliateUrl || 'https://www.google.com/search?q=' + encodeURIComponent(title);
  const inStock = raw.inStock !== undefined ? Boolean(raw.inStock) : true;
  const rating = raw.rating !== undefined && raw.rating !== null ? Math.min(5, Math.max(0, Number(raw.rating))) : null;
  const reviewCount = raw.reviewCount !== undefined && raw.reviewCount !== null ? Math.max(0, Number(raw.reviewCount)) : null;

  const id = raw.id || createProductSlug(title, raw.sku || raw.asin || raw.productId);
  const image = raw.image || raw.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';

  const singleOffer = {
    store: storeName,
    storeLogo: raw.storeLogo || '',
    price: currentPrice,
    mrp,
    discountPercent,
    deliveryCharge,
    totalCost,
    deliveryTime: raw.deliveryTime || null,
    bankOffer: raw.bankOffer || (currentPrice > 10000 ? 'Instant 5-10% Bank Discount Available' : 'Standard Payment Offers Apply'),
    seller: raw.seller || storeName,
    sellerRating: raw.sellerRating ? Number(raw.sellerRating) : 4.5,
    inStock,
    url: productUrl
  };

  const initialOffers = Array.isArray(raw.offers) && raw.offers.length > 0 ? raw.offers : [singleOffer];

  // Base canonical product object
  const canonical = {
    id,
    name: title,
    brand,
    category,
    image,
    url: productUrl,
    description: raw.description || `${brand} ${title} available with price comparison across Indian shopping stores.`,
    specs: raw.specs || null,
    rating,
    reviewCount,
    basePrice: mrp,
    lowestPrice: currentPrice,
    lowestStore: storeName,
    offers: initialOffers,
    priceHistory: Array.isArray(raw.priceHistory) && raw.priceHistory.length > 0 ? raw.priceHistory : [
      { date: 'Today', price: currentPrice, event: 'Live Tracked' }
    ],
    dataSource: raw.dataSource || 'live',
    sourceUpdatedAt: raw.sourceUpdatedAt || new Date().toISOString()
  };

  // Calculate genuine price analysis
  canonical.priceAnalysis = calculateGenuinePriceAnalysis(canonical.priceHistory, currentPrice, mrp);

  // Attach enriched AI services with transparent signals
  try {
    canonical.reviewTrustScore = analyzeReviewTrust(canonical);
    canonical.aiReviewSummary = generateReviewInsights(canonical);
    canonical.smartValueScore = calculateSmartValueScore(canonical);
  } catch (err) {
    console.warn(`[ShopWise Enrichment Warning] ${canonical.id}:`, err.message);
  }

  return canonical;
}

/**
 * Merges equivalent products across multiple providers into a single unified
 * product card containing multi-store offers, while preserving variant separation.
 */
function deduplicateAndMergeProducts(products = []) {
  if (!Array.isArray(products) || products.length === 0) return [];

  const grouped = new Map();

  for (const product of products) {
    const { variantKey } = extractVariantSignature(product.name, product.brand);
    const groupKey = `${(product.brand || 'gen').toLowerCase()}___${(product.category || 'cat').toLowerCase()}___${variantKey}`;

    if (!grouped.has(groupKey)) {
      // Clone product
      grouped.set(groupKey, {
        ...product,
        offers: [...(product.offers || [])]
      });
    } else {
      const existing = grouped.get(groupKey);

      // Merge offers from this vendor
      for (const newOffer of (product.offers || [])) {
        const existingOfferIndex = existing.offers.findIndex(
          o => o.store.toLowerCase() === newOffer.store.toLowerCase()
        );

        if (existingOfferIndex === -1) {
          existing.offers.push(newOffer);
        } else if (newOffer.price < existing.offers[existingOfferIndex].price) {
          // If the new offer from the same store is cheaper, replace it
          existing.offers[existingOfferIndex] = newOffer;
        }
      }

      // Sort offers by total cost ascending
      existing.offers.sort((a, b) => (a.totalCost || a.price) - (b.totalCost || b.price));

      // Update lowest price and store
      const bestOffer = existing.offers[0];
      if (bestOffer && bestOffer.price < existing.lowestPrice) {
        existing.lowestPrice = bestOffer.price;
        existing.lowestStore = bestOffer.store;
        existing.url = bestOffer.url || existing.url;
      }

      // Merge highest base price / MRP
      if (product.basePrice && product.basePrice > existing.basePrice) {
        existing.basePrice = product.basePrice;
      }

      // If existing was sample and new one is live, upgrade dataSource
      if (existing.dataSource === 'sample' && product.dataSource === 'live') {
        existing.dataSource = 'live';
        existing.sourceUpdatedAt = product.sourceUpdatedAt;
      }

      // Recalculate smart value score with the improved lowest price
      try {
        existing.smartValueScore = calculateSmartValueScore(existing);
      } catch {
        // preserve previous score
      }
    }
  }

  return Array.from(grouped.values());
}

module.exports = {
  CATEGORIES,
  inferCategory,
  extractVariantSignature,
  normalizeProduct,
  deduplicateAndMergeProducts,
  createProductSlug,
  calculateGenuinePriceAnalysis
};
