import { apiClient } from '../../services/api';
import type { AuditLogEntry, AuditStats } from '../types';

export const auditLogApi = {
  getAuditLogs: async (params?: {
    search?: string;
    action?: string;
    targetType?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: AuditLogEntry[];
      pagination: { currentPage: number; pageSize: number; totalItems: number; totalPages: number };
    }>('/auditlogs', { params });
    return res.data;
  },

  getAuditStats: async () => {
    const res = await apiClient.get<{ success: boolean; data: AuditStats }>('/auditlogs/stats');
    return res.data;
  },
};
