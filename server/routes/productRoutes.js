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
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes with telemetry logging middleware chain
router.get('/', loggerMiddleware, metricsMiddleware, getProducts);
router.get('/:id', loggerMiddleware, metricsMiddleware, getProductById);

// Admin-only creation and modification routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
