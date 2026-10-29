import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './context.auth.jsx';

const MasterContext = createContext(null);

export const MasterProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [masterData, setMasterData] = useState({
    DEPT_LIST: [],
    UNIT_LIST: [],
    METHOD_LIST: [],
    PROFILE_LIST: [],
    PKG_LIST: [],
    TEST_LIST: [],
    TEMPLATE_LIST: [],
    DOCT_LIST: [],
    REFERANCE_LIST: [],
    BRANCH_LIST: [],
    USER_LIST: [],
  });
  const [cacheStats, setCacheStats] = useState({});
  const [loadingMaster, setLoadingMaster] = useState(false);

  const fetchAllMaster = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) return;
    setLoadingMaster(true);
    try {
      const res = await api.get(`/master/all${forceRefresh ? '?refresh=true' : ''}`);
      if (res.data?.data) {
        setMasterData((prev) => ({ ...prev, ...res.data.data }));
      }
      if (res.data?.stats) {
        setCacheStats(res.data.stats);
      }
    } catch (err) {
      console.warn('[MasterContext] Error fetching master data:', err.message);
    } finally {
      setLoadingMaster(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllMaster();
    }
  }, [isAuthenticated, fetchAllMaster]);

  const refreshCache = async (key = null) => {
    try {
      await api.post('/master/refresh', { key });
      await fetchAllMaster(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateMasterItem = async (type, payload) => {
    try {
      const res = await api.post(`/master/${type}`, payload);
      await fetchAllMaster(true);
      return { success: true, message: res.data?.Message || 'Master catalog updated successfully' };
    } catch (err) {
      const errorMsg = err.response?.data?.Message || err.message || 'Failed to update master catalog item';
      return { success: false, error: errorMsg };
    }
  };

  return (
    <MasterContext.Provider
      value={{
        masterData,
        departments: masterData.DEPT_LIST || [],
        units: masterData.UNIT_LIST || [],
        methods: masterData.METHOD_LIST || [],
        profiles: masterData.PROFILE_LIST || [],
        packages: masterData.PKG_LIST || [],
        tests: masterData.TEST_LIST || [],
        templates: masterData.TEMPLATE_LIST || [],
        doctors: masterData.DOCT_LIST || [],
        references: masterData.REFERANCE_LIST || [],
        branches: masterData.BRANCH_LIST || [],
        users: masterData.USER_LIST || [],
        cacheStats,
        loadingMaster,
        refreshCache,
        updateMasterItem,
        fetchAllMaster,
      }}
    >
      {children}
    </MasterContext.Provider>
  );
};

export const useMaster = () => {
  const context = useContext(MasterContext);
  if (!context) {
    throw new Error('useMaster must be used within a MasterProvider');
  }
  return context;
};
