import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrderItem, PaymentMode } from '../types';
import { apiClient } from '../services/api';
import { signalRService } from '../services/signalr';

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
}

interface TableStoreState {
  tables: TableData[];
  fetchTablesFromApi: () => Promise<void>;
  initializeSignalRSync: () => void;
  vacateTable: (tableNumber: string) => void;
  occupyTable: (tableNumber: string, items: OrderItem[], total: number) => void;
  updateTableOrder: (tableNumber: string, items: OrderItem[], total: number) => void;
  addTable: (table: Omit<TableData, 'id' | 'isOccupied'>) => void;
  mergeTables: (sourceTableNumber: string, targetTableNumber: string) => boolean;
  shiftTable: (fromTableNumber: string, toTableNumber: string) => boolean;
  getTable: (tableNumber: string) => TableData | undefined;
  resetToDefaults: () => void;
}

const defaultTables: TableData[] = [
  {
    id: 't1',
    tableNumber: 'T-1',
    section: 'Main Hall',
    capacity: 4,
    isOccupied: true,
    orderTotal: 420,
    orderTime: '24m',
    billNumber: 'BILL-1021',
    kotNumber: 'KOT-304',
    items: [
      {
        menuItemId: 'm-1',
        name: 'Paneer Butter Masala',
        quantity: 1,
        unitPrice: 240,
        totalPrice: 240,
        isVeg: true,
      },
      {
        menuItemId: 'm-2',
        name: 'Butter Naan',
        quantity: 3,
        unitPrice: 40,
        totalPrice: 120,
        isVeg: true,
      },
      {
        menuItemId: 'm-3',
        name: 'Fresh Lime Soda',
        quantity: 1,
        unitPrice: 60,
        totalPrice: 60,
        isVeg: true,
      },
    ],
  },
  { id: 't2', tableNumber: 'T-2', section: 'Main Hall', capacity: 2, isOccupied: false, items: [] },
  { id: 't3', tableNumber: 'T-3', section: 'Main Hall', capacity: 4, isOccupied: false, items: [] },
  {
    id: 't4',
    tableNumber: 'T-4',
    section: 'AC Section',
    capacity: 6,
    isOccupied: true,
    orderTotal: 860,
    orderTime: '45m',
    billNumber: 'BILL-1022',
    kotNumber: 'KOT-305',
    items: [
      {
        menuItemId: 'm-4',
        name: 'Chicken Dum Biryani',
        quantity: 2,
        unitPrice: 280,
        totalPrice: 560,
        isVeg: false,
      },
      {
        menuItemId: 'm-5',
        name: 'Butter Garlic Naan',
        quantity: 2,
        unitPrice: 60,
        totalPrice: 120,
        isVeg: true,
      },
      {
        menuItemId: 'm-6',
        name: 'Cold Coffee with Ice Cream',
        quantity: 2,
        unitPrice: 90,
        totalPrice: 180,
        isVeg: true,
      },
    ],
  },
  { id: 't5', tableNumber: 'T-5', section: 'AC Section', capacity: 4, isOccupied: false, items: [] },
  { id: 't6', tableNumber: 'T-6', section: 'Outdoor / Patio', capacity: 2, isOccupied: false, items: [] },
  {
    id: 't7',
    tableNumber: 'T-7',
    section: 'Outdoor / Patio',
    capacity: 4,
    isOccupied: true,
    orderTotal: 290,
    orderTime: '12m',
    billNumber: 'BILL-1023',
    kotNumber: 'KOT-306',
    items: [
      {
        menuItemId: 'm-7',
        name: 'Veg Hakka Noodles',
        quantity: 1,
        unitPrice: 180,
        totalPrice: 180,
        isVeg: true,
      },
      {
        menuItemId: 'm-8',
        name: 'Crispy Corn Salt & Pepper',
        quantity: 1,
        unitPrice: 110,
        totalPrice: 110,
        isVeg: true,
      },
    ],
  },
  { id: 't8', tableNumber: 'T-8', section: 'First Floor', capacity: 8, isOccupied: false, items: [] },
];

export const useTableStore = create<TableStoreState>()(
  persist(
    (set, get) => ({
      tables: defaultTables,

      fetchTablesFromApi: async () => {
        try {
          const res = await apiClient.get<{ success: boolean; data: any[] }>('/tables');
          if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
            const mapped: TableData[] = res.data.data.map((t: any) => {
              const existing = get().tables.find((et) => et.tableNumber.toUpperCase() === t.tableNumber?.toUpperCase());
              return {
                id: t.id,
                tableNumber: t.tableNumber,
                section: t.section || 'Main Dining Hall',
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
      },

      vacateTable: (tableNumber: string) => {
        apiClient.post(`/tables/${encodeURIComponent(tableNumber)}/vacate`).catch(() => {});
        const targetTable = get().tables.find((t) => t.tableNumber.toUpperCase() === tableNumber.toUpperCase());
        if (targetTable?.id) {
          apiClient.patch(`/tables/${targetTable.id}/status`, { isOccupied: false }).catch(() => {});
        }

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

      updateTableOrder: (tableNumber: string, items: OrderItem[], total: number) => {
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
                }
              : t
          ),
        }));
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
