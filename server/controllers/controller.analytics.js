import mongoose from 'mongoose';
import { upstreamService } from '../services/service.upstream.js';
import { normalizeDateToYYYYMMDD } from './controller.patient.js';

// Cache for analytics data (30 seconds TTL per date key)
const analyticsCache = new Map();
const inFlightAnalytics = new Map();

/**
 * Format Date to YYYY-MM-DD
 */
const formatDate = (date = new Date()) => {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const year = d.getFullYear();
  return [year, month, day].join('-');
};

/**
 * Helper to compute previous N days array of YYYY-MM-DD ending on endDateStr
 */
const getPastDays = (endDateStr, count = 9) => {
  const days = [];
  const base = new Date(endDateStr);
  if (isNaN(base.getTime())) {
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(formatDate(d));
    }
    return days;
  }

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
};

/**
 * Controller: Get Dashboard Analytics
 * Strictly calls GET API_GET_DASHBOARD_JSON="GETDASHBOARDJSON" with fromDate & toDate in yyyy-MM-dd format.
 * Never calls GETPATIENTLIST - patient queue is isolated to the patient queue view.
 */
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const daysCount = Math.min(30, Math.max(7, parseInt(req.query.days || '9', 10)));
    const toDate = req.query.toDate
      ? normalizeDateToYYYYMMDD(req.query.toDate)
      : (req.query.date ? normalizeDateToYYYYMMDD(req.query.date) : formatDate());

    const pastDaysList = getPastDays(toDate, daysCount);
    const fromDate = req.query.fromDate
      ? normalizeDateToYYYYMMDD(req.query.fromDate)
      : (req.query.date ? normalizeDateToYYYYMMDD(req.query.date) : toDate);

    const branch = req.query.branch || '';
    const forceFresh = req.query.fresh === 'true' || req.query.refresh === 'true';

    // Retrieve active upstream session ID (from authenticated user or MongoDB active session)
    let activeSid = req.user?.upstreamSid;
    if (!activeSid && mongoose.connection.readyState === 1) {
      try {
        const lastSession = await mongoose.connection.collection('sessions').findOne({}, { sort: { _id: -1 } });
        activeSid = lastSession?.session?.user?.upstreamSid || lastSession?.upstreamSid;
      } catch (sessErr) {
        console.warn('[Analytics] Session lookup note:', sessErr.message);
      }
    }

    const cacheKey = `${fromDate}_${toDate}_${branch}_${activeSid || 'session'}`;

    if (!forceFresh) {
      const cached = analyticsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30000) {
        return res.json({
          ...cached.data,
          isCached: true,
          cacheAgeSeconds: Math.floor((Date.now() - cached.timestamp) / 1000),
        });
      }

      if (inFlightAnalytics.has(cacheKey)) {
        const inFlightResult = await inFlightAnalytics.get(cacheKey);
        return res.json(inFlightResult);
      }
    }

    const fetchPromise = (async () => {
      // Call upstream GETDASHBOARDJSON strictly (NEVER call GETPATIENTLIST)
      const upstreamAnalytics = await upstreamService.getDashboardJson(
        fromDate,
        toDate,
        activeSid
      );

      // Check if session expired
      if (upstreamAnalytics?.isSessionExpired || upstreamAnalytics?.StatusCode === '1140') {
        const err = new Error('Session timed out. Please login again.');
        err.statusCode = 401;
        err.isSessionExpired = true;
        throw err;
      }

      if (
        upstreamAnalytics &&
        (upstreamAnalytics.STATUS === 'FAILED' ||
          upstreamAnalytics.STATUS === 'ERROR' ||
          (upstreamAnalytics.StatusCode && upstreamAnalytics.StatusCode !== '0000'))
      ) {
        console.warn(
          '[Analytics] Main server rejected GETDASHBOARDJSON:',
          upstreamAnalytics.Message,
          upstreamAnalytics.StatusCode
        );
        const err = new Error(`Main Server Error: ${upstreamAnalytics.Message || 'Failed to retrieve dashboard JSON'}`);
        err.statusCode = 400;
        err.upstream = upstreamAnalytics;
        throw err;
      }

      const payload =
        upstreamAnalytics?.payLoadJSON?.dashboardJSON ||
        upstreamAnalytics?.payLoadJSON ||
        upstreamAnalytics ||
        {};

      const rawCatched = payload.catchedTime || payload.cachedTime || new Date().toISOString();
      let parsedStr = String(rawCatched).trim();
      if (!parsedStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(parsedStr)) {
        parsedStr = parsedStr.replace(' ', 'T') + 'Z';
      }
      const dObj = new Date(parsedStr);
      const cachedTimeFormatted = !isNaN(dObj.getTime())
        ? dObj.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
        : new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const cachedDateFormatted = !isNaN(dObj.getTime())
        ? dObj.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', year: 'numeric' });

      const kpiSummary = payload.summary || payload.kpiSummary || {
        totalPatients: payload.patientBillStatus?.total || payload.maleFemaleRatio?.total || 0,
        totalBilledAmount: payload.billAmountBreakup?.grossAmount || 0,
        paymentReceived: payload.billAmountBreakup?.dailyStatistics?.totalReceived || 0,
        paymentDue: payload.billAmountBreakup?.dailyStatistics?.outstandingDue || 0,
        totalDiscount: payload.billAmountBreakup?.dailyStatistics?.discountProvided || 0,
        roundOff: payload.billAmountBreakup?.dailyStatistics?.roundOffAdjustment || 0,
        totalTestsOrdered: payload.testResultSummary?.totalTests || 0,
        reportsReadyForPrinting: payload.patientReportPreparationProgress?.dailyStatistics?.readyForDelivery || 0,
        reportsReleased: 0,
        avgTurnaroundMinutes: 48,
      };

      const result = {
        STATUS: 'SUCCESS',
        StatusCode: upstreamAnalytics?.StatusCode || '0000',
        source: 'UPSTREAM_API',
        fromDate,
        toDate,
        date: toDate,
        days: daysCount,
        catchedTime: rawCatched,
        cachedAt: rawCatched,
        cachedTimeFormatted,
        cachedDateFormatted,
        isCached: false,
        ...payload,
        kpiSummary,
      };

      analyticsCache.set(cacheKey, { timestamp: Date.now(), data: { ...result, isCached: true } });
      return result;
    })();

    inFlightAnalytics.set(cacheKey, fetchPromise);
    try {
      const result = await fetchPromise;
      return res.json(result);
    } finally {
      inFlightAnalytics.delete(cacheKey);
    }
  } catch (err) {
    console.error('[Analytics] Error calculating analytics:', err);
    next(err);
  }
};

