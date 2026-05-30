const DuplicateMetric = require('../server/models/DuplicateMetric');
const mongoose = require('mongoose');
const offlineDb = require('../server/utils/offlineDb');

/**
 * Calculates duplicate request telemetry and returns dashboard-ready JSON.
 * @returns {Promise<Object>} Duplicate telemetry report.
 */
const getDuplicateStats = async () => {
  if (mongoose.connection.readyState !== 1) {
    return await offlineDb.getDuplicateStats();
  }

  try {
    // 1. Aggregation: Overall metrics count, total events, and averages
    // Calculations:
    // - totalUniqueSignatures = Count of unique signature records
    // - totalDuplicateEvents = Sum of the count attribute across all signatures
    // - avgDuplicatesPerSignature = Average of count
    // - maxDuplicatesSingleRequest = Maximum duplication level
    const summary = await DuplicateMetric.aggregate([
      {
        $group: {
          _id: null,
          totalUniqueSignatures: { $sum: 1 },
          totalDuplicateEvents: { $sum: '$count' },
          maxDuplicatesSingleRequest: { $max: '$count' },
          avgDuplicatesPerSignature: { $avg: '$count' }
        }
      }
    ]);

    if (summary.length === 0) {
      return {
        totalUniqueSignatures: 0,
        totalDuplicateEvents: 0,
        maxDuplicatesSingleRequest: 0,
        avgDuplicatesPerSignature: 0,
        abusedEndpoints: []
      };
    }

    const {
      totalUniqueSignatures,
      totalDuplicateEvents,
      maxDuplicatesSingleRequest,
      avgDuplicatesPerSignature
    } = summary[0];

    // 2. Aggregation: Get the top 5 most abused endpoints (grouped by endpoint url)
    const abusedEndpoints = await DuplicateMetric.aggregate([
      {
        $group: {
          _id: '$endpoint',
          totalDuplicates: { $sum: '$count' },
          uniqueAbusesCount: { $sum: 1 }
        }
      },
      { $sort: { totalDuplicates: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          endpoint: '$_id',
          totalDuplicates: 1,
          uniqueAbusesCount: 1
        }
      }
    ]);

    return {
      totalUniqueSignatures,
      totalDuplicateEvents,
      maxDuplicatesSingleRequest,
      avgDuplicatesPerSignature: parseFloat(avgDuplicatesPerSignature.toFixed(2)),
      abusedEndpoints
    };
  } catch (error) {
    console.error(`[SAIOF Duplicate Analyzer Error] ${error.message}`);
    return {
      totalUniqueSignatures: 0,
      totalDuplicateEvents: 0,
      maxDuplicatesSingleRequest: 0,
      avgDuplicatesPerSignature: 0,
      abusedEndpoints: []
    };
  }
};

module.exports = {
  getDuplicateStats
};

