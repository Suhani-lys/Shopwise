/**
 * Google Shopping India Live Product Aggregator Adapter
 * Queries multi-store Indian e-commerce search results (Flipkart, Amazon.in, Croma, Reliance Digital)
 * using an authorized Google Shopping search feed (e.g. SerpApi).
 */

const BaseProvider = require('./baseProvider');
const { normalizeProduct, inferCategory } = require('../productNormalizer');

class GoogleShoppingProvider extends BaseProvider {
  constructor() {
    super('google_shopping', 'Google Shopping India Aggregator', 8000);
    this.endpoint = 'https://serpapi.com/search.json';
  }

  getRequiredEnvVars() {
    return ['SERPAPI_API_KEY'];
  }

  isConfigured() {
    const key = process.env.SERPAPI_API_KEY || process.env.GOOGLE_SHOPPING_API_KEY;
    return Boolean(key && !key.includes('your_') && key.trim().length > 15);
  }

  async search(query, { signal, category } = {}) {
    if (!this.isConfigured() || !query || query.trim() === '') return [];

    const apiKey = (process.env.SERPAPI_API_KEY || process.env.GOOGLE_SHOPPING_API_KEY).trim();
    const searchUrl = `${this.endpoint}?engine=google_shopping&q=${encodeURIComponent(query)}&gl=in&hl=en&cr=countryIN&api_key=${apiKey}`;

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Google Shopping aggregator authentication failed. Check SERPAPI_API_KEY.');
      }
      throw new Error(`Google Shopping API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const results = data.shopping_results || [];

    return results.map(item => {
      // 1. Current Price Extraction
      let cleanPrice = 0;
      if (typeof item.extracted_price === 'number') {
        cleanPrice = item.extracted_price;
      } else if (item.price) {
        const match = String(item.price).match(/[0-9,.]+/);
        cleanPrice = match ? Number(match[0].replace(/,/g, '')) : 0;
      }

      // 2. Authentic MRP / Base Price Extraction (without artificial multiplier)
      let cleanMrp = cleanPrice;
      if (item.old_price) {
        const mrpMatch = String(item.old_price).match(/₹\s*([0-9,]+)/) || String(item.old_price).match(/([0-9,]+)\s*$/);
        if (mrpMatch) {
          const parsed = Number(mrpMatch[1].replace(/,/g, ''));
          if (parsed > cleanPrice) {
            cleanMrp = parsed;
          }
        }
      } else if (typeof item.extracted_old_price === 'number' && item.extracted_old_price > cleanPrice) {
        cleanMrp = item.extracted_old_price;
      }

      // 3. Store / Merchant Name
      const storeName = (item.source || 'Online Store').replace(/\.in|\.com/gi, '').trim();

      // 4. Authentic Product URL
      const productUrl = item.link || item.product_link || '';

      // 5. Authentic Rating & Review Count (pass real values or null)
      const rating = typeof item.rating === 'number' ? item.rating : null;
      const reviewCount = typeof item.reviews === 'number' ? item.reviews : null;

      // 6. Delivery details
      const deliveryTime = item.delivery || null;
      let deliveryCharge = 0;
      if (item.delivery && !/free/i.test(item.delivery)) {
        const delMatch = String(item.delivery).match(/₹\s*([0-9,]+)/);
        if (delMatch) {
          deliveryCharge = Number(delMatch[1].replace(/,/g, '')) || 0;
        }
      }

      // 7. Dynamic Category Inference
      const itemCategory = inferCategory(category || '', item.title || query);

      return normalizeProduct({
        id: `gs-${item.product_id || Math.random().toString(36).substring(7)}`,
        name: item.title || query,
        brand: item.brand || storeName,
        category: itemCategory,
        price: cleanPrice,
        mrp: cleanMrp,
        image: item.thumbnail || '',
        url: productUrl,
        inStock: true,
        store: storeName,
        rating,
        reviewCount,
        deliveryTime,
        deliveryCharge,
        dataSource: 'live'
      }, storeName);
    });
  }
}

module.exports = GoogleShoppingProvider;
