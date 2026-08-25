import api from './api';

export const productService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/products', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  getLowStock: async () => {
    const { data } = await api.get('/products/low-stock');
    return data;
  },

  getCategories: async () => {
    const { data } = await api.get('/products/categories');
    return data;
  },

  getProductTypes: async () => {
    const { data } = await api.get('/products/types');
    return data;
  },

  create: async (productData) => {
    const { data } = await api.post('/products', productData);
    return data;
  },

  update: async (id, productData) => {
    const { data } = await api.put(`/products/${id}`, productData);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
};
