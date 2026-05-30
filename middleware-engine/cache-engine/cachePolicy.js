/**
 * SAIOF Middleware Engine - Cache Policy
 * 
 * Contains deterministic business rules that evaluate whether a request is cacheable,
 * and determines the appropriate Time-To-Live (TTL) for the cached response.
 * 
 * Redis Design: Invalidation patterns and TTL parameters produced here map directly 
 * to Redis key expiration (e.g. EXPIRE command).
 * ML Integration Design: Allows dynamic, real-time TTL overrides. An ML model can 
 * adjust TTLs based on traffic volatility (e.g. lowering TTL for highly active items 
 * to maintain fresh data, or increasing it during flash sales to prevent DB stampedes).
 */

class CachePolicy {
  /**
   * @param {Object} [options]
   * @param {number} [options.defaultTtlSec=60] - Default TTL in seconds.
   * @param {string[]} [options.cacheableMethods=['GET', 'HEAD']] - Methods allowed to cache.
   * @param {Object} [options.routeRules] - Key-value pair of path-regex to TTL. E.g. { '^/api/products': 300 }
   * @param {string[]} [options.nonCacheablePaths] - Array of regexes that should never be cached.
   */
  constructor(options = {}) {
    this.defaultTtlSec = options.defaultTtlSec || 60;
    this.cacheableMethods = (options.cacheableMethods || ['GET', 'HEAD']).map(m => m.toUpperCase());
    
    // Set up path-specific cache controls
    this.routeRules = options.routeRules || {};
    this.nonCacheablePaths = options.nonCacheablePaths || [
      '^/api/auth',
      '^/api/cart',
      '^/api/checkout',
      '^/api/users/profile',
      '^/api/orders/current'
    ];
  }

  /**
   * Evaluates cacheability and returns decision metadata.
   * 
   * @param {Object} request - Request object.
   * @param {string} request.method - HTTP method.
   * @param {string} request.url - Full path / request URL.
   * @param {Object} [request.headers] - Request headers.
   * @param {number} [dynamicTtlSec] - Optional dynamic TTL override (e.g. computed by ML engine).
   * @returns {Object} Decision object: { isCacheable: boolean, ttlSec: number, reason: string }
   */
  evaluate(request, dynamicTtlSec = null) {
    if (!request || !request.method || !request.url) {
      return { isCacheable: false, ttlSec: 0, reason: 'Invalid request payload' };
    }

    const method = request.method.toUpperCase();
    const url = request.url.toLowerCase();

    // 1. Validate HTTP Method
    if (!this.cacheableMethods.includes(method)) {
      return { isCacheable: false, ttlSec: 0, reason: `Method '${method}' is not cacheable` };
    }

    // 2. Evaluate Cache-Control headers
    if (request.headers && typeof request.headers === 'object') {
      const cacheControl = Object.keys(request.headers)
        .find(k => k.toLowerCase() === 'cache-control');
      
      if (cacheControl) {
        const val = String(request.headers[cacheControl]).toLowerCase();
        if (val.includes('no-store') || val.includes('no-cache')) {
          return { isCacheable: false, ttlSec: 0, reason: 'Cache-Control header forbids caching' };
        }
      }
    }

    // 3. Check hardcoded non-cacheable paths
    for (const pattern of this.nonCacheablePaths) {
      const regex = new RegExp(pattern);
      if (regex.test(url)) {
        return { isCacheable: false, ttlSec: 0, reason: `URL matches non-cacheable rule: ${pattern}` };
      }
    }

    // 4. Calculate TTL
    let finalTtl = typeof dynamicTtlSec === 'number' ? dynamicTtlSec : this.defaultTtlSec;

    // Apply specific route rules if dynamic override is not provided
    if (dynamicTtlSec === null) {
      for (const [pattern, ruleTtl] of Object.entries(this.routeRules)) {
        const regex = new RegExp(pattern);
        if (regex.test(url)) {
          finalTtl = ruleTtl;
          break;
        }
      }
    }

    return {
      isCacheable: true,
      ttlSec: finalTtl,
      reason: dynamicTtlSec !== null ? 'Dynamic ML override applied' : 'Passed cacheability rules'
    };
  }

  /**
   * Adds a custom non-cacheable path pattern.
   * @param {string} regexPattern - Regex string.
   */
  addNonCacheablePath(regexPattern) {
    if (!this.nonCacheablePaths.includes(regexPattern)) {
      this.nonCacheablePaths.push(regexPattern);
    }
  }

  /**
   * Registers a path-specific TTL rule.
   * @param {string} regexPattern - Regex string.
   * @param {number} ttlSec - TTL in seconds.
   */
  setRouteRule(regexPattern, ttlSec) {
    this.routeRules[regexPattern] = ttlSec;
  }
}

module.exports = {
  CachePolicy
};
