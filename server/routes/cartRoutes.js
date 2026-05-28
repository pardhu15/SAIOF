const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// All cart endpoints require authentication
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update/:id', updateCartItem);
router.delete('/remove/:id', removeCartItem);

module.exports = router;
