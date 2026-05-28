const mongoose = require('mongoose');

const TrafficMetricSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  concurrentUsers: {
    type: Number,
    required: true,
    default: 0
  },
  requestCount: {
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

module.exports = mongoose.model('TrafficMetric', TrafficMetricSchema);
