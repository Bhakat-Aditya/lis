import axios from 'axios';
import { upstreamService } from '../services/service.upstream.js';
import { reportOverrideService } from '../services/service.reportOverride.js';
import { invalidatePatientListCache } from './controller.patient.js';
import { cacheService, CACHE_KEYS } from '../services/service.cache.js';

// Deduplication and short-lived cache (5s) to eliminate duplicate calls
const reportCache = new Map();
const inFlightReports = new Map();

export const invalidateReportCache = (patientId) => {
  if (!patientId) return;
  const rawPid = String(patientId).trim().toUpperCase();
  const cleanPid = rawPid.startsWith('P') ? `P${rawPid.replace(/^P+/i, '')}` : `P${rawPid}`;
  reportCache.delete(cleanPid);
  reportCache.delete(rawPid);
  const alt = cleanPid.startsWith('P') ? cleanPid.slice(1) : cleanPid;
  reportCache.delete(alt);
  upstreamService.clearBillingCache(cleanPid);
  upstreamService.clearBillingCache(rawPid);
  upstreamService.clearBillingCache(alt);
};

export const getPatientReport = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId is required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    // 1. Check cache (5s TTL to prevent duplicate calls from multiple component mounts)
    const isFresh = req.query.fresh === 'true' || req.query.sync === 'true';
    const cached = reportCache.get(cleanPatientId);
    if (!isFresh && cached && (Date.now() - cached.timestamp < 5000)) {
      return res.json(cached.data);
    }

    // 2. In-flight request deduplication
    let upstreamData;
    if (inFlightReports.has(cleanPatientId)) {
      upstreamData = await inFlightReports.get(cleanPatientId);
    } else {
      const fetchPromise = upstreamService.get(
        'GETPATIENTREPORT',
        { patientId: cleanPatientId },
        req.user?.upstreamSid
      );
      inFlightReports.set(cleanPatientId, fetchPromise);
      try {
        upstreamData = await fetchPromise;
      } finally {
        inFlightReports.delete(cleanPatientId);
      }
    }

    // Check if upstream returned rate-limit error 8887 or failed operation
    const isRateLimited =
      upstreamData?.StatusCode === '8887' ||
      String(upstreamData?.Message || '').includes('8887') ||
      String(upstreamData?.Message || '').toLowerCase().includes('exceeded per minute limit') ||
      String(upstreamData?.Message || '').toLowerCase().includes('limit for this operation');

    const isUpstreamFailed =
      upstreamData?.STATUS === 'FAILED' &&
      (!upstreamData?.payLoadJSON?.reports || upstreamData?.payLoadJSON?.reports.length === 0);

    if (isRateLimited || isUpstreamFailed) {
      console.warn(`[Report] Upstream limit or failure for ${cleanPatientId}: StatusCode=${upstreamData?.StatusCode}, Message=${upstreamData?.Message}`);
      // If we have cached report data, serve it so the UI remains completely intact!
      if (cached?.data?.reports && cached.data.reports.length > 0) {
        console.warn(`[Report] Serving cached data for ${cleanPatientId} to preserve UI intact.`);
        return res.json({
          ...cached.data,
          rateLimited: true,
          StatusCode: upstreamData?.StatusCode || '8887',
          STATUS: 'RATE_LIMITED',
          Message: upstreamData?.Message || 'Exceeded per minute limit for this operation - 8887',
          warningMessage: upstreamData?.Message || 'Exceeded per minute limit for this operation - 8887',
        });
      }

      // If no cache exists yet, return failure status without destroying UI state
      return res.json({
        STATUS: 'FAILED',
        StatusCode: upstreamData?.StatusCode || '8887',
        rateLimited: true,
        Message: upstreamData?.Message || 'Exceeded per minute limit for this operation - 8887',
        patient: null,
        reports: [],
        templates: [],
      });
    }

    const payload = upstreamData?.payLoadJSON || {};
    const rawReports = payload.reports || [];
    const patient = payload.patient || null;
    const printPDFUrl = payload.printPDFUrl || '';
    const printPDFUrlWithHeader = printPDFUrl ? printPDFUrl.replace('addHeader=false', 'addHeader=true') : '';
    const printPDFUrlWithoutHeader = printPDFUrl ? printPDFUrl.replace('addHeader=true', 'addHeader=false') : '';

    // Apply persisted soft-deleted and status overrides so deleted tests persist across page refreshes
    let overrides = {};
    try {
      overrides = await reportOverrideService.getOverrides(cleanPatientId);
    } catch (e) {
      console.warn(`[Report] Error fetching overrides for ${cleanPatientId}:`, e.message);
    }

    // Retrieve master tests to enrich report items with operation permissions
    let masterTests = [];
    try {
      const cachedTests = await cacheService.getList(CACHE_KEYS.TEST_LIST, false, req.user?.upstreamSid);
      masterTests = cachedTests?.data || [];
    } catch (e) {
      // Ignore cache lookup failure
    }

    const toBoolFlag = (val, def) => {
      if (val === undefined || val === null || val === '') return def;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val !== 0;
      const s = String(val).toLowerCase().trim();
      if (s === 'true' || s === '1') return true;
      if (s === 'false' || s === '0') return false;
      return def;
    };

    const reports = rawReports.map((r) => {
      const rid = String(r.reportId || '').trim();
      let statusOverride = null;
      let isDel = false;
      if (overrides[rid]) {
        statusOverride = overrides[rid].status || 'DELETED';
        isDel = statusOverride === 'DELETED';
      }

      // Map with master test list
      const rTestId = String(r.testId || '').trim();
      const normTestId = rTestId.replace(/^t/i, '').trim();
      const rName = String(r.testName || '').toLowerCase().trim();
      const matchedTest = masterTests.find((t) => {
        const mId = String(t['Test Id'] || t.testId || t.id || '').trim();
        if (mId.toLowerCase() === rTestId.toLowerCase()) return true;
        const mNorm = mId.replace(/^t/i, '').trim();
        if (mNorm && normTestId && mNorm.toLowerCase() === normTestId.toLowerCase()) return true;
        const mName = String(t.Name || t.name || '').toLowerCase().trim();
        return Boolean(mName && rName && mName === rName);
      });

      return {
        ...r,
        ...(statusOverride ? { status: statusOverride, isDeleted: isDel } : {}),
        possibleCalculate: r.possibleCalculate !== undefined
          ? toBoolFlag(r.possibleCalculate, false)
          : (matchedTest ? toBoolFlag(matchedTest.possibleCalculate, false) : false),
        possibleDownload: r.possibleDownload !== undefined
          ? toBoolFlag(r.possibleDownload, true)
          : (matchedTest ? toBoolFlag(matchedTest.possibleDownload, true) : true),
        possibleEntry: r.possibleEntry !== undefined
          ? toBoolFlag(r.possibleEntry, true)
          : (matchedTest ? toBoolFlag(matchedTest.possibleEntry, true) : true),
        possibleUpload: r.possibleUpload !== undefined
          ? toBoolFlag(r.possibleUpload, false)
          : (matchedTest ? toBoolFlag(matchedTest.possibleUpload, false) : false),
      };
    });

    const templates = (payload.templates || []).map((t) => {
      let parsed = null;
      if (typeof t.resultJson === 'string') {
        try {
          parsed = JSON.parse(t.resultJson);
        } catch (e) {
          parsed = t.resultJson;
        }
      } else {
        parsed = t.resultJson;
      }
      return { ...t, resultJsonParsed: parsed };
    });

    let billing = upstreamService.getCachedBilling(cleanPatientId);
    if (!billing || req.query.withBilling === 'true' || req.query.fresh === 'true') {
      try {
        billing = await upstreamService.getBillingSummary(cleanPatientId, req.user?.upstreamSid);
      } catch (e) {
        console.warn(`[Report] getBillingSummary error for ${cleanPatientId}:`, e.message);
      }
    }

    const billUrl = billing?.billUrl || '';

    const patientTotal = Number(patient?.totalBill || 0);
    const discountVal = Number(billing?.discount || patient?.discount || 0);
    const roundoffVal = Number(billing?.roundoff || patient?.roundoff || 0);

    const effectiveGross = Number(billing?.gross || 0) > 0
      ? Number(billing.gross)
      : (Number(billing?.total || 0) > 0 ? Number(billing.total) : patientTotal);

    const effectiveTotal = Number(billing?.total || 0) > 0
      ? Number(billing.total)
      : patientTotal;

    const statusNum = Number(patient?.billPayStatus);
    const paidAmount = billing ? Number(billing.paid) : Number(patient?.paidBill || 0);
    const isPaid = statusNum === 2 || (effectiveTotal > 0 && paidAmount >= effectiveTotal);
    const isUnpaid = statusNum === 3 || (!isPaid && statusNum !== 1 && effectiveTotal > 0);
    const resolvedPayStatus = isPaid ? 2 : (isUnpaid ? 3 : 1);

    const normalizePatientStatus = (raw) => {
      const s = String(raw || '').toUpperCase().trim();
      if (s === 'SAMPLE' || s.includes('SAMPLE')) return 'SAMPLE';
      if (s === 'RESULT PARTLY' || s === 'DATA_PART' || s.includes('PART')) return 'RESULT PARTLY';
      if (s === 'RESULT FULLY' || s === 'DATA_FULL' || s.includes('FULL')) return 'RESULT FULLY';
      if (s === 'PRINTING' || s === 'PRINT' || s.includes('PRINT')) return 'PRINTING';
      if (s === 'RELEASED' || s === 'RELEASE' || s === 'READY' || s.includes('RELEASE')) return 'RELEASED';
      return 'ENTRY';
    };

    const effectiveDue = isPaid
      ? 0
      : (billing && billing.due !== undefined
          ? Number(billing.due)
          : Math.max(0, effectiveTotal - paidAmount));

    const patientWithBilling = patient
      ? {
          ...patient,
          status: normalizePatientStatus(patient.status),
          grossTotal: effectiveGross > 0 ? effectiveGross : patientTotal,
          totalBill: effectiveTotal > 0 ? effectiveTotal : patientTotal,
          discount: discountVal,
          roundoff: roundoffVal,
          paidBill: isPaid && paidAmount === 0 && effectiveTotal > 0 ? effectiveTotal : paidAmount,
          balance: effectiveDue,
          dueAmount: effectiveDue,
          billPayStatus: resolvedPayStatus,
          paymentLines: billing?.paymentLines || [],
          payments: billing?.paymentLines || [],
          billUrl,
          printPDFUrl,
          reportUrl: printPDFUrl,
          printPDFUrlWithHeader,
          printPDFUrlWithoutHeader,
          testList: billing?.testList || [],
        }
      : null;

    const responseData = {
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      patient: patientWithBilling,
      reports,
      templates,
      billing,
      printPDFUrl,
      reportUrl: printPDFUrl,
      printPDFUrlWithHeader,
      printPDFUrlWithoutHeader,
      billUrl,
    };

    if (responseData.reports && responseData.reports.length > 0) {
      reportCache.set(cleanPatientId, { timestamp: Date.now(), data: responseData });
    }
    return res.json(responseData);
  } catch (err) {
    next(err);
  }
};


