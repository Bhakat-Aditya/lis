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

// Response interceptor: handle 401s gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if session expired
      localStorage.removeItem('lis_auth_token');
      localStorage.removeItem('lis_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
