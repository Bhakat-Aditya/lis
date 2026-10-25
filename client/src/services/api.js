import axios from 'axios';

// The middleman backend URL.
// When deployed on Vercel, set VITE_API_BASE_URL to your Render backend URL (e.g. https://lis-middleman-server.onrender.com)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Request interceptor: attach middleman JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lis_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401s and superseded session invalidation gracefully
api.interceptors.response.use(
  (response) => {
    // If backend returns session invalid/logout code in a 200 wrapper
    if (response.data && (response.data.StatusCode === '1140' || response.data.StatusCode === '1150')) {
      localStorage.removeItem('lis_auth_token');
      localStorage.removeItem('lis_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const reasonMsg = response.data.Message || 'Session expired: You have been logged in from another browser.';
        window.location.href = `/login?reason=${encodeURIComponent(reasonMsg)}`;
      }
    }
    return response;
  },
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 ||
        error.response.data?.StatusCode === '1150' ||
        error.response.data?.StatusCode === '1140')
    ) {
      // Clear token and redirect to login if session expired or logged in from another browser
      localStorage.removeItem('lis_auth_token');
      localStorage.removeItem('lis_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const reasonMsg =
          error.response.data?.Message ||
          'Session expired: You have been logged in from another browser or device.';
        window.location.href = `/login?reason=${encodeURIComponent(reasonMsg)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
