import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import CartItem from '../components/CartItem';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

/**
 * Integrated Shopping Cart Page
 */
const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Cart on mount
  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/cart');
      if (res.data && res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('[Cart Fetch Error] Failed:', err);
      setError(err.response?.data?.message || 'Could not load your shopping cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update Item quantity handler
  const handleUpdateQty = async (productId, quantity) => {
    try {
      const res = await apiClient.put(`/cart/update/${productId}`, { quantity });
      if (res.data && res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('[Cart Update Qty Error] Failed:', err);
      alert(err.response?.data?.message || 'Failed to update item quantity');
    }
  };

  // Remove Item handler
  const handleRemoveItem = async (productId) => {
    try {
      const res = await apiClient.delete(`/cart/remove/${productId}`);
      if (res.data && res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('[Cart Remove Error] Failed:', err);
      alert(err.response?.data?.message || 'Failed to remove item from cart');
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
        <ErrorMessage message={error} />
      </div>
    );
  }

  const items = cart?.products || [];
  const totalPrice = cart?.totalPrice || 0.0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <h1 className="text-3xl font-extrabold text-white mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center border border-gray-800/80 shadow-lg">
          <span className="text-7xl block mb-6">🛒</span>
          <p className="text-lg text-gray-400 mb-6">Your shopping cart is currently empty.</p>
          <Link
            to="/"
            className="px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-300 shadow-md shadow-green-500/10"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem
                key={item.productId?._id || item.productId}
                product={item.productId}
                quantity={item.quantity}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          {/* Cart Summary Card */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 self-start shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Items Count</span>
                <span className="text-white font-medium">
                  {items.reduce((acc, item) => acc + item.quantity, 0)} items
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-400 font-semibold uppercase tracking-wider text-xs bg-green-950/40 px-2 py-0.5 rounded border border-green-900/60">
                  Free
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800/80 pt-4 text-base font-bold text-white">
                <span>Total Amount</span>
                <span className="text-xl text-green-400">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => alert('Checkout functionality is reserved for future integration!')}
              className="w-full mt-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-green-500/20"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
