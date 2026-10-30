/**
 * ShopWise Dynamic Product Search Service
 * Orchestrates multi-provider parallel search, TTL caching, in-flight deduplication,
 * cross-store offer merging, and multi-criteria sorting across all 6 ShopWise categories.
 */

const FlipkartProvider = require('./providers/flipkartProvider');
const AmazonProvider = require('./providers/amazonProvider');
const GoogleShoppingProvider = require('./providers/googleShoppingProvider');
const CuelinksProvider = require('./providers/cuelinksProvider');
const { LocalCatalogProvider } = require('./providers/localCatalogProvider');
const { deduplicateAndMergeProducts, inferCategory } = require('./productNormalizer');

class ProductSearchService {
  constructor() {
    this.providers = [
      new FlipkartProvider(),
      new AmazonProvider(),
      new GoogleShoppingProvider(),
      new CuelinksProvider(),
      new LocalCatalogProvider()
    ];

    // In-memory search cache with 15-minute TTL
    this.cache = new Map();
    this.cacheTTL = 15 * 60 * 1000; // 15 minutes

    // In-flight request deduplication map
    this.inFlight = new Map();

    // Live Product Pool: stores all authentic verified products discovered from live searches
    // Prevents external results from disappearing when returning to homepage or browsing
    this.liveProductPool = new Map();
    this.isPoolWarming = false;
  }

  /**
   * Returns current operational status of all registered providers
   */
  getProviderStatuses() {
    return this.providers.map(p => p.getStatus());
  }

  /**
   * Generates a unique cache key based on query and filter parameters
   */
  getCacheKey(params) {
    const q = (params.query || '').trim().toLowerCase();
    const cat = (params.category || 'All').trim().toLowerCase();
    return `search_${q}__cat_${cat}`;
  }

