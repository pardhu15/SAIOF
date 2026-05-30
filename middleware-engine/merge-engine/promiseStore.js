/**
 * SAIOF Middleware Engine - Promise Store
 * 
 * Houses in-flight Promise references mapping to specific request signatures.
 * Used by the request merger to implement request coalescing (Single Flight).
 * 
 * Design: Pure business logic mapping signatures to actual JavaScript Promises.
 * Since Promises are native, in-memory asynchronous constructs, they are stored 
 * locally on this execution thread. In distributed architectures, coalescing is typically
 * combined with Redis pub/sub or Redis-based locks to block secondary requests 
 * until the primary worker publishes the completed result.
 */

class PromiseStore {
  constructor() {
    this.promises = new Map();
  }

  /**
   * Retrieves an unresolved promise by request signature.
   * @param {string} signature - Unique request signature.
   * @returns {Promise<*>|null} The pending promise, or null.
   */
  get(signature) {
    return this.promises.get(signature) || null;
  }

  /**
   * Sets the pending promise for a signature.
   * @param {string} signature - Unique request signature.
   * @param {Promise<*>} promise - Native pending promise.
   */
  set(signature, promise) {
    if (!(promise instanceof Promise)) {
      throw new Error('Invalid value: Must store a native Promise.');
    }
    this.promises.set(signature, promise);
    return true;
  }

  /**
   * Removes a signature's promise from the store (upon resolution/rejection).
   * @param {string} signature - Unique request signature.
   * @returns {boolean} True if successfully deleted.
   */
  delete(signature) {
    return this.promises.delete(signature);
  }

  /**
   * Checks if a signature currently has a pending promise in the store.
   * @param {string} signature - Unique request signature.
   * @returns {boolean} True if a pending promise exists.
   */
  has(signature) {
    return this.promises.has(signature);
  }

  /**
   * Resets and clears all promise mappings.
   */
  clear() {
    this.promises.clear();
    return true;
  }

  /**
   * Returns count of currently merged requests awaiting resolving.
   * @returns {number} Active promise count.
   */
  size() {
    return this.promises.size;
  }
}

module.exports = {
  PromiseStore
};
