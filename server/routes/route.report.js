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
  getTemplateJson,
  updateTemplateData,
} from '../controllers/controller.report.js';
import { requireAuth } from '../middleware/middleware.auth.js';
import { requireRoles, ROLES } from '../middleware/middleware.role.js';

const router = express.Router();

router.use(requireAuth);

// Read report & PDF
router.get('/patient-report', getPatientReport);
router.get('/pdf', streamReportPdf);
router.get('/template-json', getTemplateJson);

// Update Template Report Full-Page Data (UPDATETEMPLATEDATA)
router.post(
  '/template-data',
  requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.MICROBIOLOGY, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.OFFICE]),
  updateTemplateData
);

// Rule 3 & 4: Technician, Doctor, Microbiology User (scoped to Micro dept in controller)
router.post(
  '/update',
  requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.MICROBIOLOGY, ROLES.DOCTOR]),
  updateReport
);

// Rule 1: Reception / Office => Delete Report & Restore Report
router.post(
  '/delete',
  requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE]),
  deleteReport
);

router.post(
  '/restore',
  requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE]),
  restoreReport
);

// Rule 1 & 3: Reception / Office & Technician => Received Sample
router.post(
  '/receive-sample',
  requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE, ROLES.TECHNICIAN]),
  receiveSample
);

// Verification and Approval
router.post('/verify', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN]), verifyReport);
router.post('/approve', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN]), approveReport);
router.post('/reject', requireRoles([ROLES.SUPER, ROLES.DOCTOR, ROLES.TECHNICIAN]), rejectReport);

// Rule 3: Technician => Release Report
router.post(
  '/release',
  requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]),
  releaseReport
);

// Rule 3: Technician => Calculate Result
router.post('/calculate-result', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN]), calculateResult);

// Rule 3: Technician => Set Default Result
router.post(
  '/set-default-result',
  requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]),
  setDefaultResult
);

// Rule 3: Technician => Download Result
router.post('/download', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), downloadResult);
router.post('/download-result', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), downloadResult);

// Rule 3: Technician => Upload Order
router.post('/upload-order', requireRoles([ROLES.SUPER, ROLES.TECHNICIAN, ROLES.DOCTOR]), uploadOrder);

// Rule 1 & 2: Reception / Office & Branch => Send WhatsApp
router.post(
  '/send-whatsapp',
  requireRoles([
    ROLES.SUPER,
    ROLES.RECEPTIONIST,
    ROLES.OFFICE,
    ROLES.BRANCH,
    ROLES.DOCTOR,
    ROLES.TECHNICIAN,
  ]),
  sendWhatsApp
);

export default router;
