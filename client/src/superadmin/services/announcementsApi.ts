import { apiClient } from '../../services/api';
import type { AnnouncementItem } from '../types';

export const announcementsApi = {
  getAllAnnouncements: async () => {
    const res = await apiClient.get<{ success: boolean; data: AnnouncementItem[]; total: number }>('/announcements');
    return res.data;
  },

  getAnnouncementById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: AnnouncementItem }>(`/announcements/${id}`);
    return res.data;
  },

  createAnnouncement: async (data: Partial<AnnouncementItem>) => {
    const res = await apiClient.post<{ success: boolean; data: AnnouncementItem; message: string }>('/announcements', data);
    return res.data;
  },

  updateAnnouncement: async (id: string, data: Partial<AnnouncementItem>) => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/announcements/${id}`, data);
    return res.data;
  },

  deleteAnnouncement: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/announcements/${id}`);
    return res.data;
  },
};
