const productService = require('../services/productService');

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    // Artificial latency simulation of 1500ms
    // This allows SAIOF middleware layers to visibly optimize latency later.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = await productService.getAllProducts(req.query);
    return res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

/**
 * @desc    Get product details by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    // Artificial latency simulation of 1500ms
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = await productService.getProductById(req.params.id);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

/**
 * @desc    Create a product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res, next) => {
  try {
    const result = await productService.createProduct(req.body);
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @desc    Update product catalog properties
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res, next) => {
  try {
    const result = await productService.updateProduct(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: result
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @desc    Remove product catalog item
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
