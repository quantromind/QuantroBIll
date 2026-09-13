import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrderItem, PaymentMode } from '../types';
import { apiClient } from '../services/api';
import { signalRService } from '../services/signalr';
import { useDraftCartStore } from './draftCartStore';

export interface TableData {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  isOccupied: boolean;
  orderTotal?: number;
  orderTime?: string;
  billNumber?: string;
  kotNumber?: string;
  items?: OrderItem[];
  customerPhone?: string;
  paymentMode?: PaymentMode;
  lastSentQuantities?: Record<string, number>;
}

interface TableStoreState {
  tables: TableData[];
  fetchTablesFromApi: () => Promise<void>;
  initializeSignalRSync: () => void;
  createTable: (table: { tableNumber: string; section: string; capacity: number }) => Promise<{ success: boolean; message?: string; table?: TableData }>;
  updateTable: (id: string, updates: { tableNumber?: string; section?: string; capacity?: number }) => Promise<{ success: boolean; message?: string }>;
  deleteTable: (id: string) => Promise<{ success: boolean; message?: string }>;
  bulkGenerateTables: (req: { prefix: string; startNumber: number; endNumber: number; section: string; capacity: number }) => Promise<{ success: boolean; message?: string; count?: number }>;
  getSections: () => string[];
  vacateTable: (tableNumber: string) => void;
  occupyTable: (tableNumber: string, items: OrderItem[], total: number) => void;
  updateTableOrder: (tableNumber: string, items: OrderItem[], total: number, lastSentQuantities?: Record<string, number>) => void;
  addTable: (table: Omit<TableData, 'id' | 'isOccupied'>) => void;
  mergeTables: (sourceTableNumber: string, targetTableNumber: string) => boolean;
  shiftTable: (fromTableNumber: string, toTableNumber: string) => boolean;
  getTable: (tableNumber: string) => TableData | undefined;
  resetToDefaults: () => void;
}

const defaultTables: TableData[] = [];

