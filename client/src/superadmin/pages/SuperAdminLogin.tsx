import React from 'react';
import { Navigate } from 'react-router-dom';

export const SuperAdminLogin: React.FC = () => {
  return <Navigate to="/login" replace />;
};
