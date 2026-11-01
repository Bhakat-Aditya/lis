import express from 'express';
import {
  getDashboardAnalytics,
  refreshDashboardAnalytics,
} from '../controllers/controller.analytics.js';
import { requireAuth } from '../middleware/middleware.auth.js';

const router = express.Router();

// Protected dashboard analytics routes
router.use(requireAuth);

// GET API_GET_DASHBOARD_JSON="GETDASHBOARDJSON" (fromDate & toDate in yyyy-MM-dd)
router.get('/dashboard', getDashboardAnalytics);

// POST API_DASHBOARD_REFRESH="DASHBOARDREFRESH" (fromDate & toDate in yyyy-MM-dd)
router.post('/refresh', refreshDashboardAnalytics);

export default router;
