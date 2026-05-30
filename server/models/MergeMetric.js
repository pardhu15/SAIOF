const mongoose = require('mongoose');

/**
 * SAIOF MergeMetric Schema
 * Records request coalescing events, capturing concurrent request merges to monitor server cycle efficiency.
 * Essential for ML workload optimization and datastore-stampede metrics analysis.
 */
const MergeMetricSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  mergedCount: {
    type: Number,
    required: true,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index on timestamp and endpoint for quick telemetry sorting
MergeMetricSchema.index({ timestamp: -1, endpoint: 1 });

module.exports = mongoose.model('MergeMetric', MergeMetricSchema);
