import { apiClient } from '../../services/api';
import type { CouponItem } from '../types';

export const couponsApi = {
  getAllCoupons: async () => {
    const res = await apiClient.get<{ success: boolean; data: CouponItem[]; total: number }>('/platform/coupons');
    return res.data;
  },

  getCouponById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: CouponItem }>(`/platform/coupons/${id}`);
    return res.data;
  },

  createCoupon: async (data: Partial<CouponItem>) => {
    const res = await apiClient.post<{ success: boolean; data: CouponItem; message: string }>('/platform/coupons', data);
    return res.data;
  },

  updateCoupon: async (id: string, data: Partial<CouponItem>) => {
    const res = await apiClient.put<{ success: boolean; message: string }>(`/platform/coupons/${id}`, data);
    return res.data;
  },

  toggleCouponStatus: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>(`/platform/coupons/${id}/status`, { isActive });
    return res.data;
  },

  deleteCoupon: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/platform/coupons/${id}`);
    return res.data;
  },
};
