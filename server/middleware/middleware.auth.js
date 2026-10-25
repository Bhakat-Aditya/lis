import jwt from 'jsonwebtoken';
import { config } from '../config/config.env.js';
import { sessionService } from '../services/service.session.js';

export const requireAuth = (req, res, next) => {
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

    // Validate single active session concurrency:
    // If the same user logged in from another browser/IP, this token's sessionId is superseded
    if (decoded.loginId && decoded.sessionId) {
      const validation = sessionService.validateSession(decoded.loginId, decoded.sessionId);
      if (!validation.valid) {
        return res.status(401).json({
          STATUS: 'FAILED',
          StatusCode: validation.reason === 'SESSION_SUPERSEDED' ? '1150' : '1140',
          Message: validation.message || 'Session expired: You have been logged in from another browser.',
          reason: validation.reason,
        });
      }
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
