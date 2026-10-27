import { upstreamService } from '../services/service.upstream.js';
import { cacheService, CACHE_KEYS } from '../services/service.cache.js';
import { invalidateReportCache } from './controller.report.js';

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date = new Date()) => {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const year = d.getFullYear();
  return [year, month, day].join('-');
};

/**
 * Universal Gender normalizer:
 * Maps Male, Female, and converts Others/Other to 'Transgender'
 */
export const normalizeGender = (g) => {
  const s = String(g || '').trim().toLowerCase();
  if (s.startsWith('m')) return 'Male';
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('t') || s.startsWith('o')) return 'Transgender';
  return 'Male';
};

/**
 * Normalize any incoming date value (Java UTC string, ISO string, DD/MM/YYYY, Date object)
 * strictly to valid YYYY-MM-DD required by upstream LIS to avoid 1211 date format error
 */
export const normalizeDateToYYYYMMDD = (dateVal) => {
  if (!dateVal) return formatDate();
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return formatDate(dateVal);
  }

  const str = String(dateVal).trim();
  if (!str) return formatDate();

  // 1. If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  // 2. Handle Java Date.toString() e.g. "Mon Oct 26 00:00:00 UTC 2026" or "Mon Oct 26 00:00:00 IST 2026"
  const javaDateMatch = str.match(/^[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+\d{2}:\d{2}:\d{2}\s+(?:[A-Za-z0-9_+-]+)\s+(\d{4})/);
  if (javaDateMatch) {
    const [, monthStr, dayStr, yearStr] = javaDateMatch;
    const mm = monthMap[monthStr.toLowerCase()];
    if (mm) {
      return `${yearStr}-${mm}-${dayStr.padStart(2, '0')}`;
    }
  }

  // 3. Handle Java format "Oct 26, 2026, 12:00:00 AM" or "Oct 26, 2026"
  const monthDayYearMatch = str.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthDayYearMatch) {
    const [, monthStr, dayStr, yearStr] = monthDayYearMatch;
    const mm = monthMap[monthStr.toLowerCase()];
    if (mm) {
      return `${yearStr}-${mm}-${dayStr.padStart(2, '0')}`;
    }
  }

  // 4. Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 5. Fallback date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatDate(parsed);
  }

  return formatDate();
};

// In-flight deduplication and short-lived cache (5s) for GETPATIENTLIST
const patientListCache = new Map();
const inFlightPatientList = new Map();

export const invalidatePatientListCache = () => {
  patientListCache.clear();
};

const fetchUpstreamPatientList = async (fromDate, toDate, sid) => {
  const cacheKey = `${fromDate}_${toDate}_${sid || 'default'}`;

  // 1. Check 5s memory cache to coalesce simultaneous calls
  const cached = patientListCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 5000)) {
    return cached.data;
  }

  // 2. In-flight request deduplication
  if (inFlightPatientList.has(cacheKey)) {
    return await inFlightPatientList.get(cacheKey);
  }

  const fetchPromise = upstreamService.get(
    'GETPATIENTLIST',
    { fromDate, toDate },
    sid
  ).then((res) => {
    patientListCache.set(cacheKey, {
      timestamp: Date.now(),
      data: res,
    });
    inFlightPatientList.delete(cacheKey);
    return res;
  }).catch((err) => {
    inFlightPatientList.delete(cacheKey);
    throw err;
  });

  inFlightPatientList.set(cacheKey, fetchPromise);
  return await fetchPromise;
};

