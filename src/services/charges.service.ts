import api from '@/lib/axios';
import { Charge } from '@/types/api.types';

export const chargesService = {
  create: async (data: any): Promise<Charge> => {
    const response = await api.post('/charges', data);
    return response.data;
  },

  createRecurring: async (data: any): Promise<Charge> => {
    const response = await api.post('/charges/recurring', data);
    return response.data;
  },

  getAll: async (params?: { status?: string; type?: string }): Promise<Charge[]> => {
    const response = await api.get('/charges', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<Charge> => {
    const response = await api.get(`/charges/${id}`);
    return response.data;
  },

  markPaid: async (id: string, notes?: string): Promise<{ message: string }> => {
    const response = await api.post(`/charges/${id}/mark-paid`, { notes });
    return response.data;
  },

  cancel: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/charges/${id}`);
    return response.data;
  },

  forceCharge: async (debtorEmail?: string): Promise<any> => {
    const response = await api.post('/charges/force', debtorEmail ? { debtorEmail } : {});
    return response.data;
  },
};

