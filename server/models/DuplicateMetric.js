const mongoose = require('mongoose');

/**
 * SAIOF DuplicateMetric Schema
 * Records duplicate request events, tracking repeat counts per request signature and target endpoint.
 * Highly valuable for ML scrapers, retry-storm analysis, and brute-force bot profiling.
 */
const DuplicateMetricSchema = new mongoose.Schema({
  signature: {
    type: String,
    required: true,
    index: true,
    unique: true // Ensure single analytical record per unique request signature
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  count: {
    type: Number,
    required: true,
    default: 1
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index on timestamp and signature for telemetry query sorting
DuplicateMetricSchema.index({ timestamp: -1, signature: 1 });

module.exports = mongoose.model('DuplicateMetric', DuplicateMetricSchema);
