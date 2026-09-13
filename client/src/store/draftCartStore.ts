import { create } from 'zustand';
import type { OrderItem } from '../types';

export interface DraftCartData {
  items: OrderItem[];
  customerPhone?: string;
  orderNote?: string;
  discountPercent?: number;
  packagingCharge?: number;
  enablePackaging?: boolean;
  updatedAt: number;
  lastSentQuantities?: Record<string, number>;
}

const getTenantId = (): string => {
  try {
    return localStorage.getItem('quantrobill_tenant_id') || 'demo';
  } catch {
    return 'demo';
  }
};

const getStorageKey = (tid?: string): string => {
  const tenantId = tid || getTenantId();
  return `pbk_draft_carts_${tenantId || 'demo'}`;
};

const loadDraftsFromStorage = (tid?: string): Record<string, DraftCartData> => {
  try {
    const raw = localStorage.getItem(getStorageKey(tid));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.error('Error reading draft carts from storage:', err);
    return {};
  }
};

const saveDraftsToStorage = (drafts: Record<string, DraftCartData>, tid?: string): void => {
  try {
    localStorage.setItem(getStorageKey(tid), JSON.stringify(drafts));
  } catch (err) {
    console.error('Error saving draft carts to storage:', err);
  }
};

interface DraftCartStoreState {
  drafts: Record<string, DraftCartData>;
  tenantId: string;

  // Tenant scoping & sync
  initTenant: (tid?: string) => void;

  // Draft operations
  getDraft: (key: string) => DraftCartData | undefined;
  saveDraft: (key: string, data: Partial<DraftCartData>) => void;
  clearDraft: (key: string) => void;
  clearAllDrafts: () => void;
  hasDraft: (key: string) => boolean;
  getDraftItemCount: (key: string) => number;
  getDraftTotal: (key: string) => number;
  moveDraft: (fromKey: string, toKey: string) => void;
  mergeDrafts: (sourceKey: string, targetKey: string) => void;
  getLastSentQuantities: (key: string) => Record<string, number>;
  updateLastSentQuantities: (key: string, sentMap: Record<string, number>) => void;
}

