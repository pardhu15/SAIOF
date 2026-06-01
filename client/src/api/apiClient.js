import axios from 'axios';

/**
 * Custom Axios client with base API URL configured to point to backend.
 * Ports configured: http://localhost:5000
 */
const apiClient = axios.create({
  baseURL: 'https://saiof-backend.onrender.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to automatically attach authorization tokens if stored
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('saiof_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle standard connection issues or token expiration
    if (error.response) {
      console.error(`[API Error] Status: ${error.response.status}`, error.response.data);
    } else {
      console.error(`[Network Error] Connection refused or timed out`, error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
