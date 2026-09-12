import axios from 'axios';
import { useAuthStore } from '../store/authStore';
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

// Attach token to every outgoing request
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

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // TenantId and OutletId are now derived exclusively from JWT claims on the backend.
  // No client-controlled headers are sent for tenant/outlet context.

  return config;
});

// Global response interceptor for 401 token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const requestUrl = error.config?.url || '';

      // Do not boot user out if a background POS query failed due to missing tenant context
      if (
        pathname.startsWith('/superadmin') &&
        (requestUrl.includes('/orders') || requestUrl.includes('/inventory') || requestUrl.includes('/tables'))
      ) {
        return Promise.reject(error);
      }

      // If already on a login route, do not loop
      if (!pathname.includes('/login')) {
        const isSuperAdminRoute = pathname.startsWith('/superadmin');
        const isOwnerRoute = pathname.startsWith('/owner');

        if (isSuperAdminRoute) {
          clearAllAuthSessions();
          window.location.href = '/superadmin/login';
        } else if (isOwnerRoute) {
          clearAllAuthSessions();
          window.location.href = '/owner/login';
        } else {
          clearAllAuthSessions();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
