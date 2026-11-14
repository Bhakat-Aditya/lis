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

// In-flight GET request deduplication to prevent duplicate concurrent network calls
const inFlightGetRequests = new Map();
const originalGet = api.get.bind(api);

api.get = function (url, config = {}) {
  // If caller provides a dedicated abort signal, execute directly without coalescing
  if (config?.signal) {
    return originalGet(url, config);
  }

  // Build a stable request key based on url and serialized query parameters
  const paramKey = config?.params ? JSON.stringify(config.params) : '';
  const requestKey = `${url}?${paramKey}`;

  // If this exact GET request is already pending over the network, coalesce to same promise
  if (inFlightGetRequests.has(requestKey)) {
    return inFlightGetRequests.get(requestKey);
  }

  const promise = originalGet(url, config).finally(() => {
    inFlightGetRequests.delete(requestKey);
  });

  inFlightGetRequests.set(requestKey, promise);
  return promise;
};

// Response interceptor: redirect to login when session is timed out / expired
api.interceptors.response.use(
  (response) => {
    // If upstream or middleman returns session timed out / invalid code
    if (
      response.data &&
      (response.data.StatusCode === '1140' ||
        response.data.StatusCode === '1150' ||
        response.data.isSessionExpired)
    ) {
      console.warn('[API] Session timed out from server response.');
      localStorage.removeItem('lis_auth_token');
      localStorage.removeItem('lis_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const reasonMsg = response.data?.Message || 'Session timed out. Please login again.';
        window.location.href = `/login?reason=${encodeURIComponent(reasonMsg)}`;
      }
    }
    return response;
  },
  (error) => {
    const isSessionExpired =
      error.response?.status === 401 ||
      error.response?.data?.StatusCode === '1140' ||
      error.response?.data?.StatusCode === '1150' ||
      error.response?.data?.isSessionExpired;

    if (isSessionExpired) {
      console.warn('[API] Session timed out or unauthorized. Redirecting to login.');
      localStorage.removeItem('lis_auth_token');
      localStorage.removeItem('lis_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const reasonMsg = error.response?.data?.Message || 'Session timed out. Please login again.';
        window.location.href = `/login?reason=${encodeURIComponent(reasonMsg)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
