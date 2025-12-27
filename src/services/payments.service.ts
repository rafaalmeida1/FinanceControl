import api from '@/lib/axios';

export const paymentsService = {
  processPayment: async (chargeId: string, gateway: 'MERCADOPAGO') => {
    const response = await api.post(`/payments/charges/${chargeId}/process`, { gateway });
    return response.data;
  },

  getMercadoPagoAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response = await api.get('/payments/mercadopago/auth-url');
    return response.data;
  },

  handleMercadoPagoCallback: async (code: string, userId: string): Promise<{ message: string }> => {
    const response = await api.get(`/payments/mercadopago/callback?code=${code}&state=${userId}`);
    return response.data;
  },

  getMercadoPagoConnectionStatus: async (): Promise<{ connected: boolean }> => {
    try {
      const response = await api.get('/payments/mercadopago/status');
      return response.data;
    } catch (error) {
      return { connected: false };
    }
  },

  disconnectMercadoPago: async (): Promise<{ message: string }> => {
    const response = await api.delete('/payments/mercadopago/disconnect');
    return response.data;
  },

  getConfirmationData: async (token: string) => {
    const response = await api.get(`/payments/confirm/${token}`);
    return response.data;
  },

  confirmPayment: async (token: string) => {
    const response = await api.post(`/payments/confirm/${token}`);
    return response.data;
  },

  requestConfirmation: async (chargeId: string, creditorEmail: string) => {
    const response = await api.post(`/payments/confirm/charges/${chargeId}/request`, null, {
      params: { creditorEmail },
    });
    return response.data;
  },
};

