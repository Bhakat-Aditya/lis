import express from 'express';
import {
  login,
  logout,
  getMe,
  updatePassword,
  forgetPassword,
  resetPassword,
} from '../controllers/controller.auth.js';
import { requireAuth } from '../middleware/middleware.auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

// Password Management APIs
// 1. After login only: API_PASSWORD_UPDATE="PASSWORDUPDATE"
router.post('/password/update', requireAuth, updatePassword);

// 2. Before login: API_PASSWORD_FORGET="PASSWORDFORGET"
router.post('/password/forget', forgetPassword);

// 3. Before login: API_PASSWORD_RESET="PASSWORDRESET"
router.post('/password/reset', resetPassword);

export default router;
