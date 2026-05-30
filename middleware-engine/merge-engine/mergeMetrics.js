/**
 * SAIOF Middleware Engine - Merge Metrics
 * 
 * Aggregates request coalescing (Single Flight) events and persists them to the MongoDB
 * mergemetrics collection. Used to evaluate server cycle savings.
 */

const MergeMetric = require('../../server/models/MergeMetric');
const mongoose = require('mongoose');
const offlineDb = require('../../server/utils/offlineDb');

class MergeMetrics {
  /**
   * Logs a request coalescing event to the database.
   * Atomically increments the mergedCount for the endpoint.
   * 
   * @param {string} endpoint - The API endpoint URL.
   * @param {number} [count=1] - The number of duplicate concurrent requests coalesced.
   * @returns {Promise<Object|null>} The Mongoose document created/updated.
   */
  async recordMerge(endpoint, count = 1) {
    try {
      if (mongoose.connection.readyState !== 1) {
        return await offlineDb.addMergeMetric(endpoint, count);
      }
      return await MergeMetric.findOneAndUpdate(
        { endpoint },
        {
          $inc: { mergedCount: count },
          $set: { timestamp: new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error(`[SAIOF Merge Metrics Error] Failed to log merge record to MongoDB: ${error.message}`);
      return null;
    }
  }

  /**
   * Clears all request coalescing telemetry records.
   * @returns {Promise<boolean>} True if successfully wiped.
   */
  async clearMetrics() {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.log('[SAIOF Merge Metrics] Purged all offline coalescing telemetry.');
        return true;
      }
      await MergeMetric.deleteMany({});
      console.log('[SAIOF Merge Metrics] Purged all coalescing telemetry records.');
      return true;
    } catch (error) {
      console.error(`[SAIOF Merge Metrics Error] Failed to clear metrics: ${error.message}`);
      return false;
    }
  }
}

module.exports = {
  MergeMetrics
};

