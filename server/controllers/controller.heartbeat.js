import axios from 'axios';

const BETTERSTACK_HEARTBEATS_URL = 'https://incidents.betterstack.com/api/v2/heartbeats';
const BETTERSTACK_TOKEN = process.env.BETTERSTACK_API_TOKEN || 'yrbEUMHrbSqwpLYoX2Mjr5Wn';

// In-memory cache for heartbeats (5-second TTL to avoid rate-limiting on rapid user clicks)
let heartbeatsCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5000;

/**
 * Format relative duration from seconds
 */
const formatDuration = (totalSeconds) => {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return `${hours}h ${remMinutes}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
};

/**
 * GET /api/heartbeats
 * Directly fetches live heartbeat telemetry from BetterStack API (bypasses AWS server)
 */
export const getHeartbeats = async (req, res, next) => {
  try {
    const forceFresh = req.query.fresh === 'true';
    const now = Date.now();

    if (!forceFresh && heartbeatsCache && (now - lastCacheTime < CACHE_TTL_MS)) {
      return res.json({
        ...heartbeatsCache,
        isCached: true,
        cacheAgeSeconds: Math.floor((now - lastCacheTime) / 1000),
      });
    }

    const response = await axios.get(BETTERSTACK_HEARTBEATS_URL, {
      headers: {
        Authorization: `Bearer ${BETTERSTACK_TOKEN}`,
        Accept: 'application/json',
      },
      timeout: 8000,
    });

    const rawData = response.data?.data || [];
    const pagination = response.data?.pagination || null;

    const heartbeats = rawData.map((item) => {
      const attr = item.attributes || {};
      const updatedAt = attr.updated_at ? new Date(attr.updated_at) : null;
      const createdAt = attr.created_at ? new Date(attr.created_at) : null;
      const ageSeconds = updatedAt && !isNaN(updatedAt.getTime())
        ? Math.max(0, Math.floor((now - updatedAt.getTime()) / 1000))
        : 0;

      const isUp = attr.status === 'up';

      return {
        id: String(item.id),
        type: item.type,
        name: attr.name || 'Unnamed Machine',
        status: attr.status, // "up" | "down"
        isUp,
        period: attr.period || 180,
        grace: attr.grace || 300,
        url: attr.url || '',
        paused: Boolean(attr.paused),
        timezone: attr.maintenance_timezone || 'Chennai',
        teamName: attr.team_name || 'Your team',
        createdAt: attr.created_at,
        updatedAt: attr.updated_at,
        ageSeconds,
        timeInState: formatDuration(ageSeconds),
        lastPingAgo: formatDuration(ageSeconds),
      };
    });

    const onlineCount = heartbeats.filter((h) => h.isUp).length;
    const offlineCount = heartbeats.filter((h) => !h.isUp).length;

    const payload = {
      STATUS: 'SUCCESS',
      source: 'BETTERSTACK_V2_DIRECT',
      fetchedAt: new Date().toISOString(),
      count: heartbeats.length,
      onlineCount,
      offlineCount,
      heartbeats,
      pagination,
    };

    heartbeatsCache = payload;
    lastCacheTime = now;

    return res.json(payload);
  } catch (err) {
    console.error('[Heartbeat] BetterStack API fetch error:', err.message);

    // Fallback to cache if available
    if (heartbeatsCache) {
      return res.json({
        ...heartbeatsCache,
        isCached: true,
        stale: true,
        warning: 'Failed to contact BetterStack, returning last known cache.',
      });
    }

    return res.status(502).json({
      STATUS: 'FAILED',
      StatusCode: '5002',
      Message: `Failed to fetch heartbeats from BetterStack: ${err.message}`,
    });
  }
};

