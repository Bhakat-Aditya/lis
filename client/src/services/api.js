import axios from 'axios';

// Helper to reliably get the API base URL across localhost and production (e.g. Vercel + Render)
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // If running in browser on localhost, default to local Express port
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  // Production fallback: live backend server on Render
  return 'https://newlifecaremdnserver.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

/**
 * Ensures a PDF URL has preview=true attached so the browser renders it inline in a new tab
 * rather than downloading it or buffering.
 */
export const ensurePreviewUrl = (url) => {
  if (!url) return '';
  let res = String(url).trim();
  if (!res) return '';
  if (res.includes('preview=false')) {
    return res.replace('preview=false', 'preview=true');
  }
  if (!res.includes('preview=true')) {
    const sep = res.includes('?') ? '&' : '?';
    return `${res}${sep}preview=true`;
  }
  return res;
};

/**
 * Constructs the fully-qualified URL for the official diagnostic report PDF endpoint.
 */
export const getReportPdfUrl = (patientId, { addHeader = true, download = false, preview = true } = {}) => {
  if (!patientId) return '';
  const rawPid = String(patientId).trim();
  const cleanPid = rawPid
    ? (rawPid.toUpperCase().startsWith('P') ? `P${rawPid.replace(/^P+/i, '')}` : `P${rawPid}`)
    : '';
  const token = (typeof localStorage !== 'undefined' && (localStorage.getItem('lis_auth_token') || localStorage.getItem('token'))) || '';
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  if (cleanPid) params.append('patientId', cleanPid);
  params.append('addHeader', String(Boolean(addHeader)));
  if (download) {
    params.append('download', 'true');
  } else if (preview) {
    params.append('preview', 'true');
  }
  if (token) params.append('token', token);
  return `${base}/api/reports/pdf?${params.toString()}`;
};

/**
 * Constructs the fully-qualified URL for the official billing/invoice PDF endpoint.
 */
export const getBillingPdfUrl = (patientId, { download = false, preview = true } = {}) => {
  if (!patientId) return '';
  const rawPid = String(patientId).trim();
  const cleanPid = rawPid
    ? (rawPid.toUpperCase().startsWith('P') ? `P${rawPid.replace(/^P+/i, '')}` : `P${rawPid}`)
    : '';
  const token = (typeof localStorage !== 'undefined' && (localStorage.getItem('lis_auth_token') || localStorage.getItem('token'))) || '';
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  if (cleanPid) params.append('patientId', cleanPid);
  if (download) {
    params.append('download', 'true');
  } else if (preview) {
    params.append('preview', 'true');
  }
  if (token) params.append('token', token);
  return `${base}/api/billing/pdf?${params.toString()}`;
};

/**
 * Opens the official AWS report PDF in a new tab directly.
 * Appends &preview=true so the browser opens and previews the PDF instantly without downloading or caching.
 * If target URL comes in the API response, redirects directly to it in a new tab.
 */
