import axios from 'axios';
import { upstreamService } from '../services/service.upstream.js';

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

    const upstreamData = await upstreamService.get(
      'GETPATIENTREPORT',
      { patientId: cleanPatientId },
      req.user?.upstreamSid
    );

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

    let billing = null;
    if (req.query.withBilling === 'true') {
      try {
        billing = await upstreamService.getBillingSummary(cleanPatientId, req.user?.upstreamSid);
      } catch (e) {}
    } else {
      billing = upstreamService.getCachedBilling(cleanPatientId);
    }

    const billUrl = billing?.billUrl || '';

    const patientTotal = Number(patient?.totalBill || 0);
    const statusNum = Number(patient?.billPayStatus);
    const isPaid = statusNum === 2 || (billing && billing.total > 0 && billing.due <= 0 && billing.paid >= billing.total);
    const isUnpaid = statusNum === 3 || (!isPaid && statusNum !== 1 && patientTotal > 0);
    const resolvedPayStatus = isPaid ? 2 : (isUnpaid ? 3 : 1);

    const patientWithBilling = patient
      ? {
          ...patient,
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

    return res.json({
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
    });
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

