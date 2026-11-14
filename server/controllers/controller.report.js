import axios from 'axios';
import { config } from '../config/config.env.js';
import { upstreamService } from '../services/service.upstream.js';
import { reportOverrideService } from '../services/service.reportOverride.js';
import { invalidatePatientListCache } from './controller.patient.js';
import { cacheService, CACHE_KEYS } from '../services/service.cache.js';
import { orderExamObject } from '../services/service.templateSequence.js';
import { templateStore } from '../services/service.templateStore.js';

// Deduplication and short-lived cache (5s) to eliminate duplicate calls
const reportCache = new Map();
const inFlightReports = new Map();

export const invalidateReportCache = (patientId) => {
  if (!patientId) {
    reportCache.clear();
    return;
  }
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

export const getCachedReport = (cleanPatientId) => {
  if (!cleanPatientId) return null;
  const entry = reportCache.get(cleanPatientId);
  if (entry && (Date.now() - entry.timestamp < 30000)) {
    return entry.data;
  }
  return null;
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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

    // 1. Check cache (30s TTL to prevent duplicate calls during tab switching and component mounts; mutations auto-invalidate)
    const isFresh = req.query.fresh === 'true' || req.query.sync === 'true';
    const cached = reportCache.get(cleanPatientId);
    if (!isFresh && cached && (Date.now() - cached.timestamp < 30000)) {
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
      const rid = String(t.reportId || t.templatesId || t.id || '').trim();
      let statusOverride = null;
      let isDel = Boolean(t.isDeleted || String(t.status || '').toUpperCase() === 'DELETED');
      if (overrides[rid]) {
        statusOverride = overrides[rid].status || 'DELETED';
        isDel = statusOverride === 'DELETED';
      }
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
      // If persistent template store has customizations (units, ref ranges, values, or custom items), merge them
      const cleanRid = String(rid).trim().toUpperCase();
      const masterRid = cleanRid.startsWith('P') ? `P14R${cleanRid.replace(/^P\d*R/i, '')}` : cleanRid;
      const storedReport = templateStore.get(cleanRid) || templateStore.get(masterRid);
      if (storedReport?.resultJSON) {
        if (!parsed || !parsed.Exam || Object.keys(parsed.Exam).length === 0) {
          parsed = storedReport.resultJSON;
        } else {
          // Deep merge Exam so units, ref ranges, and custom items are preserved
          const mergedExam = templateStore.mergeExam(parsed.Exam, storedReport.resultJSON.Exam);
          parsed = {
            ...parsed,
            Exam: mergedExam,
            others: storedReport.resultJSON.others || parsed.others,
            drawingData: storedReport.resultJSON.drawingData || parsed.drawingData,
          };
        }
      }

      // Ensure specialized HbA1c schema fields are normalized from Exam if missing
      if (parsed && typeof parsed === 'object') {
        const tmplName = String(t.TEMPLATE_NAME || t.testName || parsed.TEMPLATE_NAME || parsed.headingName || '').toUpperCase();
        const isHb = tmplName.includes('HBA1C') || tmplName.includes('GLYCATED') || Boolean(parsed.Exam?.PeakData) || Boolean(parsed.Exam?.['Peak Data']) || Boolean(parsed.peakDataTable);
        if (isHb) {
          parsed.templateType = 'HBA1C';
          const exam = parsed.Exam || {};
          let extractedHb = null;
          if (exam.Result || exam['HbA1C Result']) {
            const arr = exam.Result || exam['HbA1C Result'];
            if (Array.isArray(arr)) {
              extractedHb = arr.map((r, idx) => ({
                name: r.Name || r.name || (idx === 0 ? 'Glycated Haemoglobin (HbA1c)' : 'Estimated Average Glucose (eAG)'),
                operator: r.Method || r.method || r.operator || '-',
                value: r.Value !== undefined ? String(r.Value) : (r.value !== undefined ? String(r.value) : ''),
                unit: r.Unit || r.unit || (idx === 0 ? '% ofTotal Hb' : 'mg/dL'),
                refRange: r['Ref Range'] || r.RefRange || r.refRange || (idx === 0 ? '<6%' : ''),
              }));
            }
          }
          let extractedPeaks = null;
          if (exam.PeakData || exam['Peak Data']) {
            const arr = exam.PeakData || exam['Peak Data'];
            const defaultPeaks = ['HbA1C(IFCC)', 'eAG[ADA]', 'Others 1', 'Others 2', 'Others 3', 'Peak Data', 'Graph Data'];
            if (Array.isArray(arr)) {
              extractedPeaks = arr.map((p, idx) => ({
                peak: p.Peak || p.peak || p.Name || p.name || defaultPeaks[idx] || `Peak ${idx + 1}`,
                time: p.Time !== undefined ? String(p.Time) : (p.time !== undefined ? String(p.time) : ''),
                abs: p.ABS !== undefined ? String(p.ABS) : (p.abs !== undefined ? String(p.abs) : ''),
                area: p.Area !== undefined ? String(p.Area) : (p.area !== undefined ? String(p.area) : ''),
                result: p.Result !== undefined ? String(p.Result) : (p.result !== undefined ? String(p.result) : ''),
                refRange: p['Ref Range'] || p.RefRange || p.refRange || '',
              }));
            }
          }
          let extractedSummary = null;
          if (exam['Final Result'] || exam['Summary Result']) {
            const arr = exam['Final Result'] || exam['Summary Result'];
            const defaultSummary = ['TotalArea', 'HbA1C(NGSP)', 'eAG(ADA)', 'HbA1C(IFCC)', 'eAG[ADA]'];
            if (Array.isArray(arr)) {
              extractedSummary = arr.map((s, idx) => ({
                name: s.Name || s.name || defaultSummary[idx] || `Summary ${idx + 1}`,
                val1: s.val1 !== undefined ? String(s.val1) : (s.Value !== undefined ? String(s.Value) : (s.value !== undefined ? String(s.value) : '')),
                val2: s.val2 !== undefined ? String(s.val2) : (s.Unit !== undefined ? String(s.Unit) : (s.unit !== undefined ? String(s.unit) : '')),
              }));
            }
          }

          // Merge with stored values: upstream clinical findings take precedence over stored blank values
          const sJson = storedReport?.resultJSON || {};
          parsed.hba1cResult = templateStore.mergeHbA1c(
            extractedHb || parsed.hba1cResult,
            sJson.hba1cResult || sJson.Exam?.Result || sJson.Exam?.['HbA1C Result']
          );
          parsed.peakDataTable = templateStore.mergePeaks(
            extractedPeaks || parsed.peakDataTable,
            sJson.peakDataTable || sJson.Exam?.PeakData || sJson.Exam?.['Peak Data']
          );
          parsed.summaryResult = templateStore.mergeSummary(
            extractedSummary || parsed.summaryResult,
            sJson.summaryResult || sJson.Exam?.['Final Result'] || sJson.Exam?.['Summary Result']
          );
        }

        // Also ensure Exam sections order is strictly maintained with Others at the bottom
        if (parsed.Exam && typeof parsed.Exam === 'object') {
          parsed.Exam = orderExamObject(parsed.Exam, tmplName);
        }

        // Keep local persistent template store in sync with the fresh upstream lab values
        if (storedReport && cleanRid) {
          templateStore.set(cleanRid, {
            ...storedReport,
            reportId: cleanRid,
            patientId: cleanPatientId,
            resultJSON: {
              ...storedReport.resultJSON,
              ...parsed,
            },
            status: storedReport.status || 'SAVED',
          });
        }
      }
      return {
        ...t,
        status: statusOverride || t.status || (isDel ? 'DELETED' : 'SAVED'),
        isDeleted: isDel,
        resultJsonParsed: parsed,
        possibleDownload: t.possibleDownload !== undefined
          ? toBoolFlag(t.possibleDownload, true)
          : true,
      };
    });

    let billing = upstreamService.getCachedBilling(cleanPatientId);
    if (!billing || isFresh) {
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
    const billingGross = Number(billing?.gross || 0);
    const billingTotal = Number(billing?.total || 0);

    // Determine Net Bill (after discount)
    const effectiveTotal = billingTotal > 0
      ? billingTotal
      : (patientTotal > 0 ? patientTotal : 0);

    // Determine Gross Total (before discount)
    let effectiveGross = billingGross > 0
      ? billingGross
      : (effectiveTotal > 0 && discountVal > 0
          ? effectiveTotal + discountVal + roundoffVal
          : (effectiveTotal > 0 ? effectiveTotal : patientTotal));

    if (discountVal > 0 && effectiveGross <= effectiveTotal) {
      effectiveGross = effectiveTotal + discountVal + roundoffVal;
    }

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
          age: patient.age
            ? String(patient.age).trim().replace(/\b(years?|months?|days?|yrs?)\b(?:\s+\1\b)+/gi, '$1')
            : patient.age,
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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

    // Rule 4: Microbiology User can only update specific live Microbiology Dept investigations
    if (req.user?.role === 'Microbiology') {
      const isMicro =
        String(deptName || '').toLowerCase().includes('micro') ||
        String(profileName || '').toLowerCase().includes('micro') ||
        String(testName || '').toLowerCase().includes('micro') ||
        String(deptName || '').toLowerCase().includes('culture');

      if (!isMicro) {
        return res.status(403).json({
          STATUS: 'FAILED',
          StatusCode: '403',
          Message:
            'Access denied. Microbiology User is only permitted to update investigations in the Microbiology department.',
        });
      }
    }

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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

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

/**
 * Task - 10 : Report Recall
 * API_RECALL_REPORT="RECALLPORT"; api=RECALLPORT&patientId=P47
 * Recalls an approved/released report back to editable/draft state.
 */
export const recallReport = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

    const upstreamData = await upstreamService.recallReport(cleanPatientId, req.user?.upstreamSid);
    invalidateReportCache(cleanPatientId);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report recalled back to active/draft state successfully',
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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }
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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }
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
    const { patientId, sendType = 'patientReportMsg' } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

    // Valid sendType values: onboardingMsg | patientReportMsg | doctorReportMsg | agentReportMsg
    const validSendTypes = ['onboardingMsg', 'patientReportMsg', 'doctorReportMsg', 'agentReportMsg'];
    const effectiveSendType = validSendTypes.includes(sendType) ? sendType : 'patientReportMsg';

    const sendParams = {
      patientId: cleanPatientId,
      sendType: effectiveSendType,
    };

    console.log(`[sendWhatsApp] Dispatching WhatsApp for ${cleanPatientId} with sendType=${effectiveSendType}`);

    // 1. Initial attempt to dispatch WhatsApp via upstream SENDWHATSAPP
    let upstreamData = await upstreamService.post('SENDWHATSAPP', sendParams, null, req.user?.upstreamSid);

    // 2. If upstream returns 1211 (Unreleased report), automatically release report upstream and retry
    if (upstreamData?.StatusCode === '1211' || upstreamData?.STATUS === 'FAILED') {
      try {
        console.log(`[sendWhatsApp] Upstream returned 1211 for ${cleanPatientId}. Automatically triggering RELEASEREPORT...`);
        const releaseRes = await upstreamService.post('RELEASEREPORT', { patientId: cleanPatientId }, null, req.user?.upstreamSid);
        invalidateReportCache(cleanPatientId);
        invalidateReportCache(rawPid);

        if (releaseRes?.STATUS === 'SUCCESS' || releaseRes?.StatusCode === '0000') {
          // Retry SENDWHATSAPP after report has been released
          upstreamData = await upstreamService.post('SENDWHATSAPP', sendParams, null, req.user?.upstreamSid);
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
          : `Unable to dispatch WhatsApp (${effectiveSendType}): Report must be released and patient must have a valid mobile number registered.`;
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamData?.StatusCode || '1211',
        Message: errorMsg,
        data: upstreamData,
      });
    }

    const typeLabels = {
      onboardingMsg: 'Onboarding Welcome Message',
      patientReportMsg: 'Diagnostic Report to Patient',
      doctorReportMsg: 'Diagnostic Report to Doctor',
      agentReportMsg: 'Diagnostic Report to Referring Agent',
    };

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      sendType: effectiveSendType,
      Message: upstreamData?.Message || `${typeLabels[effectiveSendType] || 'Notification'} sent via WhatsApp successfully!`,
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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }

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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }
    const cleanReportId = String(reportId).trim();
    const isTemplate =
      String(reportType) === '2' ||
      reportType === 2 ||
      /[A-Z0-9]+T\d+$/i.test(cleanReportId);
    const resolvedReportType = isTemplate ? '2' : String(reportType || 1);

    // 1. Call upstream native DELETEREPORT API (as per main server specification)
    let upstreamData = null;
    try {
      if (isTemplate) {
        // Upstream template reports use GET APIServlet with reportType=2
        upstreamData = await upstreamService.getAPIServlet(
          'DELETEREPORT',
          {
            patientId: cleanPatientId,
            reportId: cleanReportId,
            reportType: '2',
          },
          req.user?.upstreamSid
        );
      } else {
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
      }
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

    // Check if patient was deleted
    try {
      const { DeletedPatient } = await import('../models/model.deletedPatient.js');
      const isDeleted = await DeletedPatient.findOne({ patientId: cleanPatientId.toUpperCase() }).lean();
      if (isDeleted) {
        return res.status(404).json({
          STATUS: 'FAILED',
          StatusCode: '404',
          Message: `Patient #${cleanPatientId} has been deleted from active directory.`,
        });
      }
    } catch (e) {
      // Continue
    }
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



/**
 * Default structured schema generator for full-page template reports (T1 to T15)
 */
export const getDefaultTemplateResultJson = (templateName = 'STOOL EXAMINATION') => {
  const norm = String(templateName || '').toUpperCase().trim();

  // 1. HbA1C Report (Matching Image 1 Structure)
  if (norm.includes('HBA1C') || norm.includes('GLYCATED') || norm.includes('A1C')) {
    return {
      TEMPLATE_NAME: 'HbA1C Report',
      headingName: 'HbA1C Report',
      templateType: 'HBA1C',
      hba1cResult: [
        { name: 'Glycated Haemoglobin (HbA1c)', operator: '-', value: '', unit: '% ofTotal Hb', refRange: '<6%' },
        { name: 'Estimated Average Glucose', operator: '-', value: '', unit: 'mg/dL', refRange: '' },
      ],
      peakDataTable: [
        { peak: 'HbA1a', time: '', abs: '', area: '', result: '', refRange: '' },
        { peak: 'HbA1b', time: '', abs: '', area: '', result: '', refRange: '' },
        { peak: 'HbF', time: '', abs: '', area: '', result: '', refRange: '' },
        { peak: 'LA1c', time: '', abs: '', area: '', result: '', refRange: '' },
        { peak: 'HbA1c', time: '', abs: '', area: '', result: '', refRange: '' },
        { peak: 'HbA0', time: '', abs: '', area: '', result: '', refRange: '' },
        { peak: 'V_Win', time: '', abs: '', area: '', result: '', refRange: '' },
      ],
      summaryResult: [
        { name: 'TotalArea', val1: '', val2: '' },
        { name: 'HbA1C(NGSP)', val1: '', val2: '' },
        { name: 'eAG(ADA)', val1: '', val2: '' },
        { name: 'HbA1C(IFCC)', val1: '', val2: '' },
        { name: 'eAG[ADA]', val1: '', val2: '' },
      ],
      others: [
        { name: 'Others 1', value: '' },
        { name: 'Others 2', value: '' },
        { name: 'Others 3', value: '' },
      ],
      drawingData: [
        { name: 'Peak Data', value: '' },
        { name: 'Graph Data', value: '' },
      ],
      Exam: {
        'HbA1C Result': [
          { Name: 'Glycated Haemoglobin (HbA1c)', Value: '', Unit: '% ofTotal Hb', RefRange: '<6%' },
          { Name: 'Estimated Average Glucose', Value: '', Unit: 'mg/dL', RefRange: '' },
        ],
        'Summary Result': [
          { Name: 'TotalArea', Value: '' },
          { Name: 'HbA1C(NGSP)', Value: '' },
          { Name: 'eAG(ADA)', Value: '' },
          { Name: 'HbA1C(IFCC)', Value: '' },
          { Name: 'eAG[ADA]', Value: '' },
        ],
      },
    };
  }

  if (norm.includes('STOOL')) {
    return {
      TEMPLATE_NAME: 'STOOL EXAMINATION',
      Exam: {
        'Physical Examination': [
          { Name: 'Quantity', Value: '' },
          { Name: 'Colour', Value: '' },
          { Name: 'Odour', Value: '' },
          { Name: 'Consistency', Value: '' },
          { Name: 'Mucus', Value: '' },
          { Name: 'Parasite', Value: '' },
        ],
        'Chemical Examination': [
          { Name: 'Occult Blood', Value: '' },
          { Name: 'Reducing Substance', Value: '' },
          { Name: 'pH', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'OVA / LARVAE', Value: '' },
          { Name: 'Trophozoites', Value: '' },
          { Name: 'Crystals', Value: '' },
          { Name: 'Ghost Cells', Value: '' },
          { Name: 'RBC', Value: '' },
          { Name: 'Bacteria', Value: '' },
          { Name: 'Cysts', Value: '' },
          { Name: 'Pyknotic Bodies', Value: '' },
          { Name: 'Pus cells', Value: '' },
          { Name: 'Epithelial Cells', Value: '' },
          { Name: 'Veg. cells', Value: '' },
        ],
        Others: [
          { Name: 'Others 1', Value: '' },
          { Name: 'Others 2', Value: '' },
        ],
      },
    };
  }
  if (norm.includes('URINE')) {
    return {
      TEMPLATE_NAME: norm.includes('COMPLETE') ? 'URINE EXAMINATION - COMPLETE' : 'URINE EXAMINATION',
      Exam: {
        'Physical Examination': [
          { Name: 'Quantity', Value: '' },
          { Name: 'Colour', Value: '' },
          { Name: 'Appearance', Value: '' },
          { Name: 'Specific Gravity', Value: '' },
          { Name: 'Deposit', Value: '' },
        ],
        'Chemical Examination': [
          { Name: 'Reaction (pH)', Value: '' },
          { Name: 'Protein / Albumin', Value: '' },
          { Name: 'Sugar / Glucose', Value: '' },
          { Name: 'Ketone Bodies', Value: '' },
          { Name: 'Bile Salts', Value: '' },
          { Name: 'Bile Pigments', Value: '' },
          { Name: 'Urobilinogen', Value: '' },
          { Name: 'Blood / Hemoglobin', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'Pus Cells', Value: '' },
          { Name: 'R.B.C.', Value: '' },
          { Name: 'Epithelial Cells', Value: '' },
          { Name: 'Casts', Value: '' },
          { Name: 'Crystals', Value: '' },
          { Name: 'Bacteria', Value: '' },
          { Name: 'Yeast Cells', Value: '' },
        ],
        Others: [
          { Name: 'Mucus Threads', Value: '' },
          { Name: 'Amorphous Phosphates', Value: '' },
        ],
      },
    };
  }
  if (norm.includes('SEMEN')) {
    return {
      TEMPLATE_NAME: 'SEMEN ANALYSIS',
      Exam: {
        'Physical Examination': [
          { Name: 'Period of Abstinence', Value: '' },
          { Name: 'Time of Collection', Value: '' },
          { Name: 'Time of Examination', Value: '' },
          { Name: 'Volume', Value: '' },
          { Name: 'Colour & Appearance', Value: '' },
          { Name: 'Liquefaction Time', Value: '' },
          { Name: 'Viscosity', Value: '' },
          { Name: 'pH', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'Total Sperm Count', Value: '' },
          { Name: 'Active Motility (Grade a)', Value: '' },
          { Name: 'Sluggish Motility (Grade b)', Value: '' },
          { Name: 'Non-Progressive (Grade c)', Value: '' },
          { Name: 'Immotile (Grade d)', Value: '' },
          { Name: 'Normal Morphology', Value: '' },
          { Name: 'Abnormal Forms', Value: '' },
          { Name: 'Pus Cells', Value: '' },
          { Name: 'Epithelial Cells', Value: '' },
          { Name: 'Agglutination', Value: '' },
        ],
        Others: [
          { Name: 'Fructose', Value: '' },
          { Name: 'Impression / Note', Value: '' },
        ],
      },
    };
  }
  if (norm.includes('CSF') || norm.includes('FLUID') || norm.includes('ASCITIC') || norm.includes('SYNOVIAL') || norm.includes('PLEURAL')) {
    return {
      TEMPLATE_NAME: templateName,
      Exam: {
        'Physical Examination': [
          { Name: 'Quantity', Value: '' },
          { Name: 'Colour', Value: '' },
          { Name: 'Appearance / Clarity', Value: '' },
          { Name: 'Coagulum / Clot', Value: '' },
          { Name: 'Specific Gravity', Value: '' },
        ],
        'Chemical Examination': [
          { Name: 'Protein', Value: '' },
          { Name: 'Glucose', Value: '' },
          { Name: 'Chloride', Value: '' },
          { Name: 'L.D.H.', Value: '' },
          { Name: 'Adenosine Deaminase (ADA)', Value: '' },
        ],
        'Microscopic / Cytological Examination': [
          { Name: 'Total WBC Count', Value: '' },
          { Name: 'Polymorphs (Neutrophils)', Value: '' },
          { Name: 'Lymphocytes', Value: '' },
          { Name: 'RBCs', Value: '' },
          { Name: 'Malignant / Atypical Cells', Value: '' },
        ],
        'Microbiological Examination': [
          { Name: 'Gram Stain', Value: '' },
          { Name: 'ZN Stain for AFB', Value: '' },
          { Name: 'India Ink Preparation', Value: '' },
        ],
      },
    };
  }
  if (norm.includes('HISTOPATHOLOGY') || norm.includes('FNAC') || norm.includes('BIOPSY')) {
    return {
      TEMPLATE_NAME: templateName,
      Exam: {
        'Gross Examination': [
          { Name: 'Specimen Received', Value: '' },
          { Name: 'Dimensions / Weight', Value: '' },
          { Name: 'External Surface & Cut Surface', Value: '' },
          { Name: 'Number of Blocks Processed', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'Section Findings', Value: '' },
          { Name: 'Cellular Architecture', Value: '' },
          { Name: 'Nuclear Atypia / Mitotic Figures', Value: '' },
          { Name: 'Stromal / Vascular Infiltration', Value: '' },
          { Name: 'Surgical Resection Margins', Value: '' },
        ],
        'Diagnostic Impression': [
          { Name: 'Final Histopathological Diagnosis', Value: '' },
          { Name: 'Pathological Staging / Grade', Value: '' },
          { Name: 'Comments / Recommendations', Value: '' },
        ],
      },
    };
  }
  return {
    TEMPLATE_NAME: templateName,
    Exam: {
      'General Observations': [
        { Name: 'Parameter 1', Value: '' },
        { Name: 'Parameter 2', Value: '' },
        { Name: 'Parameter 3', Value: '' },
      ],
      'Clinical Findings': [
        { Name: 'Finding 1', Value: '' },
        { Name: 'Finding 2', Value: '' },
      ],
      'Impression / Remarks': [
        { Name: 'Interpretation', Value: '' },
        { Name: 'Note', Value: '' },
      ],
    },
  };
};

/**
 * Fetch structured full-page template JSON (API_GET_TEMPLATE_JSON="GETTEMPLATEJSON")
 * /GetAPIServlet?api=GETTEMPLATEJSON&reportId=P14R3
 */
export const getTemplateJson = async (req, res, next) => {
  try {
    const { reportId, templateName = 'STOOL EXAMINATION' } = req.query;
    if (!reportId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'reportId is required' });
    }

    const cleanReportId = String(reportId).trim();
    const isFresh = req.query.fresh === 'true';
    const stored = templateStore.get(cleanReportId);

    // If template is already cached/stored and fresh is not requested, return immediately without hitting upstream
    if (!isFresh && stored && stored.resultJSON) {
      return res.json({
        STATUS: 'SUCCESS',
        StatusCode: '0000',
        payLoadJSON: {
          TemplateReport: stored,
        },
        templateReport: stored,
      });
    }

    // 1. Fetch from upstream GETTEMPLATEJSON
    try {
      const upstreamRes = await upstreamService.get(
        'GETTEMPLATEJSON',
        { reportId: cleanReportId },
        req.user?.upstreamSid
      );
      if (upstreamRes?.payLoadJSON?.TemplateReport) {
        let report = { ...upstreamRes.payLoadJSON.TemplateReport };
        let rJson = report.resultJSON;
        if (typeof rJson === 'string') {
          try {
            rJson = JSON.parse(rJson);
          } catch {
            rJson = null;
          }
        }
        if (rJson && typeof rJson === 'object' && rJson.Exam) {
          const orderedExam = orderExamObject(rJson.Exam, report.TEMPLATE_NAME || templateName);
          rJson.Exam = orderedExam;
          const isHb =
            String(report.TEMPLATE_NAME || templateName).toUpperCase().includes('HBA1C') ||
            Boolean(orderedExam.PeakData) ||
            Boolean(orderedExam['Peak Data']);

          if (isHb) {
            rJson.templateType = 'HBA1C';
            if (!rJson.hba1cResult && (orderedExam.Result || orderedExam['HbA1C Result'])) {
              const rArr = orderedExam.Result || orderedExam['HbA1C Result'];
              rJson.hba1cResult = rArr.map((r, idx) => ({
                name: r.Name || r.name || (idx === 0 ? 'Glycated Haemoglobin (HbA1c)' : 'Estimated Average Glucose (eAG)'),
                operator: r.Method || r.method || r.operator || '-',
                value: r.Value !== undefined ? String(r.Value) : (r.value !== undefined ? String(r.value) : ''),
                unit: r.Unit || r.unit || (idx === 0 ? '% ofTotal Hb' : 'mg/dL'),
                refRange: r['Ref Range'] || r.RefRange || r.refRange || (idx === 0 ? '<6%' : ''),
              }));
            }
            if (!rJson.peakDataTable && (orderedExam.PeakData || orderedExam['Peak Data'])) {
              const pArr = orderedExam.PeakData || orderedExam['Peak Data'];
              const defaultPeaks = ['HbA1C(IFCC)', 'eAG[ADA]', 'Others 1', 'Others 2', 'Others 3', 'Peak Data', 'Graph Data'];
              rJson.peakDataTable = pArr.map((p, idx) => ({
                peak: p.Peak || p.peak || p.Name || p.name || defaultPeaks[idx] || `Peak ${idx + 1}`,
                time: p.Time !== undefined ? String(p.Time) : (p.time !== undefined ? String(p.time) : ''),
                abs: p.ABS !== undefined ? String(p.ABS) : (p.abs !== undefined ? String(p.abs) : ''),
                area: p.Area !== undefined ? String(p.Area) : (p.area !== undefined ? String(p.area) : ''),
                result: p.Result !== undefined ? String(p.Result) : (p.result !== undefined ? String(p.result) : ''),
                refRange: p['Ref Range'] || p.RefRange || p.refRange || '',
              }));
            }
            if (!rJson.summaryResult && (orderedExam['Final Result'] || orderedExam['Summary Result'])) {
              const sArr = orderedExam['Final Result'] || orderedExam['Summary Result'];
              const defaultSummary = ['TotalArea', 'HbA1C(NGSP)', 'eAG(ADA)', 'HbA1C(IFCC)', 'eAG[ADA]'];
              rJson.summaryResult = sArr.map((s, idx) => ({
                name: s.Name || s.name || defaultSummary[idx] || `Summary ${idx + 1}`,
                val1: s.val1 !== undefined ? String(s.val1) : (s.Value !== undefined ? String(s.Value) : (s.value !== undefined ? String(s.value) : '')),
                val2: s.val2 !== undefined ? String(s.val2) : (s.Unit !== undefined ? String(s.Unit) : (s.unit !== undefined ? String(s.unit) : '')),
              }));
            }
          }
          report.resultJSON = rJson;
        }

        // Deep merge with stored persistent customizations (units, custom rows, ref ranges)
        if (stored) {
          report = templateStore.mergeTemplateReport(report, stored);
        }
        templateStore.set(cleanReportId, report);

        return res.json({
          STATUS: 'SUCCESS',
          StatusCode: '0000',
          payLoadJSON: { ...upstreamRes.payLoadJSON, TemplateReport: report },
          templateReport: report,
        });
      }
    } catch (upstreamErr) {
      console.warn(`[getTemplateJson] Upstream GETTEMPLATEJSON warning for ${cleanReportId}:`, upstreamErr.message);
    }

    // 2. If upstream fails but stored report is available from disk, return it
    if (stored) {
      return res.json({
        STATUS: 'SUCCESS',
        StatusCode: '0000',
        payLoadJSON: {
          TemplateReport: stored,
        },
        templateReport: stored,
      });
    }

    // 3. Fallback: generate standard structured resultJSON
    const fallbackResultJson = getDefaultTemplateResultJson(templateName);
    const fallbackReport = {
      resultJSON: fallbackResultJson,
      TEMPLATE_NAME: fallbackResultJson.TEMPLATE_NAME,
      reportId: cleanReportId,
      name: fallbackResultJson.TEMPLATE_NAME,
      templatesDate: new Date().toISOString().slice(0, 10),
      status: 'Active',
    };
    templateStore.set(cleanReportId, fallbackReport);

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      payLoadJSON: {
        TemplateReport: fallbackReport,
      },
      templateReport: fallbackReport,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update full-page template data (API_UPDATE_TEMPLATE_DATA="UPDATETEMPLATEDATA")
 * /APIServlet?api=UPDATETEMPLATEDATA&reportId=P14R3
 * Sends resultJSON as body of request
 */
export const updateTemplateData = async (req, res, next) => {
  try {
    const reportId = req.query.reportId || req.body.reportId;
    if (!reportId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'reportId is required' });
    }

    const cleanReportId = String(reportId).trim();
    const rawResultJSON = req.body.resultJSON || req.body;

    if (!rawResultJSON || typeof rawResultJSON !== 'object') {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'resultJSON object is required in request body' });
    }

    const templateName = rawResultJSON.TEMPLATE_NAME || rawResultJSON.headingName || '';
    const isHbA1C =
      String(templateName).toUpperCase().includes('HBA1C') ||
      rawResultJSON.templateType === 'HBA1C' ||
      rawResultJSON.peakDataTable !== undefined ||
      Boolean(rawResultJSON.Exam?.PeakData);

    const resultJSON = {
      ...rawResultJSON,
      templateType: isHbA1C ? 'HBA1C' : (rawResultJSON.templateType || 'GENERAL'),
      Exam: rawResultJSON.Exam ? orderExamObject(rawResultJSON.Exam, templateName) : rawResultJSON.Exam,
    };

    let targetPid = req.body.patientId || req.query.patientId;
    if (!targetPid) {
      const match = cleanReportId.match(/^(P\d+)/i);
      if (match) targetPid = match[1];
    }
    targetPid = targetPid ? String(targetPid).trim().toUpperCase() : 'P14';

    console.log(`[updateTemplateData] Updating template findings for patient ${targetPid}, report ${cleanReportId}...`);

    // 1. Persist directly to upstream SaveTemplateData servlet
    let upstreamSaveResult = null;
    try {
      upstreamSaveResult = await upstreamService.saveTemplateData(
        targetPid,
        cleanReportId,
        resultJSON,
        req.body.templateId || req.query.templateId,
        req.user?.upstreamSid
      );
    } catch (saveErr) {
      console.warn(`[updateTemplateData] Upstream saveTemplateData warning for ${cleanReportId}:`, saveErr.message);
    }

    // 2. Safely attempt status update via UPDATETEMPLATE without failing on upstream 1211
    try {
      await upstreamService.post(
        'UPDATETEMPLATE',
        {
          reportId: cleanReportId,
          patientId: targetPid,
          status: 'SAVED',
          TEMPLATE_NAME: resultJSON.TEMPLATE_NAME || '',
        },
        null,
        req.user?.upstreamSid
      );
    } catch (tmplErr) {
      // Non-fatal
    }

    // 3. Update persistent template store
    const existing = templateStore.get(cleanReportId) || {};
    const updatedReport = {
      ...existing,
      reportId: cleanReportId,
      patientId: targetPid,
      resultJSON,
      TEMPLATE_NAME: resultJSON.TEMPLATE_NAME || existing.TEMPLATE_NAME || 'TEMPLATE REPORT',
      status: 'SAVED',
      templatesDate: new Date().toISOString().slice(0, 10),
    };
    templateStore.set(cleanReportId, updatedReport);

    // Invalidate report cache
    invalidateReportCache(targetPid);
    reportCache.clear();

    if (targetPid === 'P14') {
      try {
        await cacheService.invalidate(CACHE_KEYS.TEMPLATE_LIST);
      } catch {
        // ignore
      }
    }

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: 'Template Report Updated Successfully',
      reportId: cleanReportId,
      templateReport: updatedReport,
      upstreamSynced: Boolean(upstreamSaveResult?.success),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update multiple template reports in a single batch (UPDATETEMPLATEDATA in batch)
 * POST /api/reports/template-batch-data
 * Body: { reports: [ { reportId: 'P87R13', resultJSON: { ... } }, ... ] }
 */
