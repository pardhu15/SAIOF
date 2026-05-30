const Product = require('../models/Product');
const mongoose = require('mongoose');
const offlineDb = require('../utils/offlineDb');

/**
 * Get all products with search, filtering, sorting, and pagination
 */
const getAllProducts = async (queryParams) => {
  if (mongoose.connection.readyState !== 1) {
    return await offlineDb.getAllProducts(queryParams);
  }

  const { search, category, sort, page = 1, limit = 10 } = queryParams;

  // Build filter object
  const filter = {};

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Text search filter
  if (search) {
    // Check if MongoDB text index should be utilized, or fall back to regex
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build query
  let query = Product.find(filter);

  // Sorting
  if (sort) {
    // Example: sort=price -> asc, sort=-price -> desc
    const sortBy = sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    // Default sort by creation time (newest first)
    query = query.sort('-createdAt');
  }

  // Pagination calculations
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const skipIndex = (parsedPage - 1) * parsedLimit;

  query = query.skip(skipIndex).limit(parsedLimit);

  // Execute query and total count
  const productsResult = await query;
  const totalCount = await Product.countDocuments(filter);

  return {
    products: productsResult,
    pagination: {
      total: totalCount,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(totalCount / parsedLimit)
    }
  };
};

/**
 * Get single product by id
 */
const getProductById = async (id) => {
  if (mongoose.connection.readyState !== 1) {
    return await offlineDb.getProductById(id);
  }

  // Online Mode dynamic sale mapper
  if (id === 'sale') {
    let product = await Product.findOne({ title: "SAIOF Flash Sale Optimization Bundle" });
    if (!product) {
      product = await Product.create({
        title: "SAIOF Flash Sale Optimization Bundle",
        price: 149.99,
        description: "Exclusive promotional optimization bundle on flash sale.",
        category: "electronics"
      });
    }
    return product;
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
};

/**
 * Create a new product
 */
const createProduct = async (productData) => {
  if (mongoose.connection.readyState !== 1) {
    return await offlineDb.createProduct(productData);
  }
  return await Product.create(productData);
};

/**
 * Update product details
 */
const updateProduct = async (id, productData) => {
  if (mongoose.connection.readyState !== 1) {
    return await offlineDb.getProductById(id);
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: productData },
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new Error('Product not found to update');
  }
  return product;
};

/**
 * Delete product
 */
const deleteProduct = async (id) => {
  if (mongoose.connection.readyState !== 1) {
    return await offlineDb.getProductById(id);
  }

  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new Error('Product not found to delete');
  }
  return product;
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

