import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('saiof_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDbOffline, setIsDbOffline] = useState(false);

  // Periodic database health checking (every 10 seconds)
  useEffect(() => {
    const checkDbHealth = async () => {
      try {
  const res = await apiClient.get('/health');
  console.log('Health Check:', res.data);
  setIsDbOffline(false);
} catch (err) {
  console.error('Health Check Failed:', err);
  setIsDbOffline(true);
}
    };

    checkDbHealth();
    const interval = setInterval(checkDbHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Check if token exists in localStorage on boot and load user profile

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (token) {
        try {
          // Set authorization header manually just in case interceptor hasn't synced
          localStorage.setItem('saiof_token', token);
          const res = await apiClient.get('/auth/profile');
          if (res.data && res.data.success) {
            setUser(res.data.data);
          } else {
            // Invalid profile return
            handleLogout();
          }
        } catch (err) {
          console.error('[Auth Boot Error] Token validation failed:', err.message);
          handleLogout();
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, [token]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        const { token: receivedToken, ...userData } = res.data.data;
        localStorage.setItem('saiof_token', receivedToken);
        setToken(receivedToken);
        setUser(userData);
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const handleRegister = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      if (res.data && res.data.success) {
        const { token: receivedToken, ...userData } = res.data.data;
        localStorage.setItem('saiof_token', receivedToken);
        setToken(receivedToken);
        setUser(userData);
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Registration failed. Try again.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('saiof_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user,
        isDbOffline,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>

  );
};

export const useAuth = () => useContext(AuthContext);
