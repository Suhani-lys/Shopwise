/**
 * Amazon India Creators / Product Advertising API (PA-API v5) Provider Adapter
 * Queries Amazon India's official API and normalizes responses into ShopWise canonical schema.
 */

const crypto = require('crypto');
const BaseProvider = require('./baseProvider');
const { normalizeProduct } = require('../productNormalizer');

class AmazonProvider extends BaseProvider {
  constructor() {
    super('amazon', 'Amazon India PA-API / Creators API', 4500);
    this.host = 'webservices.amazon.in';
    this.region = process.env.AMAZON_REGION || 'eu-west-1';
    this.service = 'ProductAdvertisingAPI';
  }

  getRequiredEnvVars() {
    return ['AMAZON_ACCESS_KEY', 'AMAZON_SECRET_KEY', 'AMAZON_PARTNER_TAG'];
  }

  isConfigured() {
    const key = process.env.AMAZON_ACCESS_KEY;
    const secret = process.env.AMAZON_SECRET_KEY;
    const tag = process.env.AMAZON_PARTNER_TAG;
    return Boolean(
      key && 
      secret && 
      tag && 
      !key.includes('your_') && 
      !secret.includes('your_') && 
      !tag.includes('your_')
    );
  }

  /**
   * Helper: AWS Signature Version 4 HMAC signing
   */
  sign(key, message) {
    return crypto.createHmac('sha256', key).update(message).digest();
  }

  getSignatureKey(key, dateStamp, regionName, serviceName) {
    const kDate = this.sign('AWS4' + key, dateStamp);
    const kRegion = this.sign(kDate, regionName);
    const kService = this.sign(kRegion, serviceName);
    const kSigning = this.sign(kService, 'aws4_request');
    return kSigning;
  }

  async search(query, { signal, category } = {}) {
    if (!this.isConfigured()) return [];

    const accessKey = process.env.AMAZON_ACCESS_KEY.trim();
    const secretKey = process.env.AMAZON_SECRET_KEY.trim();
    const partnerTag = process.env.AMAZON_PARTNER_TAG.trim();

    const payload = {
      Keywords: query,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible'
      ],
      PartnerTag: partnerTag,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.in',
      ItemCount: 10
    };

    const requestBody = JSON.stringify(payload);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substr(0, 8);

    const canonicalUri = '/paapi5/searchitems';
    const canonicalQueryString = '';
    const canonicalHeaders = 
      `content-encoding:amz-1.0\n` +
      `content-type:application/json; charset=utf-8\n` +
      `host:${this.host}\n` +
      `x-amz-date:${amzDate}\n` +
      `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;

    const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
    const payloadHash = crypto.createHash('sha256').update(requestBody).digest('hex');

    const canonicalRequest = 
      `POST\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.region}/${this.service}/aws4_request`;
    const stringToSign = 
      `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

    const signingKey = this.getSignatureKey(secretKey, dateStamp, this.region, this.service);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const authorizationHeader = 
      `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`https://${this.host}${canonicalUri}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-encoding': 'amz-1.0',
        'x-amz-date': amzDate,
        'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        'Authorization': authorizationHeader
      },
      body: requestBody,
      signal
    });

    if (!response.ok) {
      const errBody = await response.text();
      if (response.status === 403 || response.status === 401) {
        throw new Error(`Amazon PA-API access denied. Verify account approvals and API keys. (${errBody})`);
      }
      throw new Error(`Amazon PA-API returned HTTP ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const items = data.SearchResult?.Items || [];

    return items.map(item => {
      const title = item.ItemInfo?.Title?.DisplayValue || query;
      const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || 'Amazon Prime';
      const priceListing = item.Offers?.Listings?.[0]?.Price;
      const savingListing = item.Offers?.Listings?.[0]?.SavingBasis;
      const imageUrl = item.Images?.Primary?.Large?.URL || '';

      const price = priceListing?.Amount || 0;
      const mrp = savingListing?.Amount || price;

      return normalizeProduct({
        id: `amz-${item.ASIN || Math.random().toString(36).substring(7)}`,
        name: title,
        brand,
        category: category || 'Electronics',
        price,
        mrp,
        image: imageUrl,
        url: item.DetailPageURL || `https://www.amazon.in/dp/${item.ASIN}?tag=${partnerTag}`,
        inStock: true,
        store: 'Amazon',
        storeLogo: 'https://images.unsplash.com/photo-1523474253243-282a0762d115?auto=format&fit=crop&w=100&q=80',
        deliveryTime: 'FREE Delivery (Prime)',
        deliveryCharge: 0,
        dataSource: 'live'
      }, 'Amazon');
    });
  }
}

module.exports = AmazonProvider;
