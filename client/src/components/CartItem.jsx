import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Single Cart Item Component
 */
const CartItem = ({ product, quantity, onUpdateQty, onRemove }) => {
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const handleDecrease = () => {
    if (quantity > 1) {
      onUpdateQty(product._id, quantity - 1);
    } else {
      onRemove(product._id);
    }
  };

  const handleIncrease = () => {
    if (quantity < product.stock) {
      onUpdateQty(product._id, quantity + 1);
    } else {
      alert(`Cannot add more. Only ${product.stock} items available in stock.`);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-gray-700/60 transition-all duration-300">
      <div className="flex items-center space-x-6 w-full sm:w-auto">
        {/* Product Image / Fallback Icon */}
        <Link to={`/products/${product._id}`} className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden hover:bg-gray-800 transition-colors shrink-0 border border-gray-800 relative">
          {product.image && !imgError ? (
            <img
              src={product.image}
              alt={product.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl select-none">
              {product.category === 'Electronics' ? '💻' : product.category === 'Fashion' ? '👕' : product.category === 'Books' ? '📚' : product.category === 'Accessories' ? '👜' : '⚙️'}
            </span>
          )}
        </Link>
        <div>
          <Link
            to={`/products/${product._id}`}
            className="text-lg font-bold text-white hover:text-green-400 line-clamp-1 transition-colors duration-300"
          >
            {product.title}
          </Link>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mt-0.5">
            {product.category}
          </span>
          <p className="text-sm font-medium text-green-400 mt-1">${product.price.toFixed(2)} each</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
        {/* Quantity Selector */}
        <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={handleDecrease}
            className="px-3 py-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            −
          </button>
          <span className="px-4 py-1.5 text-sm font-semibold text-white select-none w-10 text-center">
            {quantity}
          </span>
          <button
            onClick={handleIncrease}
            className="px-3 py-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            +
          </button>
        </div>

        {/* Price & Remove Action */}
        <div className="text-right shrink-0">
          <p className="text-lg font-extrabold text-white">${(product.price * quantity).toFixed(2)}</p>
          <button
            onClick={() => onRemove(product._id)}
            className="text-xs font-bold text-red-400 hover:text-red-300 mt-1 transition-colors underline hover:no-underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
