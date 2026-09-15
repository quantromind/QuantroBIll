import { apiClient } from '../../services/api';
import type { PlatformSettingsData } from '../types';

export const settingsApi = {
  getSettings: async () => {
    const res = await apiClient.get<{ success: boolean; data: PlatformSettingsData }>('/platform/settings');
    return res.data;
  },

  updateSettings: async (data: PlatformSettingsData) => {
    const res = await apiClient.put<{ success: boolean; message: string }>('/platform/settings', data);
    return res.data;
  },
};
