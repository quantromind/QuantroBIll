import { create } from 'zustand';
import type { SuperAdminUser } from '../types';

interface SuperAdminAuthState {
  token: string | null;
  user: SuperAdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, token?: string) => void;
  logout: () => void;
  initializeAuth: () => void;
}

const STORAGE_TOKEN_KEY = 'quantrobill_superadmin_token';
const STORAGE_USER_KEY = 'quantrobill_superadmin_user';

export const useSuperAdminAuthStore = create<SuperAdminAuthState>((set) => ({
  token: localStorage.getItem(STORAGE_TOKEN_KEY) || localStorage.getItem('petbharke_superadmin_token'),
  user: (localStorage.getItem(STORAGE_USER_KEY) || localStorage.getItem('petbharke_superadmin_user'))
    ? JSON.parse((localStorage.getItem(STORAGE_USER_KEY) || localStorage.getItem('petbharke_superadmin_user'))!)
    : null,
  isAuthenticated: !!(localStorage.getItem(STORAGE_TOKEN_KEY) || localStorage.getItem('petbharke_superadmin_token')),

  initializeAuth: () => {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY) || localStorage.getItem('petbharke_superadmin_token');
    const userStr = localStorage.getItem(STORAGE_USER_KEY) || localStorage.getItem('petbharke_superadmin_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },

  login: (email: string, customToken?: string) => {
    const token = customToken || `mock_sa_token_${Date.now()}`;
    const user: SuperAdminUser = {
      id: 'sa_root_01',
      name: 'System SuperAdmin',
      email,
      role: 'SuperAdmin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    };

    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));

    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    ['quantrobill_', 'petbharke_'].forEach((prefix) => {
      localStorage.removeItem(`${prefix}access_token`);
      localStorage.removeItem(`${prefix}refresh_token`);
      localStorage.removeItem(`${prefix}user`);
      localStorage.removeItem(`${prefix}tenant`);
      localStorage.removeItem(`${prefix}tenant_id`);
      localStorage.removeItem(`${prefix}active_outlet`);
      localStorage.removeItem(`${prefix}available_outlets`);
      localStorage.removeItem(`${prefix}superadmin_token`);
      localStorage.removeItem(`${prefix}superadmin_user`);
      localStorage.removeItem(`${prefix}owner_token`);
      localStorage.removeItem(`${prefix}owner_user`);
    });
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
