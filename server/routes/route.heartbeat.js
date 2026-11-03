import express from 'express';
import { getHeartbeats, pingHeartbeatUrl } from '../controllers/controller.heartbeat.js';

const router = express.Router();

// Direct BetterStack heartbeat status (Public or authenticated)
router.get('/', getHeartbeats);
router.post('/ping', pingHeartbeatUrl);

export default router;