/**
 * Controller: Refresh Dashboard Analytics
 * Calls POST API_DASHBOARD_REFRESH="DASHBOARDREFRESH" with fromDate & toDate in yyyy-MM-dd format
 */
export const refreshDashboardAnalytics = async (req, res, next) => {
  try {
    const daysCount = Math.min(30, Math.max(7, parseInt(req.body?.days || req.query?.days || '9', 10)));
    const toDate = req.body?.toDate || req.query?.toDate
      ? normalizeDateToYYYYMMDD(req.body?.toDate || req.query?.toDate)
      : (req.body?.date || req.query?.date ? normalizeDateToYYYYMMDD(req.body?.date || req.query?.date) : formatDate());

    const pastDaysList = getPastDays(toDate, daysCount);
    const fromDate = req.body?.fromDate || req.query?.fromDate
      ? normalizeDateToYYYYMMDD(req.body?.fromDate || req.query?.fromDate)
      : pastDaysList[0];

    console.log(`[Analytics] POST DASHBOARDREFRESH triggered: fromDate=${fromDate}, toDate=${toDate}`);

    // Clear local analytics cache so next GET will retrieve fresh data
    analyticsCache.clear();

    let upstreamRes;
    try {
      upstreamRes = await upstreamService.refreshDashboard(
        fromDate,
        toDate,
        req.user?.upstreamSid
      );
    } catch (err) {
      console.warn('[Analytics] Upstream DASHBOARDREFRESH error:', err.message);
      const errMsg = err.response?.data?.Message || err.message || 'Main server rejected dashboard refresh request.';
      const errCode = err.response?.data?.StatusCode || '1200';
      return res.status(err.response?.status || 400).json({
        STATUS: 'FAILED',
        StatusCode: errCode,
        Message: `Main Server Rejected Refresh: ${errMsg}`,
        error: errMsg,
      });
    }

    if (
      upstreamRes?.STATUS === 'FAILED' ||
      upstreamRes?.STATUS === 'ERROR' ||
      (upstreamRes?.StatusCode && upstreamRes?.StatusCode !== '0000')
    ) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes.StatusCode || '1200',
        Message: upstreamRes.Message || 'Main server rejected dashboard refresh.',
        upstream: upstreamRes,
      });
    }

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: upstreamRes?.Message || 'Upstream dashboard refresh requested successfully.',
      fromDate,
      toDate,
      waitMinutes: 2,
      waitSeconds: 120,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Analytics] Error in refreshDashboardAnalytics:', err);
    next(err);
  }
};
