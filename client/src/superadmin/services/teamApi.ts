import { apiClient } from '../../services/api';
import type { PlatformTeamMember } from '../types';

export const teamApi = {
  getTeamMembers: async () => {
    const res = await apiClient.get<{ success: boolean; data: PlatformTeamMember[] }>('/superadmin/team');
    return res.data;
  },

  getTeamMemberById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: PlatformTeamMember }>(`/superadmin/team/${id}`);
    return res.data;
  },

  createTeamMember: async (data: { email: string; username?: string; fullName?: string; phone?: string; password: string; permissions?: string[] }) => {
    const res = await apiClient.post<{ success: boolean; data: PlatformTeamMember; message: string }>('/superadmin/team', data);
    return res.data;
  },

  updateTeamMember: async (id: string, data: Partial<PlatformTeamMember> & { password?: string }) => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/superadmin/team/${id}`, data);
    return res.data;
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>(`/superadmin/team/${id}/status`, { isActive });
    return res.data;
  },

  deleteTeamMember: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/superadmin/team/${id}`);
    return res.data;
  },
};
