import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { getHomeRouteForRole, SUPERADMIN_ROLES, POS_ROLES, FINANCE_ROLES, MANAGEMENT_ROLES, UserRole } from './types/roles';
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Billing } from './pages/Billing';
import { OnlineOrders } from './pages/OnlineOrders';
import { Operations } from './pages/Operations';
import { KDS } from './pages/KDS';
import { TableManager } from './pages/TableManager';
import { MenuManager } from './pages/MenuManager';
import { Finance } from './pages/Finance';
import { Reports } from './pages/Reports';
import { ReceiptSettings } from './pages/ReceiptSettings';

import { SuperAdminLayout } from './superadmin/components/SuperAdminLayout';
import { SuperAdminDashboard } from './superadmin/pages/SuperAdminDashboard';
import { TenantManagement } from './superadmin/pages/TenantManagement';
import { TenantCreatePage } from './superadmin/pages/TenantCreatePage';
import { TenantDetailPage } from './superadmin/pages/TenantDetailPage';
import { SubscriptionPlans } from './superadmin/pages/SubscriptionPlans';
import { FeatureToggles } from './superadmin/pages/FeatureToggles';
import { PlansCatalog } from './superadmin/pages/PlansCatalog';
import { PlanEditorPage } from './superadmin/pages/PlanEditorPage';
import { PlatformBilling } from './superadmin/pages/PlatformBilling';
import { InvoiceDetailPage } from './superadmin/pages/InvoiceDetailPage';
import { AuditLogs } from './superadmin/pages/AuditLogs';
import { TeamManagement } from './superadmin/pages/TeamManagement';
import { TeamMemberEditorPage } from './superadmin/pages/TeamMemberEditorPage';
import { Announcements } from './superadmin/pages/Announcements';
import { AnnouncementEditorPage } from './superadmin/pages/AnnouncementEditorPage';
import { CouponsPage } from './superadmin/pages/CouponsPage';
import { AnalyticsPage } from './superadmin/pages/AnalyticsPage';
import { SystemHealthPage } from './superadmin/pages/SystemHealthPage';
import { SettingsPage } from './superadmin/pages/SettingsPage';

import { OwnerLayout } from './owner/components/OwnerLayout';
import { OwnerDashboard } from './owner/pages/OwnerDashboard';
import { OwnerMenu } from './owner/pages/OwnerMenu';
import { OwnerSales } from './owner/pages/OwnerSales';
import { OwnerReports } from './owner/pages/OwnerReports';
import { OwnerExpenses } from './owner/pages/OwnerExpenses';
import { EmployeeManager } from './owner/pages/EmployeeManager';
import { OwnerInventory } from './owner/pages/OwnerInventory';
import { OwnerReceipt } from './owner/pages/OwnerReceipt';
import { OwnerCustomers } from './owner/pages/OwnerCustomers';
import { OwnerCredit } from './owner/pages/OwnerCredit';
import { OwnerTables } from './owner/pages/OwnerTables';
import { OwnerSettings } from './owner/pages/OwnerSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
    },
  },
});

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const target = getHomeRouteForRole(user?.role);
  return <Navigate to={target} replace />;
};

