import NodeCache from 'node-cache';
import { config } from '../config/config.env.js';
import { upstreamService } from './service.upstream.js';
import {
  ALL_CLINICAL_DEFAULTS,
  DEFAULT_SAMPLES,
  DEFAULT_TEMPLATES,
} from './service.defaults.js';

export const DEFAULT_SIGNATURES = [
  {
    id: '1',
    Id: 1,
    name: 'Bio-Chemistry',
    Name: 'Bio-Chemistry',
    post: 'Bio-Chemistry',
    Post: 'Bio-Chemistry',
    designation: 'Bio-Chemistry',
    image: 'https://lis.newlifecaremidnapore.com/lifecare/Bio-Chemistry.png',
    'Sign Image Source': 'https://lis.newlifecaremidnapore.com/lifecare/Bio-Chemistry.png',
  },
  {
    id: '2',
    Id: 2,
    name: 'Technician',
    Name: 'Technician',
    post: 'Technician',
    Post: 'Technician',
    designation: 'Technician',
    image: 'https://lis.newlifecaremidnapore.com/lifecare/Bishakha.png',
    'Sign Image Source': 'https://lis.newlifecaremidnapore.com/lifecare/Bishakha.png',
  },
  {
    id: '3',
    Id: 3,
    name: 'Microbiologist',
    Name: 'Microbiologist',
    post: 'Microbiologist',
    Post: 'Microbiologist',
    designation: 'Microbiologist',
    image: 'https://lis.newlifecaremidnapore.com/lifecare/Microbiologist.png',
    'Sign Image Source': 'https://lis.newlifecaremidnapore.com/lifecare/Microbiologist.png',
  },
  {
    id: '4',
    Id: 4,
    name: 'Pathologist',
    Name: 'Pathologist',
    post: 'Pathologist',
    Post: 'Pathologist',
    designation: 'Pathologist',
    image: 'https://lis.newlifecaremidnapore.com/lifecare/PATHOLOGIST.png',
    'Sign Image Source': 'https://lis.newlifecaremidnapore.com/lifecare/PATHOLOGIST.png',
  },
  {
    id: '5',
    Id: 5,
    name: 'Verification',
    Name: 'Verification',
    post: 'Verification',
    Post: 'Verification',
    designation: 'Verification',
    image: 'https://lis.newlifecaremidnapore.com/lifecare/Signature.png',
    'Sign Image Source': 'https://lis.newlifecaremidnapore.com/lifecare/Signature.png',
  },
];

export { DEFAULT_SAMPLES, DEFAULT_TEMPLATES, ALL_CLINICAL_DEFAULTS };

// Cache keys matching user specification
export const CACHE_KEYS = {
  DEPT_LIST: 'DEPT_LIST',
  UNIT_LIST: 'UNIT_LIST',
  METHOD_LIST: 'METHOD_LIST',
  PROFILE_LIST: 'PROFILE_LIST',
  PKG_LIST: 'PKG_LIST',
  TEST_LIST: 'TEST_LIST',
  TEMPLATE_LIST: 'TEMPLATE_LIST',
  SAMPLE_LIST: 'SAMPLE_LIST',
  DOCT_LIST: 'DOCT_LIST',
  REFERANCE_LIST: 'REFERANCE_LIST',
  BRANCH_LIST: 'BRANCH_LIST',
  USER_LIST: 'USER_LIST',
  INTERPRETATION_LIST: 'INTERPRETATION_LIST',
};

