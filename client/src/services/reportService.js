import api from './api';

export const reportService = {
  getDashboardStats: async () => {
    const { data } = await api.get('/reports/dashboard');
    return data;
  },

  getDailyReport: async (date) => {
    const { data } = await api.get('/reports/daily', { params: { date } });
    return data;
  },

  getMonthlyReport: async (year, month) => {
    const { data } = await api.get('/reports/monthly', { params: { year, month } });
    return data;
  },

  getUsageReport: async (params = {}) => {
    const { data } = await api.get('/reports/usage', { params });
    return data;
  },

  getChartData: async (days = 7) => {
    const { data } = await api.get('/reports/chart', { params: { days } });
    return data;
  },
};
