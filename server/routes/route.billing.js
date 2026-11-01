import express from 'express';
import {
  generateBill,
  recordDeposit,
  getInvoice,
  applyDiscount,
  getBillJson,
  streamInvoicePdf,
  updateBill,
  getBillList,
} from '../controllers/controller.billing.js';
import { requireAuth } from '../middleware/middleware.auth.js';
import { requireRoles, ROLES } from '../middleware/middleware.role.js';

const router = express.Router();

router.use(requireAuth);

router.get('/list', getBillList);
router.post('/generate', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE, ROLES.BRANCH]), generateBill);

// Rule 2: Branch => Payment Receive (recordDeposit)
router.post('/deposit', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE, ROLES.BRANCH]), recordDeposit);

router.post('/discount', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE, ROLES.BRANCH]), applyDiscount);
router.post('/update-bill', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.OFFICE, ROLES.BRANCH]), updateBill);

router.get('/invoice', getInvoice);
router.get('/bill-json', getBillJson);
router.get('/pdf', streamInvoicePdf);

export default router;
