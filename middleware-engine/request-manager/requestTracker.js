/**
 * SAIOF Middleware Engine - Request Tracker
 * 
 * Coordinates the lifecycle of requests. Connects the request signature generator
 * with the active request store and triggers hooks for telemetry and analytics.
 * 
 * Analytics/ML Design: Standardized event emitters and telemetry metrics streams.
 * Machine Learning models can attach as listeners to predict traffic spikes,
 * identify slow endpoints, or detect abnormal response times.
 */

const { generateSignature } = require('./requestSignature');
const { MemoryActiveRequestStore } = require('./activeRequestStore');

class RequestTracker {
  /**
   * @param {Object} [options]
   * @param {ActiveRequestStoreInterface} [options.store] - Pluggable store adapter.
   * @param {number} [options.slowRequestThresholdMs=3000] - Threshold above which a request is marked "slow" for ML flags.
   */
  constructor(options = {}) {
    this.store = options.store || new MemoryActiveRequestStore();
    this.slowRequestThresholdMs = options.slowRequestThresholdMs || 3000;
    this.listeners = {
      start: [],
      end: [],
      slow: [],
      error: []
    };
  }

  /**
   * Registers a telemetry or ML integration callback.
   * @param {'start'|'end'|'slow'|'error'} event - Event name.
   * @param {Function} callback - Callback function receiving event telemetry data.
   */
  on(event, callback) {
    if (this.listeners[event] && typeof callback === 'function') {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Helper to trigger registered event listeners.
   * @private
   */
  _emit(event, data) {
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]) {
        try {
          callback(data);
        } catch (err) {
          console.error(`[SAIOF Tracker Telemetry Error] Callback failed: ${err.message}`);
        }
      }
    }
  }

  /**
   * Starts tracking an incoming request.
   * Computes signature, stores details, and emits the 'start' telemetry event.
   * 
   * @param {Object} request - Request data.
   * @param {string} [clientId] - Optional client identifier for ML profiling.
   * @param {number} [ttlMs] - Time-to-live after which active request is automatically evicted.
   * @returns {Promise<Object>} Request tracking metadata, including the computed signature.
   */
  async start(request, clientId = 'anonymous', ttlMs = null) {
    const signature = generateSignature(request);
    
    const requestMetadata = {
      signature,
      method: request.method.toUpperCase(),
      url: request.url,
      startTime: Date.now(),
      clientId,
      route: request.route || request.url.split('?')[0]
    };

    // Store in active requests
    await this.store.set(signature, requestMetadata, ttlMs);

    // Stream telemetry
    this._emit('start', {
      timestamp: requestMetadata.startTime,
      signature,
      method: requestMetadata.method,
      route: requestMetadata.route,
      clientId
    });

    return requestMetadata;
  }

  /**
   * Completes tracking of a request.
   * Calculates execution duration, clears active request, and emits 'end' / 'slow' telemetry.
   * 
   * @param {string} signature - The computed request signature.
   * @param {number} statusCode - HTTP-like response code (e.g. 200, 500).
   * @returns {Promise<Object|null>} The completed request metadata, or null if not found.
   */
  async end(signature, statusCode) {
    const requestMetadata = await this.store.get(signature);
    if (!requestMetadata) {
      return null;
    }

    const endTime = Date.now();
    const durationMs = endTime - requestMetadata.startTime;

    // Delete from active requests
    await this.store.delete(signature);

    const telemetryData = {
      signature,
      method: requestMetadata.method,
      route: requestMetadata.route,
      clientId: requestMetadata.clientId,
      startTime: requestMetadata.startTime,
      endTime,
      durationMs,
      statusCode,
      success: statusCode >= 200 && statusCode < 400
    };

    // Stream end telemetry
    this._emit('end', telemetryData);

    // Track anomalies or slow requests for ML engines
    if (durationMs > this.slowRequestThresholdMs) {
      this._emit('slow', {
        ...telemetryData,
        message: `Request exceeded latency threshold of ${this.slowRequestThresholdMs}ms`
      });
    }

    if (statusCode >= 500) {
      this._emit('error', {
        ...telemetryData,
        message: `Request failed with server error code ${statusCode}`
      });
    }

    return telemetryData;
  }

  /**
   * Retrieves current count of active requests.
   * @returns {Promise<number>} Count of active requests.
   */
  async getActiveCount() {
    const list = await this.store.list();
    return Object.keys(list).length;
  }

  /**
   * Returns complete active requests inventory.
   * @returns {Promise<Object>} Active requests object list.
   */
  async getActiveRequests() {
    return this.store.list();
  }
}

module.exports = {
  RequestTracker
};
