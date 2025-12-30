import api from '@/lib/axios';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  color?: string;
  icon?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    debts: number;
    pixKeys: number;
  };
}

export interface CreateWalletDto {
  name: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export interface UpdateWalletDto {
  name?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export const walletsService = {
  create: async (data: CreateWalletDto): Promise<Wallet> => {
    const response = await api.post('/wallets', data);
    return response.data;
  },

  getAll: async (): Promise<Wallet[]> => {
    const response = await api.get('/wallets');
    return response.data;
  },

  getOne: async (id: string): Promise<Wallet> => {
    const response = await api.get(`/wallets/${id}`);
    return response.data;
  },

  getDefault: async (): Promise<Wallet> => {
    const response = await api.get('/wallets/default');
    return response.data;
  },

  update: async (id: string, data: UpdateWalletDto): Promise<Wallet> => {
    const response = await api.patch(`/wallets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/wallets/${id}`);
    return response.data;
  },

  setDefault: async (id: string): Promise<Wallet> => {
    const response = await api.patch(`/wallets/${id}/set-default`);
    return response.data;
  },
};

