export interface TenantOutlet {
  id: string;
  name: string;
  code: string;
  city: string;
  isActive: boolean;
  tableCount?: number;
  address?: string;
  phone?: string;
  gstin?: string;
}

export type SubscriptionTier = 'Starter' | 'Professional' | 'Enterprise' | 'Basic' | 'Standard' | 'Premium';
export type RestaurantType = 'Cafe' | 'FineDine' | 'QSR' | 'CloudKitchen' | 'Bakery' | 'BarAndRestro' | 'Restaurant' | 'Bar';
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

// 1. Plan Catalog
export interface PlanTier {
  id: string;
  name: string;
  code: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxOutlets: number;
  maxStaffUsers: number;
  trialDays: number;
  features: {
    enableKds: boolean;
    enableWaiterApp: boolean;
    enableAggregators: boolean;
    enableRecipeInventory: boolean;
    enableKhataBook: boolean;
    [key: string]: boolean;
  };
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

// 2. Billing & Invoices
export interface PlatformInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  billingCycle: 'Monthly' | 'Yearly';
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'Paid' | 'Due' | 'Overdue' | 'Failed' | 'Cancelled';
  dueDate: string;
  paidAt?: string;
  paymentMethod: string;
  transactionRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BillingStats {
  totalRevenue: number;
  mrr: number;
  arr: number;
  overdueCount: number;
  dueCount: number;
  activeSubscriptions: number;
  totalInvoices: number;
}

// 3. Audit Logs
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  outletId?: string;
  userId: string;
  userName: string;
  actorEmail?: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details: string;
  changesJson?: string;
  ipAddress?: string;
  status: string;
  timestamp: string;
}

export interface AuditStats {
  totalEvents: number;
  eventsToday: number;
  securityActions: number;
  configChanges: number;
}

// 4. Platform Team
export interface PlatformTeamMember {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

// 5. Announcements
export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: 'Info' | 'Maintenance' | 'Feature' | 'Warning';
  targetAudience: 'All' | 'Starter' | 'Professional' | 'Enterprise' | 'Custom';
  targetTenantIds?: string[];
  isActive: boolean;
  publishedAt: string;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
}

// 6. Platform Coupons
export interface CouponItem {
  id: string;
  code: string;
  description: string;
  discountType: 1 | 2; // 1: Percentage, 2: FixedAmount
  value: number;
  minPlanDurationMonths: number;
  maxRedemptions: number;
  timesRedeemed: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicablePlans: string[];
  createdAt: string;
}

// 7. Platform Analytics
export interface PlatformAnalyticsData {
  summary: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    trialTenants: number;
    totalCollectedRevenue: number;
    mrr: number;
    arr: number;
    churnRate: string;
  };
  planDistribution: Array<{
    plan: string;
    count: number;
    price: number;
    share: number;
  }>;
  cityDistribution: Array<{
    city: string;
    count: number;
  }>;
  businessTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    tenants: number;
    revenue: number;
  }>;
}

// 8. System Health
export interface SystemHealthData {
  status: 'Healthy' | 'Degraded' | 'Unhealthy';
  database: {
    status: string;
    pingMs: number;
    tenantsCount: number;
    outletsCount: number;
    ordersCount: number;
    usersCount: number;
    invoicesCount: number;
  };
  server: {
    memoryUsageMb: number;
    uptime: string;
    serverTimeUtc: string;
    environment: string;
    runtime: string;
  };
  services: Array<{
    name: string;
    status: string;
    latencyMs: number;
  }>;
}

// 9. Platform Settings
export interface PlatformSettingsData {
  id?: string;
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  defaultTaxRate: number;
  defaultTrialDays: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFromEmail: string;
  razorpayKeyId: string;
  maintenanceMode: boolean;
  updatedAt?: string;
}

// 10. Tenant Full Details
export interface TenantFullDetails {
  tenant: {
    id: string;
    businessName: string;
    legalName: string;
    ownerEmail: string;
    ownerPhone: string;
    city: string;
    state: string;
    gstin: string;
    subscriptionPlan: number | string;
    businessType: number | string;
    subscriptionExpiresAt: string;
    maxOutlets: number;
    isActive: boolean;
    features: Record<string, boolean>;
    createdAt: string;
    updatedAt?: string;
  };
  outlets: TenantOutlet[];
  users: Array<{
    id: string;
    username: string;
    email: string;
    fullName: string;
    phone: string;
    role: string;
    outletId: string;
    permissions: string[];
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
  }>;
  invoices: PlatformInvoice[];
  auditLogs: AuditLogEntry[];
}
