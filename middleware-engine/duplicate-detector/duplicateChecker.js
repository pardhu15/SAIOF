/**
 * SAIOF Middleware Engine - Duplicate Checker
 * 
 * Screens incoming requests for duplicates to prevent race conditions,
 * double database writes, or server retry-storms.
 * 
 * Supports two duplicate detection strategies:
 * 1. Concurrent Duplicates: Checks if the request is already in-flight (tracked in the active requests store).
 * 2. Sequential Duplicates: Checks if the request was submitted within a rapid sliding window threshold (sliding lock).
 * 
 * Redis Design: Storage of sliding-window locks uses standard Redis keys with an EX (expire) parameter 
 * and NX (set if not exists) atomic constraints. All methods are asynchronous.
 * ML Integration Design: Delivers telemetry events. An ML model can inspect the rate and source
 * of duplicates to distinguish between legitimate network-retry glitches and bot-based scraper storms.
 */

const { generateSignature } = require('../request-manager/requestSignature');
const { MemoryActiveRequestStore } = require('../request-manager/activeRequestStore');
const { DuplicateMetrics } = require('./duplicateMetrics');

class DuplicateChecker {
  /**
   * @param {Object} [options]
   * @param {ActiveRequestStoreInterface} [options.activeStore] - Active requests store.
   * @param {number} [options.slidingWindowMs=2000] - Default sliding window in milliseconds.
   * @param {DuplicateMetrics} [options.metrics] - Metrics logger.
   */
  constructor(options = {}) {
    this.activeStore = options.activeStore || new MemoryActiveRequestStore();
    this.slidingWindowMs = options.slidingWindowMs || 2000;
    this.metrics = options.metrics || new DuplicateMetrics();
    
    // In-memory backing store for sliding window locks
    this.slidingLocks = new Map();
    this.timeouts = new Map();
  }

  /**
   * Evaluates if a request is a concurrent or sequential duplicate.
   * 
   * @param {Object} request - Request object.
   * @param {string} [clientId='anonymous'] - Optional client identity.
   * @param {number} [customWindowMs] - Custom sliding window override.
   * @returns {Promise<Object>} Output object: { isDuplicate: boolean, type: 'concurrent'|'sequential'|'none', remainingLockTimeMs?: number }
   */
  async check(request, clientId = 'anonymous', customWindowMs = null) {
    if (!request) {
      return { isDuplicate: false, type: 'none' };
    }

    const signature = generateSignature(request);
    const windowMs = typeof customWindowMs === 'number' ? customWindowMs : this.slidingWindowMs;

    // 1. Check Concurrent Duplicates (in-flight check)
    const isCurrentlyExecuting = await this.activeStore.has(signature);
    if (isCurrentlyExecuting) {
      this.metrics.recordDuplicate(signature, 'concurrent', clientId, request.url);
      return {
        isDuplicate: true,
        type: 'concurrent',
        reason: 'Identical request is currently executing in-flight.'
      };
    }

    // 2. Check Sequential Duplicates (rapid retry lock check)
    const lockTime = this.slidingLocks.get(signature);
    if (lockTime) {
      const remainingTime = lockTime - Date.now();
      if (remainingTime > 0) {
        this.metrics.recordDuplicate(signature, 'sequential', clientId, request.url);
        return {
          isDuplicate: true,
          type: 'sequential',
          remainingLockTimeMs: remainingTime,
          reason: `Identical request was completed too recently. Rate locked for another ${remainingTime}ms.`
        };
      } else {
        // Expired but not yet cleaned up, clear it
        this.slidingLocks.delete(signature);
      }
    }

    // Not a duplicate.
    this.metrics.recordAllowed(request.url);
    return { isDuplicate: false, type: 'none' };
  }

  /**
   * Places a sliding window lock on a request signature.
   * This is called after a request finishes processing to block identical replays for a buffer period.
   * 
   * @param {Object} request - Request object.
   * @param {number} [customWindowMs] - Custom sliding window override in milliseconds.
   * @returns {Promise<boolean>} True if lock placed.
   */
  async acquireLock(request, customWindowMs = null) {
    if (!request) return false;
    const signature = generateSignature(request);
    const windowMs = typeof customWindowMs === 'number' ? customWindowMs : this.slidingWindowMs;

    const expiresAt = Date.now() + windowMs;
    this.slidingLocks.set(signature, expiresAt);

    // Cancel existing timeout if any
    if (this.timeouts.has(signature)) {
      clearTimeout(this.timeouts.get(signature));
      this.timeouts.delete(signature);
    }

    // Schedule eviction
    const timeoutId = setTimeout(() => {
      this.slidingLocks.delete(signature);
      this.timeouts.delete(signature);
    }, windowMs);
    
    if (timeoutId.unref) {
      timeoutId.unref();
    }
    this.timeouts.set(signature, timeoutId);

    return true;
  }

  /**
   * Release a sliding window lock immediately.
   * @param {Object} request - Request profile.
   */
  async releaseLock(request) {
    if (!request) return false;
    const signature = generateSignature(request);
    
    if (this.timeouts.has(signature)) {
      clearTimeout(this.timeouts.get(signature));
      this.timeouts.delete(signature);
    }

    return this.slidingLocks.delete(signature);
  }

  /**
   * Resets all checker locks.
   */
  async clear() {
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
    this.slidingLocks.clear();
    this.metrics.reset();
    return true;
  }

  /**
   * Returns analytics details.
   * @returns {Object} Metric stats.
   */
  getStats() {
    return this.metrics.getStats();
  }
}

module.exports = {
  DuplicateChecker
};
