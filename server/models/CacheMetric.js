const mongoose = require('mongoose');

const CacheMetricSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    index: true
  },
  hitOrMiss: {
    type: String,
    enum: ['hit', 'miss'],
    required: true
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
