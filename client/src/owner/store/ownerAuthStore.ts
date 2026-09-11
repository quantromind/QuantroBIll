import { create } from 'zustand';

export interface OwnerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  restaurantName: string;
  role: 'Owner' | 'GeneralManager';
}

interface OwnerAuthState {
  token: string | null;
  user: OwnerUser | null;
  isAuthenticated: boolean;
  login: (email: string, customToken?: string) => void;
  logout: () => void;
  initializeAuth: () => void;
}

const STORAGE_TOKEN_KEY = 'quantrobill_owner_token';
const STORAGE_USER_KEY = 'quantrobill_owner_user';

export const useOwnerAuthStore = create<OwnerAuthState>((set) => ({
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
    const token = customToken || `mock_owner_token_${Date.now()}`;
    const user: OwnerUser = {
      id: 'owner_101',
      name: 'Ajay Yadav',
      email,
      phone: '+91 98765 43210',
      restaurantName: 'RR RESTAURANT',
      role: 'Owner',
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