export const updateTemplateBatchData = async (req, res, next) => {
  try {
    const reportsList = Array.isArray(req.body.reports)
      ? req.body.reports
      : (Array.isArray(req.body) ? req.body : []);

    if (reportsList.length === 0) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'No template reports provided in batch payload',
      });
    }

    console.log(`[updateTemplateBatchData] Processing batch update for ${reportsList.length} template reports...`);

    const results = [];
    let updatedCount = 0;
    for (const item of reportsList) {
      const cleanReportId = String(item.reportId || item.id || '').trim();
      const resultJSON = item.resultJSON || item.resultJson;

      if (!cleanReportId || !resultJSON || typeof resultJSON !== 'object') {
        continue;
      }

      let targetPid = item.patientId || req.body.patientId || req.query.patientId;
      if (!targetPid) {
        const match = cleanReportId.match(/^(P\d+)/i);
        if (match) targetPid = match[1];
      }
      targetPid = targetPid ? String(targetPid).trim().toUpperCase() : 'P14';

      // 1. Post to upstream SaveTemplateData
      try {
        await upstreamService.saveTemplateData(
          targetPid,
          cleanReportId,
          resultJSON,
          item.templateId || item.templatesId,
          req.user?.upstreamSid
        );
      } catch (err) {
        console.warn(`[updateTemplateBatchData] Upstream warning for ${cleanReportId}:`, err.message);
      }

      // 2. Upstream status attempt (safe)
      try {
        await upstreamService.post(
          'UPDATETEMPLATE',
          {
            reportId: cleanReportId,
            patientId: targetPid,
            status: 'SAVED',
            TEMPLATE_NAME: resultJSON.TEMPLATE_NAME || '',
          },
          null,
          req.user?.upstreamSid
        );
      } catch (tmplErr) {
        // Non-fatal
      }

      // 3. Update persistent template store
      const existing = templateStore.get(cleanReportId) || {};
      const updatedReport = {
        ...existing,
        reportId: cleanReportId,
        patientId: targetPid,
        resultJSON,
        TEMPLATE_NAME: resultJSON.TEMPLATE_NAME || existing.TEMPLATE_NAME || 'TEMPLATE REPORT',
        status: 'SAVED',
        templatesDate: new Date().toISOString().slice(0, 10),
      };
      templateStore.set(cleanReportId, updatedReport);
      invalidateReportCache(targetPid);
      results.push({ reportId: cleanReportId, status: 'SUCCESS' });
      updatedCount++;
    }

    // Invalidate report cache
    reportCache.clear();

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: `Successfully updated ${updatedCount} template report(s)`,
      updatedCount,
      results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate authenticated URL for upstream editTemplateV2.jsp
 * /api/reports/template-url?patientId=P14&reportId=P14R11
 */
