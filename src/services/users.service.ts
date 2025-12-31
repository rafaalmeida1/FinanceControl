import api from '@/lib/axios';
import { User, UserStats } from '@/types/api.types';

export interface NotificationPreferences {
  paymentReminders: boolean;
  overdueNotifications: boolean;
  monthlySummary: boolean;
  debtCreated: boolean;
  disputeNotifications: boolean;
  paymentConfirmationRequest: boolean;
}

export const usersService = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: { name?: string; email?: string; phone?: string }): Promise<User> => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/users/me/stats');
    return response.data;
  },

  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get('/users/me/notification-preferences');
    return response.data;
  },

  updateNotificationPreferences: async (data: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await api.patch('/users/me/notification-preferences', data);
    return response.data;
  },

  getSalaryStatus: async () => {
    const response = await api.get('/users/salary/status');
    return response.data;
  },

  confirmSalary: async (amount?: number) => {
    const response = await api.post('/users/salary/confirm', { amount });
    return response.data;
  },
};

