const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a product title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a product description']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a product price'],
    min: [0, 'Price cannot be negative'],
    default: 0.0
  },
  image: {
    type: String,
    default: '/images/placeholder.jpg'
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock count'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  ratings: {
    type: Number,
    default: 0.0,
    min: [0, 'Rating cannot be below 0'],
    max: [5, 'Rating cannot exceed 5']
  }
}, {
  timestamps: true
});

// Single-field index on category for quick filtering
ProductSchema.index({ category: 1 });

// Text index on title (and description for comprehensive search)
ProductSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
