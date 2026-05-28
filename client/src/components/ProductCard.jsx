import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Modern E-Commerce Catalog Card
 */
const ProductCard = ({ product, onAddToCart, isAdding }) => {
  const { _id, title, price, category, ratings, stock, image } = product;
  const [imgError, setImgError] = useState(false);

  // Star ratings helper
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else {
        stars.push(<span key={i} className="text-gray-600">☆</span>);
      }
    }
    return stars;
  };

  return (
    <div className="glass-panel group rounded-3xl overflow-hidden border border-gray-800/80 hover:border-gray-700/80 transition-all duration-300 flex flex-col justify-between h-full hover:shadow-xl hover:shadow-black/20">
      {/* Product Image or Fallback */}
      <Link to={`/products/${_id}`} className="block relative aspect-square overflow-hidden bg-gray-900 flex items-center justify-center border-b border-gray-800/40">
        {image && !imgError ? (
          <img
            src={image}
            alt={title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-6xl transform group-hover:scale-110 transition-transform duration-300 select-none flex flex-col items-center justify-center">
            <span>
              {category === 'Electronics' ? '💻' : category === 'Fashion' ? '👕' : category === 'Books' ? '📚' : category === 'Accessories' ? '👜' : '⚙️'}
            </span>
            <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-2">No Image</span>
          </div>
        )}
        {stock === 0 && (
          <span className="absolute top-3 right-3 bg-red-950/80 text-red-400 text-xs px-2.5 py-1 rounded-full border border-red-900 font-semibold uppercase tracking-wider">
            Sold Out
          </span>
        )}
      </Link>

      {/* Product Information */}
      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            {category}
          </span>
          <Link to={`/products/${_id}`} className="block">
            <h3 className="text-lg font-bold text-white hover:text-green-400 line-clamp-2 transition-colors duration-300 mb-2">
              {title}
            </h3>
          </Link>
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex text-sm">{renderStars(ratings || 0)}</div>
            <span className="text-xs text-gray-400 font-medium">({ratings ? ratings.toFixed(1) : '0.0'})</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mt-2 mb-4">
            <span className="text-2xl font-extrabold text-white">${price.toFixed(2)}</span>
            <span className="text-xs text-gray-400">Stock: {stock}</span>
          </div>

          <button
            onClick={() => onAddToCart(_id)}
            disabled={stock === 0 || isAdding}
            className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-md shadow-green-500/10"
          >
            {stock === 0 ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