// Upstream API mapping for each cache key
export const API_MAPPING = {
  [CACHE_KEYS.DEPT_LIST]: {
    api: 'GETDEPERTMENTIST',
    extract: (data) => data?.payLoadJSON?.depertments || [],
  },
  [CACHE_KEYS.UNIT_LIST]: {
    api: 'GETUNITLIST',
    extract: (data) => data?.payLoadJSON?.units || [],
  },
  [CACHE_KEYS.METHOD_LIST]: {
    api: 'GETMETHODLIST',
    extract: (data) => data?.payLoadJSON?.methods || [],
  },
  [CACHE_KEYS.PROFILE_LIST]: {
    api: 'GETPROFILELIST',
    extract: (data) =>
      (data?.payLoadJSON?.profiles || []).map((p) => {
        const v = String(p?.Vowel ?? p?.vowel ?? p?.PROFILE_VOWEL ?? 'CITRT').trim().toUpperCase() || 'CITRT';
        const sn = String(p?.['Short Name'] ?? p?.shortName ?? p?.PROFILE_SHORT_NAME ?? '').trim().slice(0, 10);
        return {
          ...p,
          Vowel: v,
          vowel: v,
          'Short Name': sn,
          shortName: sn,
        };
      }),
  },
  [CACHE_KEYS.PKG_LIST]: {
    api: 'GETPACKAGELIST',
    extract: (data) => data?.payLoadJSON?.packages || [],
  },
  [CACHE_KEYS.TEST_LIST]: {
    api: 'GETTESTLIST',
    extract: (data) =>
      (data?.payLoadJSON?.tests || []).map((t) => {
        const v = String(t?.Vowel ?? t?.vowel ?? t?.TEST_VOWEL ?? 'CITRT').trim().toUpperCase() || 'CITRT';
        return {
          ...t,
          Vowel: v,
          vowel: v,
        };
      }),
  },
  [CACHE_KEYS.TEMPLATE_LIST]: {
    api: 'GETTEMPLATELIST',
    extract: (data) => data?.payLoadJSON?.templateList || data?.payLoadJSON?.templates || [],
  },
  [CACHE_KEYS.INTERPRETATION_LIST]: {
    api: 'GETINTERPRETATIONLIST',
    extract: (data) => data?.payLoadJSON?.interpretations || [],
  },
  [CACHE_KEYS.SAMPLE_LIST]: {
    api: 'GETSAMPLELIST',
    extract: (data) => data?.payLoadJSON?.samples || [],
  },
  [CACHE_KEYS.DOCT_LIST]: {
    api: 'GETDOCTORLIST',
    extract: (data) => data?.payLoadJSON?.doctors || [],
  },
  [CACHE_KEYS.REFERANCE_LIST]: {
    api: 'GETREFERLIST',
    extract: (data) =>
      (data?.payLoadJSON?.refers || []).map((r) => ({
        ...r,
        'Refer Id': r['Refer Id'] || r['Doct Id'] || r.id || '',
        id: r.id || r['Refer Id'] || r['Doct Id'] || '',
      })),
  },
  [CACHE_KEYS.BRANCH_LIST]: {
    api: 'GETBRANCHLIST',
    extract: (data) => data?.payLoadJSON?.branches || [],
  },
  [CACHE_KEYS.USER_LIST]: {
    api: 'GETUSERLIST',
    extract: (data) => data?.payLoadJSON?.users || [],
  },
};

/**
 * Robustly compute the next sequential ID for any master list if upstream nextId is absent
 */
