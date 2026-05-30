/**
 * SAIOF Express ↔ Python ML Service Layer - Integration Verification Suite
 * 
 * Verifies Express endpoints (/api/ml/*), Axios microservice bridge (mlService.js),
 * and the analytics-engine integration completely in-memory with zero port collisions.
 */

const assert = require('assert').strict;
const path = require('path');

// 1. Mock Mongoose Models before loading the Express app
const mockRequestLog = {
  countDocuments: async () => 850, // mock current traffic in the last 60 minutes
  aggregate: async (pipeline) => []
};

const mockTrafficMetric = {
  aggregate: async () => [{ peakConcurrency: 15, totalTrafficLogs: 200 }]
};

const mockCacheMetric = {
  aggregate: async () => [{ totalHits: 80, totalMisses: 20, avgHitResponseTime: 4.5, avgMissResponseTime: 1500.2 }]
};

const mockDuplicateMetric = {
  aggregate: async () => [{ totalUniqueSignatures: 10, totalDuplicateEvents: 100 }]
};

// Register all mocks in Mongoose require caches
require.cache[require.resolve('../models/RequestLog.js')] = { exports: mockRequestLog };
require.cache[require.resolve('../models/TrafficMetric.js')] = { exports: mockTrafficMetric };
require.cache[require.resolve('../models/CacheMetric.js')] = { exports: mockCacheMetric };
require.cache[require.resolve('../models/DuplicateMetric.js')] = { exports: mockDuplicateMetric };

// 2. Load the Express application
const app = require('../app.js');

/**
 * Helper to dispatch an in-memory GET request to the Express routing pipeline.
 */
function requestExpressGet(path) {
  return new Promise((resolve) => {
    let headers = {};
    let responseBody = null;
    let statusCode = 200;

    const req = {
      method: 'GET',
      url: path,
      originalUrl: path,
      headers: { 'Accept': 'application/json' },
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' },
      on: () => {}
    };

    const res = {
      statusCode: 200,
      headers: {},
      setHeader: (key, val) => { headers[key.toLowerCase()] = val; },
      getHeader: (key) => { return headers[key.toLowerCase()]; },
      status: (code) => { statusCode = code; return res; },
      json: (data) => { responseBody = data; resolve({ statusCode, headers, body: responseBody }); return res; },
      send: (data) => { responseBody = typeof data === 'string' ? JSON.parse(data) : data; resolve({ statusCode, headers, body: responseBody }); return res; },
      end: () => { resolve({ statusCode, headers, body: responseBody }); }
    };

    // Forward request inside Express app directly
    app(req, res);
  });
}

async function runMlIntegrationTest() {
  console.log('===============================================================');
  console.log('🚀 SAIOF Express ↔ Python ML Engine - Integration Verification');
  console.log('===============================================================\n');

  let testsPassed = 0;

  // 1. Test GET /api/ml/traffic
  console.log('--- Request: GET /api/ml/traffic ---');
  const resTraffic = await requestExpressGet('/api/ml/traffic?hour=12&day=1');
  console.log('Response:', JSON.stringify(resTraffic.body, null, 2));
  assert.equal(resTraffic.statusCode, 200);
  assert.equal(resTraffic.body.success, true);
  assert.equal(resTraffic.body.data.predictionType, 'traffic');
  assert.equal(resTraffic.body.data.hour, 12);
  assert.equal(resTraffic.body.data.day, 1);
  assert.ok(typeof resTraffic.body.data.prediction === 'number');
  console.log(' ✅ Traffic prediction route returned correct status and JSON layout.');
  testsPassed++;

  // 2. Test GET /api/ml/cache
  console.log('\n--- Request: GET /api/ml/cache (with chained defaults) ---');
  const resCache = await requestExpressGet('/api/ml/cache?hour=14&day=3');
  console.log('Response:', JSON.stringify(resCache.body, null, 2));
  assert.equal(resCache.statusCode, 200);
  assert.equal(resCache.body.success, true);
  assert.equal(resCache.body.data.predictionType, 'cache');
  assert.ok(typeof resCache.body.data.inputRequestCount === 'number');
  assert.ok(resCache.body.data.prediction >= 0.0 && resCache.body.data.prediction <= 1.0);
  console.log(' ✅ Cache demand prediction route successfully resolved in chain.');
  testsPassed++;

  // 3. Test GET /api/ml/latency
  console.log('\n--- Request: GET /api/ml/latency (with full chained defaults) ---');
  const resLatency = await requestExpressGet('/api/ml/latency');
  console.log('Response:', JSON.stringify(resLatency.body, null, 2));
  assert.equal(resLatency.statusCode, 200);
  assert.equal(resLatency.body.success, true);
  assert.equal(resLatency.body.data.predictionType, 'latency');
  assert.ok(typeof resLatency.body.data.prediction === 'number');
  console.log(' ✅ Latency response prediction route successfully resolved in chain.');
  testsPassed++;

  // 4. Test GET /api/analytics/overview (assert predictions merge)
  console.log('\n--- Request: GET /api/analytics/overview (Assert ML Predictions Integration) ---');
  const resOverview = await requestExpressGet('/api/analytics/overview');
  console.log('Overview ML Segment Output:', JSON.stringify(resOverview.body.data.mlPredictions, null, 2));
  
  assert.equal(resOverview.statusCode, 200);
  assert.equal(resOverview.body.success, true);
  assert.ok(resOverview.body.data.mlPredictions !== undefined, 'mlPredictions is missing from overview response!');
  assert.equal(resOverview.body.data.mlPredictions.currentTraffic, 850);
  assert.ok(typeof resOverview.body.data.mlPredictions.predictedTraffic === 'number');
  assert.ok(typeof resOverview.body.data.mlPredictions.predictedLatency === 'number');
  assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(resOverview.body.data.mlPredictions.predictedCacheDemand));
  
  console.log(' ✅ Analytics overview successfully incorporates predictedTraffic, predictedLatency, and predictedCacheDemand.');
  testsPassed++;

  console.log('\n===============================================================');
  console.log(`🏁 ALL ${testsPassed} INTEGRATION PIPELINE VERIFICATIONS PASSED SUCCESSFULLY!`);
  console.log('===============================================================');
}

runMlIntegrationTest().catch(err => {
  console.error('\n ❌ ML INTEGRATION VERIFICATION FAILURE:');
  console.error(err);
  process.exit(1);
});
