import api from '@/lib/axios';
import { Debt } from '@/types/api.types';

export const debtsService = {
  create: async (data: any): Promise<Debt> => {
    const response = await api.post('/debts', data);
    return response.data;
  },

  getAll: async (params?: { status?: string; search?: string; type?: 'personal' | 'third-party' | 'all' }): Promise<Debt[]> => {
    const response = await api.get('/debts', { params });
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

  sendCompiledEmail: async (debtorEmail: string, pixKeyId?: string): Promise<any> => {
    const params: any = { debtorEmail };
    if (pixKeyId) {
      params.pixKeyId = pixKeyId;
    }
    const response = await api.post('/debts/compiled-by-pix/send-email', null, { params });
    return response.data;
  },
};

