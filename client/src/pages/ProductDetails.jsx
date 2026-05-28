import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

/**
 * Integrated Product Details Page
 */
const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch product detail on mount
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      setImgError(false); // Reset image error state
      try {
        const res = await apiClient.get(`/products/${id}`);
        if (res.data && res.data.success) {
          setProduct(res.data.data);
        }
      } catch (err) {
        console.error('[Details Fetch Error] Failed:', err);
        setError(err.response?.data?.message || 'Failed to retrieve product details. Confirm database record exists.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCartSubmit = async () => {
    if (!isAuthenticated) {
      alert('Authentication required to manage shopping cart. Redirecting...');
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      const res = await apiClient.post('/cart/add', { productId: product._id, quantity });
      if (res.data && res.data.success) {
        alert(`Successfully added ${quantity} item(s) to your shopping cart!`);
      }
    } catch (err) {
      console.error('[Cart Add Details Error] Failed:', err);
      alert(err.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-sm text-green-400 hover:text-green-300 mb-8 transition-colors">
          ← Back to Catalog
        </Link>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Breadcrumb Back Link */}
      <Link to="/" className="inline-flex items-center text-sm text-green-400 hover:text-green-300 mb-8 transition-colors">
        ← Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image Panel */}
        <div className="glass-panel aspect-square rounded-3xl overflow-hidden flex items-center justify-center border border-gray-800 shadow-xl bg-gray-900 relative">
          {product.image && !imgError ? (
            <img
              src={product.image}
              alt={product.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center flex flex-col items-center justify-center p-6">
              <span className="text-[120px] select-none leading-none">
                {product.category === 'Electronics' ? '💻' : product.category === 'Fashion' ? '👕' : product.category === 'Books' ? '📚' : product.category === 'Accessories' ? '👜' : '⚙️'}
              </span>
              <span className="text-xs text-gray-500 font-bold tracking-wider uppercase mt-4 block">Image Unavailable</span>
            </div>
          )}
        </div>

        {/* Product Details Actions */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700 uppercase tracking-wider">
              {product.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-4 mb-6">
              {product.title}
            </h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-yellow-400 font-bold">
                {'★'.repeat(Math.floor(product.ratings || 0))}
                {'☆'.repeat(5 - Math.floor(product.ratings || 0))}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400 text-sm">{product.ratings ? product.ratings.toFixed(1) : '0.0'} Ratings</span>
            </div>

            <p className="text-3xl font-extrabold text-white mb-6">
              ${product.price.toFixed(2)}
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              {product.description}
            </p>
          </div>

          <div>
            {/* Stock Availability */}
            <div className="flex items-center justify-between border-t border-b border-gray-800/80 py-4 mb-8">
              <span className="text-gray-400">Stock Availability:</span>
              {product.stock > 0 ? (
                <span className="text-green-400 font-medium">In Stock ({product.stock} items remaining)</span>
              ) : (
                <span className="text-red-400 font-medium">Out of Stock</span>
              )}
            </div>

            {/* Quantity Selector & Add Button */}
            {product.stock > 0 && (
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-sm text-gray-400">Quantity:</span>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                  className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none cursor-pointer focus:border-green-500"
                >
                  {[...Array(Math.min(product.stock, 10)).keys()].map((x) => (
                    <option key={x + 1} value={x + 1}>
                      {x + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleAddToCartSubmit}
              disabled={product.stock === 0 || addingToCart}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-green-500/20"
            >
              {product.stock === 0 ? 'Out of Stock' : addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
