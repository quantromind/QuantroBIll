import { apiClient } from '../../services/api';
import type { PlatformAnalyticsData } from '../types';

export const analyticsApi = {
  getOverview: async () => {
    const res = await apiClient.get<{ success: boolean; data: PlatformAnalyticsData }>('/superadmin/analytics/overview');
    return res.data;
  },
};
