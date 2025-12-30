import api from '@/lib/axios';
import { Debt } from '@/types/api.types';

export const debtsService = {
  create: async (data: any): Promise<Debt> => {
    const response = await api.post('/debts', data);
    return response.data;
  },

  getAll: async (params?: {
    status?: string;
    search?: string;
    type?: 'personal' | 'third-party' | 'all';
    archived?: boolean;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
  }): Promise<Debt[]> => {
    const queryParams: any = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.search) queryParams.search = params.search;
    if (params?.type && params.type !== 'all') queryParams.type = params.type;
    if (params?.archived !== undefined) queryParams.archived = params.archived;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.month) queryParams.month = params.month;
    if (params?.year) queryParams.year = params.year;
    const response = await api.get('/debts', { params: queryParams });
    return response.data;
  },

  getOne: async (id: string): Promise<Debt> => {
    const response = await api.get(`/debts/${id}`);
    return response.data;
  },

  update: async (id: string, data: any): Promise<Debt> => {
    const response = await api.patch(`/debts/${id}`, data);
    return response.data;
  },

  cancel: async (id: string): Promise<Debt> => {
    const response = await api.patch(`/debts/${id}/cancel`);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/debts/${id}`);
    return response.data;
  },

  sendLink: async (id: string): Promise<{ accessLink: string; token: string; expiresAt: string }> => {
    const response = await api.post(`/debts/${id}/send-link`);
    return response.data;
  },

  getCompiledByPix: async (): Promise<any[]> => {
    const response = await api.get('/debts/compiled-by-pix');
    return response.data;
  },

  getRelatedEmails: async (): Promise<Array<{ email: string; name?: string; count: number }>> => {
    const response = await api.get('/debts/related-emails');
    return response.data;
  },

  sendCompiledEmail: async (debtorEmail: string, pixKeyId?: string): Promise<any> => {
    const params: any = { debtorEmail };
    if (pixKeyId) {
      params.pixKeyId = pixKeyId;
    }
    // Enviar objeto vazio no body para evitar erro de parse JSON no backend
    const response = await api.post('/debts/compiled-by-pix/send-email', {}, { params });
    return response.data;
  },

  markAsPaid: async (id: string, notes?: string): Promise<Debt> => {
    const response = await api.post(`/debts/${id}/mark-paid`, { notes });
    return response.data;
  },

  checkDuplicates: async (data: any): Promise<Array<{
    id: string;
    description: string;
    totalAmount: number;
    debtorEmail: string;
    creditorEmail: string | null;
    isRecurring: boolean;
    similarityScore: number;
    reason: string;
  }>> => {
    const response = await api.post('/debts/check-duplicates', data);
    return response.data;
  },

  cancelRecurringDebt: async (debtId: string, reason?: string): Promise<{
    success: boolean;
    debtId: string;
    cancelled: boolean;
    mercadoPagoCancelled: boolean;
    mercadoPagoRedirectUrl: string | null;
  }> => {
    const response = await api.patch(`/debts/${debtId}/cancel-recurring`, { reason });
    return response.data;
  },
};

