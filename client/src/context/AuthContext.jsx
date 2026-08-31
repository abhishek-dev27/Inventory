import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVITY_KEY = 'lastActivityTimestamp';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastUpdateRef = useRef(Date.now());

  const logout = useCallback(async (reason) => {
    try {
      await authService.logout();
    } catch {
      // Silent fail — clear tokens regardless
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);

    if (reason === 'inactivity') {
      toast.error('Session expired due to 30 minutes of inactivity. Please log in again.', {
        id: 'inactivity-logout',
        duration: 5000,
      });
    }
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        const lastActiveStr = localStorage.getItem(LAST_ACTIVITY_KEY);
        const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : Date.now();

        // Check if session already timed out while page was closed
        if (Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          setUser(null);
          setLoading(false);
          toast.error('Session expired due to inactivity. Please log in again.', {
            id: 'inactivity-logout',
            duration: 5000,
          });
          return;
        }

        try {
          setUser(JSON.parse(storedUser));
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          // Verify token is still valid
          const { data } = await authService.getMe();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch {
          // Token invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem(LAST_ACTIVITY_KEY);
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
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

    setUser(userData);
    return userData;
  }, []);

  // Track user activity and auto-logout on 30 minutes inactivity
  useEffect(() => {
    if (!user) return;

    // Record activity timestamp (throttled to at most once every 2 seconds)
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current > 2000) {
        lastUpdateRef.current = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      }
    };

    // Periodically check if 30 minutes elapsed without activity
    const checkInactivity = () => {
      const lastActiveStr = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActiveStr) return;
      const lastActive = parseInt(lastActiveStr, 10);
      if (Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
        logout('inactivity');
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, updateActivity, { passive: true });
    });

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        checkInactivity();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Run check every 10 seconds
    const intervalId = setInterval(checkInactivity, 10000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, updateActivity);
      });
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(intervalId);
    };
  }, [user, logout]);

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