export const getPatients = async (req, res, next) => {
  try {
    const today = formatDate();
    const explicitFrom = req.query.fromDate;
    const explicitTo = req.query.toDate;
    const search = req.query.search?.toLowerCase().trim() || '';
    const branch = req.query.branch || '';
    const status = req.query.status || '';
    const allDates = req.query.allDates === 'true';

    // If searching without explicit dates or allDates is requested, search wide window
    let fromDate = explicitFrom || (search || allDates ? '2026-01-01' : today);
    let toDate = explicitTo || (search || allDates ? '2026-12-31' : today);

    let upstreamData = await fetchUpstreamPatientList(
      fromDate,
      toDate,
      req.user?.upstreamSid
    );

    let patients = upstreamData?.payLoadJSON?.patients || [];

    // If searched within a specific date range and no results, try searching broad date range
    if (search && patients.length === 0 && explicitFrom) {
      const broadData = await fetchUpstreamPatientList(
        '2026-01-01',
        '2026-12-31',
        req.user?.upstreamSid
      );
      if (broadData?.payLoadJSON?.patients?.length > 0) {
        patients = broadData.payLoadJSON.patients;
      }
    }

    // If no explicit date was requested and today has 0 records, load recent records
    if (!explicitFrom && !search && !allDates && patients.length === 0) {
      const broadData = await fetchUpstreamPatientList(
        '2026-01-01',
        '2026-12-31',
        req.user?.upstreamSid
      );
      if (broadData?.payLoadJSON?.patients?.length > 0) {
        patients = broadData.payLoadJSON.patients;
      }
    }

    // Filter in-memory with safe string casting
    if (search) {
      patients = patients.filter((p) => {
        const name = String(p.name || '').toLowerCase();
        const pid = String(p.patientId || '').toLowerCase();
        const mobile = String(p.mobile || '').toLowerCase();
        const slNo = String(p.slNo || '').toLowerCase();
        const dr = String(p.referedDr || '').toLowerCase();
        return (
          name.includes(search) ||
          pid.includes(search) ||
          mobile.includes(search) ||
          slNo.includes(search) ||
          dr.includes(search)
        );
      });
    }

    if (branch) {
      patients = patients.filter((p) => String(p.branch) === String(branch));
    }

    // Official Upstream Patient Directory Status Constants:
    // STATUS_ENTRY = 'ENTRY', STATUS_SAMPLE = 'SAMPLE', STATUS_DATA_PART = 'RESULT PARTLY',
    // STATUS_DATA_FULL = 'RESULT FULLY', STATUS_REPORT_PRINT = 'PRINTING', STATUS_REPORT_RELEASED = 'RELEASED'
    const normalizePatientStatus = (raw) => {
      const s = String(raw || '').toUpperCase().trim();
      if (s === 'SAMPLE' || s.includes('SAMPLE')) return 'SAMPLE';
      if (s === 'RESULT PARTLY' || s === 'DATA_PART' || s.includes('PART')) return 'RESULT PARTLY';
      if (s === 'RESULT FULLY' || s === 'DATA_FULL' || s.includes('FULL')) return 'RESULT FULLY';
      if (s === 'PRINTING' || s === 'PRINT' || s.includes('PRINT')) return 'PRINTING';
      if (s === 'RELEASED' || s === 'RELEASE' || s === 'READY' || s.includes('RELEASE')) return 'RELEASED';
      return 'ENTRY';
    };

    // Upstream Patient Status & Payment Status Constants
    // PAYMENT_STATUS_CODE_NOBILL = 1, PAYMENT_STATUS_CODE_PAID = 2, PAYMENT_STATUS_CODE_UNPAID = 3
    const PAYMENT_STATUS_CODE_NOBILL = 1;
    const PAYMENT_STATUS_CODE_PAID = 2;
    const PAYMENT_STATUS_CODE_UNPAID = 3;

    // Use patient bill payment status directly from each patient JSON (do not call getBILL api)
    // Strictly map status to one of the 6 official patient directory statuses
    patients = patients.map((p) => {
      const total = Number(p.totalBill || 0);

      let statusNum = Number(p.billPayStatus);
      if (!statusNum || isNaN(statusNum)) {
        statusNum = total > 0 ? PAYMENT_STATUS_CODE_UNPAID : PAYMENT_STATUS_CODE_NOBILL;
      }

      const isPaid = statusNum === PAYMENT_STATUS_CODE_PAID;
      const isUnpaid = statusNum === PAYMENT_STATUS_CODE_UNPAID;
      const isNoBill = statusNum === PAYMENT_STATUS_CODE_NOBILL;

      const paid = isPaid ? total : Number(p.paidBill || 0);
      const due = (isPaid || isNoBill)
        ? 0
        : (p.balance !== undefined ? Number(p.balance) : Math.max(0, total - paid));

      const normalizedStatus = normalizePatientStatus(p.status);

      return {
        ...p,
        gender: normalizeGender(p.gender),
        status: normalizedStatus,
        totalBill: total,
        paidBill: paid,
        balance: due,
        dueAmount: due,
        billPayStatus: statusNum,
      };
    });

    if (status) {
      const targetNorm = normalizePatientStatus(status);
      patients = patients.filter((p) => p.status === targetNorm);
    }

    // Always sort patients so most recent date and newest PID are at the top
    patients.sort((a, b) => {
      const dateA = a.regDate ? new Date(a.regDate).getTime() : 0;
      const dateB = b.regDate ? new Date(b.regDate).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      const numA = parseInt(String(a.patientId || a.slNo || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.patientId || b.slNo || '').replace(/\D/g, ''), 10) || 0;
      return numB - numA;
    });

    // Detect the latest registration date available
    let latestDate = null;
    if (patients.length > 0 && patients[0].regDate) {
      const d = new Date(patients[0].regDate);
      if (!isNaN(d.getTime())) {
        latestDate = formatDate(d);
      }
    }

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      fromDate,
      toDate,
      latestDate: latestDate || today,
      total: patients.length,
      patients,
    });
  } catch (err) {
    next(err);
  }
};

