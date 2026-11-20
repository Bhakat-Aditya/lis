import jwt from 'jsonwebtoken';
import { config } from '../config/config.env.js';
import { sessionService } from '../services/service.session.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    } else if (req.cookies && (req.cookies.lis_auth_token || req.cookies.token)) {
      token = req.cookies.lis_auth_token || req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        STATUS: 'FAILED',
        StatusCode: '401',
        Message: 'Authentication required. No token provided.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    if (!decoded || !decoded.upstreamSid) {
      return res.status(401).json({
        STATUS: 'FAILED',
        StatusCode: '1140',
        Message: 'Invalid or expired session. Please login again.',
        isSessionExpired: true,
      });
    }

    // Validate active session status and attach THAT user's specific upstreamSid
    if (decoded.loginId && decoded.sessionId) {
      const validation = await sessionService.validateSession(decoded.loginId, decoded.sessionId);
      if (!validation.valid) {
        return res.status(401).json({
          STATUS: 'FAILED',
          StatusCode: '1140',
          Message: validation.message || 'Session expired. Please login again.',
          reason: validation.reason,
          isSessionExpired: true,
        });
      }

      // Bind strictly to THIS user's session upstreamSid (never global masterSid)
      if (validation.session?.upstreamSid) {
        decoded.upstreamSid = validation.session.upstreamSid;
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
      isSessionExpired: true,
    });
  }
};
