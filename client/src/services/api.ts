import axios from 'axios';
import { useAuthStore } from '../store/authStore';

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

// Attach token & tenant headers to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('petbharke_access_token');
  const activeOutlet = localStorage.getItem('petbharke_active_outlet');
  const tenantId = localStorage.getItem('petbharke_tenant_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }

  if (activeOutlet) {
    try {
      const parsed = JSON.parse(activeOutlet);
      if (parsed?.id) {
        config.headers['X-Outlet-Id'] = parsed.id;
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  return config;
});

// Global response interceptor for 401 token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
