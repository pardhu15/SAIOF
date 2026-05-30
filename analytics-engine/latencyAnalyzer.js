const RequestLog = require('../server/models/RequestLog');
const mongoose = require('mongoose');
const offlineDb = require('../server/utils/offlineDb');

/**
 * Calculates latency profiles, percentiles, and returns dashboard-ready JSON.
 * @returns {Promise<Object>} Latency telemetry report.
 */
const getLatencyStats = async () => {
  if (mongoose.connection.readyState !== 1) {
    return await offlineDb.getLatencyStats();
  }

  try {
    // 1. Aggregation: Compute avg, p50, p90, p99, and standard deviation (stability)
    // Calculations:
    // - Sorts requests in ascending order of latency to prepare for percentile array index lookup.
    // - Groups records to compile count, mean latency, and population standard deviation ($stdDevPop).
    // - Projects percentiles using index formulas:
    //   - p50 (Median) Index: floor(count * 0.50)
    //   - p90 Index: floor(count * 0.90)
    //   - p99 Index: floor(count * 0.99)
    const percentileSummary = await RequestLog.aggregate([
      { $sort: { latency: 1 } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgLatency: { $avg: '$latency' },
          stdDev: { $stdDevPop: '$latency' },
          latencies: { $push: '$latency' }
        }
      },
      {
        $project: {
          _id: 0,
          count: 1,
          avgLatency: { $round: ['$avgLatency', 2] },
          stdDev: { $round: ['$stdDev', 2] },
          p50: {
            $arrayElemAt: [
              '$latencies',
              { $floor: { $multiply: ['$count', 0.50] } }
            ]
          },
          p90: {
            $arrayElemAt: [
              '$latencies',
              { $floor: { $multiply: ['$count', 0.90] } }
            ]
          },
          p99: {
            $arrayElemAt: [
              '$latencies',
              { $floor: { $multiply: ['$count', 0.99] } }
            ]
          }
        }
      }
    ]);

    if (percentileSummary.length === 0) {
      return {
        count: 0,
        avgLatencyMs: 0,
        stdDevMs: 0,
        p50Ms: 0,
        p90Ms: 0,
        p99Ms: 0,
        slowestEndpoints: []
      };
    }

    const { count, avgLatency, stdDev, p50, p90, p99 } = percentileSummary[0];

    // 2. Aggregation: Top 5 slowest endpoints by average response latency
    const slowestEndpoints = await RequestLog.aggregate([
      {
        $group: {
          _id: '$endpoint',
          avgLatency: { $avg: '$latency' },
          maxLatency: { $max: '$latency' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgLatency: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          endpoint: '$_id',
          avgLatency: { $round: ['$avgLatency', 2] },
          maxLatency: 1,
          count: 1
        }
      }
    ]);

    return {
      count,
      avgLatencyMs: avgLatency || 0,
      stdDevMs: stdDev || 0,
      p50Ms: p50 || 0,
      p90Ms: p90 || 0,
      p99Ms: p99 || 0,
      slowestEndpoints
    };
  } catch (error) {
    console.error(`[SAIOF Latency Analyzer Error] ${error.message}`);
    return {
      count: 0,
      avgLatencyMs: 0,
      stdDevMs: 0,
      p50Ms: 0,
      p90Ms: 0,
      p99Ms: 0,
      slowestEndpoints: []
    };
  }
};

module.exports = {
  getLatencyStats
};

