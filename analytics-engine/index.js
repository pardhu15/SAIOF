/**
 * SAIOF Analytics Engine - Entry Point
 * 
 * Aggregates all modular analyzers (traffic, cache, latency, duplicate, merge)
 * into a single unified dashboard-ready analytical framework.
 * 
 * Requirements Met:
 * - CommonJS strictly used.
 * - Framework-agnostic: Detached from Express routing.
 * - Utilizes high-performance MongoDB aggregation pipelines.
 * - Employs concurrent executing Promises (Promise.all) for compiling getOverview().
 */

const { getTrafficStats } = require('./trafficAnalyzer');
const { getCacheStats } = require('./cacheAnalyzer');
const { getDuplicateStats } = require('./duplicateAnalyzer');
const { getMergeStats } = require('./mergeAnalyzer');
const { getLatencyStats } = require('./latencyAnalyzer');
const mlService = require('../server/services/mlService');
const RequestLog = require('../server/models/RequestLog');
const CacheMetric = require('../server/models/CacheMetric');
const DuplicateMetric = require('../server/models/DuplicateMetric');
const MergeMetric = require('../server/models/MergeMetric');
const mongoose = require('mongoose');
const offlineDb = require('../server/utils/offlineDb');

/**
 * Generates a unified overview telemetry report across all sub-analyzers.
 * Spawns aggregations concurrently for maximum database efficiency.
 * 
 * @param {Object} [activeMergerInstance] - Optional active RequestMerger reference for merge analytics.
 * @returns {Promise<Object>} Unified dashboard-ready JSON payload.
 */
const getOverview = async (activeMergerInstance = null) => {
  try {
    const [traffic, cache, duplicate, merge, latency, mlPredictions] = await Promise.all([
      getTrafficStats(),
      getCacheStats(),
      getDuplicateStats(),
      getMergeStats(activeMergerInstance),
      getLatencyStats(),
      mlService.getPredictionsOverview()
    ]);

    // Calculate aggregated overall wellness metrics
    const totalRequests = traffic.totalRequests || 0;
    const cacheHitRate = cache.hitRate || 0;
    const avgLatencyMs = latency.avgLatencyMs || 0;
    const duplicateCount = duplicate.totalDuplicateEvents || 0;

    // Gather and calculate historical telemetry aggregates (Phase 3 Audit)
    let totalHistoricalRequests = 0;
    let totalCacheHits = 0;
    let totalDuplicates = 0;
    let totalMergeSavings = 0;
    let predictionHistoryCount = 0;

    if (mongoose.connection.readyState !== 1) {
      const offlineTelemetry = await offlineDb.getHistoricalTelemetrySummary();
      totalHistoricalRequests = offlineTelemetry.totalHistoricalRequests;
      totalCacheHits = offlineTelemetry.totalCacheHits;
      totalDuplicates = offlineTelemetry.totalDuplicates;
      totalMergeSavings = offlineTelemetry.totalMergeSavings;
      predictionHistoryCount = offlineTelemetry.predictionHistoryCount;
    } else {
      const [reqs, caches, duplicates, merges] = await Promise.all([
        RequestLog.countDocuments(),
        CacheMetric.countDocuments({ cacheHit: true }),
        DuplicateMetric.aggregate([{ $group: { _id: null, total: { $sum: '$count' } } }]),
        MergeMetric.aggregate([{ $group: { _id: null, total: { $sum: '$mergedCount' } } }])
      ]);

      try {
        predictionHistoryCount = await mongoose.connection.db.collection('predictionhistory').countDocuments();
      } catch (e) {
        predictionHistoryCount = 0;
      }

      totalHistoricalRequests = reqs;
      totalCacheHits = caches;
      totalDuplicates = duplicates.length > 0 ? duplicates[0].total : 0;
      totalMergeSavings = merges.length > 0 ? merges[0].total : 0;
    }

    const totalTelemetryCount = totalHistoricalRequests + totalCacheHits + totalDuplicates + totalMergeSavings + predictionHistoryCount;

    // ML wellness score: Based on latency bounds, cache hit effectiveness, and abuse indexes
    const wellnessScore = calculateWellnessScore(totalRequests, cacheHitRate, avgLatencyMs, duplicateCount);

    return {
      timestamp: new Date(),
      wellnessScore,
      summary: {
        totalRequests,
        cacheHitRate: `${cacheHitRate}%`,
        avgLatencyMs: `${avgLatencyMs}ms`,
        duplicateCount
      },
      historicalTelemetry: {
        totalHistoricalRequests,
        totalCacheHits,
        totalDuplicates,
        totalMergeSavings,
        predictionHistoryCount,
        totalTelemetryCount
      },
      traffic,
      cache,
      duplicate,
      merge,
      latency,
      mlPredictions
    };
  } catch (error) {
    console.error(`[SAIOF Analytics Overview Error] ${error.message}`);
    return {
      timestamp: new Date(),
      wellnessScore: 0,
      summary: {
        totalRequests: 0,
        cacheHitRate: '0%',
        avgLatencyMs: '0ms',
        duplicateCount: 0
      },
      historicalTelemetry: {
        totalHistoricalRequests: 0,
        totalCacheHits: 0,
        totalDuplicates: 0,
        totalMergeSavings: 0,
        predictionHistoryCount: 0,
        totalTelemetryCount: 0
      },
      error: error.message
    };
  }
};


/**
 * Internal helper to compute a dynamic system performance wellness score.
 * Helps ML monitoring detect degradation periods or spike anomalies.
 * @private
 */
function calculateWellnessScore(requests, hitRate, latency, duplicates) {
  if (requests === 0) return 100;
  
  let score = 100;

  // Deduct for high latencies (ideal: <200ms)
  if (latency > 1000) {
    score -= 30;
  } else if (latency > 500) {
    score -= 15;
  } else if (latency > 200) {
    score -= 5;
  }

  // Deduct if caching is not hit-effective under load
  if (requests > 100 && hitRate < 20) {
    score -= 10;
  }

  // Deduct for abnormal duplicate volumes (suggests bot scrapers or retry loop storms)
  const duplicateRatio = (duplicates / requests) * 100;
  if (duplicateRatio > 30) {
    score -= 20;
  } else if (duplicateRatio > 10) {
    score -= 10;
  }

  return Math.max(0, score);
}

module.exports = {
  getTrafficStats,
  getCacheStats,
  getDuplicateStats,
  getMergeStats,
  getLatencyStats,
  getOverview
};
