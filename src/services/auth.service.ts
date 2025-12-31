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

  verifyEmail: async (token: string): Promise<{ message: string; verified: boolean }> => {
    const { data } = await api.get(`/auth/verify-email/${token}`);
    return data;
  },

  resendVerificationEmail: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  },

  // Registro com OTP (2 etapas)
  registerStep1: async (email: string, name?: string): Promise<{ sessionToken: string; otp?: string }> => {
    const { data } = await api.post('/auth/register/step1', { email, name });
    return data;
  },

  registerStep2: async (email: string, otp: string, sessionToken: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/register/step2', { email, otp, sessionToken });
    return data;
  },

  // Login com OTP (2 etapas)
  loginStep1: async (email: string): Promise<{ sessionToken: string; otp?: string }> => {
    const { data } = await api.post('/auth/login/step1', { email });
    return data;
  },

  loginStep2: async (email: string, otp: string, sessionToken: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login/step2', { email, otp, sessionToken });
    return data;
  },
};

