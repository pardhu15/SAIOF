const mongoose = require('mongoose');

/**
 * SAIOF CacheMetric Schema
 * Represents structured analytical metrics for evaluating caching performance.
 * Matches requested tracking properties for analytics and ML pipeline integrations.
 */
const CacheMetricSchema = new mongoose.Schema({
  cacheHit: {
    type: Boolean,
    required: true
  },
  cacheMiss: {
    type: Boolean,
    required: true
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  responseTime: {
    type: Number, // Response time in milliseconds
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('CacheMetric', CacheMetricSchema);
