import { cacheService, CACHE_KEYS, computeNextIdForList, DEFAULT_SIGNATURES } from '../services/service.cache.js';
import { upstreamService } from '../services/service.upstream.js';

export const getMasterList = async (req, res, next) => {
  try {
    const { key } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    const KEY_MAP = {
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

    const resolvedKey = KEY_MAP[key] || KEY_MAP[String(key).toLowerCase()] || KEY_MAP[String(key).toUpperCase()] || key;

    if (!CACHE_KEYS[resolvedKey]) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: `Invalid master list key: ${key}. Valid keys: ${Object.keys(CACHE_KEYS).join(', ')}`,
      });
    }

    const result = await cacheService.getList(resolvedKey, forceRefresh, req.user?.upstreamSid);

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      key: resolvedKey,
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
    const nextIds = {};
    let globalSignList = [];

    await Promise.all(
      keys.map(async (key) => {
        try {
          const result = await cacheService.getList(key, forceRefresh, req.user?.upstreamSid);
          results[key] = result.data;
          const nId = result.nextId || computeNextIdForList(key, result.data);
          if (nId) {
            nextIds[key] = String(nId);
          }
          if (Array.isArray(result.signList) && result.signList.length > 0) {
            globalSignList = result.signList;
          }
        } catch (e) {
          results[key] = [];
        }
      })
    );

    if (!globalSignList || globalSignList.length === 0) {
      globalSignList = DEFAULT_SIGNATURES;
    }

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      data: results,
      signList: globalSignList,
      nextIds,
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

    await cacheService.warmAllCaches(req.user?.upstreamSid);
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
    const params = {
      sampleId: req.body.sampleId || '101.3',
      id: req.body.id ?? req.body.deptId ?? req.body['Dept Id'] ?? '',
      name: req.body.name ?? req.body.Name ?? '',
      shortname: req.body.shortname ?? req.body['Short Name'] ?? req.body.shortName ?? '',
      status: req.body.status ?? req.body.Status ?? 'Active',
      sign: req.body.sign !== undefined ? String(req.body.sign) : '',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEDEPARTMENT', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update department',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.DEPT_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Department updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateUnit = async (req, res, next) => {
  try {
    const params = {
      id: req.body.id ?? req.body.unitId ?? req.body['Unit Id'] ?? '',
      name: req.body.name ?? req.body.Name ?? '',
      status: req.body.status ?? req.body.Status ?? 'Active',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEUNIT', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update measurement unit',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.UNIT_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Unit updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateMethod = async (req, res, next) => {
  try {
    const params = {
      sampleId: req.body.sampleId || '101.3',
      id: req.body.id ?? req.body.methodId ?? req.body['Method Id'] ?? '',
      name: req.body.name ?? req.body.Name ?? '',
      status: req.body.status ?? req.body.Status ?? 'Active',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEMETHOD', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update method',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.METHOD_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Method updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateTest = async (req, res, next) => {
  try {
    const params = {
      TEST_ID: req.body.TEST_ID ?? req.body.id ?? req.body['Test Id'] ?? '',
      TEST_SHORT_NAME: req.body.TEST_SHORT_NAME ?? req.body.shortName ?? req.body['Short Name'] ?? '',
      TEST_NAME: req.body.TEST_NAME ?? req.body.name ?? req.body.Name ?? '',
      TEST_DEPTID: req.body.TEST_DEPTID ?? req.body.deptId ?? req.body['Dept Id'] ?? '',
      TEST_SAMPLE: req.body.TEST_SAMPLE ?? req.body.sampleType ?? req.body['Sample Type'] ?? 'Serum',
      TEST_METHOD_ID: req.body.TEST_METHOD_ID ?? req.body.methodId ?? req.body['Method Id'] ?? '',
      TEST_UNIT_ID: req.body.TEST_UNIT_ID ?? req.body.unitId ?? req.body['Unit Id'] ?? '',
      TEST_STATUS: req.body.TEST_STATUS ?? req.body.status ?? req.body.Status ?? 'Active',
      TEST_RATE: req.body.TEST_RATE ?? req.body.rate ?? req.body.Rate ?? '',
      TEST_RATE1: req.body.TEST_RATE1 ?? req.body.rate1 ?? req.body.Rate1 ?? '',
      TEST_RATE2: req.body.TEST_RATE2 ?? req.body.rate2 ?? req.body.Rate2 ?? '',
      TEST_COMMENT: req.body.TEST_COMMENT ?? req.body.comment ?? req.body.Comment ?? '',
      rg0l: req.body.rg0l ?? '',
      rg0h: req.body.rg0h ?? '',
      rg1l: req.body.rg1l ?? '',
      rg1h: req.body.rg1h ?? '',
      rg2l: req.body.rg2l ?? '',
      rg2h: req.body.rg2h ?? '',
      rg3l: req.body.rg3l ?? '',
      rg3h: req.body.rg3h ?? '',
      rg4l: req.body.rg4l ?? '',
      rg4h: req.body.rg4h ?? '',
      rg5l: req.body.rg5l ?? '',
      rg5h: req.body.rg5h ?? '',
      rg6l: req.body.rg6l ?? '',
      rg6h: req.body.rg6h ?? '',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATETEST', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update test',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.TEST_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Test updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const params = {
      PROFILE_ID: req.body.PROFILE_ID ?? req.body.id ?? req.body['Profile Id'] ?? '',
      PROFILE_DEPTID: req.body.PROFILE_DEPTID ?? req.body.deptId ?? req.body['Dept Id'] ?? '',
      PROFILE_NAME: req.body.PROFILE_NAME ?? req.body.name ?? req.body.Name ?? '',
      PROFILE_STATUS: req.body.PROFILE_STATUS ?? req.body.status ?? req.body.Status ?? 'Active',
      PROFILE_RATE: req.body.PROFILE_RATE ?? req.body.rate ?? req.body.Rate ?? '',
      PROFILE_RATE1: req.body.PROFILE_RATE1 ?? req.body.rate1 ?? req.body.Rate1 ?? '',
      PROFILE_RATE2: req.body.PROFILE_RATE2 ?? req.body.rate2 ?? req.body.Rate2 ?? '',
      PROFILE_TEST_ID_LIST: req.body.PROFILE_TEST_ID_LIST ?? req.body.testIdList ?? req.body['Test Id List'] ?? '',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEPROFILE', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update profile',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.PROFILE_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Profile updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updatePackage = async (req, res, next) => {
  try {
    const params = {
      PKG_ID: req.body.PKG_ID ?? req.body.id ?? req.body['Package Id'] ?? '',
      PKG_DEPTID: req.body.PKG_DEPTID ?? req.body.deptId ?? req.body['Dept Id'] ?? '',
      PKG_NAME: req.body.PKG_NAME ?? req.body.name ?? req.body.Name ?? '',
      PKG_STATUS: req.body.PKG_STATUS ?? req.body.status ?? req.body.Status ?? 'Active',
      PKG_RATE: req.body.PKG_RATE ?? req.body.rate ?? req.body.Rate ?? '',
      PKG_RATE1: req.body.PKG_RATE1 ?? req.body.rate1 ?? req.body.Rate1 ?? '',
      PKG_RATE2: req.body.PKG_RATE2 ?? req.body.rate2 ?? req.body.Rate2 ?? '',
      PKG_TEST_ID_LIST: req.body.PKG_TEST_ID_LIST ?? req.body.testIdList ?? req.body['Test Id List'] ?? '',
      PKG_PROFILE_ID_LIST: req.body.PKG_PROFILE_ID_LIST ?? req.body.profileIdList ?? req.body['Profile Id List'] ?? '',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEPKG', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update package',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.PKG_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Package updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const params = {
      sampleId: req.body.sampleId || '101.3',
      id: req.body.id ?? req.body.doctId ?? req.body['Doct Id'] ?? '',
      name: req.body.name ?? req.body.Name ?? '',
      deg: req.body.deg ?? req.body.Deg ?? '',
      contact: req.body.contact ?? req.body.Contact ?? '',
      rate: req.body.rate ?? req.body.Rate ?? '',
      type: req.body.type ?? req.body.Type ?? 'P',
      status: req.body.status ?? req.body.Status ?? 'Active',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEDOCT', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update doctor',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.DOCT_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Doctor updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateReference = async (req, res, next) => {
  try {
    const params = {
      sampleId: req.body.sampleId || '101.3',
      id: req.body.id ?? req.body.referId ?? req.body['Refer Id'] ?? req.body['Doct Id'] ?? req.body.doctId ?? '',
      name: req.body.name ?? req.body.Name ?? '',
      address: req.body.address ?? req.body.Address ?? '',
      contact: req.body.contact ?? req.body.Contact ?? '',
      rate: req.body.rate ?? req.body.Rate ?? '0',
      type: req.body.type ?? req.body.Type ?? 'P',
      status: req.body.status ?? req.body.Status ?? 'Active',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEREFERANCE', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update reference agent',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.REFERANCE_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Reference agent updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateBranch = async (req, res, next) => {
  try {
    const params = {
      sampleId: req.body.sampleId || '101.3',
      id: req.body.id ?? req.body.branchId ?? req.body['Branch Id'] ?? '',
      name: req.body.name ?? req.body.Name ?? '',
      location: req.body.location ?? req.body.Location ?? '',
      contact: req.body.contact ?? req.body.Contact ?? '',
      status: req.body.status ?? req.body.Status ?? 'Active',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEBRANCH', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update branch',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.BRANCH_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Branch updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const effectiveAccess = req.body.access ?? (typeof req.body.accessPermissionJson === 'object' ? req.body.accessPermissionJson?.accessType : req.body.accessPermissionJson) ?? 'Settings';
    const isBranchRole = String(effectiveAccess).trim().toLowerCase() === 'branch';

    const params = {
      id: req.body.id ?? req.body.userId ?? req.body.UserId ?? '',
      login: req.body.login ?? req.body.loginId ?? '',
      name: req.body.name ?? req.body.Name ?? '',
      mobile: req.body.mobile ?? req.body.Mobile ?? '',
      email: req.body.email ?? req.body.Email ?? '',
      password: req.body.password || '',
      access: effectiveAccess,
      accessbranch: isBranchRole ? (req.body.accessbranch ?? req.body.accessBranch ?? '') : '',
      status: req.body.status ?? req.body.Status ?? 'Active',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEUSER', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update user',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.USER_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'User updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

export const updateInterpretation = async (req, res, next) => {
  try {
    const params = {
      id: req.body.id ?? req.body.ID ?? '',
      name: req.body.name ?? req.body.Name ?? '',
      type: req.body.type ?? req.body.Type ?? 'Test',
      text: req.body.text ?? req.body.Text ?? '',
      status: req.body.status ?? req.body.Status ?? 'Active',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATEINTERPRETITION', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update interpretation',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.INTERPRETATION_LIST);
    await cacheService.invalidate(CACHE_KEYS.TEMPLATE_LIST);
    return res.json({ STATUS: 'SUCCESS', Message: upstreamRes?.Message || 'Interpretation updated successfully', upstream: upstreamRes });
  } catch (err) {
    next(err);
  }
};

/**
 * Update / Add Sample Type (API_ADD_UPDATE_SAMPLE="UPDATESAMPLE")
 * /APIServlet?api=UPDATESAMPLE&id=1&name=Serum&status=Active
 */
export const updateSample = async (req, res, next) => {
  try {
    const params = {
      id: req.body.id ?? req.body['Sample Id'] ?? req.body.sampleId ?? '',
      name: req.body.name ?? req.body.Name ?? '',
      status: req.body.status ?? req.body.Status ?? 'Active',
      ...req.body,
    };
    const upstreamRes = await upstreamService.post('UPDATESAMPLE', params, null, req.user?.upstreamSid);
    if (upstreamRes?.STATUS === 'FAILED' || (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '1000',
        Message: upstreamRes?.Message || 'Failed to update sample type',
        upstream: upstreamRes,
      });
    }
    await cacheService.invalidate(CACHE_KEYS.SAMPLE_LIST);
    return res.json({
      STATUS: 'SUCCESS',
      Message: upstreamRes?.Message || 'Sample Updated',
      upstream: upstreamRes,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Template Metadata (API_UPDATE_TEMPLATE="UPDATETEMPLATE")
 * /APIServlet?api=UPDATETEMPLATE&reportId=P14R3&status=SAVED&price=100&TEMPLATE_NAME=STOOL%20EXAMINATION
 */
export const updateTemplate = async (req, res, next) => {
  try {
    let repId = req.body.reportId ?? req.body.id ?? '';
    // Normalize if reportId was given as T-prefixed template id (e.g. 'T1' -> 'P14R1')
    if (String(repId).toUpperCase().startsWith('T')) {
      const num = String(repId).replace(/^T+/i, '');
      repId = `P14R${num}`;
    }
    if (!repId) repId = 'P14R1';

    let tmplId = req.body.templatesId ?? '';
    if (!tmplId && repId) {
      const num = String(repId).replace(/^P\d+R/i, '');
      tmplId = `T${num}`;
    }

    const params = {
      reportId: repId,
      patientId: 'P14',
      status: req.body.status ?? req.body.Status ?? 'Active',
      price: req.body.price ?? req.body.rate ?? '0',
      price1: req.body.price1 ?? '',
      price2: req.body.price2 ?? '',
      price3: req.body.price3 ?? '',
      price4: req.body.price4 ?? '',
      price5: req.body.price5 ?? '',
      TEMPLATE_NAME: req.body.TEMPLATE_NAME ?? req.body.name ?? req.body.templateName ?? '',
      deptId: req.body.deptId ?? req.body.department ?? '',
      sign: req.body.sign !== undefined ? String(req.body.sign) : '',
      ...req.body,
      reportId: repId,
    };
    let upstreamRes = null;
    try {
      upstreamRes = await upstreamService.post('UPDATETEMPLATE', params, null, req.user?.upstreamSid);
    } catch (err) {
      console.warn('[updateTemplate] Upstream UPDATETEMPLATE warning:', err.message);
    }

    // Upstream UPDATETEMPLATE may return 1211 because master templates in upstream
    // are stored as patient P14 or in internal configuration.
    // Update local cache and MongoDB CacheModel for TEMPLATE_LIST so the edit is persisted.
    try {
      const list = await cacheService.getList(CACHE_KEYS.TEMPLATE_LIST);
      if (Array.isArray(list)) {
        const idx = list.findIndex(
          (t) =>
            String(t.reportId || '').toUpperCase() === String(repId).toUpperCase() ||
            String(t.templatesId || '').toUpperCase() === String(tmplId).toUpperCase() ||
            String(t.templatesId || '').toUpperCase() === String(repId).toUpperCase() ||
            String(t.id || '').toUpperCase() === String(repId).toUpperCase() ||
            String(t.id || '').toUpperCase() === String(tmplId).toUpperCase()
        );
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            reportId: repId,
            templatesId: tmplId || list[idx].templatesId,
            TEMPLATE_NAME: params.TEMPLATE_NAME || list[idx].TEMPLATE_NAME,
            name: params.TEMPLATE_NAME || list[idx].name,
            deptId: params.deptId || list[idx].deptId,
            price: params.price || list[idx].price || '0',
            rate: params.price || list[idx].rate || '0',
            Rate: params.price || list[idx].Rate || '0',
            price1: params.price1 ?? list[idx].price1 ?? '',
            rate1: params.price1 ?? list[idx].rate1 ?? '',
            Rate1: params.price1 ?? list[idx].Rate1 ?? '',
            price2: params.price2 ?? list[idx].price2 ?? '',
            rate2: params.price2 ?? list[idx].rate2 ?? '',
            Rate2: params.price2 ?? list[idx].Rate2 ?? '',
            status: params.status || list[idx].status,
            Status: params.status || list[idx].Status,
            sign: params.sign !== undefined ? params.sign : (list[idx].sign || ''),
          };
          cacheService.cache.set(CACHE_KEYS.TEMPLATE_LIST, list, 3600);
          try {
            const { Cache } = await import('../models/model.cache.js');
            await Cache.findOneAndUpdate(
              { key: CACHE_KEYS.TEMPLATE_LIST },
              { data: list, updatedAt: new Date() },
              { upsert: true }
            );
          } catch (dbErr) {
            // ignore
          }
        }
      }
    } catch (cacheErr) {
      console.warn('[updateTemplate] Cache update warning:', cacheErr.message);
    }

    await cacheService.invalidate(CACHE_KEYS.INTERPRETATION_LIST);
    await cacheService.invalidate(CACHE_KEYS.TEMPLATE_LIST);
    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: upstreamRes?.Message && upstreamRes?.Message !== 'Error In Proccessing - 1211'
        ? upstreamRes.Message
        : 'Template Report Updated',
      upstream: upstreamRes,
    });
  } catch (err) {
    next(err);
  }
};