export const getTemplateEditUrl = async (req, res, next) => {
  try {
    const rawPid = String(req.query.patientId || req.body?.patientId || 'P14').trim();
    let cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    let rawRid = String(req.query.reportId || req.body?.reportId || '').trim();
    if (!rawRid && cleanPatientId === 'P14') {
      rawRid = 'P14R1';
    } else if (cleanPatientId === 'P14' && rawRid.toUpperCase().startsWith('T')) {
      const tNum = rawRid.replace(/^T+/i, '');
      rawRid = `P14R${tNum}`;
    }

    // 1. Candidate session: client-supplied sid, user upstreamSid, or cached masterSid
    let activeSid = req.query.sid || req.body?.sid || req.user?.upstreamSid || upstreamService.masterSid;

    // 2. Validate whether candidate session is live upstream (does not 302 to login.jsp)
    let isAlive = false;
    if (activeSid) {
      isAlive = await upstreamService.isSessionAlive(activeSid);
    }

    // 3. If invalid or expired, do not attempt auto-relogin - report session expired
    if (!isAlive) {
      return res.status(401).json({
        STATUS: 'FAILED',
        StatusCode: '1140',
        Message: 'Session timed out. Please login again.',
        isSessionExpired: true,
      });
    }

    // 4. Construct bulletproof upstream URL with session ID in both path and query parameters
    const domain = config.lab.domain;
    const path = config.lab.path;
    const targetUrl = `${domain}/${path}/editTemplateV2.jsp;jsessionid=${activeSid}?patientId=${encodeURIComponent(cleanPatientId)}&reportId=${encodeURIComponent(rawRid)}&jsessionid=${activeSid}&sid=${activeSid}`;

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      url: targetUrl,
      patientId: cleanPatientId,
      reportId: rawRid,
      sid: activeSid,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Direct redirect to upstream editTemplateV2.jsp
 * /api/reports/edit-template?patientId=P14&reportId=P14R11
 */
export const redirectToTemplateEdit = async (req, res, next) => {
  try {
    const rawPid = String(req.query.patientId || 'P14').trim();
    let cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    let rawRid = String(req.query.reportId || '').trim();
    if (!rawRid && cleanPatientId === 'P14') {
      rawRid = 'P14R1';
    } else if (cleanPatientId === 'P14' && rawRid.toUpperCase().startsWith('T')) {
      const tNum = rawRid.replace(/^T+/i, '');
      rawRid = `P14R${tNum}`;
    }

    // 1. Candidate session: client-supplied sid, user upstreamSid, or cached masterSid
    let activeSid = req.query.sid || req.user?.upstreamSid || upstreamService.masterSid;

    // 2. Validate candidate session
    let isAlive = false;
    if (activeSid) {
      isAlive = await upstreamService.isSessionAlive(activeSid);
    }

    // 3. If missing or dead, redirect to login
    if (!isAlive) {
      return res.redirect('/login?reason=Session%20timed%20out.%20Please%20login%20again.');
    }

    const domain = config.lab.domain;
    const path = config.lab.path;
    const targetUrl = `${domain}/${path}/editTemplateV2.jsp;jsessionid=${activeSid}?patientId=${encodeURIComponent(cleanPatientId)}&reportId=${encodeURIComponent(rawRid)}&jsessionid=${activeSid}&sid=${activeSid}`;

    return res.redirect(targetUrl);
  } catch (err) {
    next(err);
  }
};
