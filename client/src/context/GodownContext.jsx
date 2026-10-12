import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { godownService } from '../services/godownService';
import { GODOWN_LOCATIONS } from '../utils/constants';
import toast from 'react-hot-toast';

export const GodownContext = createContext(null);

export const GodownProvider = ({ children }) => {
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchGodowns = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setLoading(true);
    try {
      const response = await godownService.getAll();
      if (response && response.data && Array.isArray(response.data)) {
        setGodowns(response.data);
      }
    } catch (err) {
      console.error('Failed to load godowns:', err);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchGodowns();
  }, [fetchGodowns]);

  // Derived array of godown names: ['Ranchi', 'Jamshedpur', ...]
  // If backend returned empty or hasn't loaded yet, fallback gracefully to GODOWN_LOCATIONS
  const godownNames = (godowns && godowns.length > 0)
    ? godowns.map((g) => g.name)
    : GODOWN_LOCATIONS;

  const addGodown = async (godownData) => {
    try {
      const res = await godownService.create(godownData);
      toast.success(res?.message || `Godown "${godownData.name}" added successfully!`);
      await fetchGodowns();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create new godown';
      toast.error(msg);
      throw err;
    }
  };

  const deleteGodown = async (id, godownName) => {
    try {
      const res = await godownService.delete(id);
      toast.success(res?.message || `Godown "${godownName || ''}" deleted successfully!`);
      await fetchGodowns();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete godown';
      toast.error(msg);
      throw err;
    }
  };

  return (
    <GodownContext.Provider
      value={{
        godowns,
        godownNames,
        loading,
        hasLoaded,
        fetchGodowns,
        addGodown,
        deleteGodown,
      }}
    >
      {children}
    </GodownContext.Provider>
  );
};

export const useGodowns = () => {
  const context = useContext(GodownContext);
  if (!context) {
    return {
      godowns: [],
      godownNames: GODOWN_LOCATIONS,
      loading: false,
      hasLoaded: false,
      fetchGodowns: async () => {},
      addGodown: async () => {},
      deleteGodown: async () => {},
    };
  }
  return context;
};
