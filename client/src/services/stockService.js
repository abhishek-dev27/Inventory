import api from './api';

export const stockService = {
  stockIn: async (stockData) => {
    const { data } = await api.post('/stock/in', stockData);
    return data;
  },

  stockOut: async (stockData) => {
    const { data } = await api.post('/stock/out', stockData);
    return data;
  },

  getTransactions: async (params = {}) => {
    const { data } = await api.get('/transactions', { params });
    return data;
  },

  getTransactionById: async (id) => {
    const { data } = await api.get(`/transactions/${id}`);
    return data;
  },

  updateTransaction: async (id, txData) => {
    const { data } = await api.put(`/transactions/${id}`, txData);
    return data;
  },
};
