import jwt from 'jsonwebtoken';
import { config } from '../config/config.env.js';
import { sessionService } from '../services/service.session.js';
import { upstreamService } from '../services/service.upstream.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        STATUS: 'FAILED',
        StatusCode: '401',
        Message: 'Authentication required. No token provided.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    // Validate active session status (gracefully supports multiple tabs/windows)
    if (decoded.loginId && decoded.sessionId) {
      const validation = await sessionService.validateSession(decoded.loginId, decoded.sessionId);
      if (!validation.valid && validation.reason !== 'SESSION_SUPERSEDED') {
        return res.status(401).json({
          STATUS: 'FAILED',
          StatusCode: '1140',
          Message: validation.message || 'Session expired. Please login again.',
          reason: validation.reason,
        });
      }
    }

    // Always synchronize decoded.upstreamSid with the current live masterSid
    if (upstreamService.masterSid) {
      decoded.upstreamSid = upstreamService.masterSid;
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      STATUS: 'FAILED',
      StatusCode: '1140',
      Message: 'Invalid or expired session. Please login again.',
      error: err.message,
    });
  }
};
