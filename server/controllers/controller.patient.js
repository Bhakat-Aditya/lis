import { upstreamService } from '../services/service.upstream.js';

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
    const fromDate = req.query.fromDate || today;
    const toDate = req.query.toDate || today;
    const search = req.query.search?.toLowerCase() || '';
    const branch = req.query.branch || '';
    const status = req.query.status || '';

    const upstreamData = await upstreamService.get(
      'GETPATIENTLIST',
      { fromDate, toDate },
      req.user?.upstreamSid
    );

    let patients = upstreamData?.payLoadJSON?.patients || [];

    // Filter in-memory if query parameters provided
    if (search) {
      patients = patients.filter((p) => {
        return (
          p.name?.toLowerCase().includes(search) ||
          p.patientId?.toLowerCase().includes(search) ||
          p.mobile?.includes(search) ||
          p.slNo?.includes(search)
        );
      });
    }

    if (branch) {
      patients = patients.filter((p) => String(p.branch) === String(branch));
    }

    if (status) {
      patients = patients.filter((p) => p.status?.toLowerCase() === status.toLowerCase());
    }

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      fromDate,
      toDate,
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

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Patient registered successfully',
      redirectURL: upstreamData?.redirectURL,
      sid: upstreamData?.sid,
      patient: params,
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
        Message: 'patientId and selectedTestIds are required (e.g. TEST|T1,PROF|11,PKG|3)',
      });
    }

    const params = {
      patientId,
      selectedTestIds,
    };

    const upstreamData = await upstreamService.post('ADDTESTMULTIPLE', params, null, req.user?.upstreamSid);

    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Tests added successfully',
      data: upstreamData,
    });
  } catch (err) {
    next(err);
  }
};
