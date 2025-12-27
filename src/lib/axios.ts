import axios from 'axios';
import { authStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adicionar token
api.interceptors.request.use(
  (config) => {
    const token = authStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // Se erro 401 e não é retry
    if (error.response?.status === 401 && !originalRequest._retry) {
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
          authStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        authStore.getState().logout();
        window.location.href = '/login';
      }
    }

    // Mostrar toast de erro
    const message = error.response?.data?.message || 'Erro ao processar requisição';
    toast.error(message);

    return Promise.reject(error);
  },
);

export default api;

