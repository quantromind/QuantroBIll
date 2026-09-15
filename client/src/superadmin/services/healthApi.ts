import { apiClient } from '../../services/api';
import type { SystemHealthData } from '../types';

export const healthApi = {
  getHealth: async () => {
    const res = await apiClient.get<SystemHealthData>('/health/detailed');
    return res.data;
  },
};
