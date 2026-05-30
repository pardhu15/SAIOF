/**
 * SAIOF Middleware Engine - Active Request Store
 * 
 * Tracks requests that are currently in-flight / executing.
 * This prevents concurrent processing of the exact same query, and acts as the state registry
 * for the duplicate checking and request merging engines.
 * 
 * Redis Design: Implements an asynchronous storage interface (using Promises).
 * In production, the default In-Memory adapter can be swapped out for a Redis adapter 
 * (e.g. using `ioredis` or `redis`) with zero changes to the consumer code.
 */

/**
 * Base abstract interface defining the contract for Active Request Stores.
 * Any future Redis-backed store must implement these asynchronous methods.
 */
class ActiveRequestStoreInterface {
  async set(key, value, ttlMs) { throw new Error('Method "set" must be implemented.'); }
  async get(key) { throw new Error('Method "get" must be implemented.'); }
  async delete(key) { throw new Error('Method "delete" must be implemented.'); }
  async has(key) { throw new Error('Method "has" must be implemented.'); }
  async list() { throw new Error('Method "list" must be implemented.'); }
  async clear() { throw new Error('Method "clear" must be implemented.'); }
}

/**
 * In-Memory Implementation of the Active Request Store.
 * Standard fallback backing store using Javascript Map.
 */
class MemoryActiveRequestStore extends ActiveRequestStoreInterface {
  constructor() {
    super();
    this.store = new Map();
    this.timeouts = new Map();
  }

  /**
   * Stores an active request with optional TTL eviction.
   * @param {string} key - Unique request signature.
   * @param {Object} value - Request metadata (timestamp, route, client info).
   * @param {number} [ttlMs] - Optional Time-To-Live in milliseconds.
   */
  async set(key, value, ttlMs) {
    this.store.set(key, {
      data: value,
      insertedAt: Date.now()
    });

    // Clear any existing timeout for this key
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }

    // Set TTL eviction if provided
    if (ttlMs && typeof ttlMs === 'number' && ttlMs > 0) {
      const timeoutId = setTimeout(() => {
        this.delete(key);
      }, ttlMs);
      // Unref the timer so it doesn't block process exit in test scripts
      if (timeoutId.unref) {
        timeoutId.unref();
      }
      this.timeouts.set(key, timeoutId);
    }
    return true;
  }

  /**
   * Retrieves active request metadata.
   * @param {string} key - Unique request signature.
   * @returns {Object|null} The stored metadata or null.
   */
  async get(key) {
    const record = this.store.get(key);
    return record ? record.data : null;
  }

  /**
   * Deletes an active request (upon request completion).
   * @param {string} key - Unique request signature.
   * @returns {boolean} True if deletion occurred.
   */
  async delete(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    return this.store.delete(key);
  }

  /**
   * Checks if a request signature is currently marked active.
   * @param {string} key - Unique request signature.
   * @returns {boolean} True if the signature is active.
   */
  async has(key) {
    return this.store.has(key);
  }

  /**
   * Lists all active request keys and metadata.
   * @returns {Object} Dictionary of key-value pairs of active requests.
   */
  async list() {
    const listObj = {};
    for (const [key, record] of this.store.entries()) {
      listObj[key] = {
        ...record.data,
        activeDurationMs: Date.now() - record.insertedAt
      };
    }
    return listObj;
  }

  /**
   * Clears all active requests and cancels their timeouts.
   */
  async clear() {
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
    this.store.clear();
    return true;
  }
}

module.exports = {
  ActiveRequestStoreInterface,
  MemoryActiveRequestStore
};
