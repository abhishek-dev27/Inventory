import api from './api';

export const godownService = {
  // Get all active godowns
  getAll: async () => {
    const { data } = await api.get('/godowns');
    return data;
  },

  // Get single godown
  getById: async (id) => {
    const { data } = await api.get(`/godowns/${id}`);
    return data;
  },

  // Create a new godown (Admin only)
  create: async (godownData) => {
    const { data } = await api.post('/godowns', godownData);
    return data;
  },

  // Update godown
  update: async (id, godownData) => {
    const { data } = await api.put(`/godowns/${id}`, godownData);
    return data;
  },

  // Delete godown
  delete: async (id) => {
    const { data } = await api.delete(`/godowns/${id}`);
    return data;
  },
};
