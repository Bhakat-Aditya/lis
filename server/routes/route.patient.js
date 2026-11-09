import express from 'express';
import {
  getPatients,
  addPatient,
  updatePatient,
  deletePatient,
  addMultipleTests,
  getPatientLogs,
  getPatientEmr,
} from '../controllers/controller.patient.js';
import { getPatientReport } from '../controllers/controller.report.js';
import { requireAuth } from '../middleware/middleware.auth.js';
import { requireRoles, ROLES } from '../middleware/middleware.role.js';

const router = express.Router();

router.use(requireAuth);

// Patient List (Accessible to authenticated clinic staff)
router.get('/list', getPatients);

// Rule 2: Branch has NO ACCESS to Patient Activity Logs (X Log Patient)
router.get(
  '/logs',
  requireRoles([], {
    deniedRoles: [ROLES.BRANCH],
    deniedMessage: 'Access denied. Branch role is restricted from viewing Patient Activity Logs.',
  }),
  getPatientLogs
);

// Rule 2: Branch has NO ACCESS to Patient EMR (X EMR Patient)
router.get(
  '/emr',
  requireRoles([], {
    deniedRoles: [ROLES.BRANCH],
    deniedMessage: 'Access denied. Branch role is restricted from viewing Patient EMR History.',
  }),
  getPatientEmr
);

// Individual Patient Report & Demographics (Must come AFTER specific static routes like /logs and /emr)
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!id || ['logs', 'emr', 'list', 'add', 'update', 'delete', 'add-tests'].includes(id.toLowerCase())) {
    return next();
  }
  req.query.patientId = id;
  return getPatientReport(req, res, next);
});

// Rule 1 & 2: Patient Entry => Add Patient / Update
router.post(
  '/add',
  requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE, ROLES.BRANCH]),
  addPatient
);

router.post(
  '/update',
  requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE, ROLES.BRANCH]),
  updatePatient
);

// Rule 1 & 2: Add Test => ADD TEST MULTIPLE
router.post(
  '/add-tests',
  requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE, ROLES.BRANCH]),
  addMultipleTests
);

// Rule 1 & 2: Delete Patient record (Accessible to Super, Receptionist, Office, Branch, Setting)
router.post(
  '/delete',
  requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE, ROLES.BRANCH, ROLES.SETTING]),
  deletePatient
);

export default router;
