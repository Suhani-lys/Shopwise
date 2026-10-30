/**
 * Flipkart Affiliate API Provider Adapter
 * Queries the official Flipkart Affiliate search endpoint and normalizes responses.
 */

const BaseProvider = require('./baseProvider');
const { normalizeProduct } = require('../productNormalizer');

class FlipkartProvider extends BaseProvider {
  constructor() {
    super('flipkart', 'Flipkart Affiliate API', 4000);
    this.endpoint = 'https://affiliate-api.flipkart.net/affiliate/1.0/search.json';
  }

  getRequiredEnvVars() {
    return ['FLIPKART_AFFILIATE_ID', 'FLIPKART_AFFILIATE_TOKEN'];
  }

  isConfigured() {
    const id = process.env.FLIPKART_AFFILIATE_ID;
    const token = process.env.FLIPKART_AFFILIATE_TOKEN;
    return Boolean(
      id && 
      token && 
      !id.includes('your_') && 
      !token.includes('your_')
    );
  }

  async search(query, { signal, category } = {}) {
    if (!this.isConfigured()) return [];

    const affiliateId = process.env.FLIPKART_AFFILIATE_ID.trim();
    const affiliateToken = process.env.FLIPKART_AFFILIATE_TOKEN.trim();

    const searchUrl = `${this.endpoint}?query=${encodeURIComponent(query)}&resultCount=10`;

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Fk-Affiliate-Id': affiliateId,
        'Fk-Affiliate-Token': affiliateToken,
        'Accept': 'application/json'
      },
      signal
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Flipkart Affiliate API authentication failed. Verify FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN.');
      }
      if (response.status === 429) {
        throw new Error('Flipkart Affiliate API rate limit exceeded.');
      }
      throw new Error(`Flipkart API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const productBaseInfoList = data.productInfoList || data.products || [];

    return productBaseInfoList.map(item => {
      const baseInfo = item.productBaseInfoV1 || item.productBaseInfo || item;
      const attributes = baseInfo.productAttributes || baseInfo;
      const priceObj = attributes.maximumRetailPrice || {};
      const sellingObj = attributes.sellingPrice || {};
      const imageObj = attributes.imageUrls || {};

      const highestResImage = imageObj['800x800'] || imageObj['400x400'] || Object.values(imageObj)[0] || '';

      return normalizeProduct({
        id: `fk-${baseInfo.productId || attributes.productId || Math.random().toString(36).substring(7)}`,
        name: attributes.title || attributes.productDescription || query,
        brand: attributes.productBrand || 'Flipkart Verified',
        category: attributes.productCategory || category || 'Electronics',
        price: sellingObj.amount || 0,
        mrp: priceObj.amount || sellingObj.amount || 0,
        image: highestResImage,
        url: attributes.productUrl || 'https://www.flipkart.com',
        inStock: attributes.inStock !== false,
        store: 'Flipkart',
        storeLogo: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=100&q=80',
        deliveryTime: '2-3 Business Days',
        deliveryCharge: 0,
        dataSource: 'live'
      }, 'Flipkart');
    });
  }
}

module.exports = FlipkartProvider;
