/**
 * SAIOF cacheMiddleware
 * 
 * Performance-tuned caching middleware that interfaces with the central 'middleware-engine' cache.
 * Automatically handles cache hits, misses, headers, logging, and MongoDB metrics tracking.
 * 
 * Redis Design: The CacheManager is built on standard async storage contracts. Swapping out 
 * the local memory store with a Redis store wrapper connects the Express routing layer 
 * to Redis with zero middleware code modification.
 */

const { CacheEngine } = require('../../middleware-engine');
const CacheMetric = require('../models/CacheMetric');
const mongoose = require('mongoose');
const offlineDb = require('../utils/offlineDb');

// Instantiate central CacheManager using standard LRU Memory Storage
const cacheManager = new CacheEngine.CacheManager();

/**
 * Cache Middleware constructor.
 * @param {number} [durationInSeconds=60] - Expiration TTL in seconds.
 */
const cacheMiddleware = (durationInSeconds = 60) => {
  // Override policy default TTL with configuration param if present
  if (typeof durationInSeconds === 'number' && durationInSeconds > 0) {
    cacheManager.policy.defaultTtlSec = durationInSeconds;
  }

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      res.setHeader('X-Cache', 'BYPASS');
      return next();
    }

    const startTime = Date.now();
    const requestProfile = {
      method: req.method,
      url: req.originalUrl || req.url,
      headers: req.headers
    };

    // Pre-emptively set X-Cache default value to MISS
    res.setHeader('X-Cache', 'MISS');

    try {
      // 1. Query CacheManager (returns value on cache hit, or null on cache miss)
      const cachedResponseString = await cacheManager.get(requestProfile);

      if (cachedResponseString !== null) {
        const responseTime = Date.now() - startTime;

        // Log hit to console
        console.log(`[SAIOF Cache HIT] ${req.method} ${requestProfile.url} - ${responseTime}ms`);

        // Record metrics to MongoDB CacheMetrics collection
        if (mongoose.connection.readyState !== 1) {
          await offlineDb.addCacheMetric({
            cacheHit: true,
            cacheMiss: false,
            endpoint: requestProfile.url,
            responseTime,
            timestamp: new Date()
          });
        } else {
          await CacheMetric.create({
            cacheHit: true,
            cacheMiss: false,
            endpoint: requestProfile.url,
            responseTime,
            timestamp: new Date()
          });
        }

        // Set response headers and return cached payload
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedResponseString);
      }
    } catch (error) {
      console.error(`[SAIOF Cache Error] Error retrieving key from store: ${error.message}`);
    }

    // 2. Intercept Response Delivery on Cache MISS
    const originalSend = res.send;

    res.send = function (body) {
      // Revert hook immediately to prevent recursion
      res.send = originalSend;

      const responseTime = Date.now() - startTime;

      // Only cache successful JSON-like GET request payloads
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log miss to console
        console.log(`[SAIOF Cache MISS] ${req.method} ${requestProfile.url} - ${responseTime}ms`);

        // Asynchronously set cache entry
        cacheManager.set(requestProfile, body, responseTime)
          .catch(err => console.error(`[SAIOF Cache Error] Error setting key in store: ${err.message}`));

        // Asynchronously record miss metrics
        if (mongoose.connection.readyState !== 1) {
          offlineDb.addCacheMetric({
            cacheHit: false,
            cacheMiss: true,
            endpoint: requestProfile.url,
            responseTime,
            timestamp: new Date()
          }).catch(err => console.error(`[SAIOF Cache Metrics Error] Failed to log local record: ${err.message}`));
        } else {
          CacheMetric.create({
            cacheHit: false,
            cacheMiss: true,
            endpoint: requestProfile.url,
            responseTime,
            timestamp: new Date()
          }).catch(err => console.error(`[SAIOF Cache Metrics Error] Failed to log MongoDB record: ${err.message}`));
        }
      }

      // Deliver standard response to client
      return originalSend.call(this, body);
    };

    next();
  };
};

module.exports = cacheMiddleware;

