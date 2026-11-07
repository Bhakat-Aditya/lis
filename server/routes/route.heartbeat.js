import express from 'express';
import { getHeartbeats } from '../controllers/controller.heartbeat.js';

const router = express.Router();

// Direct BetterStack heartbeat status (Public or authenticated)
router.get('/', getHeartbeats);

export default router;

