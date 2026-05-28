/**
 * SAIOF cacheMiddleware
 * Simple in-memory response caching boilerplate.
 * 
 * FUTURE INTEGRATION POSSIBILITIES:
 * - Connecting to a Redis server or central 'middleware-engine' cache.
 * - Intelligent cache invalidation triggers on POST/PUT/DELETE requests for related resources.
 * - Dynamic caching strategies for catalog lookups (products, categories).
 */
const mcache = require('memory-cache'); // We can use a simple custom local store or memory-cache if needed.
// To keep it zero-dependency on extra packages besides package.json dependencies, we'll write a simple JS Map store.
const cacheStore = new Map();

const cacheMiddleware = (durationInSeconds = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cacheStore.get(key);

    if (cachedResponse && cachedResponse.expires > Date.now()) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Cache', 'HIT');
      return res.send(cachedResponse.body);
    }

    // Capture standard send function to intercept and cache response
    const originalSend = res.send;
    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          body,
          expires: Date.now() + durationInSeconds * 1000
        });
      }
      res.setHeader('X-Cache', 'MISS');
      originalSend.call(this, body);
    };

    next();
  };
};

module.exports = cacheMiddleware;
