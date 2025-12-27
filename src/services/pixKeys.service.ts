import api from '@/lib/axios';

export interface PixKey {
  id: string;
  userId: string;
  accountId?: string;
  keyType: 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
  keyValue: string;
  label: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    name: string;
  };
}

export interface CreatePixKeyDto {
  keyType: 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
  keyValue: string;
  label?: string;
  accountId?: string;
  isDefault?: boolean;
}

export interface UpdatePixKeyDto {
  label?: string;
  accountId?: string;
  isActive?: boolean;
}

export const pixKeysService = {
  getAll: async (): Promise<PixKey[]> => {
    const response = await api.get('/pix-keys');
    return response.data;
  },

  getOne: async (id: string): Promise<PixKey> => {
    const response = await api.get(`/pix-keys/${id}`);
    return response.data;
  },

  create: async (data: CreatePixKeyDto): Promise<PixKey> => {
    const response = await api.post('/pix-keys', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePixKeyDto): Promise<PixKey> => {
    const response = await api.patch(`/pix-keys/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/pix-keys/${id}`);
    return response.data;
  },

  setDefault: async (id: string): Promise<PixKey> => {
    const response = await api.patch(`/pix-keys/${id}/set-default`);
    return response.data;
  },
};

