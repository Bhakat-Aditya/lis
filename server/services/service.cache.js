import NodeCache from 'node-cache';
import { config } from '../config/config.env.js';
import { upstreamService } from './service.upstream.js';
import { Cache as CacheModel } from '../models/model.cache.js';

// Cache keys matching user specification
export const CACHE_KEYS = {
  DEPT_LIST: 'DEPT_LIST',
  UNIT_LIST: 'UNIT_LIST',
  METHOD_LIST: 'METHOD_LIST',
  PROFILE_LIST: 'PROFILE_LIST',
  PKG_LIST: 'PKG_LIST',
  TEST_LIST: 'TEST_LIST',
  TEMPLATE_LIST: 'TEMPLATE_LIST',
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
    api: 'GETINTERPRETATIONLIST',
    extract: (data) => data?.payLoadJSON?.interpretations || [],
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
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      const meta = this.metadata.get(cacheKey) || {};
      return {
        data: cached,
        fromCache: true,
        cachedAt: meta.cachedAt,
        expiresAt: meta.expiresAt,
        itemCount: cached.length,
      };
    }

    // Cache Miss or Force Refresh - Fetch from upstream
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

    console.log(`[Cache] Fetching fresh data from upstream for ${cacheKey} (${mapping.api})...`);
    const rawData = await upstreamService.get(mapping.api, {}, sid);
    const items = mapping.extract(rawData);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.cacheTtlSeconds * 1000);

    // Save into in-memory node-cache
    this.cache.set(cacheKey, items, config.cacheTtlSeconds);
    this.metadata.set(cacheKey, {
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      api: mapping.api,
      itemCount: items.length,
    });

    // Optionally persist in MongoDB if connected
    try {
      if (CacheModel?.findOneAndUpdate) {
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
  async warmAllCaches() {
    console.log('[Cache] Pre-warming master lists (24h TTL)...');
    const keys = Object.values(CACHE_KEYS);
    for (const key of keys) {
      try {
        await this.getList(key);
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
