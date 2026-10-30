/**
 * Base Provider Class for ShopWise Shopping Platform Adapters
 * Standardizes lifecycle, configuration checks, timeout handling, and error states.
 */

class BaseProvider {
  /**
   * @param {string} id - Identifier key (e.g. 'flipkart', 'amazon')
   * @param {string} name - Display name (e.g. 'Flipkart Affiliate API')
   * @param {number} timeoutMs - Max execution time before timing out (default 4000ms)
   */
  constructor(id, name, timeoutMs = 4000) {
    this.id = id;
    this.name = name;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Subclasses must implement to check required environment credentials
   * @returns {boolean}
   */
  isConfigured() {
    return false;
  }

  /**
   * Subclasses must declare list of required environment variable names
   * @returns {string[]}
   */
  getRequiredEnvVars() {
    return [];
  }

  /**
   * Returns current operational status and configuration diagnostics
   */
  getStatus() {
    const configured = this.isConfigured();
    const missing = this.getRequiredEnvVars().filter(key => !process.env[key]);
    return {
      id: this.id,
      name: this.name,
      configured,
      status: configured ? 'ready' : 'unconfigured',
      missingCredentials: missing,
      message: configured 
        ? `${this.name} is configured and operational.` 
        : `${this.name} credentials missing in server/.env (${missing.join(', ')}).`
    };
  }

  /**
   * Executes the provider search with an enforced timeout
   * @param {string} query
   * @param {object} options
   * @returns {Promise<Array>}
   */
  async executeSearch(query, options = {}) {
    if (!this.isConfigured()) {
      return [];
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const results = await this.search(query, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return Array.isArray(results) ? results : [];
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.warn(`[ShopWise Provider] ⏱️ ${this.name} timed out after ${this.timeoutMs}ms.`);
      } else {
        console.warn(`[ShopWise Provider Error] ⚠️ ${this.name} search failed: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Abstract search method to be implemented by vendor subclasses
   * @param {string} query
   * @param {object} options
   */
  async search(query, options) {
    throw new Error(`Method search() must be implemented by ${this.constructor.name}`);
  }
}

module.exports = BaseProvider;