export const openReportPdf = (patientIdOrObj, options = {}) => {
  let target = '';
  let cleanPid = '';
  const wantsHeader = options?.addHeader !== false;

  if (patientIdOrObj && typeof patientIdOrObj === 'object') {
    target = (wantsHeader
      ? (patientIdOrObj.printPDFUrlWithHeader || patientIdOrObj.printPDFUrl)
      : (patientIdOrObj.printPDFUrlWithoutHeader || patientIdOrObj.printPDFUrl))
      || patientIdOrObj.reportUrl
      || patientIdOrObj.url
      || options?.targetUrl
      || '';

    const rawPid = String(patientIdOrObj.patientId || patientIdOrObj.slNo || patientIdOrObj.id || '').trim();
    cleanPid = rawPid
      ? (rawPid.toUpperCase().startsWith('P') ? `P${rawPid.replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';
  } else {
    target = options?.targetUrl || options?.reportUrl || options?.printPDFUrl || '';
    const rawPid = String(patientIdOrObj || '').trim();
    cleanPid = rawPid
      ? (rawPid.toUpperCase().startsWith('P') ? `P${rawPid.replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';
  }

  // If URL already comes from the API response, immediately open that in a new tab with preview=true
  if (target) {
    let directAwsUrl = ensurePreviewUrl(target);
    if (wantsHeader) {
      directAwsUrl = directAwsUrl.replace('addHeader=false', 'addHeader=true');
    } else {
      directAwsUrl = directAwsUrl.replace('addHeader=true', 'addHeader=false');
    }
    window.open(directAwsUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  if (!cleanPid) return;

  // Direct server 302 redirect endpoint with preview=true in a new tab (instant, zero buffering)
  const fallbackUrl = getReportPdfUrl(cleanPid, {
    addHeader: wantsHeader,
    preview: true,
    ...options,
  });
  window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Opens the official AWS billing invoice PDF in a new tab directly.
 * Appends &preview=true so the browser opens and previews the invoice instantly without downloading or caching.
 * If target URL comes in the API response, redirects directly to it in a new tab.
 */
export const openBillingPdf = (patientIdOrObj, options = {}) => {
  let target = '';
  let cleanPid = '';

  if (patientIdOrObj && typeof patientIdOrObj === 'object') {
    target = patientIdOrObj.billUrl
      || patientIdOrObj.invoiceUrl
      || patientIdOrObj.bill?.billUrl
      || patientIdOrObj.bill?.url
      || patientIdOrObj.url
      || options?.targetUrl
      || '';

    const rawPid = String(patientIdOrObj.patientId || patientIdOrObj.slNo || patientIdOrObj.id || '').trim();
    cleanPid = rawPid
      ? (rawPid.toUpperCase().startsWith('P') ? `P${rawPid.replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';
  } else {
    target = options?.targetUrl || options?.billUrl || options?.invoiceUrl || '';
    const rawPid = String(patientIdOrObj || '').trim();
    cleanPid = rawPid
      ? (rawPid.toUpperCase().startsWith('P') ? `P${rawPid.replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';
  }

  // If URL already comes from the API response, immediately open that in a new tab with preview=true
  if (target) {
    const directAwsUrl = ensurePreviewUrl(target);
    window.open(directAwsUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  if (!cleanPid) return;

  // Direct server 302 redirect endpoint with preview=true in a new tab (instant, zero buffering)
  const fallbackUrl = getBillingPdfUrl(cleanPid, { preview: true, ...options });
  window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
};

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

// Helper to detect if server response strictly indicates session timeout (StatusCode 1140 or 1150 Auto Logout)
const isSessionTimeout = (data) => {
  if (!data) return false;
  if (typeof data === 'object') {
    const code = String(data.StatusCode ?? data.statusCode ?? data.code ?? '');
    return code === '1140' || code === '1150' || data.isSessionExpired === true;
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      const code = String(parsed.StatusCode ?? parsed.statusCode ?? parsed.code ?? '');
      return code === '1140' || code === '1150' || parsed.isSessionExpired === true;
    } catch {
      return false;
    }
  }
  return false;
};

// Response interceptor: redirect to login ONLY when session is timed out (StatusCode: 1140)
api.interceptors.response.use(
  (response) => {
    // If upstream or middleman explicitly returns StatusCode 1140 (Session Timed Out)
    if (isSessionTimeout(response.data)) {
      console.warn('[API] Session timed out (StatusCode 1140). Redirecting to login.');
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
    // ONLY log out if StatusCode is explicitly 1140 (Session Timed Out)
    const isTimeout = isSessionTimeout(error.response?.data);

    if (isTimeout) {
      console.warn('[API] Session timed out (StatusCode 1140). Redirecting to login.');
      localStorage.removeItem('lis_auth_token');
      localStorage.removeItem('lis_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const reasonMsg = error.response?.data?.Message || 'Session timed out. Please login again.';
        window.location.href = `/login?reason=${encodeURIComponent(reasonMsg)}`;
      }
    } else {
      // General error (500, 400, 404, network error, etc.) - NEVER log out!
      console.warn('[API] Server or network error (non-1140, session preserved):', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });
    }
    return Promise.reject(error);
  }
);

export default api;
