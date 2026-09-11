import { create } from 'zustand';
import type { OrderItem, OrderType, PaymentMode } from '../types';
import type { OwnerSaleTransaction, InventoryIngredient } from '../owner/types';
import { apiClient } from '../services/api';
import { signalRService } from '../services/signalr';

export interface KdsItem {
  name: string;
  qty: number;
  note?: string;
  station?: 'Kitchen' | 'Tandoor' | 'Bar' | 'Dessert';
}

export interface KdsTicket {
  id: string;
  kotNo: string;
  orderType: string;
  tableOrChannel: string;
  tableNumber?: string;
  createdAt: number; // timestamp in ms
  elapsedMinutes: number;
  items: KdsItem[];
  status: 'Pending' | 'InPrep' | 'Ready' | 'Completed';
  isUrgent?: boolean;
  station: 'Kitchen' | 'Tandoor' | 'Bar' | 'Dessert' | 'All';
}

// Initial Stock matching OwnerInventory
const initialIngredients: InventoryIngredient[] = [
  { id: '3', stockItemName: 'THUMS UP 250 ML', recipeUom: 'Piece', parStockQuantity: 1000, parStockUnit: 'Pieces (Pc)', currentAvailable: 840, landingPrice: 18 },
  { id: '4', stockItemName: 'SODA 250 ML', recipeUom: 'Piece', parStockQuantity: 500, parStockUnit: 'Pieces (Pc)', currentAvailable: 310, landingPrice: 12 },
  { id: '5', stockItemName: 'WATER 1 LTR', recipeUom: 'Piece', parStockQuantity: 1000, parStockUnit: 'Pieces (Pc)', currentAvailable: 920, landingPrice: 10 },
  { id: '6', stockItemName: 'WATER 500 ML', recipeUom: 'Piece', parStockQuantity: 1050, parStockUnit: 'Pieces (Pc)', currentAvailable: 680, landingPrice: 6 },
  { id: '7', stockItemName: 'STRING 200 ML', recipeUom: 'Piece', parStockQuantity: 15, parStockUnit: 'Pieces (Pc)', currentAvailable: 12, landingPrice: 20 },
  { id: '8', stockItemName: 'J SODA 200 ML', recipeUom: 'Piece', parStockQuantity: 1, parStockUnit: 'Pieces (Pc)', currentAvailable: 4, landingPrice: 15 },
  { id: '9', stockItemName: 'TANGY 200 ML', recipeUom: 'Piece', parStockQuantity: 1, parStockUnit: 'Pieces (Pc)', currentAvailable: 1, landingPrice: 15 },
  { id: '10', stockItemName: 'MOONSTAR 200 ML', recipeUom: 'Piece', parStockQuantity: 1, parStockUnit: 'Pieces (Pc)', currentAvailable: 0, landingPrice: 25 },
  { id: '11', stockItemName: 'REDBULL 200 ML', recipeUom: 'Piece', parStockQuantity: 100, parStockUnit: 'Pieces (Pc)', currentAvailable: 45, landingPrice: 95 },
  { id: '28', stockItemName: 'HELLA 200 ML', recipeUom: 'Piece', parStockQuantity: 1, parStockUnit: 'Pieces (Pc)', currentAvailable: 2, landingPrice: 40 },
  { id: '29', stockItemName: 'WATER 2 LTR', recipeUom: 'Piece', parStockQuantity: 1, parStockUnit: 'Pieces (Pc)', currentAvailable: 6, landingPrice: 25 },
  { id: '30', stockItemName: 'PREDATOR', recipeUom: 'Piece', parStockQuantity: 1, parStockUnit: 'Pieces (Pc)', currentAvailable: 1, landingPrice: 45 },
  { id: '31', stockItemName: 'BUDWEISER PREMIUM 650 ML', recipeUom: 'Piece', parStockQuantity: 1, parStockUnit: 'Pieces (Pc)', currentAvailable: 24, landingPrice: 180 },
  { id: '32', stockItemName: 'DAIRY MILK PANEER', recipeUom: 'Kg', parStockQuantity: 50, parStockUnit: 'Kilograms (Kg)', currentAvailable: 18.5, landingPrice: 340 },
  { id: '33', stockItemName: 'BASMATI BIRYANI RICE', recipeUom: 'Kg', parStockQuantity: 200, parStockUnit: 'Kilograms (Kg)', currentAvailable: 110, landingPrice: 90 },
];