export const useDraftCartStore = create<DraftCartStoreState>((set, get) => {
  const initialTenantId = getTenantId();
  const initialDrafts = loadDraftsFromStorage(initialTenantId);

  return {
    drafts: initialDrafts,
    tenantId: initialTenantId,

    initTenant: (tid?: string) => {
      const activeTenant = tid || getTenantId();
      const loaded = loadDraftsFromStorage(activeTenant);
      set({ tenantId: activeTenant, drafts: loaded });
    },

    getDraft: (key: string) => {
      return get().drafts[key.toUpperCase()];
    },

    getLastSentQuantities: (key: string) => {
      const draft = get().drafts[key.toUpperCase()];
      return draft?.lastSentQuantities || {};
    },

    updateLastSentQuantities: (key: string, sentMap: Record<string, number>) => {
      const normalizedKey = key.toUpperCase();
      const currentDraft = get().drafts[normalizedKey] || {
        items: [],
        updatedAt: Date.now(),
      };

      const updatedDraft: DraftCartData = {
        ...currentDraft,
        lastSentQuantities: { ...(currentDraft.lastSentQuantities || {}), ...sentMap },
        updatedAt: Date.now(),
      };

      const updatedDrafts = {
        ...get().drafts,
        [normalizedKey]: updatedDraft,
      };

      set({ drafts: updatedDrafts });
      saveDraftsToStorage(updatedDrafts, get().tenantId);
    },

    saveDraft: (key: string, data: Partial<DraftCartData>) => {
      const normalizedKey = key.toUpperCase();
      const currentDraft = get().drafts[normalizedKey] || {
        items: [],
        updatedAt: Date.now(),
      };

      const updatedDraft: DraftCartData = {
        ...currentDraft,
        ...data,
        updatedAt: Date.now(),
      };

      const updatedDrafts = {
        ...get().drafts,
        [normalizedKey]: updatedDraft,
      };

      // If items exist or fields exist or sent quantities exist, store it; if empty items and no metadata, remove
      if (
        (!updatedDraft.items || updatedDraft.items.length === 0) &&
        !updatedDraft.customerPhone &&
        !updatedDraft.orderNote &&
        (!updatedDraft.lastSentQuantities || Object.keys(updatedDraft.lastSentQuantities).length === 0)
      ) {
        delete updatedDrafts[normalizedKey];
      }

      set({ drafts: updatedDrafts });
      saveDraftsToStorage(updatedDrafts, get().tenantId);
    },

    clearDraft: (key: string) => {
      const normalizedKey = key.toUpperCase();
      const updatedDrafts = { ...get().drafts };
      if (updatedDrafts[normalizedKey]) {
        delete updatedDrafts[normalizedKey];
        set({ drafts: updatedDrafts });
        saveDraftsToStorage(updatedDrafts, get().tenantId);
      }
    },

    clearAllDrafts: () => {
      set({ drafts: {} });
      saveDraftsToStorage({}, get().tenantId);
    },

    hasDraft: (key: string) => {
      const draft = get().drafts[key.toUpperCase()];
      return Boolean(draft && draft.items && draft.items.length > 0);
    },

    getDraftItemCount: (key: string) => {
      const draft = get().drafts[key.toUpperCase()];
      if (!draft || !draft.items) return 0;
      return draft.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    getDraftTotal: (key: string) => {
      const draft = get().drafts[key.toUpperCase()];
      if (!draft || !draft.items) return 0;
      return draft.items.reduce((sum, item) => sum + item.totalPrice, 0);
    },

    moveDraft: (fromKey: string, toKey: string) => {
      const normFrom = fromKey.toUpperCase();
      const normTo = toKey.toUpperCase();
      const drafts = { ...get().drafts };
      const sourceDraft = drafts[normFrom];

      if (sourceDraft) {
        drafts[normTo] = {
          ...sourceDraft,
          updatedAt: Date.now(),
        };
        delete drafts[normFrom];
        set({ drafts });
        saveDraftsToStorage(drafts, get().tenantId);
      }
    },

    mergeDrafts: (sourceKey: string, targetKey: string) => {
      const normSource = sourceKey.toUpperCase();
      const normTarget = targetKey.toUpperCase();
      const drafts = { ...get().drafts };
      const sourceDraft = drafts[normSource];
      const targetDraft = drafts[normTarget] || { items: [], updatedAt: Date.now() };

      if (!sourceDraft || !sourceDraft.items || sourceDraft.items.length === 0) {
        return;
      }

      const consolidatedItems = [...(targetDraft.items || [])];
      sourceDraft.items.forEach((sItem) => {
        const existingIdx = consolidatedItems.findIndex(
          (tItem) => tItem.menuItemId === sItem.menuItemId
        );
        if (existingIdx !== -1) {
          const existing = consolidatedItems[existingIdx];
          const newQty = existing.quantity + sItem.quantity;
          consolidatedItems[existingIdx] = {
            ...existing,
            quantity: newQty,
            totalPrice: existing.unitPrice * newQty,
          };
        } else {
          consolidatedItems.push({ ...sItem });
        }
      });

      const mergedSentQuantities: Record<string, number> = {
        ...(targetDraft.lastSentQuantities || {}),
      };
      if (sourceDraft.lastSentQuantities) {
        Object.entries(sourceDraft.lastSentQuantities).forEach(([itemId, qty]) => {
          mergedSentQuantities[itemId] = (mergedSentQuantities[itemId] || 0) + qty;
        });
      }

      drafts[normTarget] = {
        ...targetDraft,
        items: consolidatedItems,
        customerPhone: targetDraft.customerPhone || sourceDraft.customerPhone,
        orderNote: [targetDraft.orderNote, sourceDraft.orderNote].filter(Boolean).join(' | '),
        lastSentQuantities: Object.keys(mergedSentQuantities).length > 0 ? mergedSentQuantities : undefined,
        updatedAt: Date.now(),
      };

      delete drafts[normSource];
      set({ drafts });
      saveDraftsToStorage(drafts, get().tenantId);
    },
  };
});
