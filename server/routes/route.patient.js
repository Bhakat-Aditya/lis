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
import { requireAuth } from '../middleware/middleware.auth.js';
import { requireRoles, ROLES } from '../middleware/middleware.role.js';

const router = express.Router();

router.use(requireAuth);

router.get('/list', getPatients);
router.get('/logs', getPatientLogs);
router.get('/emr', getPatientEmr);
router.post('/add', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.BRANCH, ROLES.OFFICE]), addPatient);
router.post('/update', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.BRANCH]), updatePatient);
router.post('/delete', requireRoles([ROLES.SUPER]), deletePatient);
router.post('/add-tests', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.BRANCH]), addMultipleTests);

export default router;

