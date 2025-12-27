import api from './api';

export const mercadoPagoService = {
  connect: () => {
    const clientId = import.meta.env.VITE_MERCADOPAGO_CLIENT_ID;
    const redirectUri = `${window.location.origin}/settings/callback`;
    
    if (!clientId) {
      throw new Error('VITE_MERCADOPAGO_CLIENT_ID não configurado');
    }
    
    const authUrl = new URL('https://auth.mercadopago.com/authorization');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('platform_id', 'mp');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    
    window.location.href = authUrl.toString();
  },

  handleCallback: async (code: string) => {
    const response = await api.post('/payments/mercadopago/connect', {
      code,
    });
    return response.data;
  },

  disconnect: async () => {
    const response = await api.delete('/payments/mercadopago/disconnect');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/payments/mercadopago/status');
    return response.data;
  },
};

