const crypto = require('crypto');
const RequestLog = require('../models/RequestLog');

/**
 * SAIOF Telemetry Request Logger
 * Intercepts requests, computes latency and MD5 request hashes, and logs performance telemetry
 * directly into MongoDB. This acts as the dataset for predictive caching and traffic analysis.
 */
const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    try {
      // Exclude static assets or very noisy paths if needed (e.g. /favicon.ico)
      const path = req.originalUrl || req.url;
      if (path.includes('favicon.ico')) return;

      const latency = Date.now() - startTime;

      // Generate a deterministic MD5 signature of the request
      const bodyString = req.body ? JSON.stringify(req.body) : '';
      const requestSignature = `${req.method}:${path}:${bodyString}`;
      const requestHash = crypto
        .createHash('md5')
        .update(requestSignature)
        .digest('hex');

      // Async write to database so it doesn't block the request lifecycle
      await RequestLog.create({
        endpoint: path,
        method: req.method,
        latency,
        statusCode: res.statusCode,
        requestHash,
        timestamp: new Date()
      });

      console.log(`[SAIOF Log] ${req.method} ${path} - Status: ${res.statusCode} (${latency}ms)`);
    } catch (error) {
      console.error(`[SAIOF Logging Error] Failed to record request telemetry: ${error.message}`);
    }
  });

  next();
};

module.exports = loggerMiddleware;
