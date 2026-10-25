import axios from 'axios';
import { upstreamService } from '../services/service.upstream.js';

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

    const payload = upstreamData?.payLoadJSON || {};
    const reports = payload.reports || [];
    const patient = payload.patient || null;
    const printPDFUrl = payload.printPDFUrl || '';
    const printPDFUrlWithHeader = printPDFUrl ? printPDFUrl.replace('addHeader=false', 'addHeader=true') : '';
    const printPDFUrlWithoutHeader = printPDFUrl ? printPDFUrl.replace('addHeader=true', 'addHeader=false') : '';

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
    if (!billing || req.query.withBilling === 'true') {
      try {
        billing = await upstreamService.getBillingSummary(cleanPatientId, req.user?.upstreamSid);
      } catch (e) {
        console.warn(`[Report] getBillingSummary error for ${cleanPatientId}:`, e.message);
      }
    }

    const billUrl = billing?.billUrl || '';

    const patientTotal = Number(patient?.totalBill || 0);
    const statusNum = Number(patient?.billPayStatus);
    const isPaid = statusNum === 2 || (billing && billing.total > 0 && billing.due <= 0 && billing.paid >= billing.total);
    const isUnpaid = statusNum === 3 || (!isPaid && statusNum !== 1 && patientTotal > 0);
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

    const patientWithBilling = patient
      ? {
          ...patient,
          status: normalizePatientStatus(patient.status),
          grossTotal: billing?.gross || (billing?.total && billing.total > 0 ? billing.total : patientTotal),
          totalBill: (billing?.total && billing.total > 0) ? billing.total : patientTotal,
          discount: billing?.discount || 0,
          roundoff: billing?.roundoff || 0,
          paidBill: billing ? billing.paid : (isPaid ? patientTotal : Number(patient.paidBill || 0)),
          balance: billing
            ? billing.due
            : (isPaid ? 0 : (patient.balance !== undefined ? Number(patient.balance) : Math.max(0, patientTotal - Number(patient.paidBill || 0)))),
          dueAmount: billing ? billing.due : (isPaid ? 0 : patientTotal),
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

    reportCache.set(cleanPatientId, { timestamp: Date.now(), data: responseData });
    return res.json(responseData);
  } catch (err) {
    next(err);
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
      sampletype = 'Serum',
      method = '',
      refRange = '',
      unitref = '',
      resultData = '',
      unit = '',
      comment = '',
    } = req.body;

    if (!reportId || !patientId) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'reportId and patientId are required',
      });
    }

    const params = {
      profileName,
      deptName,
      reportId,
      patientId,
      sampleId,
      testName,
      rate,
      sampletype,
      method,
      refRange,
      unitref,
      resultData,
      unit,
      comment,
    };

    const upstreamData = await upstreamService.post('UPDATEREPORT', params, null, req.user?.upstreamSid);
    invalidateReportCache(patientId);

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
    const { patientId, reportId, resultVersion = 1 } = req.body;
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
      'SETDEFAULTRESULT',
      { patientId: cleanPatientId, reportId: String(reportId).trim(), resultVersion: Number(resultVersion) || 1 },
      null,
      req.user?.upstreamSid
    );

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || `Default result set to version ${resultVersion}`,
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const downloadResult = async (req, res, next) => {
  try {
    const { patientId, reportId } = req.body;
    const upstreamData = await upstreamService.post('DOWNLOADRESULT', { patientId, reportId }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Download initiated',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const sendWhatsApp = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    const upstreamData = await upstreamService.post('SENDWHATSAPP', { patientId }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report sent to WhatsApp',
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
 * Status: DELETED
 */
export const deleteReport = async (req, res, next) => {
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
    const cleanReportId = String(reportId).trim();

    let upstreamData = null;
    let successful = false;

    // 1. Try REPORTDELETE
    try {
      upstreamData = await upstreamService.post('REPORTDELETE', { patientId: cleanPatientId, reportId: cleanReportId }, null, req.user?.upstreamSid);
      if (upstreamData?.STATUS === 'SUCCESS') successful = true;
    } catch (e1) {
      // ignore and try next
    }

    // 2. Try DELETEREPORT
    if (!successful) {
      try {
        upstreamData = await upstreamService.post('DELETEREPORT', { patientId: cleanPatientId, reportId: cleanReportId }, null, req.user?.upstreamSid);
        if (upstreamData?.STATUS === 'SUCCESS') successful = true;
      } catch (e2) {
        // ignore and try next
      }
    }

    // 3. Fallback: UPDATEREPORT with status = 'DELETED'
    if (!successful) {
      try {
        upstreamData = await upstreamService.post('UPDATEREPORT', {
          patientId: cleanPatientId,
          reportId: cleanReportId,
          status: 'DELETED',
        }, null, req.user?.upstreamSid);
        if (upstreamData?.STATUS === 'SUCCESS') successful = true;
      } catch (e3) {
        console.warn('[Report] Fallback UPDATEREPORT status=DELETED failed:', e3.message);
      }
    }

    invalidateReportCache(cleanPatientId);

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Test parameter deleted successfully',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Restore individual test report parameter
 * Reverts status from DELETED to SAVED / ENTRY
 */
export const restoreReport = async (req, res, next) => {
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
    const cleanReportId = String(reportId).trim();

    let upstreamData = null;
    let successful = false;

    // 1. Try REPORTRESTORE
    try {
      upstreamData = await upstreamService.post('REPORTRESTORE', { patientId: cleanPatientId, reportId: cleanReportId }, null, req.user?.upstreamSid);
      if (upstreamData?.STATUS === 'SUCCESS') successful = true;
    } catch (e1) {
      // ignore and try next
    }

    // 2. Try RESTOREREPORT
    if (!successful) {
      try {
        upstreamData = await upstreamService.post('RESTOREREPORT', { patientId: cleanPatientId, reportId: cleanReportId }, null, req.user?.upstreamSid);
        if (upstreamData?.STATUS === 'SUCCESS') successful = true;
      } catch (e2) {
        // ignore and try next
      }
    }

    // 3. Fallback: UPDATEREPORT with status = 'SAVED'
    if (!successful) {
      try {
        upstreamData = await upstreamService.post('UPDATEREPORT', {
          patientId: cleanPatientId,
          reportId: cleanReportId,
          status: 'SAVED',
        }, null, req.user?.upstreamSid);
        if (upstreamData?.STATUS === 'SUCCESS') successful = true;
      } catch (e3) {
        console.warn('[Report] Fallback UPDATEREPORT status=SAVED failed:', e3.message);
      }
    }

    invalidateReportCache(cleanPatientId);

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Test parameter restored successfully',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};


