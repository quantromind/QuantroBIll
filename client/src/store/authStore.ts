import { create } from 'zustand';
import type { AuthResponse, OutletSummary, TenantSummary, UserProfile } from '../types';
import { apiClient } from '../services/api';
import { signalRService } from '../services/signalr';

// Re-export for backward compatibility
export { getHomeRouteForRole, canSettleBills, canApplyDiscounts, canVoidBills, isWaiterOnly } from '../types/roles';

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
}

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
    ['quantrobill_owner_token', 'quantrobill_superadmin_token', 'quantrobill_owner_user', 'quantrobill_superadmin_user', 'petbharke_owner_token', 'petbharke_superadmin_token'].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });

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
      ['quantrobill_owner_token', 'quantrobill_superadmin_token', 'quantrobill_owner_user', 'quantrobill_superadmin_user', 'petbharke_owner_token', 'petbharke_superadmin_token'].forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });

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

        // Transparently upgrade demo session to real backend JWT session if available
        if (token.startsWith('quantrobill_demo_')) {
          const creds: Record<string, { identifier: string; pass: string }> = {
            Owner: { identifier: 'sourabh@gmail.com', pass: 'Owner@123' },
            SuperAdmin: { identifier: 'admin@quantrobill.com', pass: 'SuperAdmin@123' },
            Cashier: { identifier: 'biller@jaymalhar.com', pass: 'Cashier@123' },
            Manager: { identifier: 'manager@jaymalhar.com', pass: 'Manager@123' },
            Waiter: { identifier: 'waiter@jaymalhar.com', pass: 'Waiter@123' },
          };
          const match = creds[user.role];
          if (match) {
            apiClient
              .post<{ success: boolean; data: AuthResponse }>('/auth/login', {
                identifier: match.identifier,
                password: match.pass,
              })
              .then((res) => {
                if (res.data?.success && res.data.data) {
                  get().setAuthData(res.data.data);
                }
              })
              .catch(() => {});
          }
        }
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
