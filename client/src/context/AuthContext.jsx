import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify token is still valid
          const { data } = await authService.getMe();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch {
          // Token invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = useCallback(async (identifier, password) => {
    const response = await authService.login(identifier, password);
    const { user: userData, accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Silent fail — clear tokens regardless
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const hasModuleAccess = useCallback((moduleKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const allowed = Array.isArray(user.allowedModules) && user.allowedModules.length > 0
      ? user.allowedModules
      : ['dashboard', 'products', 'stock_in', 'stock_out', 'stock_history'];
    return allowed.includes(moduleKey);
  }, [user]);

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    hasModuleAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
