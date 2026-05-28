const mongoose = require('mongoose');

const RequestLogSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true
  },
  latency: {
    type: Number, // Latency in milliseconds
    required: true
  },
  statusCode: {
    type: Number,
    required: true,
    index: true
  },
  requestHash: {
    type: String, // Fingerprint for checking duplicate requests
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index on timestamp and endpoint for quick analytics aggregations
RequestLogSchema.index({ timestamp: -1, endpoint: 1 });

module.exports = mongoose.model('RequestLog', RequestLogSchema);
