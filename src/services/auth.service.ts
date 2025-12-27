import api from '@/lib/axios';
import { LoginResponse, User } from '@/types/api.types';

export const authService = {
  register: async (email: string, password: string, name?: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/register', { email, password, name });
    return data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  sendMagicLink: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/magic-link', { email });
    return data;
  },

  verifyMagicLink: async (token: string): Promise<LoginResponse> => {
    const { data } = await api.get(`/auth/magic-link/${token}`);
    return data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
  },

  logout: async (): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get('/users/me');
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  },
};

