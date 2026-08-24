import api from './api';

export const accountService = {
  // Get all accounts with filters & pagination
  getAll: async (params = {}) => {
    const response = await api.get('/accounts', { params });
    return response.data;
  },

  // Get account by ID
  getById: async (id) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  // Create new account
  create: async (data) => {
    const response = await api.post('/accounts', data);
    return response.data;
  },

  // Update account
  update: async (id, data) => {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data;
  },

  // Delete account
  delete: async (id) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  // Bulk import accounts
  bulkImport: async (items) => {
    const response = await api.post('/accounts/bulk-import', { items });
    return response.data;
  },

  // 1-Click Sync from Customers DB
  syncFromCustomers: async () => {
    const response = await api.post('/accounts/sync-customers');
    return response.data;
  },

  // Record Recurring Payment / EMI Installment
  recordRecurring: async (id, data = {}) => {
    const response = await api.post(`/accounts/${id}/record-recurring`, data);
    return response.data;
  },
};
