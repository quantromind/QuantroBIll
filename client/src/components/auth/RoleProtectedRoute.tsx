import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole, getHomeRouteForRole } from '../../types/roles';

interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Universal role-based route guard. Replaces PrivateRoute, SuperAdminPrivateRoute,
 * and OwnerPrivateRoute with a single component.
 *
 * 1. Not authenticated → redirect to /login
 * 2. Authenticated but role not in allowedRoles → redirect to getHomeRouteForRole()
 * 3. Otherwise → render children
 */
export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
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

  const userRole = user?.role as UserRole | undefined;
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect to the appropriate home for the user's actual role
    const fallback = getHomeRouteForRole(userRole);
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
