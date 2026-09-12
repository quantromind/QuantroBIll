import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore, getHomeRouteForRole } from './store/authStore';
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
import { SuperAdminPrivateRoute } from './superadmin/components/SuperAdminPrivateRoute';
import { SuperAdminDashboard } from './superadmin/pages/SuperAdminDashboard';
import { SuperAdminLogin } from './superadmin/pages/SuperAdminLogin';
import { TenantManagement } from './superadmin/pages/TenantManagement';
import { SubscriptionPlans } from './superadmin/pages/SubscriptionPlans';
import { FeatureToggles } from './superadmin/pages/FeatureToggles';

import { OwnerLayout } from './owner/components/OwnerLayout';
import { OwnerPrivateRoute } from './owner/components/OwnerPrivateRoute';
import { OwnerDashboard } from './owner/pages/OwnerDashboard';
import { OwnerLogin } from './owner/pages/OwnerLogin';
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

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
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
          {/* Dedicated Login Portals                   */}
          {/* ========================================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />

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
          {/* 1. RESTAURANT STAFF POS (Cashier, Waiter) */}
          {/* ========================================= */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/billing" element={<Billing />} />
            <Route path="/online-orders" element={<OnlineOrders />} />
            <Route path="/tables" element={<TableManager />} />
            <Route path="/menu-manager" element={<MenuManager />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/kds" element={<KDS />} />
            <Route path="/receipt-settings" element={<ReceiptSettings />} />
          </Route>

          {/* ========================================= */}
          {/* 2. ISOLATED SAAS SUPERADMIN PORTAL        */}
          {/* ========================================= */}
          <Route
            path="/superadmin"
            element={
              <SuperAdminPrivateRoute>
                <SuperAdminLayout />
              </SuperAdminPrivateRoute>
            }
          >
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="tenants" element={<TenantManagement />} />
            <Route path="subscriptions" element={<SubscriptionPlans />} />
            <Route path="features" element={<FeatureToggles />} />
          </Route>

          {/* =================================================== */}
          {/* 3. ISOLATED RESTAURANT OWNER / ADMIN PORTAL (LEVEL 2) */}
          {/* =================================================== */}
          <Route
            path="/owner"
            element={
              <OwnerPrivateRoute>
                <OwnerLayout />
              </OwnerPrivateRoute>
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
