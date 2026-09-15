import { apiClient } from '../../services/api';
import type { PlanTier } from '../types';

export const plansApi = {
  getAllPlans: async (activeOnly = false) => {
    const res = await apiClient.get<{ success: boolean; data: PlanTier[]; total: number }>('/plans', {
      params: { activeOnly },
    });
    return res.data;
  },

  getPlanById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: PlanTier }>(`/plans/${id}`);
    return res.data;
  },

  createPlan: async (data: Partial<PlanTier>) => {
    const res = await apiClient.post<{ success: boolean; data: PlanTier; message: string }>('/plans', data);
    return res.data;
  },

  updatePlan: async (id: string, data: Partial<PlanTier>) => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/plans/${id}`, data);
    return res.data;
  },

  archivePlan: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/plans/${id}`);
    return res.data;
  },
};
