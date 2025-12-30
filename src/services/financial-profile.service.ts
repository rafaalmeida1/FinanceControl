import api from '@/lib/axios';

export interface FinancialProfile {
  id: string;
  userId: string;
  monthlyIncome: number | null;
  payday: number | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinancialProfileDto {
  monthlyIncome?: number;
  payday?: number;
}

export interface UpdateFinancialProfileDto {
  monthlyIncome?: number;
  payday?: number;
  onboardingCompleted?: boolean;
}

export const financialProfileService = {
  create: async (data: CreateFinancialProfileDto): Promise<FinancialProfile> => {
    const response = await api.post('/users/financial-profile', data);
    return response.data;
  },

  get: async (): Promise<FinancialProfile | null> => {
    try {
      const response = await api.get('/users/financial-profile');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  update: async (data: UpdateFinancialProfileDto): Promise<FinancialProfile> => {
    const response = await api.patch('/users/financial-profile', data);
    return response.data;
  },
};

