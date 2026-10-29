import express from 'express';
import { getDashboardAnalytics } from '../controllers/controller.analytics.js';
import { requireAuth } from '../middleware/middleware.auth.js';

const router = express.Router();

// Protected dashboard analytics route
router.use(requireAuth);
router.get('/dashboard', getDashboardAnalytics);

export default router;