  /**
   * Main dynamic search execution across all operational providers
   */
  async searchProducts(params = {}) {
    // Sanitize and bound query length (max 120 chars, strip control characters)
    const rawQuery = typeof (params.query || params.search) === 'string' ? (params.query || params.search) : '';
    const query = rawQuery.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 120);
    const category = params.category && params.category !== 'All' ? String(params.category).slice(0, 50).trim() : null;
    const brand = params.brand && params.brand !== 'All' ? String(params.brand).slice(0, 50).trim() : null;
    const minPrice = params.minPrice ? Number(params.minPrice) : null;
    const maxPrice = params.maxPrice ? Number(params.maxPrice) : null;
    const minRating = params.minRating ? Number(params.minRating) : null;
    const store = params.store && params.store !== 'All' ? params.store.trim().toLowerCase() : null;
    const sort = params.sort || 'relevance';
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 50));

    const cacheKey = this.getCacheKey({ query, category });

    // 1. Check TTL Cache
    const cachedEntry = this.cache.get(cacheKey);
    const now = Date.now();
    if (cachedEntry && (now - cachedEntry.timestamp) < this.cacheTTL) {
      if (Array.isArray(cachedEntry.data)) {
        cachedEntry.data.forEach(item => {
          if (item && item.id && !this.liveProductPool.has(item.id)) {
            this.liveProductPool.set(item.id, item);
          }
        });
      }
      return this.formatResponse(cachedEntry.data, {
        query,
        category,
        brand,
        minPrice,
        maxPrice,
        minRating,
        store,
        sort,
        page,
        limit,
        cached: true,
        cachedAt: new Date(cachedEntry.timestamp).toISOString()
      });
    }

    // 2. In-flight request deduplication: reuse running Promise for identical query
    if (this.inFlight.has(cacheKey)) {
      const inFlightData = await this.inFlight.get(cacheKey);
      return this.formatResponse(inFlightData, {
        query,
        category,
        brand,
        minPrice,
        maxPrice,
        minRating,
        store,
        sort,
        page,
        limit,
        cached: false,
        cachedAt: null
      });
    }

    // 3. Initiate parallel multi-provider search
    const searchPromise = (async () => {
      // Find active external providers
      const externalProviders = this.providers.filter(p => p.id !== 'local_catalog' && p.isConfigured());
      const localProvider = this.providers.find(p => p.id === 'local_catalog');

      let combined = [];

      // If user performed an active keyword search and we have operational external providers
      if (query && query.trim() !== '' && externalProviders.length > 0) {
        // Execute all configured external providers in parallel with individual timeout isolation
        const settledResults = await Promise.allSettled(
          externalProviders.map(p => p.executeSearch(query, { category }))
        );

        settledResults.forEach((res, idx) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            combined.push(...res.value);
            // Ingest all live products into liveProductPool
            res.value.forEach(item => {
              if (item && item.id) this.liveProductPool.set(item.id, item);
            });
          } else if (res.status === 'rejected') {
            console.warn(`[ShopWise Provider Rejected] ${externalProviders[idx].name}: ${res.reason?.message}`);
          }
        });
      }

      // If query is empty (Homepage or Category Browse):
      if (!query || query.trim() === '') {
        // If liveProductPool is empty and external providers are operational, warm pool with trending Indian products once
        if (externalProviders.length > 0 && this.liveProductPool.size === 0 && !this.isPoolWarming) {
          this.isPoolWarming = true;
          try {
            const warmQuery = category ? `${category} deals india` : 'trending products deals india';
            const warmResults = await Promise.allSettled(
              externalProviders.map(p => p.executeSearch(warmQuery, { category }))
            );
            warmResults.forEach((res) => {
              if (res.status === 'fulfilled' && Array.isArray(res.value)) {
                res.value.forEach(item => {
                  if (item && item.id) this.liveProductPool.set(item.id, item);
                });
              }
            });
          } catch (err) {
            console.warn('[ShopWise Search Service] Initial warm query skipped:', err.message);
          } finally {
            this.isPoolWarming = false;
          }
        }

        // Include all live products from liveProductPool
        const poolItems = Array.from(this.liveProductPool.values());
        combined.push(...poolItems);

        // Always also consult local catalog to guarantee multi-category baseline
        if (localProvider) {
          const localResults = await localProvider.executeSearch(query, { category });
          if (Array.isArray(localResults)) {
            combined.push(...localResults);
          }
        }
      } else {
        // Active keyword search: if external providers returned 0 items, consult local catalog
        if (combined.length === 0 && localProvider) {
          const localResults = await localProvider.executeSearch(query, { category });
          if (Array.isArray(localResults)) {
            combined.push(...localResults);
          }
        }
      }

      // 4. Merge duplicate products across stores (e.g. Amazon + Flipkart same item)
      const mergedProducts = deduplicateAndMergeProducts(combined);

      // 5. Store in cache
      this.cache.set(cacheKey, {
        timestamp: now,
        data: mergedProducts
      });

      // Clean up cache periodically (keep max 200 queries)
      if (this.cache.size > 200) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

      return mergedProducts;
    })();

    this.inFlight.set(cacheKey, searchPromise);

    try {
      const mergedResults = await searchPromise;
      return this.formatResponse(mergedResults, {
        query,
        category,
        brand,
        minPrice,
        maxPrice,
        minRating,
        store,
        sort,
        page,
        limit,
        cached: false,
        cachedAt: null
      });
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  /**
   * Applies filtering, sorting, pagination, and formats JSON envelope
   */
  formatResponse(items = [], options = {}) {
    let results = [...items];

    // Filter: Category (handles subcategories like Mobiles, Laptops, Headphones -> Electronics)
    if (options.category && options.category !== 'All') {
      const targetCat = options.category.toLowerCase();
      results = results.filter(p => {
        const canonical = inferCategory(p.category, p.name).toLowerCase();
        return canonical === targetCat || (p.category || '').toLowerCase() === targetCat;
      });
    }

    // Filter: Brand
    if (options.brand && options.brand !== 'All') {
      const targetBrand = options.brand.toLowerCase();
      results = results.filter(p => (p.brand || '').toLowerCase() === targetBrand);
    }

    // Filter: Price Range
    if (options.minPrice !== null && !isNaN(options.minPrice)) {
      results = results.filter(p => (p.lowestPrice || 0) >= options.minPrice);
    }
    if (options.maxPrice !== null && !isNaN(options.maxPrice)) {
      results = results.filter(p => (p.lowestPrice || 0) <= options.maxPrice);
    }

    // Filter: Rating
    if (options.minRating !== null && !isNaN(options.minRating) && options.minRating > 0) {
      results = results.filter(p => (p.rating || 0) >= options.minRating);
    }

    // Filter: Store
    if (options.store && options.store !== 'all') {
      results = results.filter(p => {
        if ((p.lowestStore || '').toLowerCase() === options.store) return true;
        return Array.isArray(p.offers) && p.offers.some(o => (o.store || '').toLowerCase() === options.store);
      });
    }

    // Sorting
    switch (options.sort) {
      case 'priceAsc':
        results.sort((a, b) => a.lowestPrice - b.lowestPrice);
        break;
      case 'priceDesc':
        results.sort((a, b) => b.lowestPrice - a.lowestPrice);
        break;
      case 'ratingDesc':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discountDesc':
        results.sort((a, b) => {
          const discA = a.basePrice ? ((a.basePrice - a.lowestPrice) / a.basePrice) : 0;
          const discB = b.basePrice ? ((b.basePrice - b.lowestPrice) / b.basePrice) : 0;
          return discB - discA;
        });
        break;
      case 'smartValue':
      case 'bestValue':
        results.sort((a, b) => (b.smartValueScore?.score || 0) - (a.smartValueScore?.score || 0));
        break;
      case 'relevance':
      default:
        if (options.query) {
          const q = options.query.toLowerCase();
          results.sort((a, b) => {
            const aTitle = (a.name || '').toLowerCase().includes(q) ? 3 : 0;
            const bTitle = (b.name || '').toLowerCase().includes(q) ? 3 : 0;
            const aBrand = (a.brand || '').toLowerCase().includes(q) ? 2 : 0;
            const bBrand = (b.brand || '').toLowerCase().includes(q) ? 2 : 0;
            return (bTitle + bBrand) - (aTitle + aBrand);
          });
        }
        break;
    }

    const total = results.length;
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 50));
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    return {
      success: true,
      count: paginated.length,
      total,
      page,
      limit,
      query: options.query || null,
      category: options.category || 'All',
      meta: {
        cached: Boolean(options.cached),
        cachedAt: options.cachedAt,
        cacheTTLMinutes: this.cacheTTL / 60000,
        providerStatuses: this.getProviderStatuses()
      },
      data: paginated
    };
  }

  /**
   * Helper: Find a single product by ID or Slug from cache or database
   */
  async getProductById(id) {
    if (!id) return null;

    // 0. Search in live product pool
    if (this.liveProductPool.has(id)) {
      return this.liveProductPool.get(id);
    }

    // 1. Search in cached results
    for (const entry of this.cache.values()) {
      const match = entry.data.find(p => p.id === id);
      if (match) return match;
    }

    // 2. Search in local catalog
    const local = new LocalCatalogProvider();
    const results = await local.search('');
    const found = results.find(p => p.id === id);
    if (found) return found;

    return null;
  }
}

// Export singleton instance
const searchService = new ProductSearchService();
module.exports = searchService;
