/**
 * SAIOF Middleware Engine - Duplicate Analyzer
 * 
 * Houses duplicate request telemetry database analysis functions.
 * Exposes statistical queries over the MongoDB duplicatemetrics collection
 * designed specifically for Machine Learning pipelines and dashboard dashboards.
 */

const DuplicateMetric = require('../../server/models/DuplicateMetric');

/**
 * Retrieves highly repeated request signatures.
 * Helps ML models classify bad/abusive scrapers or brute-force scripts.
 * 
 * @param {number} [limit=10] - Number of records to return.
 * @returns {Promise<Array>} List of highly duplicated request profiles.
 */
const getAbuseReport = async (limit = 10) => {
  try {
    return await DuplicateMetric.find()
      .sort({ count: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error(`[SAIOF Duplicate Analyzer Error] Failed to fetch abuse report: ${error.message}`);
    return [];
  }
};

/**
 * Compiles a mathematical summary of overall request duplication rates.
 * @returns {Promise<Object>} Analytical dashboard stats.
 */
const getMetricsSummary = async () => {
  try {
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
        avgDuplicatesPerSignature: 0
      };
    }

    return {
      totalUniqueSignatures: summary[0].totalUniqueSignatures,
      totalDuplicateEvents: summary[0].totalDuplicateEvents,
      maxDuplicatesSingleRequest: summary[0].maxDuplicatesSingleRequest,
      avgDuplicatesPerSignature: parseFloat(summary[0].avgDuplicatesPerSignature.toFixed(2))
    };
  } catch (error) {
    console.error(`[SAIOF Duplicate Analyzer Error] Failed to aggregate metrics: ${error.message}`);
    return {};
  }
};

/**
 * Resets and purges the duplicate metrics collection.
 * @returns {Promise<boolean>} True if successfully wiped.
 */
const clearMetrics = async () => {
  try {
    await DuplicateMetric.deleteMany({});
    console.log('[SAIOF Duplicate Analyzer] Purged all duplicate metrics records.');
    return true;
  } catch (error) {
    console.error(`[SAIOF Duplicate Analyzer Error] Failed to clear metrics: ${error.message}`);
    return false;
  }
};

module.exports = {
  getAbuseReport,
  getMetricsSummary,
  clearMetrics
};
