import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useOwnerAuthStore } from '../store/ownerAuthStore';

export const OwnerPrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, initializeAuth } = useOwnerAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/owner/login" replace />;
  }

  return <>{children}</>;
};
