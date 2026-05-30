/**
 * SAIOF Middleware Engine - Cache Metrics Tracker
 * 
 * Collects and aggregates real-time metrics on cache efficiency (hits, misses, bypasses).
 * Tracks performance and bandwidth savings.
 * 
 * Analytics/ML Design: Exposes standard metrics reporting and telemetry event triggers.
 * Telemetry events feed directly to machine learning pipelines to let them auto-tune
 * TTL boundaries, detect cache-stampede risks, or identify optimal keys to pre-warm.
 */

class CacheMetrics {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.bypasses = 0;
    this.evictions = 0;
    
    // Aggregated response times to calculate performance boost
    this.totalResponseTimeSavedMs = 0;
    this.cachedResponseTimeMs = 0;
    this.dbResponseTimeMs = 0;

    // ML metric listeners
    this.listeners = [];
  }

  /**
   * Registers a telemetry / ML callback listener.
   * @param {Function} callback - Telemetry callback function.
   */
  onMetricsEvent(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Emits updated statistics to registered listeners.
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
        console.error(`[SAIOF CacheMetrics Telemetry Error] Callback failed: ${err.message}`);
      }
    }
  }

  /**
   * Records a cache hit.
   * @param {number} responseTimeSavedMs - Time saved by retrieving from cache vs database.
   */
  recordHit(responseTimeSavedMs = 0) {
    this.hits++;
    this.totalResponseTimeSavedMs += responseTimeSavedMs;
    this.cachedResponseTimeMs += 1; // Assuming 1ms lookup for cache hit
    this._emit('HIT', { responseTimeSavedMs });
  }

  /**
   * Records a cache miss.
   * @param {number} dbLatencyMs - Time taken by underlying datastore to resolve request.
   */
  recordMiss(dbLatencyMs = 0) {
    this.misses++;
    this.dbResponseTimeMs += dbLatencyMs;
    this._emit('MISS', { dbLatencyMs });
  }

  /**
   * Records a cache bypass (request ineligible for caching).
   * @param {string} reason - The reason for the bypass.
   */
  recordBypass(reason) {
    this.bypasses++;
    this._emit('BYPASS', { reason });
  }

  /**
   * Records an item eviction.
   * @param {string} [reason='expired'] - Reason for eviction ('expired', 'lru', 'manual').
   */
  recordEviction(reason = 'expired') {
    this.evictions++;
    this._emit('EVICTION', { reason });
  }

  /**
   * Computes key metrics ratios and returns them.
   * @returns {Object} Analytical statistics report.
   */
  getStats() {
    const totalRequests = this.hits + this.misses + this.bypasses;
    const cacheRequests = this.hits + this.misses;
    const hitRate = cacheRequests > 0 ? (this.hits / cacheRequests) * 100 : 0;
    const bypassRatio = totalRequests > 0 ? (this.bypasses / totalRequests) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      bypasses: this.bypasses,
      evictions: this.evictions,
      totalRequests,
      hitRate: parseFloat(hitRate.toFixed(2)),
      bypassRatio: parseFloat(bypassRatio.toFixed(2)),
      totalResponseTimeSavedMs: this.totalResponseTimeSavedMs,
      averageDbLatencyMs: this.misses > 0 ? parseFloat((this.dbResponseTimeMs / this.misses).toFixed(2)) : 0
    };
  }

  /**
   * Resets all metric accumulators.
   */
  reset() {
    this.hits = 0;
    this.misses = 0;
    this.bypasses = 0;
    this.evictions = 0;
    this.totalResponseTimeSavedMs = 0;
    this.cachedResponseTimeMs = 0;
    this.dbResponseTimeMs = 0;
    this._emit('RESET');
  }
}

module.exports = {
  CacheMetrics
};
