/**
 * ShopWise Client API Configuration
 * Supports production environment override via VITE_API_BASE_URL.
 * In development, defaults to http://localhost:5000/api.
 * In production, defaults to /api (relative reverse proxy) unless explicitly configured.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

/**
 * Validates and sanitizes external retailer URLs
 * Ensures only http: or https: protocols are permitted (prevents javascript: XSS)
 */
export function sanitizeExternalUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const clean = url.trim();
  if (clean.startsWith('https://') || clean.startsWith('http://') || clean.startsWith('/')) {
    return clean;
  }
  return '#';
}
