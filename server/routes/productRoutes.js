const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Middlewares
const loggerMiddleware = require('../middleware/loggerMiddleware');
const metricsMiddleware = require('../middleware/metricsMiddleware');
const cacheMiddleware = require('../middleware/cacheMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes with telemetry logging middleware chain and performance caching
router.get('/', loggerMiddleware, metricsMiddleware, cacheMiddleware(60), getProducts);
router.get('/:id', loggerMiddleware, metricsMiddleware, cacheMiddleware(60), getProductById);

// Admin-only creation and modification routes
router.post('/', createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
