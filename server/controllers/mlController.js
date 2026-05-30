/**
 * SAIOF Machine Learning Controller
 * 
 * Intercepts Express routing maps and brokers forecasting calls to the mlService bridge.
 * Formats data cleanly to support standard dashboard widgets and Postman verifications.
 */

const mlService = require('../services/mlService');

/**
 * @desc    Get future traffic request volume forecast
 * @route   GET /api/ml/traffic
 * @access  Public
 */
const getTrafficPrediction = async (req, res, next) => {
  try {
    const hour = req.query.hour !== undefined ? parseInt(req.query.hour) : undefined;
    const day = req.query.day !== undefined ? parseInt(req.query.day) : undefined;

    const trafficRes = await mlService.predictTraffic(hour, day);

    return res.status(200).json({
      success: true,
      message: 'Traffic volume prediction compiled successfully.',
      data: {
        predictionType: 'traffic',
        hour: hour !== undefined ? hour : new Date().getUTCHours(),
        day: day !== undefined ? day : Math.max(0, new Date().getUTCDay() - 1),
        predictedTraffic: Math.round(trafficRes.prediction),
        confidence: trafficRes.confidence,
        recommendation: trafficRes.recommendation,
        unit: 'requests/hour'
      }
    });
  } catch (error) {
    console.error(`[SAIOF ML Controller Error] getTrafficPrediction failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get future cache hit ratio and efficiency forecast
 * @route   GET /api/ml/cache
 * @access  Public
 */
const getCachePrediction = async (req, res, next) => {
  try {
    const hour = req.query.hour !== undefined ? parseInt(req.query.hour) : undefined;
    const day = req.query.day !== undefined ? parseInt(req.query.day) : undefined;
    let requestCount = req.query.requestCount !== undefined ? parseInt(req.query.requestCount) : undefined;
    const duplicateRate = req.query.duplicateRate !== undefined ? parseFloat(req.query.duplicateRate) : 0.05;

    // Chaining fallback: If requestCount is missing, use Traffic Predictor to estimate it first
    if (requestCount === undefined) {
      console.log('[ML Controller] requestCount missing. Chaining traffic model first...');
      const trafficRes = await mlService.predictTraffic(hour, day);
      requestCount = Math.round(trafficRes.prediction);
    }

    const cacheRes = await mlService.predictCache(hour, day, requestCount, duplicateRate);

    return res.status(200).json({
      success: true,
      message: 'Cache hit efficiency prediction compiled successfully.',
      data: {
        predictionType: 'cache',
        hour: hour !== undefined ? hour : new Date().getUTCHours(),
        day: day !== undefined ? day : Math.max(0, new Date().getUTCDay() - 1),
        inputRequestCount: requestCount,
        predictedCacheDemand: cacheRes.prediction,
        predictedHitRatio: parseFloat(cacheRes.hitRatio.toFixed(4)),
        confidence: cacheRes.confidence,
        recommendation: cacheRes.recommendation,
        unit: 'ratio (0-1)'
      }
    });
  } catch (error) {
    console.error(`[SAIOF ML Controller Error] getCachePrediction failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get future latency bottleneck forecast
 * @route   GET /api/ml/latency
 * @access  Public
 */
const getLatencyPrediction = async (req, res, next) => {
  try {
    const hour = req.query.hour !== undefined ? parseInt(req.query.hour) : undefined;
    const day = req.query.day !== undefined ? parseInt(req.query.day) : undefined;
    let requestCount = req.query.requestCount !== undefined ? parseInt(req.query.requestCount) : undefined;
    let cacheHitRatio = req.query.cacheHitRatio !== undefined ? parseFloat(req.query.cacheHitRatio) : undefined;
    const duplicateRate = req.query.duplicateRate !== undefined ? parseFloat(req.query.duplicateRate) : 0.05;
    const mergeRate = req.query.mergeRate !== undefined ? parseFloat(req.query.mergeRate) : 0.02;

    // Chaining fallback: If requestCount is missing, predict traffic
    if (requestCount === undefined) {
      console.log('[ML Controller] requestCount missing. Chaining traffic model...');
      const trafficRes = await mlService.predictTraffic(hour, day);
      requestCount = Math.round(trafficRes.prediction);
    }

    // Chaining fallback: If cacheHitRatio is missing, predict cache hits
    if (cacheHitRatio === undefined) {
      console.log('[ML Controller] cacheHitRatio missing. Chaining cache model...');
      const cacheRes = await mlService.predictCache(hour, day, requestCount, duplicateRate);
      cacheHitRatio = cacheRes.hitRatio;
    }

    const latencyRes = await mlService.predictLatency(
      hour,
      day,
      requestCount,
      cacheHitRatio,
      duplicateRate,
      mergeRate
    );

    return res.status(200).json({
      success: true,
      message: 'Server latency response prediction compiled successfully.',
      data: {
        predictionType: 'latency',
        hour: hour !== undefined ? hour : new Date().getUTCHours(),
        day: day !== undefined ? day : Math.max(0, new Date().getUTCDay() - 1),
        inputRequestCount: requestCount,
        inputCacheHitRatio: parseFloat(cacheHitRatio.toFixed(4)),
        inputDuplicateRate: duplicateRate,
        inputMergeRate: mergeRate,
        predictedLatency: Math.round(latencyRes.prediction),
        confidence: latencyRes.confidence,
        recommendation: latencyRes.recommendation,
        unit: 'milliseconds (ms)'
      }
    });
  } catch (error) {
    console.error(`[SAIOF ML Controller Error] getLatencyPrediction failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get self-optimizing middleware recommendations
 * @route   GET /api/ml/recommendations
 * @access  Public
 */
const getRecommendations = async (req, res, next) => {
  try {
    const hour = req.query.hour !== undefined ? parseInt(req.query.hour) : undefined;
    const day = req.query.day !== undefined ? parseInt(req.query.day) : undefined;
    const duplicateRate = req.query.duplicateRate !== undefined ? parseFloat(req.query.duplicateRate) : 0.05;
    const mergeRate = req.query.mergeRate !== undefined ? parseFloat(req.query.mergeRate) : 0.02;

    const recsRes = await mlService.predictRecommendations(hour, day, duplicateRate, mergeRate);

    return res.status(200).json({
      success: true,
      message: 'AI optimization recommendations compiled successfully.',
      data: recsRes
    });
  } catch (error) {
    console.error(`[SAIOF ML Controller Error] getRecommendations failed: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getTrafficPrediction,
  getCachePrediction,
  getLatencyPrediction,
  getRecommendations
};

