/**
 * SAIOF Analytics Controller
 * 
 * Intercepts Express HTTP routes and acts as the broker between the backend server
 * and the 'analytics-engine' aggregation pipelines.
 * Explanations of each endpoint and query are provided in headers and try/catch handlers.
 */

const analyticsEngine = require('../../analytics-engine');

/**
 * @desc    Get consolidated wellness metrics and sub-analyzer data
 * @route   GET /api/analytics/overview
 * @access  Public (Optional: Admin Protected)
 */
const getOverviewData = async (req, res, next) => {
  try {
    const overview = await analyticsEngine.getOverview();
    return res.status(200).json({
      success: true,
      message: 'Overview telemetry report retrieved successfully.',
      data: overview
    });
  } catch (error) {
    console.error(`[SAIOF Analytics Controller Error] getOverviewData failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get server traffic statistics (peaks, route distribution, hourly trends)
 * @route   GET /api/analytics/traffic
 * @access  Public
 */
const getTrafficData = async (req, res, next) => {
  try {
    const traffic = await analyticsEngine.getTrafficStats();
    return res.status(200).json({
      success: true,
      message: 'Traffic analytics compiled successfully.',
      data: traffic
    });
  } catch (error) {
    console.error(`[SAIOF Analytics Controller Error] getTrafficData failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get cache efficiency statistics (hits, misses, and response time savings)
 * @route   GET /api/analytics/cache
 * @access  Public
 */
const getCacheData = async (req, res, next) => {
  try {
    const cache = await analyticsEngine.getCacheStats();
    return res.status(200).json({
      success: true,
      message: 'Cache performance metrics aggregated successfully.',
      data: cache
    });
  } catch (error) {
    console.error(`[SAIOF Analytics Controller Error] getCacheData failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get system latency analytics (mean, median, p90/p99 percentiles, and slowest routes)
 * @route   GET /api/analytics/latency
 * @access  Public
 */
const getLatencyData = async (req, res, next) => {
  try {
    const latency = await analyticsEngine.getLatencyStats();
    return res.status(200).json({
      success: true,
      message: 'Latency profiles calculated successfully.',
      data: latency
    });
  } catch (error) {
    console.error(`[SAIOF Analytics Controller Error] getLatencyData failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get request duplication and API abuse analytics (abused endpoints, frequencies)
 * @route   GET /api/analytics/duplicates
 * @access  Public
 */
const getDuplicateData = async (req, res, next) => {
  try {
    const duplicates = await analyticsEngine.getDuplicateStats();
    return res.status(200).json({
      success: true,
      message: 'Request duplication stats summarized successfully.',
      data: duplicates
    });
  } catch (error) {
    console.error(`[SAIOF Analytics Controller Error] getDuplicateData failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get request coalescing (Promise merging) efficiency analytics
 * @route   GET /api/analytics/merge
 * @access  Public
 */
const getMergeData = async (req, res, next) => {
  try {
    const merge = await analyticsEngine.getMergeStats();
    return res.status(200).json({
      success: true,
      message: 'Merge performance metrics aggregated successfully.',
      data: merge
    });
  } catch (error) {
    console.error(`[SAIOF Analytics Controller Error] getMergeData failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Launch traffic simulator workload in the background
 * @route   POST /api/analytics/generate-traffic
 * @access  Private/Admin
 */
const generateTrafficData = async (req, res, next) => {
  try {
    const requests = parseInt(req.body.requests) || 1000;
    if (![1000, 3000, 5000].includes(requests)) {
      res.status(400);
      throw new Error('Invalid simulator workload. Supported workloads: 1000, 3000, or 5000 requests.');
    }

    const { exec } = require('child_process');
    const path = require('path');
    const scriptPath = path.join(__dirname, '../../testing/simulator/trafficSimulator.js');

    console.log(`[Traffic Generator] Launching e-commerce workload simulator background process for ${requests} requests...`);
    
    // Launch child process in background asynchronously
    exec(`node "${scriptPath}" --requests=${requests}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Traffic Generator Error] Workload simulation terminated: ${error.message}`);
        return;
      }
      console.log(`[Traffic Generator] Workload simulation completed successfully.\n${stdout}`);
    });

    return res.status(200).json({
      success: true,
      message: `Workload simulation of ${requests} requests successfully launched in the background.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewData,
  getTrafficData,
  getCacheData,
  getLatencyData,
  getDuplicateData,
  getMergeData,
  generateTrafficData
};

