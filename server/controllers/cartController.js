const cartService = require('../services/cartService');

/**
 * @desc    Get current user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCartByUserId(req.user._id);
    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/add
 * @access  Private
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required');
    }

    const cart = await cartService.addItemToCart(req.user._id, productId, quantity || 1);
    return res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @desc    Update item quantity in cart
 * @route   PUT /api/cart/update/:id
 * @access  Private
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) {
      res.status(400);
      throw new Error('Quantity is required');
    }

    const cart = await cartService.updateItemQuantity(req.user._id, req.params.id, quantity);
    return res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/remove/:id
 * @access  Private
 */
const removeCartItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeItemFromCart(req.user._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem
};
