import axios from 'axios';
import { Platform } from 'react-native';

const getDefaultBaseUrl = (): string => {
  // 1. Check custom environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // 2. Web browser running on host
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // 3. Android Emulator (10.0.2.2 maps to host 127.0.0.1)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  // 4. iOS Simulator or default
  return 'http://localhost:5000/api';
};

export let API_BASE_URL = getDefaultBaseUrl();

export const mobileApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const updateApiBaseUrl = (newUrl: string) => {
  let cleanUrl = newUrl.trim();
  // Ensure trailing /api if omitted
  if (!cleanUrl.endsWith('/api') && !cleanUrl.endsWith('/api/')) {
    cleanUrl = cleanUrl.replace(/\/+$/, '') + '/api';
  }
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  API_BASE_URL = cleanUrl;
  mobileApiClient.defaults.baseURL = cleanUrl;
};

export const setAuthHeaders = (token: string, tenantId: string, outletId: string) => {
  if (token) {
    mobileApiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    mobileApiClient.defaults.headers.common['X-Tenant-Id'] = tenantId;
  }
  if (outletId) {
    mobileApiClient.defaults.headers.common['X-Outlet-Id'] = outletId;
  }
};

export const clearAuthHeaders = () => {
  delete mobileApiClient.defaults.headers.common['Authorization'];
  // Retain tenantId and outletId if paired, or clear if fully unpairing
};

export const clearAllHeaders = () => {
  delete mobileApiClient.defaults.headers.common['Authorization'];
  delete mobileApiClient.defaults.headers.common['X-Tenant-Id'];
  delete mobileApiClient.defaults.headers.common['X-Outlet-Id'];
};
