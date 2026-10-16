import express from 'express';
import { login, logout, getMe } from '../controllers/controller.auth.js';
import { requireAuth } from '../middleware/middleware.auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

export default router;
