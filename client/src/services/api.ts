import axios from 'axios';
import { clearAllAuthSessions } from '../utils/authSession';

export const getBaseApiUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    // Local Vite dev server fallback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Production domain/subdomain dynamic resolution
    return `${origin}/api`;
  }
  return '/api';
};

export const API_BASE_URL = getBaseApiUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach unified access token to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('quantrobill_access_token') || localStorage.getItem('petbharke_access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Global response interceptor for 401 token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const requestUrl = error.config?.url || '';
      const token = localStorage.getItem('quantrobill_access_token') || localStorage.getItem('petbharke_access_token');

      // 1. If using demo token or offline fallback, NEVER boot user to login
      if (token && token.startsWith('quantrobill_demo_')) {
        return Promise.reject(error);
      }

      // 2. Ignore 401 on login endpoints so the form can display the invalid credentials error
      if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/pin-login')) {
        return Promise.reject(error);
      }

      // 3. Do not boot user out on secondary data fetches (tables, orders, reports, etc.)
      // Only boot if this is a dedicated token verification/refresh endpoint
      const isAuthVerification = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/verify') || requestUrl.includes('/auth/refresh');
      if (isAuthVerification && !pathname.includes('/login')) {
        clearAllAuthSessions();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
