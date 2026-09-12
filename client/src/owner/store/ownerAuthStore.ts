import { create } from 'zustand';

export interface OwnerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  restaurantName: string;
  role: 'Owner' | 'GeneralManager' | 'Admin';
  tenantId?: string;
  outletId?: string;
}

interface OwnerAuthState {
  token: string | null;
  user: OwnerUser | null;
  isAuthenticated: boolean;
  login: (userData: Partial<OwnerUser> | string, customToken?: string) => void;
  setUserData: (data: Partial<OwnerUser>) => void;
  logout: () => void;
  initializeAuth: () => void;
}

const STORAGE_TOKEN_KEY = 'quantrobill_owner_token';
const STORAGE_USER_KEY = 'quantrobill_owner_user';

export const useOwnerAuthStore = create<OwnerAuthState>((set, get) => ({
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
        let user = JSON.parse(userStr);
        // Self-heal any legacy hardcoded mock user from previous test sessions
        if (user.name === 'Ajay Yadav' || user.restaurantName === 'RR RESTAURANT') {
          if (user.email && (user.email.includes('sourabh') || user.email.includes('jaymalhar'))) {
            user.name = 'Sourabh';
            user.restaurantName = 'Jay Malhar';
            user.tenantId = '6aa53279b1398781a96b6719';
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
            localStorage.setItem('quantrobill_tenant_id', user.tenantId);
          } else if (user.email) {
            const clean = user.email.split('@')[0].replace(/[._-]/g, ' ');
            user.name = clean.charAt(0).toUpperCase() + clean.slice(1);
            user.restaurantName = `${user.name}'s Restaurant`;
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
          }
        }
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },

  login: (userData: Partial<OwnerUser> | string, customToken?: string) => {
    const token = customToken || `owner_token_${Date.now()}`;
    
    let user: OwnerUser;
    if (typeof userData === 'string') {
      const email = userData;
      const cleanName = email.includes('@')
        ? email.split('@')[0].replace(/[._-]/g, ' ')
        : email;
      const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      user = {
        id: `owner_${Date.now()}`,
        name: formattedName || 'Restaurant Owner',
        email,
        phone: '',
        restaurantName: `${formattedName}'s Restaurant`,
        role: 'Owner',
      };
    } else {
      user = {
        id: userData.id || `owner_${Date.now()}`,
        name: userData.name || (userData.email ? userData.email.split('@')[0] : 'Restaurant Owner'),
        email: userData.email || 'owner@restaurant.com',
        phone: userData.phone || '',
        restaurantName: userData.restaurantName || 'Restaurant Operations',
        role: userData.role || 'Owner',
        tenantId: userData.tenantId,
        outletId: userData.outletId,
      };
    }

    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    if (user.tenantId) {
      localStorage.setItem('quantrobill_tenant_id', user.tenantId);
    }

    set({ token, user, isAuthenticated: true });
  },

  setUserData: (data: Partial<OwnerUser>) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...data };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
