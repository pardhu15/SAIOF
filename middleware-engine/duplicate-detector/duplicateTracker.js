/**
 * SAIOF Middleware Engine - Duplicate Tracker
 * 
 * High-level tracker that coordinates request lifecycle checks, locking, 
 * and de-duplication inside the duplicate detector.
 * 
 * Flow:
 * - Generates unique signatures based on METHOD + URL + QUERY + BODY.
 * - Handles concurrent request collisions and sliding window rate-locks.
 */

const { DuplicateChecker } = require('./duplicateChecker');
const { generateSignature } = require('../request-manager/requestSignature');

class DuplicateTracker {
  /**
   * @param {Object} [options]
   * @param {DuplicateChecker} [options.checker] - Underlying duplicate checker engine.
   * @param {number} [options.slidingWindowMs=2000] - Lock duration in milliseconds.
   */
  constructor(options = {}) {
    this.checker = options.checker || new DuplicateChecker({
      slidingWindowMs: options.slidingWindowMs || 2000
    });
  }

  /**
   * Checks if a request is a concurrent or sequential duplicate.
   * 
   * @param {Object} request - Request profile.
   * @param {string} [clientId='anonymous'] - Optional client identity.
   * @returns {Promise<Object>} Verification details: { isDuplicate, type, reason }
   */
  async check(request, clientId = 'anonymous') {
    if (!request) {
      return { isDuplicate: false, type: 'none' };
    }
    return this.checker.check(request, clientId);
  }

  /**
   * Places a sliding window lock on a request signature.
   * 
   * @param {Object} request - Request profile.
   * @param {number} [customWindowMs] - Lock duration override.
   * @returns {Promise<boolean>} True if locked.
   */
  async acquireLock(request, customWindowMs = null) {
    if (!request) return false;
    return this.checker.acquireLock(request, customWindowMs);
  }

  /**
   * Releases a lock manually.
   * @param {Object} request - Request profile.
   */
  async releaseLock(request) {
    if (!request) return false;
    return this.checker.releaseLock(request);
  }

  /**
   * Resets all checker locks.
   */
  async clear() {
    return this.checker.clear();
  }

  /**
   * Retrieves stats.
   * @returns {Object} Metric stats.
   */
  getStats() {
    return this.checker.getStats();
  }
}

module.exports = {
  DuplicateTracker
};