/**
 * Synchronize the upstream bill (BILLUPDATE) whenever a test/report rate is updated
 */
export const syncPatientBillFromReportRate = async (cleanPatientId, reportId, testName, rate, profileName, sid) => {
  try {
    const newRate = parseFloat(rate);
    if (isNaN(newRate)) return;

    // 1. Fetch current bill from GETBILLJSON
    let billData = null;
    const altPid = cleanPatientId.startsWith('P') ? cleanPatientId.slice(1) : cleanPatientId;
    try {
      billData = await upstreamService.get('GETBILLJSON', { patientId: cleanPatientId }, sid);
      if (!billData?.payLoadJSON?.bill && altPid !== cleanPatientId) {
        billData = await upstreamService.get('GETBILLJSON', { patientId: altPid }, sid);
      }
    } catch (e) {
      console.warn('[SyncBill] GETBILLJSON fetch error:', e.message);
    }

    const b = billData?.payLoadJSON?.bill;
    let items = [];
    let billHeading = 'TXN/RECEIPT';
    let discPerc = 0;
    let discAmt = 0;
    let roundoff = 0;

    if (b && Array.isArray(b['Test List']) && b['Test List'].length > 0) {
      billHeading = b['Bill Name'] || b['billname'] || 'TXN/RECEIPT';
      discPerc = parseFloat(b['disc'] || b['Discount Percent'] || 0) || 0;
      discAmt = parseFloat(b['Discount'] || b['discamt'] || 0) || 0;
      roundoff = parseFloat(b['Round Off'] || b['roundoff'] || 0) || 0;

      items = b['Test List'].map((t) => ({
        name: t['Bill Particulars'] || '',
        amount: parseFloat(t.Amount || 0) || 0,
        date: t['Bill Date'] || '',
      }));

      const targetTest = String(testName || '').toLowerCase().trim();
      const targetProf = String(profileName || '').toLowerCase().trim();

      // Find matching item in bill list
      let matchedIdx = items.findIndex((it) => {
        const itName = String(it.name || '').toLowerCase().trim();
        return (
          itName === targetTest ||
          (targetTest && (itName.includes(targetTest) || targetTest.includes(itName))) ||
          (targetProf && itName === targetProf)
        );
      });

      if (matchedIdx !== -1) {
        if (Math.abs(items[matchedIdx].amount - newRate) < 0.01) {
          return;
        }
        items[matchedIdx].amount = newRate;
      } else if (items.length === 1) {
        if (Math.abs(items[0].amount - newRate) < 0.01) {
          return;
        }
        items[0].amount = newRate;
      } else {
        items.push({
          name: testName || 'Test',
          amount: newRate,
          date: '',
        });
      }
    } else {
      // No existing bill in GETBILLJSON, retrieve patient report and construct bill items
      let pReport = null;
      try {
        pReport = await upstreamService.get('GETPATIENTREPORT', { patientId: cleanPatientId }, sid);
      } catch (e) {
        console.warn('[SyncBill] GETPATIENTREPORT fetch error:', e.message);
      }
      const pReports = pReport?.payLoadJSON?.reports || [];
      const seenLots = new Map();

      pReports.forEach((r) => {
        const lotKey = r.packageName || r.profileName || r.testName || `rep_${r.reportId}`;
        const lotName = r.packageName || r.profileName || r.testName;
        const isTarget =
          String(r.reportId) === String(reportId) ||
          String(r.testName || '').toLowerCase().trim() === String(testName || '').toLowerCase().trim();
        const lotRate = isTarget ? newRate : parseFloat(r.rate) || 0;

        if (!seenLots.has(lotKey)) {
          seenLots.set(lotKey, { name: lotName, amount: lotRate, date: '' });
        }
      });

      items = Array.from(seenLots.values());
    }

    if (items.length > 0) {
      const today = new Date();
      const d = String(today.getDate()).padStart(2, '0');
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const y = today.getFullYear();
      const formattedDate = `${d}/${m}/${y}`;

      const grossTotal = items.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      if (discPerc > 0 && discAmt === 0) {
        discAmt = Math.round(((grossTotal * discPerc) / 100) * 100) / 100;
      } else {
        discAmt = Math.min(grossTotal, discAmt);
      }

      const remainder = grossTotal - discAmt;
      const rounded = Math.round(remainder);
      const computedRo = Math.round((remainder - rounded) * 100) / 100;
      const finalBillAmount = Math.max(0, rounded);

      const billParams = {
        patientId: cleanPatientId,
        isNew: '0',
        action: 'addbill',
        billname: billHeading,
        count: String(items.length),
        totalamt: grossTotal.toFixed(2),
        disc: String(discPerc),
        discamt: discAmt.toFixed(2),
        roundoff: (computedRo >= 0 ? computedRo : -computedRo).toFixed(2),
        billamount: finalBillAmount.toFixed(2),
      };

      items.forEach((it, i) => {
        const n = i + 1;
        billParams[`name${n}`] = String(it.name || '').trim();
        billParams[`date${n}`] = it.date || formattedDate;
        billParams[`amt${n}`] = String(it.amount !== undefined ? it.amount : 0);
      });

      const billRes = await upstreamService.post('BILLUPDATE', billParams, null, sid);
      if (billRes && (billRes.STATUS === 'FAILED' || billRes.STATUS === 'ERROR' || (billRes.StatusCode && String(billRes.StatusCode).trim() !== '0000'))) {
        console.warn('[SyncBill] Upstream BILLUPDATE returned failed response:', billRes.Message || billRes.StatusCode);
        return;
      }

      upstreamService.clearBillingCache(cleanPatientId);
      upstreamService.clearBillingCache(altPid);
      try {
        await upstreamService.getBillingSummary(cleanPatientId, sid);
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    console.warn('[SyncBill] Error synchronizing bill from report rate:', err.message);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const {
      profileName = '',
      deptName = 'D1',
      reportId,
      patientId,
      sampleId = '',
      testName = '',
      rate = '',
      method = '',
      refRange = '',
      resultData = '',
      comment = '',
    } = req.body;

    const resolvedSampleType = req.body.sampletype || req.body.sampleType || 'Serum';
    const resolvedUnit = req.body.unit || req.body.unitref || '';
    const resolvedUnitRef = req.body.unitref || req.body.unit || '';

    if (!reportId || !patientId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'reportId and patientId are required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    // Resolve Master IDs for method and unit
    let finalMethodId = String(method || '').trim();
    let finalUnitId = String(resolvedUnit || '').trim();

    try {
      if (finalMethodId || finalUnitId) {
        const [methodListRes, unitListRes] = await Promise.all([
          cacheService.getList(CACHE_KEYS.METHOD_LIST).catch(() => ({ data: [] })),
          cacheService.getList(CACHE_KEYS.UNIT_LIST).catch(() => ({ data: [] })),
        ]);
        const masterMethods = methodListRes?.data || [];
        const masterUnits = unitListRes?.data || [];

        if (finalMethodId) {
          const cleanM = finalMethodId.toLowerCase();
          const matchById = masterMethods.find(
            (m) =>
              String(m['Method Id'] || m.id || '').trim().toLowerCase() === cleanM ||
              String(m['Method Id'] || m.id || '').replace(/^M/i, '').toLowerCase() === cleanM.replace(/^M/i, '')
          );
          if (matchById) {
            finalMethodId = String(matchById['Method Id'] || matchById.id || '').trim();
          } else {
            const matchByName = masterMethods.find(
              (m) => String(m.Name || m.name || '').toLowerCase().trim() === cleanM
            );
            if (matchByName) {
              finalMethodId = String(matchByName['Method Id'] || matchByName.id || '').trim();
            }
          }
        }

        if (finalUnitId) {
          const cleanU = finalUnitId.toLowerCase();
          const matchById = masterUnits.find(
            (u) =>
              String(u['Unit Id'] || u.id || '').trim().toLowerCase() === cleanU ||
              String(u['Unit Id'] || u.id || '').replace(/^U/i, '').toLowerCase() === cleanU.replace(/^U/i, '')
          );
          if (matchById) {
            finalUnitId = String(matchById['Unit Id'] || matchById.id || '').trim();
          } else {
            const matchByName = masterUnits.find(
              (u) => String(u.Name || u.name || '').toLowerCase().trim() === cleanU
            );
            if (matchByName) {
              finalUnitId = String(matchByName['Unit Id'] || matchByName.id || '').trim();
            }
          }
        }
      }
    } catch (e) {
      console.warn('[UpdateReport] Master ID resolution note:', e.message);
    }

    let finalRate = rate !== undefined && rate !== null ? String(rate).trim() : '';
    let finalResultData = resultData !== undefined && resultData !== null ? String(resultData) : '';

    if (!finalRate || !finalResultData) {
      try {
        const cached = reportCache.get(cleanPatientId);
        const repList = cached?.data?.reports || [];
        const existingRep = repList.find((r) => String(r.reportId || '').trim() === String(reportId).trim());
        if (existingRep) {
          if (!finalRate) {
            finalRate = String(existingRep.rate || existingRep.Rate || existingRep.amount || existingRep.Amount || '').trim();
          }
          if (!finalResultData) {
            finalResultData = String(existingRep.resultData || existingRep.ResultData || '').trim();
          }
        }
      } catch (e) {
        // non-blocking fallback
      }
    }

    const params = {
      profileName: profileName || '',
      deptName: deptName || 'D1',
      reportId,
      patientId: cleanPatientId,
      sampleId: sampleId || '',
      testName: testName || '',
      rate: finalRate,
      sampletype: resolvedSampleType,
      sampleType: resolvedSampleType,
      method: finalMethodId,
      refRange: refRange || '',
      unitref: finalUnitId,
      resultData: finalResultData,
      unit: finalUnitId,
      comment: comment || '',
    };

    const upstreamData = await upstreamService.post('UPDATEREPORT', params, null, req.user?.upstreamSid);

    // If a rate was provided or changed, automatically sync the patient's bill (BILLUPDATE)
    if (finalRate !== '' && !isNaN(Number(finalRate)) && Number(finalRate) > 0) {
      await syncPatientBillFromReportRate(
        cleanPatientId,
        reportId,
        testName,
        finalRate,
        profileName,
        req.user?.upstreamSid
      );
    }

    invalidateReportCache(patientId);
    invalidateReportCache(cleanPatientId);
    invalidatePatientListCache();

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report updated successfully',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};


export const receiveSample = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    const upstreamData = await upstreamService.post('RECEIVESAMPLE', { patientId: cleanPatientId }, null, req.user?.upstreamSid);
    invalidateReportCache(cleanPatientId);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Sample received successfully',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyReport = async (req, res, next) => {
  try {
    const { patientId, reportId, reportIds } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    let resolvedReportId = '';
    if (reportId && String(reportId).trim() !== 'undefined') {
      resolvedReportId = Array.isArray(reportId) ? reportId.join(',') : String(reportId).trim();
    } else if (reportIds && Array.isArray(reportIds)) {
      resolvedReportId = reportIds.filter(Boolean).join(',');
    } else {
      // Auto-fetch all report IDs for this patient so upstream never fails with 1211
      const pData = await upstreamService.get('GETPATIENTREPORT', { patientId: cleanPatientId }, req.user?.upstreamSid);
      const repList = (pData?.payLoadJSON?.reports || []).map((r) => r.reportId).filter(Boolean);
      if (repList.length > 0) {
        resolvedReportId = repList.join(',');
      }
    }

    const params = { patientId: cleanPatientId };
    if (resolvedReportId) {
      params.reportId = resolvedReportId;
    }

    const upstreamData = await upstreamService.post('REPORTVERIFY', params, null, req.user?.upstreamSid);
    invalidateReportCache(cleanPatientId);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report verified by pathologist',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const approveReport = async (req, res, next) => {
  try {
    const { patientId, reportId, reportIds } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    let resolvedReportId = '';
    if (reportId && String(reportId).trim() !== 'undefined') {
      resolvedReportId = Array.isArray(reportId) ? reportId.join(',') : String(reportId).trim();
    } else if (reportIds && Array.isArray(reportIds)) {
      resolvedReportId = reportIds.filter(Boolean).join(',');
    } else {
      // Auto-fetch all report IDs for this patient so upstream never fails with 1211
      const pData = await upstreamService.get('GETPATIENTREPORT', { patientId: cleanPatientId }, req.user?.upstreamSid);
      const repList = (pData?.payLoadJSON?.reports || []).map((r) => r.reportId).filter(Boolean);
      if (repList.length > 0) {
        resolvedReportId = repList.join(',');
      }
    }

    const params = { patientId: cleanPatientId };
    if (resolvedReportId) {
      params.reportId = resolvedReportId;
    }

    const upstreamData = await upstreamService.post('REPORTAPPROVE', params, null, req.user?.upstreamSid);
    invalidateReportCache(cleanPatientId);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report clinically approved and signed off by Doctor',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const rejectReport = async (req, res, next) => {
  try {
    const { patientId, reportId, reason = '' } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    const params = {
      patientId: cleanPatientId,
      reason: reason || 'Flagged for recollection / re-test',
    };
    if (reportId && String(reportId).trim() !== 'undefined') {
      params.reportId = String(reportId).trim();
    }

    const upstreamData = await upstreamService.post('REPORTREJECT', params, null, req.user?.upstreamSid);
    invalidateReportCache(cleanPatientId);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report flagged for re-test / rejected',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const releaseReport = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    const upstreamData = await upstreamService.post('RELEASEREPORT', { patientId: cleanPatientId }, null, req.user?.upstreamSid);
    invalidateReportCache(cleanPatientId);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report released for delivery and printing',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const calculateResult = async (req, res, next) => {
  try {
    const { patientId, reportId } = req.body;
    if (!patientId || !reportId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and reportId are required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    const upstreamData = await upstreamService.post(
      'CALCULATERESULT',
      { patientId: cleanPatientId, reportId: String(reportId).trim() },
      null,
      req.user?.upstreamSid
    );

    const isSuccess = upstreamData?.STATUS === 'SUCCESS' && upstreamData?.StatusCode === '0000';
    const message = upstreamData?.Message || (isSuccess ? 'Result calculated' : 'This calculation is not available in the system');

    // Invalidate report cache so frontend gets freshly calculated results on first click
    invalidateReportCache(cleanPatientId);
    invalidateReportCache(rawPid);

    return res.json({
      STATUS: upstreamData?.STATUS || (isSuccess ? 'SUCCESS' : 'FAILED'),
      StatusCode: upstreamData?.StatusCode || (isSuccess ? '0000' : '1211'),
      Message: message,
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const setDefaultResult = async (req, res, next) => {
  try {
    const { patientId, reportId, resultVersion = 1, resultData } = req.body;
    if (!patientId || !reportId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and reportId are required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    const numVersion = Number(resultVersion) || 1;

    const params = {
      patientId: cleanPatientId,
      patientid: cleanPatientId,
      reportId: String(reportId).trim(),
      reportid: String(reportId).trim(),
      resultVersion: numVersion,
      resultversion: numVersion,
      version: numVersion,
      defaultVersion: numVersion,
      resultNum: numVersion,
    };

    if (resultData !== undefined && resultData !== null && String(resultData).trim() !== '') {
      params.resultData = String(resultData).trim();
      params.result = String(resultData).trim();
    }

    const upstreamData = await upstreamService.post(
      'SETDEFAULTRESULT',
      params,
      null,
      req.user?.upstreamSid
    );

    // Also update report resultData so PDF and all views reflect the chosen default result immediately
    if (resultData !== undefined && resultData !== null && String(resultData).trim() !== '') {
      try {
        await upstreamService.post(
          'UPDATEREPORT',
          {
            patientId: cleanPatientId,
            reportId: String(reportId).trim(),
            resultData: String(resultData).trim(),
          },
          null,
          req.user?.upstreamSid
        );
      } catch (e) {
        console.warn('[Report] Fallback UPDATEREPORT during SETDEFAULTRESULT:', e.message);
      }
    }

    invalidateReportCache(cleanPatientId);
    invalidateReportCache(rawPid);

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || `Default result set to version v${numVersion}`,
      data: upstreamData,
      chosenVersion: numVersion,
      chosenResult: resultData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Download result for individual report parameter from analyzer (DOWNLOADRESULT)
 */
export const downloadResult = async (req, res, next) => {
  try {
    const { patientId, reportId, reportType = 1 } = req.body;
    if (!patientId || !reportId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and reportId are required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;
    const cleanReportId = String(reportId).trim();
    const resolvedReportType = String(reportType || 1);

    const upstreamData = await upstreamService.post(
      'DOWNLOADRESULT',
      {
        patientId: cleanPatientId,
        reportId: cleanReportId,
        reportType: resolvedReportType,
      },
      null,
      req.user?.upstreamSid
    );

    invalidateReportCache(cleanPatientId);
    invalidateReportCache(rawPid);

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Result downloaded from analyzer successfully',
      data: upstreamData,
      patientId: cleanPatientId,
      reportId: cleanReportId,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Upload work order for individual report parameter to analyzer (UPLOADORDER)
 */
export const uploadOrder = async (req, res, next) => {
  try {
    const { patientId, reportId, reportType = 1 } = req.body;
    if (!patientId || !reportId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and reportId are required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;
    const cleanReportId = String(reportId).trim();
    const resolvedReportType = String(reportType || 1);

    const upstreamData = await upstreamService.post(
      'UPLOADORDER',
      {
        patientId: cleanPatientId,
        reportId: cleanReportId,
        reportType: resolvedReportType,
      },
      null,
      req.user?.upstreamSid
    );

    invalidateReportCache(cleanPatientId);
    invalidateReportCache(rawPid);

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Work order uploaded to analyzer successfully',
      data: upstreamData,
      patientId: cleanPatientId,
      reportId: cleanReportId,
    });
  } catch (err) {
    next(err);
  }
};

export const sendWhatsApp = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    // 1. Initial attempt to dispatch WhatsApp via upstream SENDWHATSAPP
    let upstreamData = await upstreamService.post('SENDWHATSAPP', { patientId: cleanPatientId }, null, req.user?.upstreamSid);

    // 2. If upstream returns 1211 (Unreleased report), automatically release report upstream and retry
    if (upstreamData?.StatusCode === '1211' || upstreamData?.STATUS === 'FAILED') {
      try {
        console.log(`[sendWhatsApp] Upstream returned 1211 for ${cleanPatientId}. Automatically triggering RELEASEREPORT...`);
        const releaseRes = await upstreamService.post('RELEASEREPORT', { patientId: cleanPatientId }, null, req.user?.upstreamSid);
        invalidateReportCache(cleanPatientId);
        invalidateReportCache(rawPid);

        if (releaseRes?.STATUS === 'SUCCESS' || releaseRes?.StatusCode === '0000') {
          // Retry SENDWHATSAPP after report has been released
          upstreamData = await upstreamService.post('SENDWHATSAPP', { patientId: cleanPatientId }, null, req.user?.upstreamSid);
        }
      } catch (releaseErr) {
        console.warn(`[sendWhatsApp] Auto-release fallback failed for ${cleanPatientId}:`, releaseErr.message);
      }
    }

    // 3. If STILL failing after release attempt, return HTTP 400 with actionable clinical guidance
    if (upstreamData?.STATUS === 'FAILED' || upstreamData?.StatusCode === '1211' || (upstreamData?.StatusCode && upstreamData?.StatusCode !== '0000')) {
      const errorMsg =
        upstreamData?.Message && upstreamData?.Message !== 'Error In Proccessing - 1211'
          ? upstreamData.Message
          : 'Unable to send WhatsApp (1211): Report must be released and patient must have a valid mobile number registered.';
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamData?.StatusCode || '1211',
        Message: errorMsg,
        data: upstreamData,
      });
    }

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report sent to WhatsApp successfully',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Stream official AWS Report PDF directly
 */
export const streamReportPdf = async (req, res, next) => {
  try {
    const { patientId, addHeader = 'false' } = req.query;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    const upstreamData = await upstreamService.get(
      'GETPATIENTREPORT',
      { patientId: cleanPatientId },
      req.user?.upstreamSid
    );

    let pdfUrl = upstreamData?.payLoadJSON?.printPDFUrl;
    if (!pdfUrl) {
      return res.status(404).json({ STATUS: 'FAILED', Message: 'Report PDF URL not found on upstream AWS server' });
    }

    const wantsHeader = String(addHeader) === 'true';
    if (wantsHeader) {
      pdfUrl = pdfUrl.replace('addHeader=false', 'addHeader=true');
    } else {
      pdfUrl = pdfUrl.replace('addHeader=true', 'addHeader=false');
    }

    const pdfStream = await axios.get(pdfUrl, {
      responseType: 'stream',
      timeout: 25000,
    });

    const isDownload = req.query.download === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="Report_${cleanPatientId}${wantsHeader ? '_Letterhead' : ''}.pdf"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    pdfStream.data.pipe(res);
  } catch (err) {
    console.error('[ReportPDF] Stream error:', err.message);
    next(err);
  }
};

/**
 * Delete individual test report parameter
 * Calls native upstream DELETEREPORT API with reportType=1,
 * and persists status to DELETED in local and database storage.
 */
export const deleteReport = async (req, res, next) => {
  try {
    const { patientId, reportId, testName, profileName, deptName, rate, reportType = 1 } = req.body;
    if (!patientId || !reportId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and reportId are required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;
    const cleanReportId = String(reportId).trim();
    const resolvedReportType = String(reportType || 1);

    // 1. Call upstream native DELETEREPORT API (as per main server specification)
    let upstreamData = null;
    try {
      upstreamData = await upstreamService.post(
        'DELETEREPORT',
        {
          patientId: cleanPatientId,
          reportId: cleanReportId,
          reportType: resolvedReportType,
        },
        null,
        req.user?.upstreamSid
      );
      console.log(`[ReportDelete] Upstream DELETEREPORT response for ${cleanReportId}:`, upstreamData);
    } catch (e) {
      console.warn(`[ReportDelete] Upstream DELETEREPORT note for ${cleanReportId}:`, e.message);
    }

    // 2. Persist soft-deletion in robust local + MongoDB store
    await reportOverrideService.markDeleted(cleanPatientId, cleanReportId, {
      testName,
      profileName,
      deptName,
      rate,
    });

    invalidateReportCache(cleanPatientId);
    invalidateReportCache(rawPid);

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || `Test parameter "${testName || cleanReportId}" marked as DELETED successfully`,
      patientId: cleanPatientId,
      reportId: cleanReportId,
      status: 'DELETED',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Restore individual test report parameter
 * Calls native upstream RESTOREREPORT API with reportType=1,
 * and restores status back to active in local and database storage.
 */
export const restoreReport = async (req, res, next) => {
  try {
    const { patientId, reportId, testName, reportType = 1 } = req.body;
    if (!patientId || !reportId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and reportId are required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;
    const cleanReportId = String(reportId).trim();
    const resolvedReportType = String(reportType || 1);

    // 1. Call upstream native RESTOREREPORT API (as per main server specification)
    let upstreamData = null;
    try {
      upstreamData = await upstreamService.post(
        'RESTOREREPORT',
        {
          patientId: cleanPatientId,
          reportId: cleanReportId,
          reportType: resolvedReportType,
        },
        null,
        req.user?.upstreamSid
      );
      console.log(`[ReportRestore] Upstream RESTOREREPORT response for ${cleanReportId}:`, upstreamData);
    } catch (e) {
      console.warn(`[ReportRestore] Upstream RESTOREREPORT note for ${cleanReportId}:`, e.message);
    }

    // 2. Remove soft-deletion from store
    await reportOverrideService.restoreDeleted(cleanPatientId, cleanReportId);

    invalidateReportCache(cleanPatientId);
    invalidateReportCache(rawPid);

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || `Test parameter "${testName || cleanReportId}" restored successfully`,
      patientId: cleanPatientId,
      reportId: cleanReportId,
      status: 'ENTRY',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};


