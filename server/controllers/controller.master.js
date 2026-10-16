import { cacheService, CACHE_KEYS } from '../services/service.cache.js';
import { upstreamService } from '../services/service.upstream.js';

export const getMasterList = async (req, res, next) => {
  try {
    const { key } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    if (!CACHE_KEYS[key]) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: `Invalid master list key: ${key}. Valid keys: ${Object.keys(CACHE_KEYS).join(', ')}`,
      });
    }

    const result = await cacheService.getList(key, forceRefresh, req.user?.upstreamSid);

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      key,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns all master lists in a single bundled payload for fast frontend initialization
 */
export const getAllMasterData = async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const keys = Object.values(CACHE_KEYS);
    const results = {};

    await Promise.all(
      keys.map(async (key) => {
        try {
          const res = await cacheService.getList(key, forceRefresh, req.user?.upstreamSid);
          results[key] = res.data;
        } catch (e) {
          results[key] = [];
        }
      })
    );

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      data: results,
      stats: cacheService.getCacheStats(),
    });
  } catch (err) {
    next(err);
  }
};

export const getCacheStatus = async (req, res, next) => {
  try {
    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      stats: cacheService.getCacheStats(),
    });
  } catch (err) {
    next(err);
  }
};

export const forceRefresh = async (req, res, next) => {
  try {
    const { key } = req.body;
    if (key && CACHE_KEYS[key]) {
      const refreshed = await cacheService.refreshList(key, req.user?.upstreamSid);
      return res.json({
        STATUS: 'SUCCESS',
        StatusCode: '0000',
        Message: `Cache for ${key} refreshed successfully`,
        data: refreshed,
      });
    }

    await cacheService.warmAllCaches();
    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: 'All master caches refreshed successfully',
      stats: cacheService.getCacheStats(),
    });
  } catch (err) {
    next(err);
  }
};

// --- Mutation Handlers (Each invalidates cache automatically) ---

export const updateDepartment = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATEDEPARTMENT', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.DEPT_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'Department updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateUnit = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATEUNIT', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.UNIT_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'Unit updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateTest = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATETEST', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.TEST_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'Test updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATEPROFILE', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.PROFILE_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'Profile updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updatePackage = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATEPKG', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.PKG_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'Package updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATEDOCT', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.DOCT_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'Doctor updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateReference = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATEREFERANCE', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.REFERANCE_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'Reference updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateBranch = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATEBRANCH', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.BRANCH_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'Branch updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATEUSER', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.USER_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'User updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateInterpretation = async (req, res, next) => {
  try {
    const upstreamRes = await upstreamService.post('UPDATEINTERPRETITION', req.body, null, req.user?.upstreamSid);
    await cacheService.invalidate(CACHE_KEYS.TEMPLATE_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: 'Interpretation updated', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};
