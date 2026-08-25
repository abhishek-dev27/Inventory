import api from './api';

export const authService = {
  login: async (identifier, password) => {
    const { data } = await api.post('/auth/login', {
      identifier,
      email: identifier,
      username: identifier,
      phone: identifier,
      password,
    });
    return data;
  },

  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  refreshToken: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },
};
