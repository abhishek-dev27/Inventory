import api from './api';

export const activityLogService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/activity-logs', { params });
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/activity-logs/stats');
    return data;
  },

  clearLogs: async (params = {}) => {
    const { data } = await api.delete('/activity-logs', { params });
    return data;
  },
};
