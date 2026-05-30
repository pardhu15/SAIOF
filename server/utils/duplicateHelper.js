/**
 * SAIOF duplicateHelper
 * 
 * Provides utility helper functions for duplicate request telemetry analysis.
 * Exposes core statistical queries designed specifically for external analytics engines,
 * database monitoring tools, and Machine Learning (ML) classification pipelines.
 */

const DuplicateMetric = require('../models/DuplicateMetric');

/**
 * Retrieves an analytical report of the most highly repeated request signatures.
 * Highly useful for ML models to isolate brute-force bots or scrapers.
 * 
 * @param {number} [limit=10] - Number of records to return.
 * @returns {Promise<Array>} List of highly duplicated request signatures.
 */
const getAbuseReport = async (limit = 10) => {
  try {
    return await DuplicateMetric.find()
      .sort({ count: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error(`[SAIOF Duplicate Helper Error] Failed to fetch abuse report: ${error.message}`);
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
          maxDuplicatesForSingleSignature: { $max: '$count' },
          avgDuplicatesPerSignature: { $avg: '$count' }
        }
      }
    ]);

    if (summary.length === 0) {
      return {
        totalUniqueSignatures: 0,
        totalDuplicateEvents: 0,
        maxDuplicatesForSingleSignature: 0,
        avgDuplicatesPerSignature: 0
      };
    }

    return {
      totalUniqueSignatures: summary[0].totalUniqueSignatures,
      totalDuplicateEvents: summary[0].totalDuplicateEvents,
      maxDuplicatesForSingleSignature: summary[0].maxDuplicatesForSingleSignature,
      avgDuplicatesPerSignature: parseFloat(summary[0].avgDuplicatesPerSignature.toFixed(2))
    };
  } catch (error) {
    console.error(`[SAIOF Duplicate Helper Error] Failed to aggregate metrics: ${error.message}`);
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
    console.log('[SAIOF Duplicate Helper] Purged all duplicate metrics records.');
    return true;
  } catch (error) {
    console.error(`[SAIOF Duplicate Helper Error] Failed to clear metrics: ${error.message}`);
    return false;
  }
};

module.exports = {
  getAbuseReport,
  getMetricsSummary,
  clearMetrics
};
