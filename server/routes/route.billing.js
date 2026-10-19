import express from 'express';
import { generateBill, recordDeposit, getInvoice } from '../controllers/controller.billing.js';
import { requireAuth } from '../middleware/middleware.auth.js';
import { requireRoles, ROLES } from '../middleware/middleware.role.js';

const router = express.Router();

router.use(requireAuth);

router.post('/generate', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.BRANCH]), generateBill);
router.post('/deposit', requireRoles([ROLES.SUPER, ROLES.RECEPTIONIST, ROLES.BRANCH]), recordDeposit);
router.get('/invoice', getInvoice);

export default router;
