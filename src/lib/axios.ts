import axios from 'axios';
import { authStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

// Determinar a baseURL baseado no ambiente
// Se VITE_API_URL estiver definido, usa ele
// Em produção, usar o domínio do backend
// Caso contrário, usa localhost para desenvolvimento
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Em produção, usar o domínio do backend
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    return 'https://api-finance-control.bitrafa.com.br/api/v1';
  }
  
  // Desenvolvimento local
  return 'http://localhost:3444/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adicionar token apenas se não for endpoint público de devedor
api.interceptors.request.use(
  (config) => {
    // Não adicionar token JWT para endpoints públicos de devedor
    const isPublicDebtorEndpoint = config.url?.startsWith('/debtor/');
    
    if (!isPublicDebtorEndpoint) {
      const token = authStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Se o body for null, converter para objeto vazio para evitar erro de parse JSON
    if (config.data === null) {
      config.data = {};
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - tratar erros e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Não tentar refresh token para endpoints públicos de devedor
    const isPublicDebtorEndpoint = originalRequest.url?.startsWith('/debtor/');

    // Se erro 401 e não é retry e não é endpoint público de devedor
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicDebtorEndpoint) {
      originalRequest._retry = true;

      const refreshToken = authStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          });

          authStore.getState().setTokens(data.accessToken, data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Token inválido ou expirado - fazer logout silencioso
          authStore.getState().logout();
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // Sem refresh token - fazer logout silencioso
        authStore.getState().logout();
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Mostrar toast de erro apenas se não for 401 (já tratado acima) e não for endpoint público
    if (error.response?.status !== 401 && !isPublicDebtorEndpoint) {
      const message = error.response?.data?.message || 'Erro ao processar requisição';
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export default api;

