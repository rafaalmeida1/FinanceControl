import api from '@/lib/axios';
import { AdminStats } from '@/types/api.types';

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getMetrics: async () => {
    const response = await api.get('/admin/metrics');
    return response.data;
  },

  getLogs: async (limit?: number, level?: string) => {
    const response = await api.get('/admin/logs', { params: { limit, level } });
    return response.data;
  },

  getAuditLogs: async (filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/audit-logs', { params: filters });
    return response.data;
  },

  getQueueStatus: async () => {
    const response = await api.get('/admin/queue-status');
    return response.data;
  },
};

