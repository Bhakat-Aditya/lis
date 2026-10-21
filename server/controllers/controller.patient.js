import { upstreamService } from '../services/service.upstream.js';
import { cacheService, CACHE_KEYS } from '../services/service.cache.js';

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

    let upstreamData = await upstreamService.get(
      'GETPATIENTLIST',
      { fromDate, toDate },
      req.user?.upstreamSid
    );

    let patients = upstreamData?.payLoadJSON?.patients || [];

    // If searched within a specific date range and no results, try searching broad date range
    if (search && patients.length === 0 && explicitFrom) {
      const broadData = await upstreamService.get(
        'GETPATIENTLIST',
        { fromDate: '2026-01-01', toDate: '2026-12-31' },
        req.user?.upstreamSid
      );
      if (broadData?.payLoadJSON?.patients?.length > 0) {
        patients = broadData.payLoadJSON.patients;
      }
    }

    // If no explicit date was requested and today has 0 records, load recent records
    if (!explicitFrom && !search && !allDates && patients.length === 0) {
      const broadData = await upstreamService.get(
        'GETPATIENTLIST',
        { fromDate: '2026-01-01', toDate: '2026-12-31' },
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

    if (status) {
      patients = patients.filter((p) => String(p.status || '').toLowerCase() === status.toLowerCase());
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

    // Proactively pre-fetch billing summaries for top recent patients who have a total bill
    if (req.query.withBilling === 'true' || allDates) {
      const needsBilling = patients
        .slice(0, 20)
        .filter((p) => Number(p.totalBill) > 0 && !upstreamService.getCachedBilling(p.patientId || p.slNo));
      if (needsBilling.length > 0) {
        await Promise.allSettled(
          needsBilling.map((p) =>
            upstreamService.getBillingSummary(p.patientId || p.slNo, req.user?.upstreamSid)
          )
        );
      }
    }

    // Enrich patients with latest billing summaries
    patients = patients.map((p) => {
      const pid = p.patientId || p.slNo;
      const cached = upstreamService.getCachedBilling(pid);
      if (cached) {
        const total = (cached.total && cached.total > 0) ? cached.total : Number(p.totalBill || 0);
        const paid = cached.paid || 0;
        const due = cached.due !== undefined ? cached.due : Math.max(0, total - paid);
        const isPaid = total > 0 && due <= 0 && paid >= total;
        return {
          ...p,
          totalBill: total,
          paidBill: paid,
          balance: due,
          dueAmount: due,
          billPayStatus: isPaid ? 2 : (paid > 0 ? 1 : 0),
        };
      }
      return p;
    });

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

    const params = {
      slNo,
      mobile,
      regDate,
      title,
      name,
      sampleType,
      age,
      age_unit,
      gender,
      referedDr,
      referDr,
      refagent,
      branch,
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
      branch = '1',
    } = req.body;

    if (!patientId || !name) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and name are required',
      });
    }

    const params = {
      patientId,
      slNo,
      mobile,
      regDate,
      title,
      name,
      sampleType,
      age,
      age_unit,
      gender,
      referedDr,
      referDr,
      refagent,
      branch,
    };

    const upstreamData = await upstreamService.post('UPDATEPATIENT', params, null, req.user?.upstreamSid);

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
    const { patientId, selectedTestIds } = req.body;

    if (!patientId || !selectedTestIds) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'patientId and selectedTestIds are required (e.g. TEST|T1,PROF|P1,PKG|K1)',
      });
    }

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

    // Parse and sanitize incoming tokens
    const rawTokens = String(selectedTestIds).split(',').map((s) => s.trim()).filter(Boolean);
    const validTokens = [];

    for (const token of rawTokens) {
      const parts = token.split('|');
      const prefix = (parts[0] || 'TEST').toUpperCase();
      const val = (parts[1] || '').trim();
      if (!val) continue;

      if (prefix === 'TEST') {
        // 1. Direct valid test ID match (e.g. T1, T0, T75)
        const matchById = testList.find((t) => String(t['Test Id']).toUpperCase() === val.toUpperCase());
        if (matchById) {
          validTokens.push(`TEST|${matchById['Test Id']}`);
          continue;
        }

        // 2. Direct valid profile ID match (e.g. P1, P2)
        const matchByProfId = profList.find((p) => String(p['Profile Id']).toUpperCase() === val.toUpperCase());
        if (matchByProfId) {
          validTokens.push(`PROF|${matchByProfId['Profile Id']}`);
          continue;
        }

        // 3. Match by test name or short name
        const matchByName = testList.find((t) => {
          const n = String(t.Name || '').toLowerCase();
          const s = String(t['Short Name'] || '').toLowerCase();
          const q = val.toLowerCase();
          return n === q || s === q || n.includes(q);
        });
        if (matchByName) {
          validTokens.push(`TEST|${matchByName['Test Id']}`);
          continue;
        }

        // 4. Match by profile name
        const matchByProfName = profList.find((p) => {
          const n = String(p.Name || '').toLowerCase();
          const q = val.toLowerCase();
          return n === q || n.includes(q);
        });
        if (matchByProfName) {
          validTokens.push(`PROF|${matchByProfName['Profile Id']}`);
          continue;
        }

        // If it starts with 'T' and has digits, assume valid test ID
        if (/^T\d+$/i.test(val)) {
          validTokens.push(`TEST|${val.toUpperCase()}`);
          continue;
        }
      } else if (prefix === 'PROF') {
        const cleanProfId = val.startsWith('P') ? val.toUpperCase() : `P${val}`;
        const match = profList.find((p) => String(p['Profile Id']).toUpperCase() === cleanProfId);
        if (match) {
          validTokens.push(`PROF|${match['Profile Id']}`);
          continue;
        }
        if (/^P\d+$/i.test(cleanProfId)) {
          validTokens.push(`PROF|${cleanProfId}`);
          continue;
        }
      } else if (prefix === 'PKG') {
        const cleanPkgId = val.startsWith('K') ? val.toUpperCase() : `K${val}`;
        const match = pkgList.find((pkg) => String(pkg['Package Id']).toUpperCase() === cleanPkgId);
        if (match) {
          validTokens.push(`PKG|${match['Package Id']}`);
          continue;
        }
        if (/^K\d+$/i.test(cleanPkgId)) {
          validTokens.push(`PKG|${cleanPkgId}`);
          continue;
        }
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

    const sanitizedTestIds = uniqueValidTokens.join(',');
    console.log(`[AddTests] Ordering ${uniqueValidTokens.length} test(s) for patient ${patientId}: ${sanitizedTestIds}`);

    const params = {
      patientId,
      selectedTestIds: sanitizedTestIds,
    };

    const upstreamData = await upstreamService.post('ADDTESTMULTIPLE', params, null, req.user?.upstreamSid);

    if (upstreamData?.StatusCode === '1211' || upstreamData?.STATUS === 'FAILED') {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: upstreamData.StatusCode || '1211',
        Message: upstreamData.Message || 'Upstream server was unable to add test (1211)',
        data: upstreamData,
      });
    }

    // Refresh billing summary in background so patient dues update immediately
    upstreamService.getBillingSummary(patientId, req.user?.upstreamSid).catch((e) => {
      console.warn('[AddTests] Billing summary refresh note:', e.message);
    });

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Tests added successfully',
      selectedTestIds: sanitizedTestIds,
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};
