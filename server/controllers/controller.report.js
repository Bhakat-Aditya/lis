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

    const upstreamData = await upstreamService.get(
      'GETPATIENTREPORT',
      { patientId },
      req.user?.upstreamSid
    );

    const payload = upstreamData?.payLoadJSON || {};
    const reports = payload.reports || [];
    const patient = payload.patient || null;
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
    try {
      billing = await upstreamService.getBillingSummary(patientId, req.user?.upstreamSid);
    } catch (e) {}

    const patientWithBilling = patient
      ? {
          ...patient,
          totalBill: billing?.total || Number(patient.totalBill || 0),
          paidBill: billing ? billing.paid : (patient.billPayStatus === 2 ? Number(patient.totalBill || 0) : Number(patient.paidBill || 0)),
          balance: billing ? billing.due : (patient.billPayStatus === 2 ? 0 : Number(patient.totalBill || 0)),
          billPayStatus: (billing?.isPaid || patient.billPayStatus === 2 || patient.billPayStatus === '2' || (billing && billing.due <= 0)) ? 2 : patient.billPayStatus,
        }
      : null;

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      patient: patientWithBilling,
      reports,
      templates,
      billing,
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

    const upstreamData = await upstreamService.post('RECEIVESAMPLE', { patientId }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Sample received successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const verifyReport = async (req, res, next) => {
  try {
    const { patientId, reportId } = req.body;
    const upstreamData = await upstreamService.post('REPORTVERIFY', { patientId, reportId }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report verified',
    });
  } catch (err) {
    next(err);
  }
};

export const approveReport = async (req, res, next) => {
  try {
    const { patientId, reportId } = req.body;
    const upstreamData = await upstreamService.post('REPORTAPPROVE', { patientId, reportId }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report approved',
    });
  } catch (err) {
    next(err);
  }
};

export const rejectReport = async (req, res, next) => {
  try {
    const { patientId, reportId, reason = '' } = req.body;
    const upstreamData = await upstreamService.post('REPORTREJECT', { patientId, reportId, reason }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report rejected',
    });
  } catch (err) {
    next(err);
  }
};

export const releaseReport = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    const upstreamData = await upstreamService.post('RELEASEREPORT', { patientId }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Report released for delivery/print',
    });
  } catch (err) {
    next(err);
  }
};

export const calculateResult = async (req, res, next) => {
  try {
    const { patientId, reportId } = req.body;
    const upstreamData = await upstreamService.post('CALCULATERESULT', { patientId, reportId }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Result calculated',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};

export const setDefaultResult = async (req, res, next) => {
  try {
    const { patientId, reportId, resultVersion = 1 } = req.body;
    const upstreamData = await upstreamService.post('SETDEFAULTRESULT', { patientId, reportId, resultVersion }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Default result set',
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
