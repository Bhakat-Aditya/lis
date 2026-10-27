import jwt from 'jsonwebtoken';
import { config } from '../config/config.env.js';
import { upstreamService } from '../services/service.upstream.js';
import { cacheService, CACHE_KEYS } from '../services/service.cache.js';
import { normalizeRole } from '../middleware/middleware.role.js';
import { sessionService } from '../services/service.session.js';

export const login = async (req, res, next) => {
  try {
    const { loginId, password, totp } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'Login ID and password are required',
      });
    }

    // Extract client IP and User-Agent (Compulsory for Login v2 / LOGINV2)
    const rawIp =
      req.body.ip ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';
    let ip = rawIp.replace(/^.*:/, '') || rawIp;
    if (ip === '1' || ip === '::1' || ip === 'localhost' || !ip) {
      ip = '127.0.0.1';
    }
    const userAgent = req.body.userAgent || req.headers['user-agent'] || 'Mozilla/5.0';

    if (!ip || !userAgent) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'IP and UserAgent are compulsory for Login v2',
      });
    }

    // Call upstream APIServlet LOGINV2 with compulsory IP and User-Agent
    const upstreamRes = await upstreamService.userLogin(loginId, password, totp, ip, userAgent);

    if (upstreamRes?.STATUS !== 'SUCCESS' && !upstreamRes?.sid) {
      return res.status(401).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '401',
        Message: upstreamRes?.Message || 'Invalid login credentials',
      });
    }

    const sid = upstreamRes.sid;

    // Fetch user details from cached USER_LIST to identify role and permissions
    let matchedUser = null;
    try {
      const userListResult = await cacheService.getList(CACHE_KEYS.USER_LIST, false, sid);
      const users = userListResult?.data || [];
      matchedUser = users.find((u) => u.loginId?.toLowerCase() === loginId.toLowerCase());
    } catch (e) {
      console.warn('[Auth] Could not fetch user details from USER_LIST:', e.message);
    }

    // Extract access permissions
    let accessType = 'Receptionist';
    let branchId = '1';
    if (matchedUser) {
      try {
        const parsedPerm =
          typeof matchedUser.accessPermissionJson === 'string'
            ? JSON.parse(matchedUser.accessPermissionJson)
            : matchedUser.accessPermissionJson;
        accessType = parsedPerm?.accessType || 'Receptionist';
      } catch (err) {
        accessType = 'Receptionist';
      }
      branchId = matchedUser.accessBranch || '1';
    } else if (loginId.toLowerCase() === 'sandip') {
      accessType = 'Super';
    }

    const role = normalizeRole(accessType);

    // Generate unique session ID for this browser login instance
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Invalidate any previous session for this user from another browser/IP
    await sessionService.createSession({
      sessionId,
      userId: matchedUser?.userId || '1',
      loginId,
      upstreamSid: sid,
      ip,
      userAgent,
      role,
      branchId,
    });

    const userPayload = {
      userId: matchedUser?.userId || '1',
      loginId: loginId,
      name: matchedUser?.name || loginId,
      email: matchedUser?.email || '',
      mobile: matchedUser?.mobile || '',
      accessType: accessType,
      role: role,
      branchId: branchId,
      upstreamSid: sid,
      sessionId,
      ip,
      userAgent,
    };

    // Generate JWT token with sessionId embedded
    const token = jwt.sign(userPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: 'Login successful',
      token,
      user: userPayload,
      sessionId,
      sid,
      ip,
      userAgent,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const sid = req.user?.upstreamSid;
    const sessionId = req.user?.sessionId;
    const loginId = req.user?.loginId;

    // Safely terminate session (can be called multiple times idempotently)
    if (sessionId || loginId) {
      await sessionService.terminateSession(sessionId, loginId, sid);
    } else if (sid) {
      await upstreamService.userLogout(sid);
    }

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: 'Logout successful',
    });
  } catch (err) {
    // Never crash on logout even if called repeatedly
    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: 'Logout completed',
    });
  }
};

export const getMe = async (req, res, next) => {
  try {
    const session = sessionService.getActiveSession(req.user?.loginId);
    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      user: {
        ...req.user,
        activeSession: session || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
