/**
 * SAIOF Middleware Engine - Duplicate Metrics Tracker
 * 
 * Collects, aggregates, and reports analytics regarding request duplication rates.
 * 
 * Analytics/ML Design: Streams anomaly metadata to hooks.
 * Machine Learning models can monitor these metrics to detect credential stuffing,
 * brute-force attacks, distributed scraper activity, or client retry storms.
 */

class DuplicateMetrics {
  constructor() {
    this.totalChecked = 0;
    this.concurrentDuplicates = 0;
    this.sequentialDuplicates = 0;
    this.allowedRequests = 0;

    // Track duplicates by client ID and endpoint to detect scraper patterns
    this.clientTelemetry = {};
    this.endpointTelemetry = {};

    // Telemetry listeners
    this.listeners = [];
  }

  /**
   * Registers a telemetry or ML integration listener.
   * @param {Function} callback - Telemetry callback function.
   */
  onMetricsEvent(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Dispatches telemetry reports to registered event callbacks.
   * @private
   */
  _emit(eventType, data = {}) {
    const report = {
      timestamp: Date.now(),
      eventType,
      stats: this.getStats(),
      ...data
    };
    for (const callback of this.listeners) {
      try {
        callback(report);
      } catch (err) {
        console.error(`[SAIOF DuplicateMetrics Telemetry Error] Callback failed: ${err.message}`);
      }
    }
  }

  /**
   * Records a duplicate request attempt.
   * 
   * @param {string} signature - Request signature.
   * @param {'concurrent'|'sequential'} type - Type of duplicate.
   * @param {string} clientId - Client identifier.
   * @param {string} endpoint - API route target.
   */
  recordDuplicate(signature, type, clientId, endpoint) {
    this.totalChecked++;
    if (type === 'concurrent') {
      this.concurrentDuplicates++;
    } else {
      this.sequentialDuplicates++;
    }

    // Client tracking
    if (!this.clientTelemetry[clientId]) {
      this.clientTelemetry[clientId] = 0;
    }
    this.clientTelemetry[clientId]++;

    // Route tracking
    if (!this.endpointTelemetry[endpoint]) {
      this.endpointTelemetry[endpoint] = 0;
    }
    this.endpointTelemetry[endpoint]++;

    // Stream telemetry
    this._emit('DUPLICATE_DETECTED', {
      signature,
      duplicateType: type,
      clientId,
      endpoint
    });
  }

  /**
   * Records an allowed request (passed checking without issue).
   * @param {string} endpoint - API route target.
   */
  recordAllowed(endpoint) {
    this.totalChecked++;
    this.allowedRequests++;
    this._emit('REQUEST_ALLOWED', { endpoint });
  }

  /**
   * Compiles current telemetry profiles and metrics.
   * @returns {Object} Metric stats.
   */
  getStats() {
    const totalDuplicates = this.concurrentDuplicates + this.sequentialDuplicates;
    const duplicationRate = this.totalChecked > 0 ? (totalDuplicates / this.totalChecked) * 100 : 0;

    return {
      totalChecked: this.totalChecked,
      concurrentDuplicates: this.concurrentDuplicates,
      sequentialDuplicates: this.sequentialDuplicates,
      allowedRequests: this.allowedRequests,
      duplicationRate: parseFloat(duplicationRate.toFixed(2)),
      clientTelemetry: { ...this.clientTelemetry },
      endpointTelemetry: { ...this.endpointTelemetry }
    };
  }

  /**
   * Resets metrics state.
   */
  reset() {
    this.totalChecked = 0;
    this.concurrentDuplicates = 0;
    this.sequentialDuplicates = 0;
    this.allowedRequests = 0;
    this.clientTelemetry = {};
    this.endpointTelemetry = {};
    this._emit('RESET');
  }
}

module.exports = {
  DuplicateMetrics
};
