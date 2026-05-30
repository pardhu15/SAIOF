import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Integrated Telemetry Navbar
 */
const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'text-green-400 bg-gray-800/60 shadow-inner'
        : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
    }`;

  return (
    <nav class="sticky top-0 z-50 glass-panel border-b border-gray-800/40 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          {/* Logo */}
          <div class="flex-shrink-0">
            <Link to="/" class="flex items-center space-x-2">
              <span class="text-2xl">🛍️</span>
              <span class="text-xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                SAIOF
              </span>
            </Link>
          </div>

          {/* Navigation Paths */}
          <div class="hidden md:flex space-x-2">
            {isAuthenticated && (
              <>
                <NavLink to="/" className={navLinkStyle}>
                  Home
                </NavLink>
                <NavLink to="/cart" className={navLinkStyle}>
                  Cart
                </NavLink>
                <NavLink to="/dashboard" className={navLinkStyle}>
                  Dashboard
                </NavLink>
                <NavLink to="/saiof-dashboard" className={navLinkStyle}>
                  SAIOF Analytics
                </NavLink>
              </>
            )}
          </div>

          {/* Auth State Actions */}
          <div class="flex items-center space-x-4">
            {isAuthenticated ? (
              <div class="flex items-center space-x-4">
                <span class="hidden sm:inline text-xs text-gray-400 font-medium">
                  Welcome, <span class="text-green-400 font-bold">{user?.name}</span>
                </span>
                <Link
                  to="/cart"
                  class="p-2 text-gray-400 hover:text-white transition-colors relative"
                >
                  <span class="text-xl">🛒</span>
                </Link>
                <button
                  onClick={handleLogoutClick}
                  class="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-gray-800/60 border border-gray-800 hover:border-gray-700 rounded-lg transition-all duration-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div class="flex items-center space-x-3">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive ? 'text-white bg-gray-800/80' : 'text-gray-300 hover:text-white'
                    }`
                  }
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/20"
                >
                  Register
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