export const addPatient = async (req, res, next) => {
  try {
    const {
      slNo = `${Date.now()}`.slice(-9),
      mobile = '',
      regDate = formatDate(),
      title = 'Mr',
      name,
      sampleType = 'Inside',
      age = '30',
      age_unit = 'Years',
      gender = 'Male',
      referedDr = 'Self',
      referDr = 'D1',
      refagent = '1',
      branch = req.user?.branchId || '1',
    } = req.body;

    if (!name) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'Patient name is required',
      });
    }

    const cleanRegDate = normalizeDateToYYYYMMDD(regDate);
    const cleanAge = String(age || '30').replace(/\D/g, '') || '30';
    const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(-10);

    const params = {
      slNo: String(slNo || '').trim(),
      mobile: cleanMobile,
      regDate: cleanRegDate,
      title: title || 'Mr',
      name: name.trim(),
      sampleType: sampleType || 'Inside',
      sampleCollectionType: sampleType || 'Inside',
      age: cleanAge,
      age_unit: age_unit || 'Years',
      gender: normalizeGender(gender),
      referedDr: (referedDr || 'Self').trim(),
      referDr: referDr || 'D1',
      refagent: refagent || '1',
      referAgent: refagent || '1',
      branch: branch || '1',
    };

    const upstreamData = await upstreamService.post('ADDPATIENT', params, null, req.user?.upstreamSid);

    let patientId = upstreamData?.payLoadJSON?.patientId || upstreamData?.patientId;
    if (!patientId && upstreamData?.redirectURL) {
      const match = upstreamData.redirectURL.match(/patientId=([^&]+)/i);
      if (match) patientId = match[1];
    }
    if (!patientId && typeof upstreamData?.Message === 'string') {
      const match = upstreamData.Message.match(/P\d+/i);
      if (match) patientId = match[0];
    }

    invalidatePatientListCache();

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Patient registered successfully',
      redirectURL: upstreamData?.redirectURL,
      patientId: patientId || null,
      sid: upstreamData?.sid,
      patient: { ...params, patientId: patientId || params.slNo },
    });
  } catch (err) {
    next(err);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const {
      patientId,
      slNo = '',
      mobile = '',
      regDate,
      title = 'Mr',
      name,
      sampleType = 'Inside',
      age = '30',
      age_unit = 'Years',
      gender = 'Male',
      referedDr = 'Self',
      referDr = 'D1',
      refagent = '1',
      branch = '1',
    } = req.body;

    if (!patientId || !name) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and name are required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    const cleanRegDate = normalizeDateToYYYYMMDD(regDate);
    const cleanAge = String(age || '30').replace(/\D/g, '') || '30';
    const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(-10);
    const cleanSlNo = String(slNo || cleanPatientId || '').trim();

    const params = {
      patientId: cleanPatientId,
      slNo: cleanSlNo,
      mobile: cleanMobile,
      regDate: cleanRegDate,
      title: title || 'Mr',
      name: name.trim(),
      sampleType: sampleType || 'Inside',
      sampleCollectionType: sampleType || 'Inside',
      age: cleanAge,
      age_unit: age_unit || 'Years',
      gender: normalizeGender(gender),
      referedDr: (referedDr || 'Self').trim(),
      referDr: referDr || 'D1',
      refagent: refagent || '1',
      referAgent: refagent || '1',
      branch: branch || '1',
    };

    const upstreamData = await upstreamService.post('UPDATEPATIENT', params, null, req.user?.upstreamSid);

    if (upstreamData?.StatusCode === '1211' || upstreamData?.STATUS === 'FAILED') {
      console.error('[UpdatePatient] Upstream returned error (1211):', {
        patientId: cleanPatientId,
        params,
        upstreamData,
      });
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamData?.StatusCode || '1211',
        Message: upstreamData?.Message || upstreamData?.Msg || 'Error In Processing - 1211',
        raw: upstreamData,
      });
    }

    invalidatePatientListCache();
    invalidateReportCache(cleanPatientId);
    invalidateReportCache(patientId);

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Patient updated successfully',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId is required',
      });
    }

    const upstreamData = await upstreamService.post('DELETEPATIENT', { patientId }, null, req.user?.upstreamSid);

    invalidatePatientListCache();

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Patient deleted successfully',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const addMultipleTests = async (req, res, next) => {
  try {
    const { patientId, selectedTestIds, allowRepeat = false } = req.body;

    if (!patientId || !selectedTestIds) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and selectedTestIds are required (e.g. TEST|T1,PROF|11,PKG|3)',
      });
    }

    // Always normalize patientId to have 'P' prefix as required by upstream APIServlet
    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    // Fetch master catalogs to validate & auto-resolve tokens
    let testList = [];
    let profList = [];
    let pkgList = [];
    try {
      const [tRes, pRes, kRes] = await Promise.all([
        cacheService.getList(CACHE_KEYS.TEST_LIST),
        cacheService.getList(CACHE_KEYS.PROFILE_LIST),
        cacheService.getList(CACHE_KEYS.PKG_LIST),
      ]);
      testList = tRes?.data || [];
      profList = pRes?.data || [];
      pkgList = kRes?.data || [];
    } catch (e) {
      console.warn('[AddTests] Could not fetch master lists for validation:', e.message);
    }

    // Build fast lookup maps for exact catalog matching
    const testMap = new Map();
    const testNameMap = new Map();
    for (const t of testList) {
      const id = String(t['Test Id'] || '').trim();
      if (!id) continue;
      testMap.set(id.toUpperCase(), id);
      // If starts with T, also allow lookup without T (e.g. '1' -> 'T1')
      if (id.toUpperCase().startsWith('T')) {
        testMap.set(id.slice(1).toUpperCase(), id);
      } else {
        // If numeric test (e.g. '215'), also allow lookup with T (e.g. 'T215' -> '215')
        testMap.set(`T${id.toUpperCase()}`, id);
      }
      if (t.Name) testNameMap.set(t.Name.toLowerCase().trim(), id);
      if (t['Short Name']) testNameMap.set(t['Short Name'].toLowerCase().trim(), id);
    }

    const profMap = new Map();
    const profNameMap = new Map();
    for (const p of profList) {
      const id = String(p['Profile Id'] || '').trim();
      if (!id) continue;
      profMap.set(id.toUpperCase(), id);
      // In upstream, Profile 1 is 'P1', while Profiles 2-19 are numeric '2'-'19'
      if (id.toUpperCase().startsWith('P')) {
        profMap.set(id.slice(1).toUpperCase(), id);
      } else {
        profMap.set(`P${id.toUpperCase()}`, id);
      }
      if (p.Name) profNameMap.set(p.Name.toLowerCase().trim(), id);
    }

    const pkgMap = new Map();
    const pkgNameMap = new Map();
    for (const pkg of pkgList) {
      const id = String(pkg['Package Id'] || '').trim();
      if (!id) continue;
      pkgMap.set(id.toUpperCase(), id);
      // In upstream, Package 1 is 'K1', while Packages 2-5 are numeric '2'-'5'
      if (id.toUpperCase().startsWith('K')) {
        pkgMap.set(id.slice(1).toUpperCase(), id);
      } else {
        pkgMap.set(`K${id.toUpperCase()}`, id);
      }
      if (pkg.Name) pkgNameMap.set(pkg.Name.toLowerCase().trim(), id);
    }

    // Parse and sanitize incoming tokens
    const rawTokens = String(selectedTestIds).split(',').map((s) => s.trim()).filter(Boolean);
    const validTokens = [];

    for (const token of rawTokens) {
      let prefix = '';
      let val = '';

      if (token.includes('|')) {
        const parts = token.split('|');
        prefix = (parts[0] || '').trim().toUpperCase();
        val = (parts[1] || '').trim();
      } else {
        val = token.trim();
      }

      if (!val) continue;

      const upperVal = val.toUpperCase();
      const lowerVal = val.toLowerCase();

      // Case 1: Token marked as Profile (PROF)
      if (prefix === 'PROF') {
        const matchedId = profMap.get(upperVal) || profNameMap.get(lowerVal);
        if (matchedId) {
          validTokens.push(`PROF|${matchedId}`);
          continue;
        }
        // Fallback: search profile list by partial name
        const matchByName = profList.find((p) => String(p.Name || '').toLowerCase().includes(lowerVal));
        if (matchByName) {
          validTokens.push(`PROF|${matchByName['Profile Id']}`);
          continue;
        }
        // Fallback: retain val without forcing 'P' prefix
        validTokens.push(`PROF|${val}`);
        continue;
      }

      // Case 2: Token marked as Package (PKG)
      if (prefix === 'PKG') {
        const matchedId = pkgMap.get(upperVal) || pkgNameMap.get(lowerVal);
        if (matchedId) {
          validTokens.push(`PKG|${matchedId}`);
          continue;
        }
        // Fallback: search package list by partial name
        const matchByName = pkgList.find((pkg) => String(pkg.Name || '').toLowerCase().includes(lowerVal));
        if (matchByName) {
          validTokens.push(`PKG|${matchByName['Package Id']}`);
          continue;
        }
        // Fallback: retain val without forcing 'K' prefix
        validTokens.push(`PKG|${val}`);
        continue;
      }

      // Case 3: Token marked as Test (TEST)
      if (prefix === 'TEST') {
        const matchedTestId = testMap.get(upperVal) || testNameMap.get(lowerVal);
        if (matchedTestId) {
          validTokens.push(`TEST|${matchedTestId}`);
          continue;
        }

        // Could it actually be a profile id?
        const matchedProfId = profMap.get(upperVal) || profNameMap.get(lowerVal);
        if (matchedProfId) {
          validTokens.push(`PROF|${matchedProfId}`);
          continue;
        }

        // Could it actually be a package id?
        const matchedPkgId = pkgMap.get(upperVal) || pkgNameMap.get(lowerVal);
        if (matchedPkgId) {
          validTokens.push(`PKG|${matchedPkgId}`);
          continue;
        }

        // Search test list by partial name
        const matchByName = testList.find((t) => {
          const n = String(t.Name || '').toLowerCase();
          const s = String(t['Short Name'] || '').toLowerCase();
          return (lowerVal.length >= 3 && (n.includes(lowerVal) || s.includes(lowerVal)));
        });
        if (matchByName) {
          validTokens.push(`TEST|${matchByName['Test Id']}`);
          continue;
        }

        // Fallback: if starts with T+digits or is pure digits
        if (/^T\d+$/i.test(val)) {
          validTokens.push(`TEST|${upperVal}`);
          continue;
        }
        if (/^\d+$/i.test(val)) {
          validTokens.push(`TEST|${val}`);
          continue;
        }
        validTokens.push(`TEST|${val}`);
        continue;
      }

      // Case 4: No prefix provided (e.g. 'T1', 'P1', '11', '3', or item name)
      if (testMap.has(upperVal)) {
        validTokens.push(`TEST|${testMap.get(upperVal)}`);
        continue;
      }
      if (profMap.has(upperVal)) {
        validTokens.push(`PROF|${profMap.get(upperVal)}`);
        continue;
      }
      if (pkgMap.has(upperVal)) {
        validTokens.push(`PKG|${pkgMap.get(upperVal)}`);
        continue;
      }
      if (testNameMap.has(lowerVal)) {
        validTokens.push(`TEST|${testNameMap.get(lowerVal)}`);
        continue;
      }
      if (profNameMap.has(lowerVal)) {
        validTokens.push(`PROF|${profNameMap.get(lowerVal)}`);
        continue;
      }
      if (pkgNameMap.has(lowerVal)) {
        validTokens.push(`PKG|${pkgNameMap.get(lowerVal)}`);
        continue;
      }
    }

    const uniqueValidTokens = Array.from(new Set(validTokens));

    if (uniqueValidTokens.length === 0) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'No valid diagnostic tests or profiles recognized. Please select tests from the catalog suggestions.',
      });
    }

    // Duplicate Investigation Check against patient's existing worklist
    let tokensToSend = uniqueValidTokens;
    const duplicateLabels = [];

    if (!allowRepeat) {
      try {
        const repData = await upstreamService.get('GETPATIENTREPORT', { patientId: cleanPatientId }, req.user?.upstreamSid);
        const existingReports = repData?.payLoadJSON?.reports || [];

        const existingTestIds = new Set();
        const existingProfIds = new Set();
        const existingPkgIds = new Set();
        const existingNames = new Set();

        existingReports.forEach((r) => {
          if (r.testId) {
            const tid = String(r.testId).toUpperCase().trim();
            existingTestIds.add(tid);
            if (tid.startsWith('T')) existingTestIds.add(tid.slice(1));
            else existingTestIds.add(`T${tid}`);
          }
          if (r.profileName && String(r.profileName).trim() !== 'undefined') {
            const pid = String(r.profileName).toUpperCase().trim();
            existingProfIds.add(pid);
            existingProfIds.add(pid.replace(/^P+/i, ''));
          }
          if (r.packageName && String(r.packageName).trim() !== 'undefined') {
            const kid = String(r.packageName).toUpperCase().trim();
            existingPkgIds.add(kid);
            existingPkgIds.add(kid.replace(/^K+/i, ''));
          }
          if (r.testName) {
            existingNames.add(String(r.testName).toLowerCase().trim());
          }
        });

        const nonDuplicateTokens = [];
        for (const token of uniqueValidTokens) {
          const [prefix, id] = token.split('|');
          const uId = (id || '').toUpperCase().trim();
          let isDup = false;

          if (prefix === 'TEST' && existingTestIds.has(uId)) isDup = true;
          if (prefix === 'PROF' && (existingProfIds.has(uId) || existingProfIds.has(uId.replace(/^P+/i, '')))) isDup = true;
          if (prefix === 'PKG' && (existingPkgIds.has(uId) || existingPkgIds.has(uId.replace(/^K+/i, '')))) isDup = true;

          if (isDup) {
            // Find friendly readable name
            let friendlyName = id;
            if (prefix === 'TEST') {
              const t = testList.find((x) => String(x['Test Id']).toUpperCase() === uId);
              if (t?.Name) friendlyName = t.Name;
            } else if (prefix === 'PROF') {
              const p = profList.find((x) => String(x['Profile Id']).toUpperCase() === uId || String(x['Profile Id']).replace(/^P+/i, '') === uId.replace(/^P+/i, ''));
              if (p?.Name) friendlyName = p.Name;
            } else if (prefix === 'PKG') {
              const k = pkgList.find((x) => String(x['Package Id']).toUpperCase() === uId || String(x['Package Id']).replace(/^K+/i, '') === uId.replace(/^K+/i, ''));
              if (k?.Name) friendlyName = k.Name;
            }
            duplicateLabels.push(friendlyName);
          } else {
            nonDuplicateTokens.push(token);
          }
        }

        if (duplicateLabels.length > 0) {
          if (nonDuplicateTokens.length === 0) {
            // All requested investigations are duplicates
            return res.status(409).json({
              STATUS: 'DUPLICATE_BLOCKED',
              StatusCode: '409',
              Message: `Investigation(s) already in patient worklist: "${duplicateLabels.join(', ')}". Duplicate order was blocked to prevent double-billing.`,
              duplicates: duplicateLabels,
              canRepeat: true,
            });
          }
          // Some are duplicates, some are new -> filter out duplicates and proceed with new items
          tokensToSend = nonDuplicateTokens;
        }
      } catch (err) {
        console.warn('[AddTests] Duplicate inspection warning:', err.message);
      }
    }

    const sanitizedTestIds = tokensToSend.join(',');
    console.log(`[AddTests] Ordering ${tokensToSend.length} test(s) for patient ${cleanPatientId}: ${sanitizedTestIds}`);

    const params = {
      patientId: cleanPatientId,
      selectedTestIds: sanitizedTestIds,
    };

    const upstreamData = await upstreamService.post('ADDTESTMULTIPLE', params, null, req.user?.upstreamSid);
    invalidateReportCache(cleanPatientId);

    if (upstreamData?.StatusCode === '1211' || upstreamData?.STATUS === 'FAILED') {
      console.error('[AddTests] Upstream returned error (1211):', {
        patientId: cleanPatientId,
        selectedTestIds: sanitizedTestIds,
        upstreamData,
      });

      const errMsg =
        upstreamData?.Message && upstreamData?.Message !== 'Error In Proccessing - 1211'
          ? upstreamData.Message
          : `Upstream server was unable to add test (1211). Please verify patient #${cleanPatientId} and selected investigations.`;

      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamData?.StatusCode || '1211',
        Message: errMsg,
        data: upstreamData,
      });
    }

    // Bill is generated and modified internally upstream upon adding tests;
    // do not trigger routine BILLGENERATE here.

    const successMsg = duplicateLabels.length > 0
      ? `Added ${tokensToSend.length} new test(s). Skipped duplicate(s): ${duplicateLabels.join(', ')}.`
      : (upstreamData?.Message || 'Tests added successfully');

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: successMsg,
      patientId: cleanPatientId,
      selectedTestIds: sanitizedTestIds,
      skippedDuplicates: duplicateLabels,
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch patient audit/activity logs (GETLOGPATIENT)
 */
export const getPatientLogs = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId query parameter is required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    const upstreamData = await upstreamService.get(
      'GETLOGPATIENT',
      { patientId: cleanPatientId },
      req.user?.upstreamSid
    );

    const payload = upstreamData?.payLoadJSON || {};
    const logs = payload.logs || [];
    const patient = payload.patient || null;

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Logs fetched successfully',
      logs,
      patient,
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch patient EMR history (GETEMRPATIENT)
 */
export const getPatientEmr = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId query parameter is required',
      });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    const upstreamData = await upstreamService.get(
      'GETEMRPATIENT',
      { patientId: cleanPatientId },
      req.user?.upstreamSid
    );

    const payload = upstreamData?.payLoadJSON || {};
    const emrlist = payload.emrlist || [];
    const patient = payload.patient || null;

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'EMR history fetched successfully',
      emrlist,
      patient,
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

