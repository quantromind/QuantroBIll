import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useOwnerAuthStore } from '../store/ownerAuthStore';
import { useAuthStore } from '../../store/authStore';

export const OwnerPrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated: isOwnerAuth, initializeAuth: initOwnerAuth, user: ownerUser } = useOwnerAuthStore();
  const { isAuthenticated: isGlobalAuth, user: globalUser } = useAuthStore();

  useEffect(() => {
    initOwnerAuth();
  }, [initOwnerAuth]);

  const isAuthenticated = isGlobalAuth || isOwnerAuth;
  const user = globalUser || ownerUser;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Enforce role permission: Owner, Admin, GeneralManager, or SuperAdmin
  const role = user?.role;
  const isAuthorized =
    role === 'Owner' ||
    role === 'Admin' ||
    role === 'Manager' ||
    role === 'GeneralManager' ||
    role === 'SuperAdmin';

  if (!isAuthorized) {
    // Non-management staff (e.g. Waiter or Cashier) attempting to access owner portal
    return <Navigate to="/billing" replace />;
  }

  return <>{children}</>;
};
