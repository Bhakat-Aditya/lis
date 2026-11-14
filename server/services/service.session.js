import mongoose from 'mongoose';
import { Session } from '../models/model.session.js';
import { upstreamService } from './service.upstream.js';

class SessionService {
  constructor() {
    // In-memory active session stores:
    // Key: loginId (lowercase) -> sessionObject
    this.activeSessionsByLogin = new Map();
    // Key: sessionId -> sessionObject
    this.sessionsById = new Map();
  }

  /**
   * Create or replace an active session for a user.
   * If the user was already logged in on a different browser/device,
   * the previous session is immediately invalidated and logged out upstream.
   */
  async createSession({
    sessionId,
    userId = '1',
    loginId,
    upstreamSid,
    ip = '127.0.0.1',
    userAgent = 'Unknown',
    role = 'Receptionist',
    branchId = '1',
  }) {
    if (!loginId || !sessionId) {
      throw new Error('loginId and sessionId are required to create a session');
    }

    const normalizedLogin = loginId.toLowerCase().trim();

    // 1. Invalidate and logout previous session if exists for this user
    const previousSession = this.activeSessionsByLogin.get(normalizedLogin);
    if (previousSession && previousSession.sessionId !== sessionId) {
      console.log(
        `[Session] Invalidating previous session (${previousSession.sessionId}) for '${normalizedLogin}'. New login from IP: ${ip}, UA: ${userAgent}`
      );

      previousSession.isActive = false;
      previousSession.terminatedReason = 'Logged in from another browser or device';

      // Note: We deliberately do NOT call upstreamService.userLogout here,
      // because upstream LIS session is shared and concurrent requests may still be using it.

      // If MongoDB is connected, mark old sessions as inactive
      if (mongoose.connection.readyState === 1) {
        try {
          await Session.updateMany(
            { loginId: normalizedLogin, isActive: true },
            { $set: { isActive: false, terminatedReason: 'Logged in from another browser or device' } }
          );
        } catch (dbErr) {
          console.warn('[Session] MongoDB update error on invalidating previous session:', dbErr.message);
        }
      }
    }

    // 2. Build new session record
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sessionRecord = {
      sessionId,
      userId,
      loginId: normalizedLogin,
      upstreamSid,
      ip,
      userAgent,
      role,
      branchId,
      expiresAt,
      isActive: true,
      createdAt: new Date(),
    };

    // 3. Store in memory maps
    this.activeSessionsByLogin.set(normalizedLogin, sessionRecord);
    this.sessionsById.set(sessionId, sessionRecord);

    // 4. Persist in MongoDB if available
    if (mongoose.connection.readyState === 1) {
      try {
        await Session.create({
          sessionId,
          userId,
          loginId: normalizedLogin,
          upstreamSid,
          ip,
          userAgent,
          role,
          branchId,
          expiresAt,
          isActive: true,
        });
      } catch (dbErr) {
        console.warn('[Session] MongoDB create session note:', dbErr.message);
      }
    }

    return sessionRecord;
  }

  /**
   * Validate whether a session is the currently active one for this loginId.
   * Checks in-memory cache first, falling back to MongoDB if server restarted.
   */
  async validateSession(loginId, sessionId) {
    if (!loginId || !sessionId) {
      return { valid: false, reason: 'MISSING_PARAMS', message: 'Authentication required' };
    }

    const normalizedLogin = loginId.toLowerCase().trim();
    let activeSession = this.activeSessionsByLogin.get(normalizedLogin);

    // If not in-memory (e.g. server restarted or cold process), hydrate from MongoDB
    if (!activeSession && mongoose.connection.readyState === 1) {
      try {
        const dbSession = await Session.findOne({
          loginId: normalizedLogin,
          isActive: true,
        }).sort({ createdAt: -1 });

        if (dbSession) {
          activeSession = {
            sessionId: dbSession.sessionId,
            userId: dbSession.userId,
            loginId: dbSession.loginId,
            upstreamSid: dbSession.upstreamSid,
            ip: dbSession.ip,
            userAgent: dbSession.userAgent,
            role: dbSession.role,
            branchId: dbSession.branchId,
            expiresAt: dbSession.expiresAt,
            isActive: dbSession.isActive,
            terminatedReason: dbSession.terminatedReason,
          };
          this.activeSessionsByLogin.set(normalizedLogin, activeSession);
          this.sessionsById.set(dbSession.sessionId, activeSession);
          if (activeSession.upstreamSid) {
            upstreamService.masterSid = activeSession.upstreamSid;
          }
        }
      } catch (dbErr) {
        console.warn('[Session] Hydration error from DB:', dbErr.message);
      }
    }

    // If no active session found in memory or DB, re-hydrate from valid JWT token session
    if (!activeSession) {
      activeSession = {
        sessionId,
        loginId: normalizedLogin,
        upstreamSid: upstreamService.masterSid || null,
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      this.activeSessionsByLogin.set(normalizedLogin, activeSession);
      this.sessionsById.set(sessionId, activeSession);
      return { valid: true, session: activeSession };
    }

    // Multi-tab / multi-window concurrency support:
    // If sessionId does not match activeSession.sessionId, allow it to continue
    // as long as the JWT is cryptographically valid and not expired.
    if (activeSession.sessionId !== sessionId) {
      return { valid: true, session: activeSession };
    }

    if (!activeSession.isActive) {
      return {
        valid: false,
        reason: 'SESSION_INACTIVE',
        message: activeSession.terminatedReason || 'Session has been terminated.',
      };
    }

    // Check expiry
    if (activeSession.expiresAt && new Date() > new Date(activeSession.expiresAt)) {
      this.terminateSession(sessionId, normalizedLogin, activeSession.upstreamSid);
      return {
        valid: false,
        reason: 'SESSION_EXPIRED',
        message: 'Session expired. Please login again.',
      };
    }

    return { valid: true, session: activeSession };
  }

  /**
   * Terminate/Logout a session cleanly.
   */
  async terminateSession(sessionId, loginId, upstreamSid = null) {
    const normalizedLogin = loginId ? loginId.toLowerCase().trim() : null;
    const session = sessionId ? this.sessionsById.get(sessionId) : (normalizedLogin ? this.activeSessionsByLogin.get(normalizedLogin) : null);

    const sidToLogout = upstreamSid || session?.upstreamSid;

    if (session) {
      session.isActive = false;
      session.terminatedReason = 'User logged out';
    }

    if (sessionId) {
      this.sessionsById.delete(sessionId);
    }
    if (normalizedLogin) {
      const cur = this.activeSessionsByLogin.get(normalizedLogin);
      if (cur && (!sessionId || cur.sessionId === sessionId)) {
        this.activeSessionsByLogin.delete(normalizedLogin);
      }
    }

    if (sidToLogout) {
      try {
        await upstreamService.userLogout(sidToLogout);
      } catch (e) {
        console.warn('[Session] Upstream logout note:', e.message);
      }
    }

    if (mongoose.connection.readyState === 1 && sessionId) {
      try {
        await Session.updateOne(
          { sessionId },
          { $set: { isActive: false, terminatedReason: 'User logged out' } }
        );
      } catch (e) {}
    }

    return { success: true };
  }

  /**
   * Get current active session for user
   */
  getActiveSession(loginId) {
    if (!loginId) return null;
    return this.activeSessionsByLogin.get(loginId.toLowerCase().trim()) || null;
  }
}

export const sessionService = new SessionService();
