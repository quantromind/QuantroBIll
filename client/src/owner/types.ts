export interface OwnerEmployee {
  id: string;
  name: string;
  menuCode: string;
  contact: string;
  password?: string;
  role: 'Manager' | 'Cashier' | 'Captain' | 'Waiter' | 'Chef' | 'Rider';
  isActiveNow: boolean;
  lastActive: string;
  allowedSections: {
    fineDine: boolean;
    fineDineTables: number;
    takeAway: boolean;
    takeAwayCounters: number;
    homeDelivery: boolean;
    homeDeliveryZones: number;
  };
  permissions: {
    orders: boolean;
    fineDine: boolean;
    qsr: boolean;
    foodCourt: boolean;
    restroBar: boolean;
    recents: boolean;
    bakery: boolean;
    salesHistory: boolean;
    reports: boolean;
    expenses: boolean;
    inventory: boolean;
    kitchen: boolean;
    menu: boolean;
    settings: boolean;
    help: boolean;
  };
}

export interface LiveTableChip {
  id: string;
  tableNumber: string;
  section: 'Dine Fine' | 'Custom Tables' | 'Take Away' | 'Home Delivery';
  orderTotal: number;
  isOccupied: boolean;
  activeOrderNumber?: string;
  runningDuration?: string;
}

export interface LiveRunningOrdersSummary {
  dineInCount: number;
  dineInTotal: number;
  parcelCount: number;
  parcelTotal: number;
  deliveryCount: number;
  deliveryTotal: number;
  overallCount: number;
  overallTotal: number;
}

export interface InventoryIngredient {
  id: string;
  stockItemName: string;
  recipeUom: string; // e.g. 'Piece', 'Kg', 'Ltr', 'Gram'
  parStockQuantity: number;
  parStockUnit: string;
  currentAvailable: number;
  landingPrice: number;
}

export interface CreditCustomer {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  totalSpent: number;
  outstandingCreditDue: number;
  lastOrderDate: string;
  status: 'Clear' | 'DuePending';
}

export interface OwnerMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isVeg: boolean;
  gstPercent: number;
  isAvailable: boolean; // 86 Out of stock toggle
  shortCode?: string;
}

export interface OwnerSaleTransaction {
  id: string;
  billNo: string;
  orderType: 'Dine In' | 'Take Away' | 'Parcel' | 'Delivery';
  tableOrToken: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit';
  cashierName: string;
  timestamp: string;
  itemsCount: number;
}

export interface OwnerExpense {
  id: string;
  voucherNo: string;
  title: string;
  category: 'Raw Materials' | 'Kitchen Gas / Fuel' | 'Maintenance' | 'Staff Advance' | 'Utilities' | 'Misc';
  amount: number;
  paidTo: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  date: string;
  notes?: string;
}

export interface OwnerReceiptConfig {
  restaurantName: string;
  tagline: string;
  address: string;
  phone: string;
  gstin: string;
  fssai: string;
  headerGreeting: string;
  footerMessage: string;
  showGstin: boolean;
  showFssai: boolean;
  showWifiPassword: boolean;
  wifiDetails: string;
  paperWidthMm: 80 | 58;
}
