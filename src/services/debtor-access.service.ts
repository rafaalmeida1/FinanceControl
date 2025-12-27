import api from '@/lib/axios';
import { Debt, Charge } from '@/types/api.types';

export const debtorAccessService = {
  getDebt: async (token: string): Promise<{ debt: Debt; expiresAt: string }> => {
    const response = await api.get(`/debtor/${token}`);
    return response.data;
  },

  getCharge: async (token: string, chargeId: string): Promise<Charge> => {
    const response = await api.get(`/debtor/${token}/charges/${chargeId}`);
    return response.data;
  },

  initiatePayment: async (token: string, chargeId: string, gateway: 'STRIPE' | 'MERCADOPAGO') => {
    const response = await api.post(`/debtor/${token}/charges/${chargeId}/pay`, { gateway });
    return response.data;
  },
};

