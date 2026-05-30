import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Dashboard from './pages/Dashboard';
import SAIOFDashboard from './pages/SAIOFDashboard';
import ProtectedRoute from './components/ProtectedRoute';

import { useAuth } from './context/AuthContext';
import AppLoader from './components/AppLoader';

/**
 * Main application content wrapper.
 * Inspects path names to hide the global navbar on profile dashboard paths.
 */
function AppContent() {
  const { loading, isDbOffline } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoader />;
  }

  const showNavbar = location.pathname !== '/dashboard';

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0f19] text-gray-100 font-sans">
      {/* Navigation Bar (conditionally hidden on My Account dashboard page) */}
      {showNavbar && <Navbar />}

      {/* Database Offline Failover Banner */}
      {isDbOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center space-x-2 animate-pulse">
          <span>⚠️</span>
          <span>Database Offline - Attempting Reconnection...</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          
          {/* My Account Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* SAIOF Analytics Dashboard Route - Secured to Admin Only */}
          <Route
            path="/saiof-dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <SAIOFDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div class="max-w-7xl mx-auto px-4 text-center py-24">
                <span class="text-7xl block mb-6">⚠️</span>
                <h1 class="text-3xl font-extrabold text-white mb-2">404 - Page Not Found</h1>
                <p class="text-gray-400 mb-8">The requested e-commerce resource does not exist.</p>
              </div>
            }
          />
        </Routes>
      </main>

      {/* Premium Footer */}
      <footer class="border-t border-gray-900 bg-gray-950/20 py-8 text-center text-xs text-gray-500">
        <div class="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} SAIOF Ecosystem. All rights reserved.</p>
          <p class="mt-2 text-gray-600">Smart MERN Stack E-commerce Foundation</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * SAIOF Main App Component
 * Wraps AuthContext and Router providers.
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
