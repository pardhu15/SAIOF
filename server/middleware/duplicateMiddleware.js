/**
 * SAIOF duplicateMiddleware
 * 
 * Advanced rate-limiting and duplicate protection middleware.
 * Connects Express routing with the 'middleware-engine' duplicate-detector.
 * Detects concurrent and sequential duplicates for GET and POST requests,
 * and maintains telemetry analytics in MongoDB duplicatemetrics collection.
 * 
 * Flow:
 * - Computes a deterministic request signature based on METHOD + URL + QUERY + BODY.
 * - Queries DuplicateChecker to check for active concurrency or sliding window locks.
 * - On DUPLICATE:
 *   - Increments duplicate count in MongoDB.
 *   - If POST, blocks immediately with 409 Conflict (prevents double writes).
 *   - If GET, logs the event to MongoDB/console but allows it to execute (tracks duplicate reads).
 * - On NEW request:
 *   - Executes route handler.
 *   - Upon response finish/close, acquires a sliding lock to trap rapid subsequent retries.
 */

const { RequestManager, DuplicateDetector } = require('../../middleware-engine');
const DuplicateMetric = require('../models/DuplicateMetric');
const mongoose = require('mongoose');
const offlineDb = require('../utils/offlineDb');

// Instantiate global DuplicateTracker (defaults to in-memory active store and 2-second rate locks)
const duplicateTracker = new DuplicateDetector.DuplicateTracker({
  slidingWindowMs: 2000
});

const duplicateMiddleware = async (req, res, next) => {
  // Construct request profile for signature generation
  const requestProfile = {
    method: req.method,
    url: req.originalUrl || req.url,
    headers: req.headers,
    query: req.query,
    body: req.body
  };

  const clientId = req.headers.authorization
    ? `user-${RequestManager.generateSignature({ method: 'HASH', url: req.headers.authorization })}`.slice(0, 15)
    : 'anonymous';

  try {
    const signature = RequestManager.generateSignature(requestProfile);

    // 1. Check if request is a duplicate (concurrent or sequential)
    const checkResult = await duplicateTracker.check(requestProfile, clientId);

    if (checkResult.isDuplicate) {
      // Log duplicate using atomic increment upsert
      if (mongoose.connection.readyState !== 1) {
        await offlineDb.addDuplicateMetric({
          signature,
          endpoint: requestProfile.url
        });
      } else {
        await DuplicateMetric.findOneAndUpdate(
          { signature },
          {
            $inc: { count: 1 },
            $set: { endpoint: requestProfile.url, timestamp: new Date() }
          },
          { upsert: true, new: true }
        );
      }

      console.warn(`[SAIOF Duplicate Detected] ${req.method} ${requestProfile.url} | Client: ${clientId} | Type: ${checkResult.type}`);

      // POST requests block immediately to prevent double database writes
      if (req.method === 'POST') {
        return res.status(409).json({
          success: false,
          message: 'Duplicate request detected. Please wait for the previous operation to complete.'
        });
      }

      // GET requests are allowed to proceed, but tracked as duplicate reads
    }

    // 2. Set sliding rate lock upon response completion to capture sequential retries
    const cleanup = async () => {
      res.removeListener('finish', cleanup);
      res.removeListener('close', cleanup);
      
      // Acquire sliding window replay lock (blocks rapid retries for 2 seconds)
      await duplicateTracker.acquireLock(requestProfile);
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);

    next();
  } catch (error) {
    console.error(`[SAIOF Duplicate Middleware Error] ${error.message}`);
    next();
  }
};

module.exports = duplicateMiddleware;

