import api from './api';

export const customerService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/customers', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/customers/${id}`);
    return data;
  },

  create: async (customerData) => {
    const { data } = await api.post('/customers', customerData);
    return data;
  },

  update: async (id, customerData) => {
    const { data } = await api.put(`/customers/${id}`, customerData);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/customers/${id}`);
    return data;
  },

  bulkImport: async (items) => {
    const { data } = await api.post('/customers/bulk-import', { items });
    return data;
  },
};
