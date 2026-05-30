const TrafficMetric = require('../server/models/TrafficMetric');
const RequestLog = require('../server/models/RequestLog');
const mongoose = require('mongoose');
const offlineDb = require('../server/utils/offlineDb');

/**
 * Calculates traffic analytics and returns dashboard-ready JSON.
 * @returns {Promise<Object>} Traffic telemetry report.
 */
const getTrafficStats = async () => {
  if (mongoose.connection.readyState !== 1) {
    return await offlineDb.getTrafficStats();
  }

  try {
    // 1. Calculate Peak Concurrency (Max concurrent users logged in trafficmetrics)
    const peakConcurrencyResult = await TrafficMetric.aggregate([
      {
        $group: {
          _id: null,
          peakConcurrency: { $max: '$concurrentUsers' },
          totalTrafficLogs: { $sum: '$requestCount' }
        }
      }
    ]);

    const peakConcurrency = peakConcurrencyResult.length > 0 ? peakConcurrencyResult[0].peakConcurrency : 0;
    const totalTrafficLogs = peakConcurrencyResult.length > 0 ? peakConcurrencyResult[0].totalTrafficLogs : 0;

    // 2. Count Total Requests from requestlogs
    const totalRequests = await RequestLog.countDocuments();

    // 3. Aggregation: Request count and average latency grouped by endpoint
    const routeBreakdown = await RequestLog.aggregate([
      {
        $group: {
          _id: '$endpoint',
          count: { $sum: 1 },
          avgLatency: { $avg: '$latency' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          endpoint: '$_id',
          count: 1,
          avgLatency: { $round: ['$avgLatency', 2] }
        }
      }
    ]);

    // 4. Aggregation: Requests grouped by HTTP method
    const methodBreakdown = await RequestLog.aggregate([
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          count: 1
        }
      }
    ]);

    // 5. Aggregation: Requests grouped by hour of the day (Hourly Traffic Trends)
    const hourlyTrends = await RequestLog.aggregate([
      {
        $project: {
          hour: { $hour: '$timestamp' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          count: 1
        }
      }
    ]);

    return {
      totalRequests,
      peakConcurrency,
      totalTrafficLogs,
      routeBreakdown,
      methodBreakdown,
      hourlyTrends
    };
  } catch (error) {
    console.error(`[SAIOF Traffic Analyzer Error] ${error.message}`);
    return {
      totalRequests: 0,
      peakConcurrency: 0,
      totalTrafficLogs: 0,
      routeBreakdown: [],
      methodBreakdown: [],
      hourlyTrends: []
    };
  }
};

module.exports = {
  getTrafficStats
};

