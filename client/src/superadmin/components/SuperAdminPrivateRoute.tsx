import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSuperAdminAuthStore } from '../store/superAdminAuthStore';
import { useAuthStore } from '../../store/authStore';

export const SuperAdminPrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated: isSuperAdminAuth, initializeAuth: initSuperAdminAuth } = useSuperAdminAuthStore();
  const { isAuthenticated: isGlobalAuth, user: globalUser } = useAuthStore();

  useEffect(() => {
    initSuperAdminAuth();
  }, [initSuperAdminAuth]);

  const isAuthenticated = isGlobalAuth || isSuperAdminAuth;
  const isSuperAdmin = globalUser?.role === 'SuperAdmin' || isSuperAdminAuth;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    if (globalUser?.role === 'Owner' || globalUser?.role === 'Admin' || globalUser?.role === 'Manager') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    return <Navigate to="/billing" replace />;
  }

  return <>{children}</>;
};
