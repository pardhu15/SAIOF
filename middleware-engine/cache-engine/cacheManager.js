/**
 * SAIOF Middleware Engine - Cache Manager
 * 
 * High-level Cache Manager that coordinates cache policies, stores/retrieves items,
 * evicts stale keys, and streams analytics.
 * 
 * Redis Design: In-memory store is abstract and completely async. Replacing the 
 * MemoryCacheStore with a Redis connection adapter is a simple configuration-level 
 * change.
 * ML Integration Design: Coordinates with CachePolicy to accept dynamic TTL instructions
 * and publishes cache statistics (e.g., hit rates) to telemetry listeners.
 */

const { generateSignature } = require('../request-manager/requestSignature');
const { CachePolicy } = require('./cachePolicy');
const { CacheMetrics } = require('./cacheMetrics');

/**
 * Standard Storage Interface contract for Cache engines.
 * Redis adapters must match this exact Promise-based signature.
 */
class CacheStoreInterface {
  async get(key) { throw new Error('Method "get" must be implemented.'); }
  async set(key, value, ttlMs) { throw new Error('Method "set" must be implemented.'); }
  async delete(key) { throw new Error('Method "delete" must be implemented.'); }
  async keys() { throw new Error('Method "keys" must be implemented.'); }
  async clear() { throw new Error('Method "clear" must be implemented.'); }
}

/**
 * High-performance, memory-bound Least-Recently-Used (LRU) Cache Store 
 * with automatic expiration checks.
 */
class MemoryCacheStore extends CacheStoreInterface {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxSize=1000] - Max cache entries allowed in memory.
   */
  constructor(options = {}) {
    super();
    this.maxSize = options.maxSize || 1000;
    this.store = new Map();
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Move to end (freshen LRU position)
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value;
  }

  async set(key, value, ttlMs) {
    // LRU eviction if full
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async keys() {
    // Return all valid, unexpired keys
    const validKeys = [];
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (!entry.expiresAt || now <= entry.expiresAt) {
        validKeys.push(key);
      } else {
        this.store.delete(key);
      }
    }
    return validKeys;
  }

  async clear() {
    this.store.clear();
    return true;
  }
}

/**
 * Cache Manager coordinating Policies, Metrics, and pluggable storage backends.
 */
class CacheManager {
  /**
   * @param {Object} [options]
   * @param {CacheStoreInterface} [options.store] - Underlying storage engine.
   * @param {CachePolicy} [options.policy] - Caching decision engine.
   * @param {CacheMetrics} [options.metrics] - Metrics logger.
   */
  constructor(options = {}) {
    this.store = options.store || new MemoryCacheStore();
    this.policy = options.policy || new CachePolicy();
    this.metrics = options.metrics || new CacheMetrics();
  }

  /**
   * Tries to get a cached item matching the request profile.
   * 
   * @param {Object} request - Request parameters.
   * @returns {Promise<*|null>} The cached value, or null if miss/bypass.
   */
  async get(request) {
    const evaluation = this.policy.evaluate(request);

    if (!evaluation.isCacheable) {
      this.metrics.recordBypass(evaluation.reason);
      return null;
    }

    const signature = generateSignature(request);
    const cachedVal = await this.store.get(signature);

    if (cachedVal !== null) {
      // Record a cache hit. In a real integration, the database latency saved 
      // can be estimated dynamically, or default to a standard 120ms multiplier.
      const estimatedSavingMs = 120;
      this.metrics.recordHit(estimatedSavingMs);
      return cachedVal;
    }

    // Cache miss
    return null;
  }

  /**
   * Sets a value in the cache store if the request is cacheable.
   * 
   * @param {Object} request - Request profile.
   * @param {*} value - Content to cache.
   * @param {number} [dbLatencyMs=0] - Datastore latency in resolving the original query.
   * @param {number} [dynamicTtlSec] - Optional dynamic TTL override (e.g. from an ML script).
   * @returns {Promise<boolean>} True if successfully cached.
   */
  async set(request, value, dbLatencyMs = 0, dynamicTtlSec = null) {
    const evaluation = this.policy.evaluate(request, dynamicTtlSec);

    if (!evaluation.isCacheable) {
      this.metrics.recordBypass(evaluation.reason);
      return false;
    }

    const signature = generateSignature(request);
    const ttlMs = evaluation.ttlSec * 1000;

    await this.store.set(signature, value, ttlMs);
    this.metrics.recordMiss(dbLatencyMs);
    return true;
  }

  /**
   * Invalidates cached items.
   * Can invalidate a specific key or match path-like keys to clear segments.
   * 
   * @param {string|RegExp} pattern - Specific request signature, or regex matching request paths.
   */
  async invalidate(pattern) {
    if (typeof pattern === 'string') {
      const deleted = await this.store.delete(pattern);
      if (deleted) {
        this.metrics.recordEviction('manual');
      }
      return deleted;
    }

    if (pattern instanceof RegExp) {
      const keys = await this.store.keys();
      let evictedCount = 0;
      for (const key of keys) {
        if (pattern.test(key)) {
          await this.store.delete(key);
          this.metrics.recordEviction('manual');
          evictedCount++;
        }
      }
      return evictedCount;
    }

    return false;
  }

  /**
   * Clears the entire cache store.
   */
  async clear() {
    await this.store.clear();
    this.metrics.reset();
    return true;
  }

  /**
   * Retrieves cache statistics and analytics metrics.
   * @returns {Object} Metric statistics.
   */
  getStats() {
    return this.metrics.getStats();
  }
}

module.exports = {
  CacheStoreInterface,
  MemoryCacheStore,
  CacheManager
};