export const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ========================================= */}
          {/* Universal Root Landing Redirection        */}
          {/* ========================================= */}
          <Route path="/" element={<RootRedirect />} />

          {/* ========================================= */}
          {/* Single Login Portal (all roles)           */}
          {/* ========================================= */}
          <Route path="/login" element={<Login />} />
          {/* Legacy login routes redirect to unified login */}
          <Route path="/owner/login" element={<Navigate to="/login" replace />} />
          <Route path="/superadmin/login" element={<Navigate to="/login" replace />} />

          {/* ========================================= */}
          {/* Quick Route Aliases                       */}
          {/* ========================================= */}
          <Route path="/pos" element={<Navigate to="/billing" replace />} />
          <Route path="/orders" element={<Navigate to="/online-orders" replace />} />
          <Route path="/table" element={<Navigate to="/tables" replace />} />
          <Route path="/kitchen" element={<Navigate to="/kds" replace />} />
          <Route path="/kot" element={<Navigate to="/kds" replace />} />
          <Route path="/menu" element={<Navigate to="/menu-manager" replace />} />
          <Route path="/admin" element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="/super-admin" element={<Navigate to="/superadmin/dashboard" replace />} />

          {/* ========================================= */}
          {/* 1. RESTAURANT POS (Staff + Owner)         */}
          {/*    Role-gated: POS_ROLES only             */}
          {/* ========================================= */}
          <Route
            element={
              <RoleProtectedRoute allowedRoles={[...POS_ROLES]}>
                <AppLayout />
              </RoleProtectedRoute>
            }
          >
            <Route
              path="/billing"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Owner, UserRole.Manager, UserRole.Cashier, UserRole.Captain]}>
                  <Billing />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/online-orders"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Owner, UserRole.Manager, UserRole.Cashier, UserRole.DeliveryBoy]}>
                  <OnlineOrders />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/tables"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Owner, UserRole.Manager, UserRole.Cashier, UserRole.Waiter, UserRole.Captain]}>
                  <TableManager />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/menu-manager"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Owner, UserRole.Manager, UserRole.Cashier]}>
                  <MenuManager />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/operations"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Owner, UserRole.Manager, UserRole.Cashier, UserRole.Captain]}>
                  <Operations />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/kds"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Owner, UserRole.Manager, UserRole.KitchenStaff, UserRole.Cashier]}>
                  <KDS />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/receipt-settings"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Owner, UserRole.Manager, UserRole.Cashier]}>
                  <ReceiptSettings />
                </RoleProtectedRoute>
              }
            />
          </Route>

          {/* ========================================= */}
          {/* Finance & Reports (Management only)       */}
          {/* ========================================= */}
          <Route
            element={
              <RoleProtectedRoute allowedRoles={[...FINANCE_ROLES]}>
                <AppLayout />
              </RoleProtectedRoute>
            }
          >
            <Route path="/finance" element={<Finance />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* ========================================= */}
          {/* 2. SUPERADMIN PORTAL (SuperAdmin only)    */}
          {/* ========================================= */}
          <Route
            path="/superadmin"
            element={
              <RoleProtectedRoute allowedRoles={[...SUPERADMIN_ROLES]}>
                <SuperAdminLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />

            {/* Restaurant Tenants */}
            <Route path="tenants" element={<TenantManagement />} />
            <Route path="tenants/new" element={<TenantCreatePage />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />

            {/* Plans Catalog & Tier Configuration */}
            <Route path="plans-catalog" element={<PlansCatalog />} />
            <Route path="plans-catalog/new" element={<PlanEditorPage />} />
            <Route path="plans-catalog/:id" element={<PlanEditorPage />} />

            {/* Tenant Plans Assignment */}
            <Route path="subscriptions" element={<SubscriptionPlans />} />

            {/* Feature Flags & Capabilities */}
            <Route path="features" element={<FeatureToggles />} />

            {/* Invoices & Platform Billing */}
            <Route path="billing" element={<PlatformBilling />} />
            <Route path="billing/:id" element={<InvoiceDetailPage />} />

            {/* Security Audit Trail */}
            <Route path="audit-logs" element={<AuditLogs />} />

            {/* SuperAdmin Team Management */}
            <Route path="team" element={<TeamManagement />} />
            <Route path="team/new" element={<TeamMemberEditorPage />} />
            <Route path="team/:id" element={<TeamMemberEditorPage />} />

            {/* Announcements & Broadcasts */}
            <Route path="announcements" element={<Announcements />} />
            <Route path="announcements/new" element={<AnnouncementEditorPage />} />
            <Route path="announcements/:id" element={<AnnouncementEditorPage />} />

            {/* Coupons & Promo Codes */}
            <Route path="coupons" element={<CouponsPage />} />

            {/* Platform Analytics */}
            <Route path="analytics" element={<AnalyticsPage />} />

            {/* Diagnostic System Health */}
            <Route path="system-health" element={<SystemHealthPage />} />

            {/* Platform Settings */}
            <Route path="settings" element={<SettingsPage />} />

            {/* Convenient Aliases */}
            <Route path="audit" element={<Navigate to="/superadmin/audit-logs" replace />} />
            <Route path="health" element={<Navigate to="/superadmin/system-health" replace />} />
            <Route path="plans" element={<Navigate to="/superadmin/plans-catalog" replace />} />
          </Route>

          {/* =================================================== */}
          {/* 3. RESTAURANT OWNER / ADMIN PORTAL (Management)     */}
          {/* =================================================== */}
          <Route
            path="/owner"
            element={
              <RoleProtectedRoute allowedRoles={[...MANAGEMENT_ROLES]}>
                <OwnerLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="analytics" element={<OwnerDashboard />} />
            <Route path="tables" element={<OwnerTables />} />
            <Route path="menu" element={<OwnerMenu />} />
            <Route path="sales" element={<OwnerSales />} />
            <Route path="reports" element={<OwnerReports />} />
            <Route path="expenses" element={<OwnerExpenses />} />
            <Route path="employees" element={<EmployeeManager />} />
            <Route path="inventory" element={<OwnerInventory />} />
            <Route path="receipt" element={<OwnerReceipt />} />
            <Route path="customers" element={<OwnerCustomers />} />
            <Route path="credit" element={<OwnerCredit />} />
            <Route path="settings" element={<OwnerSettings />} />
          </Route>

          {/* ========================================= */}
          {/* Dynamic Catch-All Fallback                */}
          {/* ========================================= */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
