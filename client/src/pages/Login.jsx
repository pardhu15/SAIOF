import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Integrated Login Page
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  
  const { login, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    // Basic Validation
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4 animate-fade-in">
      <div className="glass-panel p-8 rounded-3xl border border-gray-800 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white text-center mb-2">Welcome Back</h2>
        <p className="text-sm text-gray-400 text-center mb-8">Sign in to your SAIOF omnichannel account</p>

        {(localError || authError) && (
          <div className="mb-6 px-4 py-3 bg-red-950/40 border border-red-900/60 text-red-400 rounded-xl text-xs font-semibold text-center leading-relaxed">
            {localError || authError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-xl text-white outline-none transition-all duration-300 disabled:opacity-55"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Password
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-xl text-white outline-none transition-all duration-300 disabled:opacity-55"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-green-500/20 disabled:opacity-55 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800/80 text-center text-sm text-gray-400">
          New to SAIOF?{' '}
          <Link to="/register" className="text-green-400 hover:underline font-medium">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
