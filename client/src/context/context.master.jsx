import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './context.auth.jsx';

const MasterContext = createContext(null);

export const TYPE_TO_CACHE_KEY = {
  test: 'TEST_LIST',
  tests: 'TEST_LIST',
  TEST_LIST: 'TEST_LIST',
  department: 'DEPT_LIST',
  departments: 'DEPT_LIST',
  DEPT_LIST: 'DEPT_LIST',
  unit: 'UNIT_LIST',
  units: 'UNIT_LIST',
  UNIT_LIST: 'UNIT_LIST',
  method: 'METHOD_LIST',
  methods: 'METHOD_LIST',
  METHOD_LIST: 'METHOD_LIST',
  profile: 'PROFILE_LIST',
  profiles: 'PROFILE_LIST',
  PROFILE_LIST: 'PROFILE_LIST',
  package: 'PKG_LIST',
  packages: 'PKG_LIST',
  PKG_LIST: 'PKG_LIST',
  doctor: 'DOCT_LIST',
  doctors: 'DOCT_LIST',
  DOCT_LIST: 'DOCT_LIST',
  reference: 'REFERANCE_LIST',
  references: 'REFERANCE_LIST',
  REFERANCE_LIST: 'REFERANCE_LIST',
  branch: 'BRANCH_LIST',
  branches: 'BRANCH_LIST',
  BRANCH_LIST: 'BRANCH_LIST',
  user: 'USER_LIST',
  users: 'USER_LIST',
  USER_LIST: 'USER_LIST',
  sample: 'SAMPLE_LIST',
  samples: 'SAMPLE_LIST',
  SAMPLE_LIST: 'SAMPLE_LIST',
  template: 'TEMPLATE_LIST',
  templates: 'TEMPLATE_LIST',
  TEMPLATE_LIST: 'TEMPLATE_LIST',
  interpretation: 'INTERPRETATION_LIST',
  interpretations: 'INTERPRETATION_LIST',
  INTERPRETATION_LIST: 'INTERPRETATION_LIST',
};

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
    SAMPLE_LIST: [],
    DOCT_LIST: [],
    REFERANCE_LIST: [],
    BRANCH_LIST: [],
    USER_LIST: [],
    INTERPRETATION_LIST: [],
  });
  const [cacheStats, setCacheStats] = useState({});
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [signList, setSignList] = useState([]);
  const [nextIds, setNextIds] = useState({});

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
      if (Array.isArray(res.data?.signList)) {
        setSignList(res.data.signList);
      }
      if (res.data?.nextIds && typeof res.data.nextIds === 'object') {
        setNextIds(res.data.nextIds);
      }
    } catch (err) {
      console.warn('[MasterContext] Error fetching master data:', err.message);
    } finally {
      setLoadingMaster(false);
    }
  }, [isAuthenticated]);

  // Fetch only a single master list (strictly limited to that specific list)
  const fetchSingleMasterList = useCallback(async (keyOrType, forceRefresh = true) => {
    const cacheKey = TYPE_TO_CACHE_KEY[keyOrType] || keyOrType;
    try {
      const res = await api.get(`/master/list/${cacheKey}${forceRefresh ? '?refresh=true' : ''}`);
      const listData = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(listData)) {
        setMasterData((prev) => ({
          ...prev,
          [cacheKey]: listData,
        }));
      }
      if (res.data?.nextId) {
        setNextIds((prev) => ({
          ...prev,
          [cacheKey]: String(res.data.nextId),
        }));
      }
      if (Array.isArray(res.data?.signList) && res.data.signList.length > 0) {
        setSignList(res.data.signList);
      }
      return { success: true, data: listData };
    } catch (err) {
      console.warn(`[MasterContext] Error fetching master list for ${cacheKey}:`, err.message);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllMaster();
    }
  }, [isAuthenticated, fetchAllMaster]);

  const refreshCache = async (key = null) => {
    try {
      if (key) {
        const cacheKey = TYPE_TO_CACHE_KEY[key] || key;
        await fetchSingleMasterList(cacheKey, true);
        return { success: true };
      }
      await api.post('/master/refresh', {});
      await fetchAllMaster(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Update a specific master catalog item:
   * Strictly 2 APIs called:
   * 1. POST /master/${type} (Update particular item)
   * 2. GET /master/list/${cacheKey}?refresh=true (Refresh ONLY that specific filter list)
   */
  const updateMasterItem = async (type, payload) => {
    try {
      const res = await api.post(`/master/${type}`, payload);
      const cacheKey = TYPE_TO_CACHE_KEY[type] || 'TEST_LIST';
      await fetchSingleMasterList(cacheKey, true);
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
        samples: masterData.SAMPLE_LIST || [],
        doctors: masterData.DOCT_LIST || [],
        references: masterData.REFERANCE_LIST || [],
        branches: masterData.BRANCH_LIST || [],
        users: masterData.USER_LIST || [],
        interpretations: masterData.INTERPRETATION_LIST || [],
        signList,
        nextIds,
        cacheStats,
        loadingMaster,
        refreshCache,
        updateMasterItem,
        fetchAllMaster,
        fetchSingleMasterList,
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
