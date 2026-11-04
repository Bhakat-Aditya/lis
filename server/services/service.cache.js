import NodeCache from 'node-cache';
import { config } from '../config/config.env.js';
import { upstreamService } from './service.upstream.js';
import { Cache as CacheModel } from '../models/model.cache.js';
import {
  ALL_CLINICAL_DEFAULTS,
  DEFAULT_SAMPLES,
  DEFAULT_TEMPLATES,
} from './service.defaults.js';

export const DEFAULT_SIGNATURES = [
  { id: '1', name: 'Dr. P. K. Ghosh', designation: 'Consultant Pathologist (MD, DNB)' },
  { id: '2', name: 'Dr. S. Bhattacharya', designation: 'Consultant Microbiologist (MD)' },
  { id: '3', name: 'Dr. A. K. Roy', designation: 'Consultant Biochemist (Ph.D, FACB)' },
  { id: '4', name: 'Dr. M. Sen', designation: 'Senior Pathologist (MD Pathology)' },
  { id: '5', name: 'Dr. S. K. Das', designation: 'Chief Medical Director' },
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
    extract: (data) => data?.payLoadJSON?.profiles || [],
  },
  [CACHE_KEYS.PKG_LIST]: {
    api: 'GETPACKAGELIST',
    extract: (data) => data?.payLoadJSON?.packages || [],
  },
  [CACHE_KEYS.TEST_LIST]: {
    api: 'GETTESTLIST',
    extract: (data) => data?.payLoadJSON?.tests || [],
  },
  [CACHE_KEYS.TEMPLATE_LIST]: {
    api: 'GETTEMPLATELIST',
    extract: (data) => data?.payLoadJSON?.templateList || data?.payLoadJSON?.templates || data?.payLoadJSON?.interpretations || [],
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
    extract: (data) => data?.payLoadJSON?.refers || [],
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

class MasterCacheService {
  constructor() {
    // 24 hours TTL (86400 seconds)
    this.cache = new NodeCache({
      stdTTL: config.cacheTtlSeconds,
      checkperiod: 600,
    });
    this.metadata = new Map();
  }

  /**
   * Get list from cache or fetch from upstream if cache miss
   */
  async getList(cacheKey, forceRefresh = false, sid = null) {
    const cached = this.cache.get(cacheKey);
    const hasValidData = Array.isArray(cached) && cached.length > 0;

    if (!forceRefresh && this.cache.has(cacheKey) && hasValidData) {
      const meta = this.metadata.get(cacheKey) || {};
      return {
        data: cached,
        fromCache: true,
        cachedAt: meta.cachedAt,
        expiresAt: meta.expiresAt,
        itemCount: cached.length,
        nextId: meta.nextId || null,
        signList: meta.signList || DEFAULT_SIGNATURES,
      };
    }

    // Cache Miss, empty cache, or Force Refresh - Fetch from upstream or load from MongoDB
    return await this.refreshList(cacheKey, sid);
  }

  /**
   * Fetch latest from upstream and update cache with 24hr TTL
   */
  async refreshList(cacheKey, sid = null) {
    const mapping = API_MAPPING[cacheKey];
    if (!mapping) {
      throw new Error(`Unknown cache key: ${cacheKey}`);
    }

    // Resolve active session id
    let activeSid = sid || upstreamService.masterSid;
    if (!activeSid) {
      try {
        const { Session } = await import('../models/model.session.js');
        const latestActive = await Session.findOne({ isActive: true }).sort({ createdAt: -1 });
        if (latestActive?.upstreamSid) {
          activeSid = latestActive.upstreamSid;
          upstreamService.masterSid = activeSid;
        }
      } catch (e) {
        // ignore
      }
    }

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
        if (Array.isArray(rawData?.payLoadJSON?.signList)) {
          signList = rawData.payLoadJSON.signList;
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

    // 1. If upstream failed or returned 0, preserve existing memory cache if valid
    if (!items || items.length === 0) {
      const currentlyCached = this.cache.get(cacheKey);
      if (Array.isArray(currentlyCached) && currentlyCached.length > 0) {
        items = currentlyCached;
        console.log(`[Cache] Preserved existing memory cache for ${cacheKey} (${items.length} items).`);
      }
    }

    // 2. If still empty, try to recover from MongoDB
    if (!items || items.length === 0) {
      try {
        if (CacheModel?.findOne) {
          const dbDoc = await CacheModel.findOne({ key: cacheKey });
          if (dbDoc && Array.isArray(dbDoc.data) && dbDoc.data.length > 0) {
            items = dbDoc.data;
            console.log(`[Cache] Recovered ${items.length} items from MongoDB for ${cacheKey}`);
          }
        }
      } catch (dbErr) {
        // continue
      }
    }

    // 3. Clinical defaults fallback if upstream and MongoDB are both empty
    if (!items || items.length === 0) {
      const fallbackList = ALL_CLINICAL_DEFAULTS[cacheKey];
      if (Array.isArray(fallbackList) && fallbackList.length > 0) {
        items = [...fallbackList];
        console.log(`[Cache] Applied clinical default fallback for ${cacheKey} (${items.length} items).`);
      }
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

    // Optionally persist in MongoDB if connected (do not overwrite non-empty DB record with empty array)
    try {
      if (CacheModel?.findOneAndUpdate && items.length > 0) {
        await CacheModel.findOneAndUpdate(
          { key: cacheKey },
          {
            key: cacheKey,
            data: items,
            ttlSeconds: config.cacheTtlSeconds,
            expiresAt,
            itemCount: items.length,
            lastFetchedAt: now,
          },
          { upsert: true }
        );
      }
    } catch (dbErr) {
      // Continue even if mongo is offline
    }

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

    // 1. Immediately hydrate in-memory cache from MongoDB for instant sub-millisecond readiness
    try {
      if (CacheModel?.find) {
        const storedDocs = await CacheModel.find({});
        for (const doc of storedDocs) {
          if (doc?.key && Array.isArray(doc.data) && doc.data.length > 0) {
            this.cache.set(doc.key, doc.data, config.cacheTtlSeconds);
            this.metadata.set(doc.key, {
              cachedAt: doc.lastFetchedAt ? new Date(doc.lastFetchedAt).toISOString() : new Date().toISOString(),
              expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : new Date(Date.now() + config.cacheTtlSeconds * 1000).toISOString(),
              api: API_MAPPING[doc.key]?.api || '',
              itemCount: doc.data.length,
            });
          }
        }
        console.log(`[Cache] Pre-loaded ${storedDocs.length} master lists from MongoDB into memory.`);
      }
    } catch (dbInitErr) {
      console.warn('[Cache] Could not pre-load from MongoDB:', dbInitErr.message);
    }

    // 2. Fetch fresh data for any missing or empty lists
    const keys = Object.values(CACHE_KEYS);
    for (const key of keys) {
      try {
        const cached = this.cache.get(key);
        if (!cached || !Array.isArray(cached) || cached.length === 0) {
          await this.getList(key, true, sid);
        }
      } catch (err) {
        console.warn(`[Cache] Pre-warm failed for ${key}:`, err.message);
      }
    }
    console.log('[Cache] Master lists pre-warmed successfully.');
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
