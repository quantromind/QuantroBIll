/**
 * QuantroBill — Authoritative Role Definitions (frontend single source of truth)
 * Must stay in sync with PetBharke.Domain.Enums.UserRole (backend).
 */

export const UserRole = {
  SuperAdmin: 'SuperAdmin',
  Owner: 'Owner',
  Cashier: 'Cashier',
  KitchenStaff: 'KitchenStaff',
  DeliveryBoy: 'DeliveryBoy',
  Waiter: 'Waiter',
  Captain: 'Captain',
  Manager: 'Manager',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ── Role groups ──────────────────────────────────────────────

/** Roles that can access the Owner portal (management dashboard, employees, settings) */
export const MANAGEMENT_ROLES: readonly UserRole[] = [
  UserRole.SuperAdmin,
  UserRole.Owner,
  UserRole.Manager,
] as const;

/** Roles that can access the SuperAdmin portal */
export const SUPERADMIN_ROLES: readonly UserRole[] = [
  UserRole.SuperAdmin,
] as const;

/** Roles that can access POS screens (billing, tables, KDS, online-orders, menu-manager, operations) */
export const POS_ROLES: readonly UserRole[] = [
  UserRole.Owner,
  UserRole.Manager,
  UserRole.Cashier,
  UserRole.Waiter,
  UserRole.KitchenStaff,
  UserRole.DeliveryBoy,
  UserRole.Captain,
] as const;

/** Roles that can access Finance & Reports screens */
export const FINANCE_ROLES: readonly UserRole[] = [
  UserRole.SuperAdmin,
  UserRole.Owner,
  UserRole.Manager,
] as const;

/** All roles that belong to a restaurant (non-SuperAdmin) */
export const ALL_RESTAURANT_ROLES: readonly UserRole[] = [
  UserRole.Owner,
  UserRole.Manager,
  UserRole.Cashier,
  UserRole.Waiter,
  UserRole.KitchenStaff,
  UserRole.DeliveryBoy,
  UserRole.Captain,
] as const;

// ── Permission helpers ───────────────────────────────────────

export const canSettleBills = (role?: UserRole | string): boolean => {
  if (!role) return true; // Default cashier fallback
  return (
    role === UserRole.Owner ||
    role === UserRole.SuperAdmin ||
    role === UserRole.Manager ||
    role === UserRole.Cashier
  );
};

export const canApplyDiscounts = (role?: UserRole | string): boolean => {
  return (
    role === UserRole.Owner ||
    role === UserRole.SuperAdmin ||
    role === UserRole.Manager
  );
};

export const canVoidBills = (role?: UserRole | string): boolean => {
  return (
    role === UserRole.Owner ||
    role === UserRole.SuperAdmin ||
    role === UserRole.Manager
  );
};

export const isWaiterOnly = (role?: UserRole | string): boolean => {
  return role === UserRole.Waiter;
};

export const isManagement = (role?: UserRole | string): boolean => {
  return (
    role === UserRole.Owner ||
    role === UserRole.Manager ||
    role === UserRole.SuperAdmin
  );
};

export const isSuperAdmin = (role?: UserRole | string): boolean => {
  return role === UserRole.SuperAdmin;
};

// ── Route resolution ─────────────────────────────────────────

export const getHomeRouteForRole = (role?: UserRole | string): string => {
  if (!role) return '/billing';
  switch (role) {
    case UserRole.SuperAdmin:
      return '/superadmin/dashboard';
    case UserRole.Owner:
    case UserRole.Manager:
      return '/owner/dashboard';
    case UserRole.Waiter:
      return '/tables';
    case UserRole.KitchenStaff:
      return '/kds';
    case UserRole.DeliveryBoy:
      return '/online-orders';
    case UserRole.Cashier:
    case UserRole.Captain:
    default:
      return '/billing';
  }
};
