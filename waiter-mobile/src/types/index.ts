export interface WaiterUser {
  id: string;
  name: string;
  pin: string;
  role: 'Waiter' | 'Captain';
  outletId: string;
  tenantId: string;
}

export interface MobileTable {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  isOccupied: boolean;
  activeOrderId?: string;
  orderTotal?: number;
  runningMinutes?: number;
  status: 'Vacant' | 'Occupied' | 'FoodReady' | 'BillDue';
}

export interface MobileOrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  notes?: string;
}

export interface MobileCategory {
  id: string;
  name: string;
  icon: string;
}
