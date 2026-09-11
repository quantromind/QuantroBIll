import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { usePosSyncStore } from './store/posSyncStore';
import { useTableStore } from './store/tableStore';
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

import { SuperAdminLogin } from './superadmin/pages/SuperAdminLogin';
import { SuperAdminLayout } from './superadmin/components/SuperAdminLayout';
import { SuperAdminPrivateRoute } from './superadmin/components/SuperAdminPrivateRoute';
import { SuperAdminDashboard } from './superadmin/pages/SuperAdminDashboard';
import { TenantManagement } from './superadmin/pages/TenantManagement';
import { SubscriptionPlans } from './superadmin/pages/SubscriptionPlans';
import { FeatureToggles } from './superadmin/pages/FeatureToggles';

import { OwnerLogin } from './owner/pages/OwnerLogin';
import { OwnerLayout } from './owner/components/OwnerLayout';
import { OwnerPrivateRoute } from './owner/components/OwnerPrivateRoute';
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
import { OwnerSettings } from './owner/pages/OwnerSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const fetchInitialData = usePosSyncStore((state) => state.fetchInitialData);
  const initializeSignalRSync = usePosSyncStore((state) => state.initializeSignalRSync);
  const initializeTableSync = useTableStore((state) => state.initializeSignalRSync);
  const fetchTablesFromApi = useTableStore((state) => state.fetchTablesFromApi);

  useEffect(() => {
    initializeAuth();
    fetchInitialData();
    initializeSignalRSync();
    initializeTableSync();
    fetchTablesFromApi();
  }, [initializeAuth, fetchInitialData, initializeSignalRSync, initializeTableSync, fetchTablesFromApi]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ========================================= */}
          {/* 1. RESTAURANT STAFF POS (Cashier, Waiter) */}
          {/* ========================================= */}
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Navigate to="/billing" replace />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/online-orders" element={<OnlineOrders />} />
            <Route path="/tables" element={<TableManager />} />
            <Route path="/menu-manager" element={<MenuManager />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/kds" element={<KDS />} />
            <Route path="/receipt-settings" element={<ReceiptSettings />} />
            {/* Backward compatibility redirect for old /super-admin link */}
            <Route path="/super-admin" element={<Navigate to="/superadmin/dashboard" replace />} />
          </Route>

          {/* ========================================= */}
          {/* 2. ISOLATED SAAS SUPERADMIN PORTAL        */}
          {/* ========================================= */}
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />

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
          <Route path="/owner/login" element={<OwnerLogin />} />

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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/billing" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
