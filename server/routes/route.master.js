import express from 'express';
import {
  getMasterList,
  getAllMasterData,
  getCacheStatus,
  forceRefresh,
  updateDepartment,
  updateUnit,
  updateTest,
  updateProfile,
  updatePackage,
  updateDoctor,
  updateReference,
  updateBranch,
  updateUser,
  updateInterpretation,
} from '../controllers/controller.master.js';
import { requireAuth } from '../middleware/middleware.auth.js';
import { requireRoles, ROLES } from '../middleware/middleware.role.js';

const router = express.Router();

router.use(requireAuth);

// Read endpoints
router.get('/all', getAllMasterData);
router.get('/status', getCacheStatus);
router.get('/list/:key', getMasterList);
router.post('/refresh', forceRefresh);

// Update endpoints (Protected to Admin/Super or authorized staff)
router.post('/department', requireRoles([ROLES.SUPER]), updateDepartment);
router.post('/unit', requireRoles([ROLES.SUPER]), updateUnit);
router.post('/test', requireRoles([ROLES.SUPER]), updateTest);
router.post('/profile', requireRoles([ROLES.SUPER]), updateProfile);
router.post('/package', requireRoles([ROLES.SUPER]), updatePackage);
router.post('/doctor', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST]), updateDoctor);
router.post('/reference', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST]), updateReference);
router.post('/branch', requireRoles([ROLES.SUPER]), updateBranch);
router.post('/user', requireRoles([ROLES.SUPER]), updateUser);
router.post('/interpretation', requireRoles([ROLES.SUPER, ROLES.DOCTOR]), updateInterpretation);

export default router;
