/**
 * Cuelinks Multi-Store Indian Affiliate Network Provider Adapter
 * Queries campaigns and product feeds for Croma, Myntra, Tata CLiQ, Nykaa, and Ajio.
 */

const BaseProvider = require('./baseProvider');
const { normalizeProduct } = require('../productNormalizer');

class CuelinksProvider extends BaseProvider {
  constructor() {
    super('cuelinks', 'Cuelinks Multi-Store Aggregator', 4000);
    this.endpoint = 'https://api.cuelinks.com/v2';
  }

  getRequiredEnvVars() {
    return ['CUELINKS_API_KEY'];
  }

  isConfigured() {
    const key = process.env.CUELINKS_API_KEY;
    return Boolean(key && !key.includes('your_'));
  }

  async search(query, { signal, category } = {}) {
    if (!this.isConfigured()) return [];

    const apiKey = process.env.CUELINKS_API_KEY.trim();
    const searchUrl = `${this.endpoint}/offers.json?search=${encodeURIComponent(query)}&page=1&per_page=10`;

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token token="${apiKey}"`,
        'Accept': 'application/json'
      },
      signal
    });

    if (!response.ok) {
      throw new Error(`Cuelinks API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const offers = data.offers || [];

    return offers.map(item => {
      const storeName = item.campaign?.name || 'Retail Partner';
      const cleanPrice = Number(item.price || item.deal_price || 0);

      return normalizeProduct({
        id: `cue-${item.id || Math.random().toString(36).substring(7)}`,
        name: item.title || query,
        brand: item.brand || storeName,
        category: category || 'Fashion',
        price: cleanPrice,
        mrp: Number(item.original_price || cleanPrice),
        image: item.image_url || '',
        url: item.url || '',
        inStock: true,
        store: storeName,
        dataSource: 'live'
      }, storeName);
    });
  }
}

module.exports = CuelinksProvider;
