import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Integrated User Registration Page
 */
const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const { register, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    // Form validations
    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      const success = await register(name, email, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4 animate-fade-in">
      <div className="glass-panel p-8 rounded-3xl border border-gray-800 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white text-center mb-2">Create Account</h2>
        <p className="text-sm text-gray-400 text-center mb-8">Join the SAIOF omnichannel commerce system</p>

        {(localError || authError) && (
          <div className="mb-6 px-4 py-3 bg-red-950/40 border border-red-900/60 text-red-400 rounded-xl text-xs font-semibold text-center leading-relaxed">
            {localError || authError}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-xl text-white outline-none transition-all duration-300 disabled:opacity-55"
            />
          </div>

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
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
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

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800/80 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-green-400 hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
