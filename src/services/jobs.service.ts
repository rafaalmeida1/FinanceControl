import api from '@/lib/axios';

export const jobsService = {
  runReminders: async () => {
    const response = await api.post('/jobs/run-reminders');
    return response.data;
  },

  runOverdue: async () => {
    const response = await api.post('/jobs/run-overdue');
    return response.data;
  },

  runRecurring: async () => {
    const response = await api.post('/jobs/run-recurring');
    return response.data;
  },
};

