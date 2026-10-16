import jwt from 'jsonwebtoken';
import { config } from '../config/config.env.js';

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        STATUS: 'FAILED',
        StatusCode: '401',
        Message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      STATUS: 'FAILED',
      StatusCode: '401',
      Message: 'Invalid or expired session. Please login again.',
      error: err.message,
    });
  }
};
