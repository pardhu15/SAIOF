/**
 * SAIOF Machine Learning Routes
 * 
 * Maps predictive endpoints to the core microservice controller logic.
 * Sourced directly by backend dashboards and validation suites.
 */

const express = require('express');
const router = express.Router();
const {
  getTrafficPrediction,
  getCachePrediction,
  getLatencyPrediction,
  getRecommendations
} = require('../controllers/mlController');
const { protect, admin } = require('../middleware/authMiddleware');

// Define API routing maps - secured to Admin Only
router.get('/traffic', protect, admin, getTrafficPrediction);
router.get('/cache', protect, admin, getCachePrediction);
router.get('/latency', protect, admin, getLatencyPrediction);
router.get('/recommendations', protect, admin, getRecommendations);

module.exports = router;