// Initial Sales matching OwnerSales
const initialSales: OwnerSaleTransaction[] = [
  {
    id: 'tx-1',
    billNo: 'INV-2026-0891',
    orderType: 'Dine In',
    tableOrToken: 'Table RM3',
    totalAmount: 1890,
    taxAmount: 90,
    discountAmount: 0,
    paymentMode: 'UPI',
    cashierName: 'gayathri',
    timestamp: 'Today, 14:22',
    itemsCount: 4,
  },
  {
    id: 'tx-2',
    billNo: 'INV-2026-0890',
    orderType: 'Dine In',
    tableOrToken: 'Table RM6',
    totalAmount: 1404,
    taxAmount: 66,
    discountAmount: 100,
    paymentMode: 'Cash',
    cashierName: 'raju',
    timestamp: 'Today, 14:15',
    itemsCount: 3,
  },
  {
    id: 'tx-3',
    billNo: 'INV-2026-0889',
    orderType: 'Delivery',
    tableOrToken: 'RMH-D1',
    totalAmount: 1154,
    taxAmount: 55,
    discountAmount: 0,
    paymentMode: 'UPI',
    cashierName: 'gayathri',
    timestamp: 'Today, 14:02',
    itemsCount: 2,
  },
];

// Initial KOT Tickets
const initialKOTs: KdsTicket[] = [
  {
    id: 'k1',
    kotNo: 'KOT-104',
    orderType: 'Dine In',
    tableOrChannel: 'Table T-1',
    tableNumber: 'T-1',
    createdAt: Date.now() - 4 * 60 * 1000,
    elapsedMinutes: 4,
    items: [
      { name: 'Cold Coffee Ice Cream Float', qty: 2, station: 'Bar' },
      { name: 'Oreo Thick Shake (Most Loved)', qty: 1, note: 'Extra thick', station: 'Bar' },
    ],
    status: 'Pending',
    station: 'Bar',
  },
  {
    id: 'k2',
    kotNo: 'KOT-105',
    orderType: 'Delivery (Zomato)',
    tableOrChannel: 'Order #8242905005',
    createdAt: Date.now() - 14 * 60 * 1000,
    elapsedMinutes: 14,
    isUrgent: true,
    items: [
      { name: 'Alphonso Mango Shake', qty: 1, station: 'Bar' },
      { name: 'Choco Belgian Shake', qty: 1, station: 'Bar' },
    ],
    status: 'InPrep',
    station: 'Bar',
  },
  {
    id: 'k3',
    kotNo: 'KOT-106',
    orderType: 'Pick Up',
    tableOrChannel: 'Customer: Rahul',
    createdAt: Date.now() - 2 * 60 * 1000,
    elapsedMinutes: 2,
    items: [
      { name: 'Kitkat Shake', qty: 1, station: 'Bar' },
      { name: 'Kesar Badam Pista Milkshake', qty: 1, station: 'Bar' },
    ],
    status: 'Pending',
    station: 'Bar',
  },
];

// Pure Web Audio API dual-tone synthesized chime
export const playKitchenKdsChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // First tone (880Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Second tone (1046.5Hz - C6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.25);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 0.7);
  } catch (e) {
    console.debug('Web Audio not allowed before user interaction:', e);
  }
};

interface PosSyncState {
  activeKOTs: KdsTicket[];
  completedKOTs: KdsTicket[];
  sales: OwnerSaleTransaction[];
  inventory: InventoryIngredient[];
  nextKotSequence: number;
  nextBillSequence: number;
  audioChimeEnabled: boolean;

  // Actions
  toggleAudioChime: () => void;
  addKOT: (data: {
    orderType: OrderType | string;
    tableOrChannel: string;
    tableNumber?: string;
    items: OrderItem[];
    station?: 'Kitchen' | 'Tandoor' | 'Bar' | 'Dessert';
  }) => KdsTicket;
  startPrepKOT: (ticketId: string) => void;
  bumpKOT: (ticketId: string) => void;
  recallLastKOT: () => void;
  recordSettledBill: (data: {
    orderType: OrderType | string;
    tableOrToken: string;
    totalAmount: number;
    taxAmount: number;
    discountAmount: number;
    paymentMode: PaymentMode | string;
    cashierName: string;
    items: OrderItem[];
  }) => OwnerSaleTransaction;
  deductInventoryForItems: (items: OrderItem[]) => void;
  updateInventoryStock: (id: string, newAvailable: number) => void;
  addInventoryIngredient: (ingredient: InventoryIngredient) => void;
  fetchInitialData: () => Promise<void>;
  initializeSignalRSync: () => void;
}

