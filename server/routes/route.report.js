import express from 'express';
import {
  getPatientReport,
  updateReport,
  receiveSample,
  verifyReport,
  approveReport,
  rejectReport,
  releaseReport,
  calculateResult,
  setDefaultResult,
  downloadResult,
  sendWhatsApp,
  streamReportPdf,
} from '../controllers/controller.report.js';
import { requireAuth } from '../middleware/middleware.auth.js';
import { requireRoles, ROLES } from '../middleware/middleware.role.js';

const router = express.Router();

router.use(requireAuth);

router.get('/patient-report', getPatientReport);
router.get('/pdf', streamReportPdf);

router.post('/update', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), updateReport);
router.post('/receive-sample', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.RECEPTIONIST]), receiveSample);
router.post('/verify', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN]), verifyReport);
router.post('/approve', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN]), approveReport);
router.post('/reject', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN]), rejectReport);
router.post('/release', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN, ROLES.RECEPTIONIST]), releaseReport);
router.post('/calculate-result', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN]), calculateResult);
router.post('/set-default-result', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN]), setDefaultResult);
router.post('/download', downloadResult);
router.post('/send-whatsapp', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.DOCTOR]), sendWhatsApp);

export default router;
