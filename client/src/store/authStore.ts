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
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  logout: () => void;
  initializeAuth: () => void;
  switchRole: (role: UserRole) => void;
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

export const getHomeRouteForRole = (role?: UserRole | string): string => {
  if (!role) return '/billing';
  switch (role) {
    case 'SuperAdmin':
      return '/superadmin/dashboard';
    case 'Owner':
    case 'Admin':
    case 'Manager':
      return '/owner/dashboard';
    case 'Waiter':
      return '/tables';
    case 'KitchenStaff':
      return '/kds';
    case 'DeliveryBoy':
      return '/online-orders';
    case 'Cashier':
    default:
      return '/billing';
  }
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

    // Synchronize tokens across SuperAdmin and Owner stores
    if (data.user.role === 'SuperAdmin') {
      localStorage.setItem('quantrobill_superadmin_token', data.accessToken);
      localStorage.setItem(
        'quantrobill_superadmin_user',
        JSON.stringify({
          id: data.user.id,
          name: data.user.fullName || data.user.username || 'System SuperAdmin',
          email: data.user.email,
          role: 'SuperAdmin',
        })
      );
    }

    if (
      data.user.role === 'Owner' ||
      data.user.role === 'Admin' ||
      data.user.role === 'Manager' ||
      data.user.role === 'SuperAdmin'
    ) {
      localStorage.setItem('quantrobill_owner_token', data.accessToken);
      localStorage.setItem(
        'quantrobill_owner_user',
        JSON.stringify({
          id: data.user.id,
          name: data.user.fullName || data.user.username || 'Restaurant Owner',
          email: data.user.email,
          phone: (data.tenant as any)?.ownerPhone || '',
          restaurantName: data.tenant?.businessName || 'Restaurant Portal',
          role: data.user.role === 'Manager' ? 'GeneralManager' : 'Owner',
          tenantId: data.tenant?.id,
          outletId: data.activeOutlet?.id,
        })
      );
    }

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

  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  setDrawerOpen: (open: boolean) => set({ drawerOpen: open }),

  switchRole: (role: UserRole) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, role } });
    }
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
