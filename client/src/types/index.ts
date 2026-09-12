export type UserRole = 'SuperAdmin' | 'Admin' | 'Owner' | 'Manager' | 'Cashier' | 'Waiter' | 'KitchenStaff' | 'DeliveryBoy';
export type BusinessType = 'Cafe' | 'Restaurant' | 'QSR' | 'CloudKitchen' | 'Bar';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
  tenantId: string;
}

export interface TenantSummary {
  id: string;
  businessName: string;
  businessType: BusinessType;
  subscriptionPlan: string;
}

export interface OutletSummary {
  id: string;
  name: string;
  code: string;
  businessType: BusinessType;
  address: string;
  phone: string;
  currency: string;
  cgstPercentage: number;
  sgstPercentage: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserProfile;
  tenant: TenantSummary | null;
  activeOutlet: OutletSummary | null;
  availableOutlets: OutletSummary[];
}

export interface Category {
  id: string;
  tenantId: string;
  outletId: string;
  name: string;
  description: string;
  displayOrder: number;
  iconUrl?: string;
  colorCode?: string;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  outletId: string;
  categoryId: string;
  name: string;
  shortCode: string;
  description: string;
  basePrice: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string;
  variants: MenuItemVariant[];
  addOnGroups: AddOnGroup[];
  taxRatePercentage: number;
}

export interface MenuItemVariant {
  name: string;
  price: number;
  isDefault: boolean;
}

export interface AddOnGroup {
  title: string;
  minSelection: number;
  maxSelection: number;
  options: AddOnOption[];
}

export interface AddOnOption {
  name: string;
  price: number;
}

export type OrderType = 'DineIn' | 'Delivery' | 'PickUp' | 'TakeAway' | 'Parcel';
export type OrderStatus = 'Pending' | 'KotCreated' | 'FoodReady' | 'Dispatched' | 'Delivered' | 'Cancelled';
export type PaymentMode = 'NotPaid' | 'Cash' | 'Card' | 'UPI' | 'Online' | 'Split' | 'Other';
export type AggregatorSource = 'Direct' | 'Zomato' | 'Swiggy' | 'Magicpin';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantName?: string;
  selectedAddOns?: string[];
  itemNote?: string;
  isVeg: boolean;
}

export interface OrderPayment {
  mode: PaymentMode;
  amount: number;
  referenceNumber?: string;
  paidAt: string;
}

export interface Order {
  id: string;
  tenantId: string;
  outletId: string;
  billNumber: string;
  kotNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  tableNumber?: string;
  tokenNumber?: number;
  items: OrderItem[];
  subTotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  deliveryCharges: number;
  roundOff: number;
  totalAmount: number;
  payments: OrderPayment[];
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  aggregatorSource: AggregatorSource;
  externalOrderId?: string;
  otp?: string;
  deliveryInstructions?: string;
  orderNotes?: string;
  billerUserId?: string;
  billerName?: string;
  isHold: boolean;
  placedAt: string;
  acceptedAt?: string;
  foodReadyAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}
