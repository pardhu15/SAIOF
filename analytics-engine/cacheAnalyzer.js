const CacheMetric = require('../server/models/CacheMetric');
const mongoose = require('mongoose');
const offlineDb = require('../server/utils/offlineDb');

/**
 * Calculates cache efficiency analytics and returns dashboard-ready JSON.
 * @returns {Promise<Object>} Cache efficiency telemetry report.
 */
const getCacheStats = async () => {
  if (mongoose.connection.readyState !== 1) {
    return await offlineDb.getCacheStats();
  }

  try {
    // 1. Aggregation: Global Hit/Miss counters, average response times, and total DB latency saved.
    // Calculations:
    // - totalHits = Sum of cacheHit (true values count as 1, false as 0)
    // - totalMisses = Sum of cacheMiss (true values count as 1, false as 0)
    // - totalRequests = Sum of hits and misses
    // - averageHitResponseTime = Average of responseTime for hits
    // - averageMissResponseTime = Average of responseTime for misses
    // - totalLatencySaved = Estimated cycles saved (Assuming every cache hit saves (averageMissResponseTime - hitResponseTime) ms)
    const globalSummary = await CacheMetric.aggregate([
      {
        $group: {
          _id: null,
          totalHits: { $sum: { $cond: ['$cacheHit', 1, 0] } },
          totalMisses: { $sum: { $cond: ['$cacheMiss', 1, 0] } },
          avgHitResponseTime: {
            $avg: { $cond: ['$cacheHit', '$responseTime', null] }
          },
          avgMissResponseTime: {
            $avg: { $cond: ['$cacheMiss', '$responseTime', null] }
          }
        }
      }
    ]);

    if (globalSummary.length === 0) {
      return {
        totalHits: 0,
        totalMisses: 0,
        totalRequests: 0,
        hitRate: 0,
        avgHitResponseTimeMs: 0,
        avgMissResponseTimeMs: 0,
        estimatedLatencySavedMs: 0,
        endpointBreakdown: []
      };
    }

    const { totalHits, totalMisses, avgHitResponseTime, avgMissResponseTime } = globalSummary[0];
    const totalRequests = totalHits + totalMisses;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    
    // Performance savings: totalHits * (avgMissResponseTime - avgHitResponseTime)
    const avgHitTime = avgHitResponseTime || 0;
    const avgMissTime = avgMissResponseTime || 0;
    const latencySavingsPerHit = Math.max(0, avgMissTime - avgHitTime);
    const estimatedLatencySavedMs = Math.round(totalHits * latencySavingsPerHit);

    // 2. Aggregation: Cache performance breakdown grouped by endpoint
    const endpointBreakdown = await CacheMetric.aggregate([
      {
        $group: {
          _id: '$endpoint',
          hits: { $sum: { $cond: ['$cacheHit', 1, 0] } },
          misses: { $sum: { $cond: ['$cacheMiss', 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          endpoint: '$_id',
          hits: 1,
          misses: 1,
          total: { $add: ['$hits', '$misses'] },
          hitRate: {
            $cond: [
              { $gt: [{ $add: ['$hits', '$misses'] }, 0] },
              { $multiply: [{ $divide: ['$hits', { $add: ['$hits', '$misses'] }] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Round hit rates for clean display
    const formattedBreakdown = endpointBreakdown.map(item => ({
      ...item,
      hitRate: parseFloat(item.hitRate.toFixed(2))
    }));

    return {
      totalHits,
      totalMisses,
      totalRequests,
      hitRate: parseFloat(hitRate.toFixed(2)),
      avgHitResponseTimeMs: parseFloat(avgHitTime.toFixed(2)),
      avgMissResponseTimeMs: parseFloat(avgMissTime.toFixed(2)),
      estimatedLatencySavedMs,
      endpointBreakdown: formattedBreakdown
    };
  } catch (error) {
    console.error(`[SAIOF Cache Analyzer Error] ${error.message}`);
    return {
      totalHits: 0,
      totalMisses: 0,
      totalRequests: 0,
      hitRate: 0,
      avgHitResponseTimeMs: 0,
      avgMissResponseTimeMs: 0,
      estimatedLatencySavedMs: 0,
      endpointBreakdown: []
    };
  }
};

module.exports = {
  getCacheStats
};

