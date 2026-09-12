import { create } from 'zustand';
import type { AuthResponse, OutletSummary, TenantSummary, UserProfile, UserRole } from '../types';
import { apiClient } from '../services/api';
import { signalRService } from '../services/signalr';

interface AuthState {
  user: UserProfile | null;
  tenant: TenantSummary | null;
  activeOutlet: OutletSummary | null;
  availableOutlets: OutletSummary[];
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  drawerOpen: boolean;

  setAuthData: (data: AuthResponse) => void;
  setActiveOutlet: (outlet: OutletSummary) => Promise<void>;
  switchClientProfile: (type: 'Cafe' | 'Restaurant') => void;
  switchRole: (role: UserRole) => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const canSettleBills = (role?: UserRole): boolean => {
  if (!role) return true; // Default cashier fallback
  return role === 'Owner' || role === 'SuperAdmin' || role === 'Admin' || role === 'Manager' || role === 'Cashier';
};

export const canApplyDiscounts = (role?: UserRole): boolean => {
  return role === 'Owner' || role === 'SuperAdmin' || role === 'Admin' || role === 'Manager';
};

export const canVoidBills = (role?: UserRole): boolean => {
  return role === 'Owner' || role === 'SuperAdmin' || role === 'Admin' || role === 'Manager';
};

export const isWaiterOnly = (role?: UserRole): boolean => {
  return role === 'Waiter';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  activeOutlet: null,
  availableOutlets: [],
  accessToken: localStorage.getItem('quantrobill_access_token') || localStorage.getItem('petbharke_access_token'),
  isAuthenticated: false,
  isLoading: true,
  drawerOpen: false,

  setAuthData: (data: AuthResponse) => {
    localStorage.setItem('quantrobill_access_token', data.accessToken);
    localStorage.setItem('quantrobill_refresh_token', data.refreshToken);
    localStorage.setItem('quantrobill_user', JSON.stringify(data.user));
    if (data.tenant) {
      localStorage.setItem('quantrobill_tenant', JSON.stringify(data.tenant));
      localStorage.setItem('quantrobill_tenant_id', data.tenant.id);
    }
    if (data.activeOutlet) {
      localStorage.setItem('quantrobill_active_outlet', JSON.stringify(data.activeOutlet));
    }
    localStorage.setItem('quantrobill_available_outlets', JSON.stringify(data.availableOutlets));

    set({
      user: data.user,
      tenant: data.tenant,
      activeOutlet: data.activeOutlet,
      availableOutlets: data.availableOutlets,
      accessToken: data.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });

    if (data.tenant && data.activeOutlet) {
      signalRService.startConnection(data.tenant.id, data.activeOutlet.id);
    }
  },

  setActiveOutlet: async (outlet: OutletSummary) => {
    try {
      const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/switch-outlet', {
        outletId: outlet.id,
      });

      if (response.data.success) {
        get().setAuthData(response.data.data);
      }
    } catch {
      localStorage.setItem('quantrobill_active_outlet', JSON.stringify(outlet));
      set({ activeOutlet: outlet });
      const tenant = get().tenant;
      if (tenant) {
        signalRService.startConnection(tenant.id, outlet.id);
      }
    }
  },

  switchClientProfile: (type: 'Cafe' | 'Restaurant') => {
    if (type === 'Cafe') {
      const cafeTenant: TenantSummary = {
        id: 't_cafe_1',
        businessName: 'The Magic Bottle - Cafe & Bakery',
        businessType: 'Cafe',
        subscriptionPlan: 'Premium',
      };
      const cafeOutlet: OutletSummary = {
        id: 'o_cafe_1',
        name: 'The Magic Bottle Cafe - Wakad',
        code: 'C443077',
        businessType: 'Cafe',
        address: 'Shop 4, Datta Mandir Road, Wakad, Pune',
        phone: '07969223344',
        currency: 'INR',
        cgstPercentage: 2.5,
        sgstPercentage: 2.5,
      };
      const cafeUser: UserProfile = {
        id: 'u_cafe_1',
        username: 'biller',
        email: 'biller@magicbottle.com',
        fullName: 'Cafe Barista & Biller',
        role: 'Cashier',
        permissions: ['pos.bill', 'pos.kot', 'pos.view'],
        tenantId: 't_cafe_1',
      };
      localStorage.setItem('quantrobill_tenant', JSON.stringify(cafeTenant));
      localStorage.setItem('quantrobill_active_outlet', JSON.stringify(cafeOutlet));
      localStorage.setItem('quantrobill_user', JSON.stringify(cafeUser));
      set({
        tenant: cafeTenant,
        activeOutlet: cafeOutlet,
        user: cafeUser,
        isAuthenticated: true,
      });
    } else {
      const restTenant: TenantSummary = {
        id: 't_rest_2',
        businessName: 'Spice Garden - Fine Dine & Bar',
        businessType: 'Restaurant',
        subscriptionPlan: 'Enterprise',
      };
      const restOutlet: OutletSummary = {
        id: 'o_rest_2',
        name: 'Spice Garden - Baner High Street',
        code: 'R889021',
        businessType: 'Restaurant',
        address: 'Plot 12, Baner High Street, Pune',
        phone: '09822334455',
        currency: 'INR',
        cgstPercentage: 2.5,
        sgstPercentage: 2.5,
      };
      const restUser: UserProfile = {
        id: 'u_rest_2',
        username: 'restbiller',
        email: 'biller@spicegarden.com',
        fullName: 'Captain & Restaurant Biller',
        role: 'Cashier',
        permissions: ['pos.bill', 'pos.kot', 'pos.view', 'tables.manage'],
        tenantId: 't_rest_2',
      };
      localStorage.setItem('quantrobill_tenant', JSON.stringify(restTenant));
      localStorage.setItem('quantrobill_active_outlet', JSON.stringify(restOutlet));
      localStorage.setItem('quantrobill_user', JSON.stringify(restUser));
      set({
        tenant: restTenant,
        activeOutlet: restOutlet,
        user: restUser,
        isAuthenticated: true,
      });
    }
  },

  switchRole: (role: UserRole) => {
    const currentUser = get().user || {
      id: 'u_active',
      username: 'user',
      email: 'staff@restaurant.com',
      fullName: 'Active User',
      role: 'Cashier',
      permissions: ['pos.bill', 'pos.kot', 'pos.view'],
      tenantId: get().tenant?.id || 't_1',
    };

    let updatedPermissions: string[] = ['pos.kot', 'pos.view'];
    let fullName = currentUser.fullName;

    if (role === 'Owner' || role === 'SuperAdmin' || role === 'Admin') {
      updatedPermissions = ['pos.bill', 'pos.kot', 'pos.view', 'tables.manage', 'pos.discount', 'pos.void', 'pos.reports', 'pos.settings', 'pos.cashdrawer'];
      fullName = 'Restaurant Owner / Admin';
    } else if (role === 'Manager') {
      updatedPermissions = ['pos.bill', 'pos.kot', 'pos.view', 'tables.manage', 'pos.discount', 'pos.void', 'pos.reports', 'pos.cashdrawer'];
      fullName = 'Store Manager';
    } else if (role === 'Cashier') {
      updatedPermissions = ['pos.bill', 'pos.kot', 'pos.view', 'tables.manage', 'pos.cashdrawer'];
      fullName = 'Billing Cashier';
    } else if (role === 'Waiter') {
      updatedPermissions = ['pos.kot', 'pos.view', 'tables.manage'];
      fullName = 'Captain / Waiter';
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      role,
      fullName,
      permissions: updatedPermissions,
    };

    localStorage.setItem('quantrobill_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  setDrawerOpen: (open: boolean) => set({ drawerOpen: open }),

  logout: () => {
    ['quantrobill_', 'petbharke_'].forEach((prefix) => {
      localStorage.removeItem(`${prefix}access_token`);
      localStorage.removeItem(`${prefix}refresh_token`);
      localStorage.removeItem(`${prefix}user`);
      localStorage.removeItem(`${prefix}tenant`);
      localStorage.removeItem(`${prefix}tenant_id`);
      localStorage.removeItem(`${prefix}active_outlet`);
      localStorage.removeItem(`${prefix}available_outlets`);
    });
    signalRService.stopConnection();

    set({
      user: null,
      tenant: null,
      activeOutlet: null,
      availableOutlets: [],
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      drawerOpen: false,
    });
  },

  initializeAuth: () => {
    try {
      const token = localStorage.getItem('quantrobill_access_token') || localStorage.getItem('petbharke_access_token');
      const userStr = localStorage.getItem('quantrobill_user') || localStorage.getItem('petbharke_user');
      const tenantStr = localStorage.getItem('quantrobill_tenant') || localStorage.getItem('petbharke_tenant');
      const outletStr = localStorage.getItem('quantrobill_active_outlet') || localStorage.getItem('petbharke_active_outlet');
      const availableStr = localStorage.getItem('quantrobill_available_outlets') || localStorage.getItem('petbharke_available_outlets');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        const tenant = tenantStr ? JSON.parse(tenantStr) : null;
        const activeOutlet = outletStr ? JSON.parse(outletStr) : null;
        const availableOutlets = availableStr ? JSON.parse(availableStr) : [];

        set({
          user,
          tenant,
          activeOutlet,
          availableOutlets,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });

        if (tenant && activeOutlet) {
          signalRService.startConnection(tenant.id, activeOutlet.id);
        }
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
