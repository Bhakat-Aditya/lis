import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.env.js';
import { upstreamService } from '../services/service.upstream.js';
import { cacheService, CACHE_KEYS } from '../services/service.cache.js';
import { sessionService } from '../services/service.session.js';
import { normalizeRole } from '../middleware/middleware.role.js';

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

    // Call upstream APIServlet LOGINV2 with compulsory IP and User-Agent in real time
    const upstreamRes = await upstreamService.userLogin(loginId, password, totp, ip, userAgent);

    if (upstreamRes?.STATUS !== 'SUCCESS' && !upstreamRes?.sid) {
      return res.status(401).json({
        STATUS: 'FAILED',
        StatusCode: upstreamRes?.StatusCode || '401',
        Message: upstreamRes?.Message || 'Invalid login credentials',
      });
    }

    const sid = upstreamRes.sid;

    // Trigger async cache warm if any master list is cold
    const stats = cacheService.getCacheStats();
    const hasUncached = Object.values(stats).some((s) => !s.isCached || s.itemCount === 0);
    if (hasUncached) {
      cacheService.warmAllCaches(sid).catch((err) => {
        console.warn('[Auth] Background cache warm notice:', err.message);
      });
    }

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
    } else if (
      loginId.toLowerCase() === 'sandip' ||
      loginId.toLowerCase() === 'exsuper' ||
      loginId.toLowerCase() === 'exsuper2'
    ) {
      accessType = 'Super';
    }

    const role = normalizeRole(accessType);

    // Generate unique session ID bound strictly to this user
    const sessionId = crypto.randomUUID();

    // Store in SessionService (Map caches and MongoDB Session collection)
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

    // Build user payload. The session ID belongs strictly to this user and is signed in their JWT.
    const userPayload = {
      userId: matchedUser?.userId || '1',
      sessionId,
      loginId: loginId,
      name: matchedUser?.name || loginId,
      email: matchedUser?.email || '',
      mobile: matchedUser?.mobile || '',
      accessType: accessType,
      role: role,
      branchId: branchId,
      upstreamSid: sid,
    };

    // Generate JWT token carrying the user's isolated session ID
    const token = jwt.sign(userPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.cookie('lis_auth_token', token, {
      httpOnly: false,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: 'Login successful',
      token,
      user: userPayload,
      sid,
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

    if (sessionId || loginId || sid) {
      try {
        await sessionService.terminateSession(sessionId, loginId, sid);
      } catch (err) {
        console.warn('[Auth] Session termination warning:', err.message);
      }
    }

    res.clearCookie('lis_auth_token');

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: 'Logout successful',
    });
  } catch (err) {
    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: 'Logout completed',
    });
  }
};

export const getMe = async (req, res, next) => {
  try {
    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      user: req.user || null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 1. API_PASSWORD_UPDATE = "PASSWORDUPDATE"
 * After Login only, POST API Gateway. Required Parameter: password (new password)
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !String(password).trim()) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'New password is required',
      });
    }

    if (confirmPassword && String(password).trim() !== String(confirmPassword).trim()) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'Passwords do not match. Please re-enter matching passwords.',
      });
    }

    const sid = req.user?.upstreamSid;
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

    const upstreamRes = await upstreamService.passwordUpdate(password, sid, ip, userAgent);

    if (upstreamRes?.STATUS === 'SUCCESS' || upstreamRes?.StatusCode === '0000') {
      return res.json({
        STATUS: 'SUCCESS',
        StatusCode: '0000',
        Message: upstreamRes.Message || 'Password updated successfully',
        payLoadJSON: upstreamRes.payLoadJSON || null,
      });
    }

    return res.status(400).json({
      STATUS: 'FAILED',
      StatusCode: upstreamRes?.StatusCode || '400',
      Message: upstreamRes?.Message || 'Failed to update password. Upstream returned an error.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. API_PASSWORD_FORGET = "PASSWORDFORGET"
 * Before login screen, POST API Gateway. Required Parameter: loginid, ip, userAgent
 */
export const forgetPassword = async (req, res, next) => {
  try {
    const loginId = req.body.loginid || req.body.loginId;

    if (!loginId || !String(loginId).trim()) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'Login ID / Operator ID is required',
      });
    }

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

    const upstreamRes = await upstreamService.passwordForget(loginId, ip, userAgent);

    if (upstreamRes?.STATUS === 'SUCCESS' || upstreamRes?.StatusCode === '0000') {
      return res.json({
        STATUS: 'SUCCESS',
        StatusCode: '0000',
        Message: upstreamRes.Message || 'Verification OTP sent successfully',
        payLoadJSON: upstreamRes.payLoadJSON || null,
        isTestUser: Boolean(upstreamRes.isTestUser),
      });
    }

    return res.status(400).json({
      STATUS: 'FAILED',
      StatusCode: upstreamRes?.StatusCode || '400',
      Message: upstreamRes?.Message || 'Failed to send OTP. Please verify Operator ID.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. API_PASSWORD_RESET = "PASSWORDRESET"
 * Before login screen, POST API Gateway. Required Parameter: loginid, otp, password, ip, userAgent
 */
export const resetPassword = async (req, res, next) => {
  try {
    const loginId = req.body.loginid || req.body.loginId;
    const { otp, password, confirmPassword } = req.body;

    if (!loginId || !String(loginId).trim()) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'Login ID / Operator ID is required',
      });
    }

    if (!otp || !String(otp).trim()) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'Verification OTP is required',
      });
    }

    if (!password || !String(password).trim()) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'New password is required',
      });
    }

    if (confirmPassword && String(password).trim() !== String(confirmPassword).trim()) {
      return res.status(400).json({
        STATUS: 'FAILED',
        StatusCode: '400',
        Message: 'Passwords do not match. Please re-enter matching passwords.',
      });
    }

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

    const upstreamRes = await upstreamService.passwordReset(loginId, otp, password, ip, userAgent);

    if (upstreamRes?.STATUS === 'SUCCESS' || upstreamRes?.StatusCode === '0000') {
      return res.json({
        STATUS: 'SUCCESS',
        StatusCode: '0000',
        Message: upstreamRes.Message || 'Password reset successfully',
        payLoadJSON: upstreamRes.payLoadJSON || null,
      });
    }

    return res.status(400).json({
      STATUS: 'FAILED',
      StatusCode: upstreamRes?.StatusCode || '400',
      Message: upstreamRes?.Message || 'Failed to reset password. Please check your OTP and try again.',
    });
  } catch (err) {
    next(err);
  }
};