export const computeNextIdForList = (cacheKey, items = []) => {
  if (cacheKey === CACHE_KEYS.USER_LIST) return '0';
  if (!Array.isArray(items) || items.length === 0) return '1';
  let maxNum = 0;
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const rawId =
      it['Test Id'] ||
      it['Dept Id'] ||
      it['Profile Id'] ||
      it['Package Id'] ||
      it['Doct Id'] ||
      it['Refer Id'] ||
      it['Unit Id'] ||
      it['Method Id'] ||
      it['Sample Id'] ||
      it.testId ||
      it.deptId ||
      it.profileId ||
      it.packageId ||
      it.branchId ||
      it.userId ||
      it.id;
    if (rawId !== undefined && rawId !== null) {
      const num = parseInt(String(rawId).replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return maxNum > 0 ? String(maxNum + 1) : '1';
};

class MasterCacheService {
  constructor() {
    // 24 hours TTL (86400 seconds)
    this.cache = new NodeCache({
      stdTTL: config.cacheTtlSeconds,
      checkperiod: 600,
    });
    this.metadata = new Map();
    this.inFlight = new Map();
  }

  /**
   * Get list from cache or fetch from upstream if cache miss
   */
  async getList(cacheKey, forceRefresh = false, sid = null) {
    const cached = this.cache.get(cacheKey);
    const hasValidData = Array.isArray(cached) && cached.length > 0;

    if (!forceRefresh && this.cache.has(cacheKey) && hasValidData) {
      const meta = this.metadata.get(cacheKey) || {};
      const resolvedNextId =
        meta.nextId !== undefined && meta.nextId !== null
          ? String(meta.nextId)
          : computeNextIdForList(cacheKey, cached);
      return {
        data: cached,
        fromCache: true,
        cachedAt: meta.cachedAt,
        expiresAt: meta.expiresAt,
        itemCount: cached.length,
        nextId: resolvedNextId,
        signList: meta.signList || DEFAULT_SIGNATURES,
      };
    }

    if (this.inFlight.has(cacheKey)) {
      return await this.inFlight.get(cacheKey);
    }

    const fetchPromise = this.refreshList(cacheKey, sid);
    this.inFlight.set(cacheKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  /**
   * Fetch latest from upstream and update cache with 24hr TTL
   */
  async refreshList(cacheKey, sid = null) {
    const mapping = API_MAPPING[cacheKey];
    if (!mapping) {
      throw new Error(`Unknown cache key: ${cacheKey}`);
    }

    // Resolve active session id passed for this request
    const activeSid = sid || null;

    let items = [];
    let nextId = null;
    let signList = null;

    try {
      console.log(`[Cache] Fetching fresh data from upstream for ${cacheKey} (${mapping.api})...`);
      const rawData = await upstreamService.get(mapping.api, {}, activeSid);
      if (rawData?.STATUS === 'SUCCESS' || rawData?.StatusCode === '0000') {
        const extracted = mapping.extract(rawData);
        if (Array.isArray(extracted) && extracted.length > 0) {
          items = extracted;
        }
        if (rawData?.payLoadJSON?.nextId !== undefined && rawData?.payLoadJSON?.nextId !== null) {
          nextId = String(rawData.payLoadJSON.nextId);
        }
        if (Array.isArray(rawData?.payLoadJSON?.signList) && rawData.payLoadJSON.signList.length > 0) {
          signList = rawData.payLoadJSON.signList.map((s) => ({
            id: String(s.Id ?? s.id ?? ''),
            Id: Number(s.Id ?? s.id ?? 0),
            name: s.Name ?? s.name ?? s.Post ?? s.designation ?? '',
            Name: s.Name ?? s.name ?? s.Post ?? s.designation ?? '',
            post: s.Post ?? s.post ?? s.designation ?? '',
            Post: s.Post ?? s.post ?? s.designation ?? '',
            designation: s.Post ?? s.post ?? s.designation ?? '',
            image: s['Sign Image Source'] ?? s.image ?? '',
            'Sign Image Source': s['Sign Image Source'] ?? s.image ?? '',
          }));
        }
      } else {
        console.warn(`[Cache] Upstream response not successful for ${cacheKey}: ${rawData?.Message || rawData?.StatusCode}`);
      }
    } catch (fetchErr) {
      console.warn(`[Cache] Upstream fetch failed for ${cacheKey}:`, fetchErr.message);
    }

    if (!signList && (cacheKey === CACHE_KEYS.DEPT_LIST || cacheKey === CACHE_KEYS.TEMPLATE_LIST)) {
      signList = DEFAULT_SIGNATURES;
    }

    // Template metadata: merge any locally assigned or saved template signatures and rates (Standard, Special 1, Special 2)
    if (cacheKey === CACHE_KEYS.TEMPLATE_LIST && Array.isArray(items) && items.length > 0) {
      const prevItems = this.cache.get(CACHE_KEYS.TEMPLATE_LIST) || [];
      const prevMap = new Map();
      if (Array.isArray(prevItems)) {
        prevItems.forEach((p) => {
          const k = String(p.templatesId || p.reportId || p.id || '').toUpperCase();
          prevMap.set(k, p);
        });
      }
      items = items.map((t) => {
        const k = String(t.templatesId || t.reportId || t.id || '').toUpperCase();
        const prev = prevMap.get(k) || {};
        return {
          ...prev,
          ...t,
          price: t.price || prev.price || prev.Rate || prev.rate || '0',
          Rate: t.price || prev.price || prev.Rate || prev.rate || '0',
          rate: t.price || prev.price || prev.Rate || prev.rate || '0',
          price1: t.price1 !== undefined ? t.price1 : (prev.price1 || prev.Rate1 || prev.rate1 || ''),
          Rate1: t.price1 !== undefined ? t.price1 : (prev.price1 || prev.Rate1 || prev.rate1 || ''),
          rate1: t.price1 !== undefined ? t.price1 : (prev.price1 || prev.Rate1 || prev.rate1 || ''),
          price2: t.price2 !== undefined ? t.price2 : (prev.price2 || prev.Rate2 || prev.rate2 || ''),
          Rate2: t.price2 !== undefined ? t.price2 : (prev.price2 || prev.Rate2 || prev.rate2 || ''),
          rate2: t.price2 !== undefined ? t.price2 : (prev.price2 || prev.Rate2 || prev.rate2 || ''),
          sign: t.sign || prev.sign || '',
        };
      });
    }

    // 1. If upstream failed or returned 0, preserve existing memory cache if valid
    if (!items || items.length === 0) {
      const currentlyCached = this.cache.get(cacheKey);
      if (Array.isArray(currentlyCached) && currentlyCached.length > 0) {
        items = currentlyCached;
        console.log(`[Cache] Preserved existing memory cache for ${cacheKey} (${items.length} items).`);
      }
    }

    // 2. Clinical defaults fallback if upstream is empty
    if (!items || items.length === 0) {
      const fallbackList = ALL_CLINICAL_DEFAULTS[cacheKey];
      if (Array.isArray(fallbackList) && fallbackList.length > 0) {
        items = [...fallbackList];
        console.log(`[Cache] Applied clinical default fallback for ${cacheKey} (${items.length} items).`);
      }
    }

    if (nextId === null || nextId === undefined) {
      nextId = computeNextIdForList(cacheKey, items);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.cacheTtlSeconds * 1000);

    // Save into in-memory node-cache
    this.cache.set(cacheKey, items, config.cacheTtlSeconds);
    this.metadata.set(cacheKey, {
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      api: mapping.api,
      itemCount: items.length,
      nextId: nextId || null,
      signList: signList || DEFAULT_SIGNATURES,
    });

    return {
      data: items,
      fromCache: false,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      itemCount: items.length,
      nextId: nextId || null,
      signList: signList || DEFAULT_SIGNATURES,
    };
  }

  /**
   * Invalidate specific cache item (called after update API calls)
   */
  async invalidate(cacheKey) {
    this.cache.del(cacheKey);
    this.metadata.delete(cacheKey);
    console.log(`[Cache] Invalidated cache for ${cacheKey}. Will refresh on next read.`);
  }

  /**
   * Invalidate and immediately refresh
   */
  async invalidateAndRefresh(cacheKey, sid = null) {
    this.cache.del(cacheKey);
    return await this.refreshList(cacheKey, sid);
  }

  /**
   * Pre-warm all master lists on server startup
   */
  async warmAllCaches(sid = null) {
    console.log('[Cache] Pre-warming master lists (24h TTL)...');

    // 1. Initialize empty lists with clinical defaults immediately for instantaneous readiness
    const keys = Object.values(CACHE_KEYS);
    for (const key of keys) {
      if (!this.cache.has(key)) {
        const fallbackList = ALL_CLINICAL_DEFAULTS[key] || [];
        if (Array.isArray(fallbackList) && fallbackList.length > 0) {
          const resolvedNextId = computeNextIdForList(key, fallbackList);
          this.cache.set(key, fallbackList, config.cacheTtlSeconds);
          this.metadata.set(key, {
            cachedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + config.cacheTtlSeconds * 1000).toISOString(),
            api: API_MAPPING[key]?.api || '',
            itemCount: fallbackList.length,
            nextId: resolvedNextId,
            signList: DEFAULT_SIGNATURES,
          });
        }
      }
    }

    // 2. If an active session is available, refresh lists from upstream
    if (sid) {
      for (const key of keys) {
        try {
          await this.getList(key, true, sid);
        } catch (err) {
          console.warn(`[Cache] Pre-warm failed for ${key}:`, err.message);
        }
      }
    }
    console.log('[Cache] Master lists ready.');
  }

  /**
   * Get status & metadata of all cached items
   */
  getCacheStats() {
    const stats = {};
    for (const [key, mapping] of Object.entries(API_MAPPING)) {
      const isCached = this.cache.has(key);
      const meta = this.metadata.get(key) || {};
      const cachedData = this.cache.get(key);
      const ttlMs = this.cache.getTtl(key) ? Math.max(0, this.cache.getTtl(key) - Date.now()) : 0;

      stats[key] = {
        isCached,
        api: mapping.api,
        cachedAt: meta.cachedAt || null,
        expiresAt: meta.expiresAt || null,
        ttlRemainingSeconds: Math.floor(ttlMs / 1000),
        itemCount: cachedData ? cachedData.length : 0,
      };
    }
    return stats;
  }
}

export const cacheService = new MasterCacheService();
