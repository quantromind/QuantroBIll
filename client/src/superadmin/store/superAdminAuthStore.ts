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
  token: localStorage.getItem(STORAGE_TOKEN_KEY),
  user: localStorage.getItem(STORAGE_USER_KEY)
    ? JSON.parse(localStorage.getItem(STORAGE_USER_KEY)!)
    : null,
  isAuthenticated: !!localStorage.getItem(STORAGE_TOKEN_KEY),

  initializeAuth: () => {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const userStr = localStorage.getItem(STORAGE_USER_KEY);
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
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
