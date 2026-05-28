const TrafficMetric = require('../models/TrafficMetric');

// Tracks globally active requests on this process
let activeRequests = 0;

/**
 * SAIOF Telemetry Metrics Middleware
 * Monitors concurrent connections and records traffic frequency spikes in the database.
 */
const metricsMiddleware = (req, res, next) => {
  const path = req.originalUrl || req.url;
  if (path.includes('favicon.ico')) return next();

  // Increment concurrent request counters
  activeRequests++;

  res.on('finish', async () => {
    activeRequests = Math.max(0, activeRequests - 1);

    try {
      // Record tick in the traffic metrics log database
      await TrafficMetric.create({
        endpoint: path,
        concurrentUsers: activeRequests,
        requestCount: 1, // Represents this request event
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`[SAIOF Metrics Error] Failed to log traffic metrics: ${error.message}`);
    }
  });

  next();
};

module.exports = metricsMiddleware;
