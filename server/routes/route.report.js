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
  uploadOrder,
  sendWhatsApp,
  streamReportPdf,
  deleteReport,
  restoreReport,
} from '../controllers/controller.report.js';
import { requireAuth } from '../middleware/middleware.auth.js';
import { requireRoles, ROLES } from '../middleware/middleware.role.js';

const router = express.Router();

router.use(requireAuth);

router.get('/patient-report', getPatientReport);
router.get('/pdf', streamReportPdf);

router.post('/update', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), updateReport);
router.post('/delete', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), deleteReport);
router.post('/restore', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), restoreReport);
router.post('/receive-sample', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.RECEPTIONIST]), receiveSample);
router.post('/verify', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN]), verifyReport);
router.post('/approve', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN]), approveReport);
router.post('/reject', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN]), rejectReport);
router.post('/release', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN, ROLES.RECEPTIONIST]), releaseReport);
router.post('/calculate-result', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN]), calculateResult);
router.post('/set-default-result', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.BRANCH]), setDefaultResult);
router.post('/download', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), downloadResult);
router.post('/download-result', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), downloadResult);
router.post('/upload-order', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), uploadOrder);
router.post('/send-whatsapp', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.TECHNICIAN]), sendWhatsApp);

export default router;
