import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface PairedOutlet {
  outletId: string;
  tenantId: string;
  outletName: string;
  tenantName: string;
  code: string;
  apiBaseUrl?: string;
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  staffName: string;
  role?: string;
  userId?: string;
}

const STORAGE_KEY_PAIRED_OUTLET = 'quantrobill_paired_outlet';
const STORAGE_KEY_AUTH_SESSION = 'quantrobill_auth_session';

// Safe secure storage helper that uses expo-secure-store on native (iOS/Android)
// and falls back gracefully to localStorage on web
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn(`[SecureStore] Error reading key "${key}":`, err);
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn(`[SecureStore] Error saving key "${key}":`, err);
  }
};

const deleteStorageItem = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.warn(`[SecureStore] Error deleting key "${key}":`, err);
  }
};

export const getPairedOutlet = async (): Promise<PairedOutlet | null> => {
  const raw = await getStorageItem(STORAGE_KEY_PAIRED_OUTLET);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.outletId && parsed.tenantId) {
      return parsed as PairedOutlet;
    }
  } catch (err) {
    console.warn('[pairingService] Corrupt paired outlet data, clearing:', err);
    await deleteStorageItem(STORAGE_KEY_PAIRED_OUTLET);
  }
  return null;
};

export const setPairedOutlet = async (outlet: PairedOutlet): Promise<void> => {
  await setStorageItem(STORAGE_KEY_PAIRED_OUTLET, JSON.stringify(outlet));
};

export const clearPairedOutlet = async (): Promise<void> => {
  await deleteStorageItem(STORAGE_KEY_PAIRED_OUTLET);
  await clearAuthSession();
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
  const raw = await getStorageItem(STORAGE_KEY_AUTH_SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const setAuthSession = async (session: AuthSession): Promise<void> => {
  await setStorageItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
};

export const clearAuthSession = async (): Promise<void> => {
  await deleteStorageItem(STORAGE_KEY_AUTH_SESSION);
};
