export interface TenantOutlet {
  id: string;
  name: string;
  code: string;
  city: string;
  isActive: boolean;
  tableCount: number;
}

export type SubscriptionTier = 'Starter' | 'Professional' | 'Enterprise';
export type RestaurantType = 'Cafe' | 'FineDine' | 'QSR' | 'CloudKitchen' | 'Bakery' | 'BarAndRestro';
export type TenantStatus = 'Active' | 'Trial' | 'Suspended' | 'Expired';

export interface Tenant {
  id: string;
  businessName: string;
  legalName: string;
  restaurantType: RestaurantType;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  gstin?: string;
  city: string;
  state: string;
  plan: SubscriptionTier;
  status: TenantStatus;
  outlets: TenantOutlet[];
  maxOutlets: number;
  joinedAt: string;
  subscriptionExpiresAt: string;
  features: {
    enableKds: boolean;
    enableWaiterApp: boolean;
    enableAggregators: boolean;
    enableRecipeInventory: boolean;
    enableKhataBook: boolean;
  };
}

export interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SuperAdmin';
  avatarUrl?: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
