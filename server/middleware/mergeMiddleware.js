/**
 * SAIOF mergeMiddleware
 * 
 * Performance-optimizing request coalescing (Single Flight) middleware.
 * If multiple requests for the same read endpoint arrive simultaneously,
 * only one controller execution is allowed to proceed. All other concurrent
 * subscribers await and receive the same resolved Promise result, saving database cycles.
 */

const { RequestManager, MergeEngine } = require('../../middleware-engine');

// Central RequestMerger orchestrator using native deferred Promises
const requestMerger = new MergeEngine.RequestMerger();

const mergeMiddleware = async (req, res, next) => {
  // Coalescing is safe only for read operations (GET/HEAD requests)
  if (req.method !== 'GET') {
    return next();
  }

  const endpoint = req.originalUrl || req.url;
  const requestProfile = {
    method: req.method,
    url: endpoint,
    headers: req.headers,
    query: req.query,
    body: req.body
  };

  try {
    const signature = RequestManager.generateSignature(requestProfile);

    // 1. Coalesce concurrent duplicate check
    const activeDeferred = requestMerger.store.get(signature);

    if (activeDeferred !== null) {
      console.log(`[SAIOF Request Coalesced] GET ${endpoint} - Merging thread.`);

      // Log concurrent savings to database (mergemetrics collection)
      await requestMerger.registerMerge(endpoint, signature);

      // Await primary execution promise resolution
      const resolved = await activeDeferred.promise;

      // Deliver cached response directly to secondary client
      res.status(resolved.statusCode);
      for (const [key, val] of Object.entries(resolved.headers)) {
        res.setHeader(key, val);
      }
      return res.send(resolved.body);
    }

    // 2. Primary Execution thread: Register a new deferred promise
    const deferred = requestMerger.createDeferred(signature);

    const originalSend = res.send;

    res.send = function (body) {
      // Revert hook to prevent recursive loops
      res.send = originalSend;

      // Wrap response payload and resolve the deferred promise for all secondary subscribers
      deferred.resolve({
        body,
        headers: res.getHeaders(),
        statusCode: res.statusCode
      });

      // Execute original send
      return originalSend.call(this, body);
    };

    next();
  } catch (error) {
    console.error(`[SAIOF Request Merger Error] ${error.message}`);
    next();
  }
};

module.exports = mergeMiddleware;
