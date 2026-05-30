/**
 * SAIOF Middleware Engine - Active Promise Store
 * 
 * Houses active, unresolved deferred Promises in memory.
 * Maps deterministic request signatures to deferred Promise references.
 * Enables the request coalescing pipeline (Single Flight) to merge duplicate threads.
 */

class ActivePromiseStore {
  constructor() {
    this.promises = new Map();
  }

  /**
   * Retrieves an active deferred Promise.
   * @param {string} signature - Unique request signature.
   * @returns {Object|null} The deferred object containing { promise, resolve, reject }, or null.
   */
  get(signature) {
    return this.promises.get(signature) || null;
  }

  /**
   * Registers a deferred Promise for a signature.
   * @param {string} signature - Unique request signature.
   * @param {Object} deferred - Deferred promise wrapper: { promise, resolve, reject }.
   */
  set(signature, deferred) {
    if (!deferred || !deferred.promise) {
      throw new Error('Invalid deferred object: Must contain a native Promise wrapper.');
    }
    this.promises.set(signature, deferred);
    return true;
  }

  /**
   * Deletes an active deferred Promise.
   * @param {string} signature - Unique request signature.
   * @returns {boolean} True if successfully deleted.
   */
  delete(signature) {
    return this.promises.delete(signature);
  }

  /**
   * Checks if a signature currently has an unresolved deferred Promise.
   * @param {string} signature - Unique request signature.
   * @returns {boolean} True if a pending Promise exists.
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
  ActivePromiseStore
};