export const useTableStore = create<TableStoreState>()(
  persist(
    (set, get) => ({
      tables: defaultTables,

      fetchTablesFromApi: async () => {
        try {
          const res = await apiClient.get<{ success: boolean; data: any[] }>('/tables');
          if (res.data?.success && Array.isArray(res.data.data)) {
            const mapped: TableData[] = res.data.data.map((t: any) => {
              const existing = get().tables.find((et) => et.tableNumber.toUpperCase() === t.tableNumber?.toUpperCase());
              return {
                id: t.id,
                tableNumber: t.tableNumber,
                section: t.section || 'Main Hall',
                capacity: t.seatingCapacity || 4,
                isOccupied: t.isOccupied ?? existing?.isOccupied ?? false,
                orderTotal: existing?.orderTotal,
                orderTime: existing?.orderTime,
                billNumber: existing?.billNumber,
                kotNumber: existing?.kotNumber,
                items: existing?.items || [],
              };
            });
            set({ tables: mapped });
          }
        } catch (e) {
          console.debug('Fallback to cached tables:', e);
        }
      },

      initializeSignalRSync: () => {
        signalRService.on('TableStatusChanged', (data: any) => {
          if (!data || !data.tableNumber) return;
          console.log('--> [tableStore] TableStatusChanged real-time event:', data);
          const isOccupied = Boolean(data.isOccupied);

          set((state) => ({
            tables: state.tables.map((t) => {
              if (t.tableNumber.toUpperCase() === data.tableNumber.toUpperCase()) {
                return {
                  ...t,
                  isOccupied,
                  orderTotal: isOccupied ? (data.orderTotal ?? t.orderTotal) : undefined,
                  orderTime: isOccupied ? (data.orderTime ? 'Just Now' : (t.orderTime || 'Just Now')) : undefined,
                  billNumber: isOccupied ? (data.billNumber ?? t.billNumber) : undefined,
                  kotNumber: isOccupied ? (data.kotNumber ?? t.kotNumber) : undefined,
                  items: isOccupied ? (data.items ?? t.items ?? []) : [],
                };
              }
              return t;
            }),
          }));
        });

        signalRService.on('TableListChanged', (data: any) => {
          console.log('--> [tableStore] TableListChanged real-time event:', data);
          get().fetchTablesFromApi();
        });
      },

      vacateTable: (tableNumber: string) => {
        apiClient.post(`/tables/${encodeURIComponent(tableNumber)}/vacate`).catch(() => {});
        const targetTable = get().tables.find((t) => t.tableNumber.toUpperCase() === tableNumber.toUpperCase());
        if (targetTable?.id) {
          apiClient.patch(`/tables/${targetTable.id}/status`, { isOccupied: false }).catch(() => {});
        }

        // Clear associated draft in draftCartStore as well
        try {
          useDraftCartStore.getState().clearDraft(`table:${tableNumber.trim().toUpperCase()}`);
        } catch {}

        set((state) => ({
          tables: state.tables.map((t) =>
            t.tableNumber.toUpperCase() === tableNumber.toUpperCase()
              ? {
                  ...t,
                  isOccupied: false,
                  orderTotal: undefined,
                  orderTime: undefined,
                  items: [],
                  billNumber: undefined,
                  kotNumber: undefined,
                  paymentMode: undefined,
                  lastSentQuantities: undefined,
                }
              : t
          ),
        }));
      },

      occupyTable: (tableNumber: string, items: OrderItem[], total: number) => {
        const targetTable = get().tables.find((t) => t.tableNumber.toUpperCase() === tableNumber.toUpperCase());
        if (targetTable?.id) {
          apiClient.patch(`/tables/${targetTable.id}/status`, { isOccupied: true }).catch(() => {});
        }

        const numOnly = tableNumber.replace(/\D/g, '') || '101';
        set((state) => ({
          tables: state.tables.map((t) =>
            t.tableNumber.toUpperCase() === tableNumber.toUpperCase()
              ? {
                  ...t,
                  isOccupied: true,
                  orderTotal: total,
                  orderTime: 'Just Now',
                  items,
                  billNumber: t.billNumber || `BILL-${numOnly}`,
                  kotNumber: t.kotNumber || `KOT-${numOnly}`,
                }
              : t
          ),
        }));
      },

      updateTableOrder: (tableNumber: string, items: OrderItem[], total: number, lastSentQuantities?: Record<string, number>) => {
        if (items.length === 0) {
          get().vacateTable(tableNumber);
          return;
        }

        const numOnly = tableNumber.replace(/\D/g, '') || '101';
        set((state) => ({
          tables: state.tables.map((t) =>
            t.tableNumber.toUpperCase() === tableNumber.toUpperCase()
              ? {
                  ...t,
                  isOccupied: true,
                  orderTotal: total,
                  orderTime: t.orderTime || 'Just Now',
                  items,
                  billNumber: t.billNumber || `BILL-${numOnly}`,
                  kotNumber: t.kotNumber || `KOT-${numOnly}`,
                  lastSentQuantities: lastSentQuantities !== undefined ? lastSentQuantities : t.lastSentQuantities,
                }
              : t
          ),
        }));
      },

      createTable: async (tableInput) => {
        try {
          const res = await apiClient.post<{ success: boolean; message?: string; data?: any }>('/tables', {
            tableNumber: tableInput.tableNumber,
            section: tableInput.section,
            seatingCapacity: tableInput.capacity,
          });
          if (res.data?.success && res.data.data) {
            const t = res.data.data;
            const newTable: TableData = {
              id: t.id,
              tableNumber: t.tableNumber,
              section: t.section,
              capacity: t.seatingCapacity,
              isOccupied: false,
              items: [],
            };
            set((state) => ({
              tables: [...state.tables.filter((existing) => existing.tableNumber.toUpperCase() !== newTable.tableNumber.toUpperCase()), newTable],
            }));
            return { success: true, table: newTable };
          }
          return { success: false, message: res.data?.message || 'Failed to create table.' };
        } catch (err: any) {
          const msg = err.response?.data?.message || err.message || 'Error creating table.';
          return { success: false, message: msg };
        }
      },

      updateTable: async (id, updates) => {
        try {
          const res = await apiClient.put<{ success: boolean; message?: string }>(`/tables/${id}`, {
            tableNumber: updates.tableNumber,
            section: updates.section,
            seatingCapacity: updates.capacity,
          });
          if (res.data?.success) {
            set((state) => ({
              tables: state.tables.map((t) =>
                t.id === id
                  ? {
                      ...t,
                      tableNumber: updates.tableNumber ?? t.tableNumber,
                      section: updates.section ?? t.section,
                      capacity: updates.capacity ?? t.capacity,
                    }
                  : t
              ),
            }));
            return { success: true, message: 'Table updated successfully.' };
          }
          return { success: false, message: res.data?.message || 'Failed to update table.' };
        } catch (err: any) {
          return { success: false, message: err.response?.data?.message || err.message || 'Error updating table.' };
        }
      },

      deleteTable: async (id) => {
        try {
          const res = await apiClient.delete<{ success: boolean; message?: string }>(`/tables/${id}`);
          if (res.data?.success) {
            set((state) => ({
              tables: state.tables.filter((t) => t.id !== id),
            }));
            return { success: true, message: 'Table deleted successfully.' };
          }
          return { success: false, message: res.data?.message || 'Failed to delete table.' };
        } catch (err: any) {
          return { success: false, message: err.response?.data?.message || err.message || 'Error deleting table.' };
        }
      },

      bulkGenerateTables: async (bulkReq) => {
        try {
          const res = await apiClient.post<{ success: boolean; message?: string; data?: any[] }>('/tables/bulk', {
            prefix: bulkReq.prefix,
            startNumber: bulkReq.startNumber,
            endNumber: bulkReq.endNumber,
            section: bulkReq.section,
            capacity: bulkReq.capacity,
          });
          if (res.data?.success && Array.isArray(res.data.data)) {
            await get().fetchTablesFromApi();
            return { success: true, count: res.data.data.length, message: res.data.message };
          }
          return { success: false, message: res.data?.message || 'Failed to bulk generate tables.' };
        } catch (err: any) {
          return { success: false, message: err.response?.data?.message || err.message || 'Error bulk generating tables.' };
        }
      },

      getSections: () => {
        const sectionsSet = new Set<string>();
        get().tables.forEach((t) => {
          if (t.section?.trim()) sectionsSet.add(t.section.trim());
        });
        if (sectionsSet.size === 0) {
          return ['Main Hall', 'AC Section', 'Outdoor / Patio', 'First Floor'];
        }
        return Array.from(sectionsSet);
      },

      addTable: (table) => {
        const newTable: TableData = {
          ...table,
          id: `t-${Date.now()}`,
          isOccupied: false,
          items: [],
        };
        set((state) => ({
          tables: [...state.tables, newTable],
        }));
      },

      mergeTables: (sourceTableNumber: string, targetTableNumber: string) => {
        const state = get();
        const source = state.tables.find(
          (t) => t.tableNumber.toUpperCase() === sourceTableNumber.toUpperCase()
        );
        const target = state.tables.find(
          (t) => t.tableNumber.toUpperCase() === targetTableNumber.toUpperCase()
        );

        if (!source || !target || !source.isOccupied) {
          return false;
        }

        const sourceItems = source.items || [];
        const targetItems = target.items ? [...target.items] : [];

        // Consolidate items: sum quantities of duplicate items, append new ones
        sourceItems.forEach((sItem) => {
          const existingIdx = targetItems.findIndex((tItem) => tItem.menuItemId === sItem.menuItemId);
          if (existingIdx !== -1) {
            const existing = targetItems[existingIdx];
            const newQty = existing.quantity + sItem.quantity;
            targetItems[existingIdx] = {
              ...existing,
              quantity: newQty,
              totalPrice: existing.unitPrice * newQty,
            };
          } else {
            targetItems.push({ ...sItem });
          }
        });

        const newTotal = targetItems.reduce((acc, item) => acc + item.totalPrice, 0);

        const mergedSentQuantities: Record<string, number> = {
          ...(target.lastSentQuantities || {}),
        };
        if (source.lastSentQuantities) {
          Object.entries(source.lastSentQuantities).forEach(([itemId, qty]) => {
            mergedSentQuantities[itemId] = (mergedSentQuantities[itemId] || 0) + qty;
          });
        }

        try {
          useDraftCartStore.getState().mergeDrafts(`table:${sourceTableNumber}`, `table:${targetTableNumber}`);
        } catch {}

        set((s) => ({
          tables: s.tables.map((t) => {
            if (t.tableNumber.toUpperCase() === targetTableNumber.toUpperCase()) {
              return {
                ...t,
                isOccupied: true,
                items: targetItems,
                orderTotal: newTotal,
                orderTime: t.orderTime || source.orderTime || 'Just Now',
                kotNumber: t.kotNumber || source.kotNumber,
                billNumber: t.billNumber || source.billNumber,
                lastSentQuantities: Object.keys(mergedSentQuantities).length > 0 ? mergedSentQuantities : undefined,
              };
            }
            if (t.tableNumber.toUpperCase() === sourceTableNumber.toUpperCase()) {
              return {
                ...t,
                isOccupied: false,
                orderTotal: undefined,
                orderTime: undefined,
                items: [],
                billNumber: undefined,
                kotNumber: undefined,
                paymentMode: undefined,
                lastSentQuantities: undefined,
              };
            }
            return t;
          }),
        }));

        // Sync to backend via API
        apiClient.post('/tables/merge', {
          sourceTableNumber: sourceTableNumber,
          targetTableNumber: targetTableNumber,
        }).catch(() => {});

        return true;
      },

      shiftTable: (fromTableNumber: string, toTableNumber: string) => {
        const state = get();
        const from = state.tables.find(
          (t) => t.tableNumber.toUpperCase() === fromTableNumber.toUpperCase()
        );
        const to = state.tables.find(
          (t) => t.tableNumber.toUpperCase() === toTableNumber.toUpperCase()
        );

        if (!from || !to || !from.isOccupied || to.isOccupied) {
          return false;
        }

        try {
          useDraftCartStore.getState().moveDraft(`table:${fromTableNumber}`, `table:${toTableNumber}`);
        } catch {}

        set((s) => ({
          tables: s.tables.map((t) => {
            if (t.tableNumber.toUpperCase() === toTableNumber.toUpperCase()) {
              return {
                ...t,
                isOccupied: true,
                orderTotal: from.orderTotal,
                orderTime: from.orderTime,
                billNumber: from.billNumber,
                kotNumber: from.kotNumber,
                items: from.items ? [...from.items] : [],
                customerPhone: from.customerPhone,
                paymentMode: from.paymentMode,
                lastSentQuantities: from.lastSentQuantities,
              };
            }
            if (t.tableNumber.toUpperCase() === fromTableNumber.toUpperCase()) {
              return {
                ...t,
                isOccupied: false,
                orderTotal: undefined,
                orderTime: undefined,
                items: [],
                billNumber: undefined,
                kotNumber: undefined,
                paymentMode: undefined,
                customerPhone: undefined,
                lastSentQuantities: undefined,
              };
            }
            return t;
          }),
        }));

        // Sync to backend via API
        apiClient.post('/tables/shift', {
          fromTableNumber: fromTableNumber,
          toTableNumber: toTableNumber,
        }).catch(() => {});

        return true;
      },

      getTable: (tableNumber: string) => {
        return get().tables.find(
          (t) => t.tableNumber.toUpperCase() === tableNumber.toUpperCase()
        );
      },

      resetToDefaults: () => {
        set({ tables: defaultTables });
      },
    }),
    {
      name: 'quantrobill_tables_store',
    }
  )
);
