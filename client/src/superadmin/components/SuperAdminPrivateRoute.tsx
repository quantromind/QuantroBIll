import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSuperAdminAuthStore } from '../store/superAdminAuthStore';

export const SuperAdminPrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, initializeAuth } = useSuperAdminAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/superadmin/login" replace />;
  }

  return <>{children}</>;
};
