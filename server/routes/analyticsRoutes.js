/**
 * SAIOF Analytics API Routes
 * 
 * Defines clean endpoints exposing dashboard-ready JSON telemetry data
 * sourced directly from the aggregation pipelines inside analytics-engine.
 */

const express = require('express');
const router = express.Router();
const {
  getOverviewData,
  getTrafficData,
  getCacheData,
  getLatencyData,
  getDuplicateData,
  getMergeData,
  generateTrafficData
} = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Define API routing maps - secured to Admin Only
router.get('/overview', protect, admin, getOverviewData);
router.get('/traffic', protect, admin, getTrafficData);
router.get('/cache', protect, admin, getCacheData);
router.get('/latency', protect, admin, getLatencyData);
router.get('/duplicates', protect, admin, getDuplicateData);
router.get('/merge', protect, admin, getMergeData);

// Background traffic simulation executor route
router.post('/generate-traffic', protect, admin, generateTrafficData);

module.exports = router;

