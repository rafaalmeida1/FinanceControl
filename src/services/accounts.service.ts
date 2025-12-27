import api from '@/lib/axios';
import { Account } from '@/types/api.types';

export const accountsService = {
  create: async (data: any): Promise<Account> => {
    const response = await api.post('/accounts', data);
    return response.data;
  },

  getAll: async (): Promise<Account[]> => {
    const response = await api.get('/accounts');
    return response.data;
  },

  getOne: async (id: string): Promise<Account> => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  update: async (id: string, data: any): Promise<Account> => {
    const response = await api.patch(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  setDefault: async (id: string): Promise<Account> => {
    const response = await api.patch(`/accounts/${id}/set-default`);
    return response.data;
  },
};

