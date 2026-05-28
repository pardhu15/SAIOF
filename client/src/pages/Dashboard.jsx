import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import Loader from '../components/Loader';

/**
 * Clean E-Commerce "My Account" Page
 * Uses a minimal top navigation header instead of the main navigation bar.
 */
const Dashboard = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(true);

  // Dynamically fetch items count from the backend Cart API for the summary widget
  useEffect(() => {
    const fetchCartCount = async () => {
      if (user) {
        try {
          const res = await apiClient.get('/cart');
          if (res.data && res.data.success) {
            const count = res.data.data.products.reduce((acc, item) => acc + item.quantity, 0);
            setCartItemsCount(count);
          }
        } catch (error) {
          console.error('[Account Page] Failed to fetch cart count:', error.message);
        } finally {
          setCartLoading(false);
        }
      }
    };
    
    fetchCartCount();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div class="min-h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div class="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 class="text-xl font-bold text-red-400">Unable to load account. Please sign in.</h2>
      </div>
    );
  }

  // Realistic mock order items
  const mockRecentOrders = [
    { id: 'ORD-89472', date: '2026-05-28', status: 'Shipped', amount: 299.99 },
    { id: 'ORD-89461', date: '2026-05-25', status: 'Delivered', amount: 89.50 }
  ];

  const summaryCards = [
    { label: 'Active Shopping Cart', value: cartLoading ? '...' : `${cartItemsCount} Items`, icon: '🛒' },
    { label: 'Total Orders Placed', value: `${mockRecentOrders.length}`, icon: '📦' },
    { label: 'Saved Wishlist Items', value: '0 Items', icon: '❤️' }
  ];

  return (
    <div class="bg-[#0b0f19] min-h-screen text-gray-100 flex flex-col">
      {/* Minimal Top Header for Account Page */}
      <header class="border-b border-gray-800/60 bg-gray-950/40 backdrop-blur-md sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Back to Shopping Button */}
          <Link
            to="/"
            class="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors flex items-center space-x-1"
          >
            <span>←</span> <span>Back to Shopping</span>
          </Link>

          {/* Center: My Account Title */}
          <h2 class="text-base font-bold text-white tracking-wide uppercase">
            My Account
          </h2>

          {/* Right: Logout Button */}
          <button
            onClick={handleLogout}
            class="px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl border border-red-950/60 transition-all duration-300"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow animate-fade-in">
        {/* User Profile Card */}
        <div class="glass-panel p-6 rounded-2xl border border-gray-800 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center space-x-6">
            <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center text-3xl text-white font-bold shadow-lg shadow-green-500/20 select-none">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 class="text-2xl font-bold text-white">{user.name}</h2>
              <p class="text-sm text-gray-400 mt-1">{user.email}</p>
              <div class="flex items-center space-x-4 mt-3">
                <span class="px-2.5 py-0.5 rounded text-xs bg-gray-800 border border-gray-700 text-gray-300 font-semibold uppercase tracking-wider">
                  {user.role || 'user'} Account
                </span>
                <span class="text-xs text-gray-500">
                  Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'May 2026'}
                </span>
              </div>
            </div>
          </div>
          <div class="text-xs text-gray-500 font-medium">
            SAIOF Shopping Profile Verified
          </div>
        </div>

        {/* Shopping Summary Widgets */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {summaryCards.map((card, i) => (
            <div key={i} class="glass-panel p-6 rounded-2xl border border-gray-800 flex items-center justify-between shadow-md">
              <div>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  {card.label}
                </span>
                <span class="text-2xl font-extrabold text-white">{card.value}</span>
              </div>
              <span class="text-3xl bg-gray-900/50 w-12 h-12 flex items-center justify-center rounded-xl border border-gray-800">
                {card.icon}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Orders List */}
        <div class="glass-panel p-6 rounded-2xl border border-gray-800 shadow-md">
          <h3 class="text-xl font-bold text-white mb-6">Recent Orders</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-gray-800/80 text-gray-400">
                  <th class="pb-3 font-semibold">Order ID</th>
                  <th class="pb-3 font-semibold">Date</th>
                  <th class="pb-3 font-semibold">Status</th>
                  <th class="pb-3 text-right font-semibold">Total Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/40 text-gray-300">
                {mockRecentOrders.map((order) => (
                  <tr key={order.id} class="hover:bg-gray-800/10 transition-colors duration-200">
                    <td class="py-4 font-mono font-semibold text-white">#{order.id}</td>
                    <td class="py-4">{new Date(order.date).toLocaleDateString()}</td>
                    <td class="py-4">
                      <span class={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        order.status === 'Delivered'
                          ? 'bg-green-950 text-green-400 border-green-900'
                          : 'bg-yellow-950 text-yellow-400 border-yellow-900'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td class="py-4 text-right font-bold text-white">${order.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
