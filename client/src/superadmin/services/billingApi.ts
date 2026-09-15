import { apiClient } from '../../services/api';
import type { PlatformInvoice, BillingStats } from '../types';

export const billingApi = {
  getInvoices: async (params?: { search?: string; status?: string; page?: number; pageSize?: number }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: PlatformInvoice[];
      pagination: { currentPage: number; pageSize: number; totalItems: number; totalPages: number };
    }>('/platform/invoices', { params });
    return res.data;
  },

  getInvoiceById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: PlatformInvoice; tenant?: any }>(`/platform/invoices/${id}`);
    return res.data;
  },

  createInvoice: async (data: Partial<PlatformInvoice>) => {
    const res = await apiClient.post<{ success: boolean; data: PlatformInvoice; message: string }>('/platform/invoices', data);
    return res.data;
  },

  updateInvoiceStatus: async (id: string, data: { status: string; paymentMethod?: string; transactionRef?: string }) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>(`/platform/invoices/${id}/status`, data);
    return res.data;
  },

  getBillingStats: async () => {
    const res = await apiClient.get<{ success: boolean; data: BillingStats }>('/platform/invoices/stats');
    return res.data;
  },
};
