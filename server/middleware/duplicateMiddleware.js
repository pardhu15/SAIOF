/**
 * SAIOF duplicateMiddleware
 * Detects and prevents duplicate form submissions or API requests (idempotency checking).
 * 
 * FUTURE INTEGRATION POSSIBILITIES:
 * - Distributed request tracking using Redis keys.
 * - Enforcing idempotency keys for ordering pipelines and checkout payment requests.
 * - Integration with 'middleware-engine' to match network retries with cached original responses.
 */
const activeRequests = new Set();

const duplicateMiddleware = (req, res, next) => {
  // Scope duplicate checking per user/session by including authorization header in fingerprint
  const authHeader = req.headers.authorization || '';
  const requestFingerprint = `${authHeader}:${req.method}:${req.originalUrl}:${JSON.stringify(req.body)}`;
  
  if (req.method === 'POST' && activeRequests.has(requestFingerprint)) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate request detected. Please wait for the previous operation to complete.'
    });
  }

  if (req.method === 'POST') {
    activeRequests.add(requestFingerprint);
    // Cleanup active request once response is sent
    res.on('finish', () => {
      activeRequests.delete(requestFingerprint);
    });
    res.on('close', () => {
      activeRequests.delete(requestFingerprint);
    });
  }

  next();
};

module.exports = duplicateMiddleware;
