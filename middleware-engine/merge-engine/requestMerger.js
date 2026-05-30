/**
 * SAIOF Middleware Engine - Request Merger
 * 
 * High-level orchestrator that coordinates Single Flight (Request Coalescing) logic.
 * Connects the ActivePromiseStore with MergeMetrics to merge duplicate active threads.
 */

const { ActivePromiseStore } = require('./activePromiseStore');
const { MergeMetrics } = require('./mergeMetrics');

class RequestMerger {
  /**
   * @param {Object} [options]
   * @param {ActivePromiseStore} [options.store] - Underlying active promise store.
   * @param {MergeMetrics} [options.metrics] - Underlying metrics recorder.
   */
  constructor(options = {}) {
    this.store = options.store || new ActivePromiseStore();
    this.metrics = options.metrics || new MergeMetrics();
    
    // Internal listener for coalescing hooks
    this.listeners = [];
  }

  /**
   * Creates a deferred Promise wrapper for a new request signature.
   * Other concurrent requests can retrieve the promise and await it.
   * 
   * @param {string} signature - Unique request signature.
   * @returns {Object} The created deferred wrapper: { promise, resolve, reject }.
   */
  createDeferred(signature) {
    let resolveFn;
    let rejectFn;

    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    const deferred = {
      promise,
      resolve: (data) => {
        this.store.delete(signature);
        resolveFn(data);
      },
      reject: (err) => {
        this.store.delete(signature);
        rejectFn(err);
      }
    };

    this.store.set(signature, deferred);
    return deferred;
  }

  /**
   * Registers a merged request event and logs it to Mongoose.
   * 
   * @param {string} endpoint - The target request URL.
   * @param {string} signature - The request signature.
   */
  async registerMerge(endpoint, signature) {
    // Record in database metrics
    await this.metrics.recordMerge(endpoint, 1);
    
    // Emit stats events if telemetry callbacks are active
    for (const callback of this.listeners) {
      try {
        callback({ type: 'MERGE', endpoint, signature });
      } catch (err) {
        console.error(`[SAIOF RequestMerger Telemetry Error] Callback failed: ${err.message}`);
      }
    }
  }

  /**
   * Exposes telemetry hooks.
   * @param {Function} callback - Telemetry callback function.
   */
  onTelemetry(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Clears the active promise store.
   */
  async clear() {
    this.store.clear();
    await this.metrics.clearMetrics();
    return true;
  }
}

module.exports = {
  RequestMerger
};
