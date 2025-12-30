import api from '@/lib/axios';

export interface MonthlyFinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  projectedBalance: number;
  pendingIncome: number;
  pendingExpenses: number;
  month: number;
  year: number;
}

export interface FinancialHistory {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export const financialService = {
  getMonthlySummary: async (month: number, year: number, walletId?: string): Promise<MonthlyFinancialSummary> => {
    const response = await api.get('/financial/monthly-summary', {
      params: { month, year, ...(walletId && { walletId }) },
    });
    return response.data;
  },

  getHistory: async (months: number = 12, walletId?: string): Promise<FinancialHistory[]> => {
    const response = await api.get('/financial/history', {
      params: { months, ...(walletId && { walletId }) },
    });
    return response.data;
  },

  getTotalBalance: async (walletId?: string): Promise<number> => {
    const response = await api.get('/financial/total-balance', {
      params: { ...(walletId && { walletId }) },
    });
    return response.data;
  },
};

