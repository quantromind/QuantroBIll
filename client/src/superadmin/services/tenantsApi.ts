import { apiClient } from '../../services/api';
import type { TenantFullDetails } from '../types';

export const tenantsApi = {
  getAllTenants: async () => {
    const res = await apiClient.get<{ success: boolean; data: any[] }>('/tenants');
    return res.data;
  },

  getTenantById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/tenants/${id}`);
    return res.data;
  },

  getTenantFullDetails: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: TenantFullDetails }>(`/tenants/${id}/full-details`);
    return res.data;
  },

  createTenant: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: any; message: string }>('/tenants', data);
    return res.data;
  },

  updateTenant: async (id: string, data: any) => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/tenants/${id}`, data);
    return res.data;
  },

  toggleTenantStatus: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>(`/tenants/${id}/status`, { isActive });
    return res.data;
  },

  updateTenantPlan: async (id: string, data: { subscriptionPlan: number; maxOutlets: number; extendMonths?: number }) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>(`/tenants/${id}/plan`, data);
    return res.data;
  },

  updateTenantFeatures: async (id: string, features: Record<string, boolean>) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>(`/tenants/${id}/features`, features);
    return res.data;
  },

  addOutlet: async (id: string, data: { name: string; city?: string; address?: string; phone?: string; gstin?: string }) => {
    const res = await apiClient.post<{ success: boolean; data: any; message?: string }>(`/tenants/${id}/outlets`, data);
    return res.data;
  },

  deleteTenant: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/tenants/${id}`);
    return res.data;
  },

  impersonateTenant: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; data: { token: string; user: any; targetUrl: string }; message: string }>(
      `/tenants/${id}/impersonate`
    );
    return res.data;
  },
};
