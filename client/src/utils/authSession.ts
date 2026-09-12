import { useAuthStore } from '../store/authStore';
import { useSuperAdminAuthStore } from '../superadmin/store/superAdminAuthStore';
import { useOwnerAuthStore } from '../owner/store/ownerAuthStore';
import { signalRService } from '../services/signalr';

export const ALL_AUTH_STORAGE_KEYS = [
  'quantrobill_access_token',
  'quantrobill_refresh_token',
  'quantrobill_user',
  'quantrobill_tenant',
  'quantrobill_tenant_id',
  'quantrobill_active_outlet',
  'quantrobill_available_outlets',
  'quantrobill_superadmin_token',
  'quantrobill_superadmin_user',
  'quantrobill_owner_token',
  'quantrobill_owner_user',
  'petbharke_access_token',
  'petbharke_refresh_token',
  'petbharke_user',
  'petbharke_tenant',
  'petbharke_tenant_id',
  'petbharke_active_outlet',
  'petbharke_available_outlets',
  'petbharke_superadmin_token',
  'petbharke_superadmin_user',
  'petbharke_owner_token',
  'petbharke_owner_user',
];

/**
 * Universal logout and session cleanup:
 * Clears all storage keys across QuantroBill and legacy prefixes,
 * stops active SignalR streams, and completely resets all three auth stores
 * (Global useAuthStore, SuperAdmin store, and Owner store) so that
 * no stale session bounces the user back into protected dashboards.
 */
export const clearAllAuthSessions = (): void => {
  // 1. Wipe known auth keys from localStorage
  ALL_AUTH_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });

  // 2. Scan and remove any lingering quantrobill_ or petbharke_ tokens
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('quantrobill_') || key.startsWith('petbharke_'))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }

  // 3. Terminate realtime SignalR connections
  try {
    signalRService.stopConnection();
  } catch {
    // ignore
  }

  // 4. Reset global useAuthStore
  try {
    useAuthStore.setState({
      user: null,
      tenant: null,
      activeOutlet: null,
      availableOutlets: [],
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      drawerOpen: false,
    });
  } catch (e) {
    console.error('Error clearing global auth store:', e);
  }

  // 5. Reset SuperAdmin auth store
  try {
    useSuperAdminAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  } catch (e) {
    console.error('Error clearing SuperAdmin auth store:', e);
  }

  // 6. Reset Owner auth store
  try {
    useOwnerAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  } catch (e) {
    console.error('Error clearing Owner auth store:', e);
  }
};
