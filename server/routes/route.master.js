import express from 'express';
import {
  getMasterList,
  getAllMasterData,
  getCacheStatus,
  forceRefresh,
  updateDepartment,
  updateUnit,
  updateMethod,
  updateTest,
  updateProfile,
  updatePackage,
  updateDoctor,
  updateReference,
  updateBranch,
  updateUser,
  updateInterpretation,
  updateSample,
  updateTemplate,
} from '../controllers/controller.master.js';
import { requireAuth } from '../middleware/middleware.auth.js';
import { requireRoles, ROLES } from '../middleware/middleware.role.js';

const router = express.Router();

router.use(requireAuth);

// 1. View Master Static Data & Cache Refresh - Accessible to authenticated clinic staff
router.get('/all', getAllMasterData);
router.get('/status', getCacheStatus);
router.get('/list/:key', getMasterList);
router.post('/refresh', forceRefresh);

// 2. Update Master Static Data - Lab Administrators (Super) & Setting managers
const requireMasterUpdate = requireRoles([ROLES.SETTING, ROLES.SUPER], {
  allowSuper: true,
  deniedMessage:
    "Access denied. Updating Master static settings is restricted to Lab Administrators and Setting managers.",
});

router.post('/department', requireMasterUpdate, updateDepartment);
router.post('/unit', requireMasterUpdate, updateUnit);
router.post('/method', requireMasterUpdate, updateMethod);
router.post('/test', requireMasterUpdate, updateTest);
router.post('/profile', requireMasterUpdate, updateProfile);
router.post('/package', requireMasterUpdate, updatePackage);
router.post('/doctor', requireMasterUpdate, updateDoctor);
router.post('/reference', requireMasterUpdate, updateReference);
router.post('/branch', requireMasterUpdate, updateBranch);
router.post('/user', requireMasterUpdate, updateUser);
router.post('/interpretation', requireMasterUpdate, updateInterpretation);
router.post('/sample', requireMasterUpdate, updateSample);
router.post('/template', requireMasterUpdate, updateTemplate);

export default router;
