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

// Response interceptor: preserve client session and only logout on explicit middleman superseded session
api.interceptors.response.use(
  (response) => {
    // Upstream 1140/1150 codes are auto-recovered by middleman and should NOT logout the client user
    return response;
  },
  (error) => {
    const isSuperseded =
      error.response?.data?.reason === 'SESSION_SUPERSEDED' ||
      error.response?.data?.Message?.includes('logged in from another browser');

    // Only redirect to login if session was explicitly superseded by a newer login on another browser
    if (isSuperseded) {
      console.warn('[API] Session superseded by login from another browser/device.');
      localStorage.removeItem('lis_auth_token');
      localStorage.removeItem('lis_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const reasonMsg = error.response?.data?.Message || 'Session expired: You have been logged in from another browser or device.';
        window.location.href = `/login?reason=${encodeURIComponent(reasonMsg)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
