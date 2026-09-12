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
  const isSuperAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/superadmin');
  const isOwnerRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/owner');
  const superAdminToken = localStorage.getItem('quantrobill_superadmin_token') || localStorage.getItem('petbharke_superadmin_token');
  const ownerToken = localStorage.getItem('quantrobill_owner_token');
  const staffToken = localStorage.getItem('quantrobill_access_token') || localStorage.getItem('petbharke_access_token');
  const token = isSuperAdminRoute
    ? (superAdminToken || staffToken)
    : isOwnerRoute
      ? (ownerToken || staffToken || superAdminToken)
      : (staffToken || ownerToken || superAdminToken);
  const activeOutlet = localStorage.getItem('quantrobill_active_outlet') || localStorage.getItem('petbharke_active_outlet');
  const tenantId = localStorage.getItem('quantrobill_tenant_id') || localStorage.getItem('petbharke_tenant_id');

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
