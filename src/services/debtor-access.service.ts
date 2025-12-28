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

  initiatePayment: async (token: string, chargeId: string, gateway: 'MERCADOPAGO') => {
    const response = await api.post(`/debtor/${token}/charges/${chargeId}/pay`, { gateway });
    return response.data;
  },

  markChargePaid: async (token: string, chargeId: string, notes?: string) => {
    const response = await api.post(`/debtor/${token}/charges/${chargeId}/mark-paid`, { notes });
    return response.data;
  },

  markMultipleChargesPaid: async (token: string, chargeIds: string[], notes?: string) => {
    const response = await api.post(`/debtor/${token}/charges/mark-paid`, { chargeIds, notes });
    return response.data;
  },
};
