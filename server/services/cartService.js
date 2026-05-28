const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Helper to calculate cart total price dynamically using current product prices
 */
const recalculateCartTotals = async (cart) => {
  let total = 0.0;
  const validProducts = [];

  for (const item of cart.products) {
    const prodId = item.productId._id || item.productId;
    const product = await Product.findById(prodId);
    if (product) {
      total += product.price * item.quantity;
      validProducts.push(item);
    }
  }

  cart.products = validProducts;
  cart.totalPrice = Math.round(total * 100) / 100;
  return cart;
};

/**
 * Get user's cart (populated with product info)
 */
const getCartByUserId = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    // If no cart exists, create a default empty one
    cart = await Cart.create({
      userId,
      products: [],
      totalPrice: 0.0
    });
    return cart;
  }

  // Automatically filter out any orphaned products and save the cleaned cart
  const originalLength = cart.products.length;
  cart = await recalculateCartTotals(cart);
  if (cart.products.length !== originalLength) {
    await cart.save();
  }

  return await cart.populate('products.productId');
};

/**
 * Add an item to the cart
 */
const addItemToCart = async (userId, productId, quantity = 1) => {
  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found to add to cart');
  }

  // Get cart
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, products: [] });
  }

  // Check if item already in cart
  const itemIndex = cart.products.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    // Update quantity
    cart.products[itemIndex].quantity += parseInt(quantity, 10);
  } else {
    // Add new product
    cart.products.push({ productId, quantity: parseInt(quantity, 10) });
  }

  // Calculate totals
  cart = await recalculateCartTotals(cart);
  await cart.save();

  return await cart.populate('products.productId');
};

/**
 * Update item quantity in the cart
 */
const updateItemQuantity = async (userId, productId, quantity) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new Error('Cart not found for this user');
  }

  const itemIndex = cart.products.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  const parsedQty = parseInt(quantity, 10);
  if (parsedQty <= 0) {
    // Remove if quantity is zero or less
    cart.products.splice(itemIndex, 1);
  } else {
    cart.products[itemIndex].quantity = parsedQty;
  }

  cart = await recalculateCartTotals(cart);
  await cart.save();

  return await cart.populate('products.productId');
};

/**
 * Remove an item from the cart
 */
const removeItemFromCart = async (userId, productId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new Error('Cart not found for this user');
  }

  cart.products = cart.products.filter(
    (item) => item.productId.toString() !== productId.toString()
  );

  cart = await recalculateCartTotals(cart);
  await cart.save();

  return await cart.populate('products.productId');
};

module.exports = {
  getCartByUserId,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart
};