export const usePosSyncStore = create<PosSyncState>((set, get) => ({
  activeKOTs: initialKOTs,
  completedKOTs: [],
  sales: initialSales,
  inventory: initialIngredients,
  nextKotSequence: 107,
  nextBillSequence: 892,
  audioChimeEnabled: true,

  toggleAudioChime: () => set((state) => ({ audioChimeEnabled: !state.audioChimeEnabled })),

  fetchInitialData: async () => {
    try {
      const [ordersRes, invRes] = await Promise.allSettled([
        apiClient.get<{ success: boolean; data: any[] }>('/orders?limit=40'),
        apiClient.get<{ success: boolean; data: any[] }>('/inventory')
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.success && Array.isArray(ordersRes.value.data.data)) {
        const rawOrders = ordersRes.value.data.data;
        const pendingTickets: KdsTicket[] = rawOrders
          .filter((o: any) => o.status === 1 || o.status === 2 || o.status === 'KotCreated' || o.status === 'Preparing')
          .map((o: any) => ({
            id: o.id,
            kotNo: o.kotNumber || `KOT-${o.billNumber || '001'}`,
            orderType: o.orderType === 3 ? 'Delivery' : o.orderType === 2 ? 'Take Away' : 'Dine In',
            tableOrChannel: o.tableNumber ? `Table ${o.tableNumber}` : 'Counter Order',
            tableNumber: o.tableNumber,
            createdAt: new Date(o.placedAt || o.createdAt).getTime(),
            elapsedMinutes: Math.max(0, Math.floor((Date.now() - new Date(o.placedAt || o.createdAt).getTime()) / 60000)),
            items: (o.items || []).map((it: any) => ({
              name: it.name,
              qty: it.quantity,
              note: it.specialNotes,
              station: it.name?.toLowerCase().includes('shake') ? 'Bar' : 'Kitchen'
            })),
            status: o.status === 2 || o.status === 'Preparing' ? 'InPrep' : 'Pending',
            station: 'Kitchen'
          }));

        if (pendingTickets.length > 0) {
          set({ activeKOTs: pendingTickets });
        }
      }

      if (invRes.status === 'fulfilled' && invRes.value.data?.success && Array.isArray(invRes.value.data.data)) {
        const rawInv = invRes.value.data.data;
        if (rawInv.length > 0) {
          const mappedInv: InventoryIngredient[] = rawInv.map((item: any, idx: number) => ({
            id: item.id || `inv-${idx}`,
            stockItemName: item.name?.toUpperCase() || 'STOCK ITEM',
            recipeUom: item.unit || 'Kg',
            parStockQuantity: item.minimumStockAlert * 3 || 100,
            parStockUnit: item.unit || 'Kg',
            currentAvailable: item.currentStock || 0,
            landingPrice: item.costPerUnit || 100
          }));
          set({ inventory: mappedInv });
        }
      }
    } catch (e) {
      console.debug('Fallback to initial state:', e);
    }
  },

  initializeSignalRSync: () => {
    signalRService.on('ReceiveOrderUpdate', (order: any) => {
      if (!order) return;
      console.log('--> [posSyncStore] SignalR real-time event received:', order);

      // Status 4 = FoodReady, 5 = Delivered/Settled
      if (order.status === 4 || order.status === 5 || order.status === 'FoodReady' || order.status === 'Delivered') {
        set((state) => ({
          activeKOTs: state.activeKOTs.filter((t) => t.id !== order.id && t.kotNo !== order.kotNumber)
        }));
        return;
      }

      const existing = get().activeKOTs.find((t) => t.id === order.id || t.kotNo === order.kotNumber);
      if (existing) {
        set((state) => ({
          activeKOTs: state.activeKOTs.map((t) =>
            t.id === order.id ? { ...t, status: order.status === 2 ? 'InPrep' : t.status } : t
          )
        }));
      } else {
        const newTicket: KdsTicket = {
          id: order.id || `kot-sig-${Date.now()}`,
          kotNo: order.kotNumber || `KOT-${Date.now().toString().slice(-3)}`,
          orderType: order.orderType === 3 ? 'Delivery' : order.orderType === 2 ? 'Take Away' : 'Dine In',
          tableOrChannel: order.tableNumber ? `Table ${order.tableNumber}` : 'Counter Order',
          tableNumber: order.tableNumber,
          createdAt: new Date(order.placedAt || Date.now()).getTime(),
          elapsedMinutes: 0,
          items: (order.items || []).map((it: any) => ({
            name: it.name,
            qty: it.quantity,
            note: it.specialNotes,
            station: 'Kitchen'
          })),
          status: 'Pending',
          station: 'Kitchen'
        };

        set((state) => ({
          activeKOTs: [newTicket, ...state.activeKOTs]
        }));

        if (get().audioChimeEnabled) {
          playKitchenKdsChime();
        }
      }
    });
  },

  addKOT: ({ orderType, tableOrChannel, tableNumber, items, station }) => {
    const kotNumber = `KOT-${get().nextKotSequence}`;
    const newTicket: KdsTicket = {
      id: `kot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      kotNo: kotNumber,
      orderType: typeof orderType === 'string' ? orderType : 'Dine In',
      tableOrChannel,
      tableNumber,
      createdAt: Date.now(),
      elapsedMinutes: 0,
      items: items.map((i) => {
        let itemStation: 'Kitchen' | 'Tandoor' | 'Bar' | 'Dessert' = 'Kitchen';
        const nameLower = i.name.toLowerCase();
        if (nameLower.includes('shake') || nameLower.includes('coffee') || nameLower.includes('drink') || nameLower.includes('soda') || nameLower.includes('tea')) {
          itemStation = 'Bar';
        } else if (nameLower.includes('tikka') || nameLower.includes('roti') || nameLower.includes('naan') || nameLower.includes('kebab')) {
          itemStation = 'Tandoor';
        } else if (nameLower.includes('ice cream') || nameLower.includes('cake') || nameLower.includes('kulfi') || nameLower.includes('dessert')) {
          itemStation = 'Dessert';
        }

        return {
          name: i.name,
          qty: i.quantity,
          note: i.itemNote,
          station: itemStation,
        };
      }),
      status: 'Pending',
      station: station || 'Kitchen',
    };

    set((state) => ({
      activeKOTs: [newTicket, ...state.activeKOTs],
      nextKotSequence: state.nextKotSequence + 1,
    }));

    if (get().audioChimeEnabled) {
      playKitchenKdsChime();
    }

    // Async persist to MongoDB & broadcast via SignalR
    apiClient.post('/orders', {
      orderType: orderType === 'Delivery' ? 3 : orderType === 'TakeAway' || orderType === 'Take Away' ? 2 : 1,
      tableNumber: tableNumber || '',
      kotNumber,
      items: items.map((i) => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        isVeg: i.isVeg,
        specialNotes: i.itemNote || '',
      })),
      specialInstructions: items.find((i) => i.itemNote)?.itemNote || '',
    }).catch((err) => {
      console.debug('Async KOT backend persist fallback:', err?.message || err);
    });

    return newTicket;
  },

  startPrepKOT: (ticketId: string) => {
    set((state) => ({
      activeKOTs: state.activeKOTs.map((t) =>
        t.id === ticketId ? { ...t, status: 'InPrep' } : t
      ),
    }));

    apiClient.patch(`/orders/${ticketId}/status`, { status: 2 }).catch(() => {});
  },

  bumpKOT: (ticketId: string) => {
    const ticket = get().activeKOTs.find((t) => t.id === ticketId);
    if (!ticket) return;

    const completedTicket: KdsTicket = {
      ...ticket,
      status: 'Ready',
    };

    set((state) => ({
      activeKOTs: state.activeKOTs.filter((t) => t.id !== ticketId),
      completedKOTs: [completedTicket, ...state.completedKOTs.slice(0, 29)],
    }));

    apiClient.patch(`/orders/${ticketId}/status`, { status: 4 }).catch(() => {});
  },

  recallLastKOT: () => {
    const lastCompleted = get().completedKOTs[0];
    if (!lastCompleted) return;

    set((state) => ({
      completedKOTs: state.completedKOTs.slice(1),
      activeKOTs: [{ ...lastCompleted, status: 'InPrep' }, ...state.activeKOTs],
    }));
  },

  recordSettledBill: ({ orderType, tableOrToken, totalAmount, taxAmount, discountAmount, paymentMode, cashierName, items }) => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const billNo = `INV-2026-0${get().nextBillSequence}`;

    let normalizedOrderType: 'Dine In' | 'Take Away' | 'Delivery' = 'Dine In';
    if (orderType === 'Delivery') normalizedOrderType = 'Delivery';
    else if (orderType === 'TakeAway' || orderType === 'PickUp' || orderType === 'Take Away') normalizedOrderType = 'Take Away';

    let normalizedPaymentMode: 'Cash' | 'Card' | 'UPI' | 'Credit' = 'Cash';
    if (paymentMode === 'Card') normalizedPaymentMode = 'Card';
    else if (paymentMode === 'UPI') normalizedPaymentMode = 'UPI';
    else if (paymentMode === 'Credit' || paymentMode === 'Split') normalizedPaymentMode = 'Credit';

    const newSale: OwnerSaleTransaction = {
      id: `tx-${Date.now()}`,
      billNo,
      orderType: normalizedOrderType,
      tableOrToken,
      totalAmount,
      taxAmount,
      discountAmount,
      paymentMode: normalizedPaymentMode,
      cashierName: cashierName || 'biller',
      timestamp: `Today, ${hours}:${minutes}`,
      itemsCount: items.length,
    };

    // 1. Add to sales ledger
    set((state) => ({
      sales: [newSale, ...state.sales],
      nextBillSequence: state.nextBillSequence + 1,
    }));

    // 2. Auto-deduct raw recipe ingredients
    get().deductInventoryForItems(items);

    // 3. Async persist settled invoice to MongoDB
    apiClient.post('/orders', {
      orderType: normalizedOrderType === 'Delivery' ? 3 : normalizedOrderType === 'Take Away' ? 2 : 1,
      tableNumber: tableOrToken.replace('Table ', ''),
      billNumber: billNo,
      subTotal: totalAmount - taxAmount + discountAmount,
      cgstAmount: taxAmount / 2,
      sgstAmount: taxAmount / 2,
      discountAmount,
      totalAmount,
      status: 5, // Delivered / Settled
      payments: [
        {
          mode: normalizedPaymentMode === 'Card' ? 2 : normalizedPaymentMode === 'UPI' ? 3 : 1,
          amount: totalAmount,
        },
      ],
      items: items.map((i) => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        isVeg: i.isVeg,
      })),
    }).catch((err) => {
      console.debug('Async settled bill backend persist fallback:', err?.message || err);
    });

    // 4. Auto-deduct from MongoDB inventory backend
    const deductions = items.map((i) => ({ itemName: i.name, quantity: i.quantity }));
    apiClient.post('/inventory/deduct', deductions).catch(() => {});

    return newSale;
  },

  deductInventoryForItems: (items: OrderItem[]) => {
    set((state) => {
      const updatedInventory = [...state.inventory];

      items.forEach((item) => {
        const nameLower = item.name.toLowerCase();

        // Recipe Depletion Rules
        if (nameLower.includes('thums up')) {
          const ing = updatedInventory.find((i) => i.id === '3');
          if (ing) ing.currentAvailable = Math.max(0, ing.currentAvailable - item.quantity);
        } else if (nameLower.includes('soda')) {
          const ing = updatedInventory.find((i) => i.id === '4');
          if (ing) ing.currentAvailable = Math.max(0, ing.currentAvailable - item.quantity);
        } else if (nameLower.includes('water 1 ltr')) {
          const ing = updatedInventory.find((i) => i.id === '5');
          if (ing) ing.currentAvailable = Math.max(0, ing.currentAvailable - item.quantity);
        } else if (nameLower.includes('water 500 ml')) {
          const ing = updatedInventory.find((i) => i.id === '6');
          if (ing) ing.currentAvailable = Math.max(0, ing.currentAvailable - item.quantity);
        } else if (nameLower.includes('red bull') || nameLower.includes('redbull')) {
          const ing = updatedInventory.find((i) => i.id === '11');
          if (ing) ing.currentAvailable = Math.max(0, ing.currentAvailable - item.quantity);
        } else if (nameLower.includes('paneer')) {
          // Paneer dishes deduct 0.2 kg Paneer per portion
          const ing = updatedInventory.find((i) => i.id === '32');
          if (ing) ing.currentAvailable = Math.max(0, +(ing.currentAvailable - 0.2 * item.quantity).toFixed(2));
        } else if (nameLower.includes('biryani') || nameLower.includes('rice') || nameLower.includes('pulao')) {
          // Rice dishes deduct 0.15 kg Basmati Rice per portion
          const ing = updatedInventory.find((i) => i.id === '33');
          if (ing) ing.currentAvailable = Math.max(0, +(ing.currentAvailable - 0.15 * item.quantity).toFixed(2));
        }
      });

      return { inventory: updatedInventory };
    });
  },

  updateInventoryStock: (id: string, newAvailable: number) => {
    set((state) => ({
      inventory: state.inventory.map((ing) =>
        ing.id === id ? { ...ing, currentAvailable: newAvailable } : ing
      ),
    }));
  },

  addInventoryIngredient: (ingredient: InventoryIngredient) => {
    set((state) => ({
      inventory: [ingredient, ...state.inventory],
    }));
  },
}));
