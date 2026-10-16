import axios from 'axios';
import { config } from '../config/config.env.js';

class UpstreamService {
  constructor() {
    this.baseUrl = config.lab.url;
    this.masterSid = null;
    this.masterCookie = null;
    this.lastLoginTime = null;
  }

  /**
   * Ensure we have a valid upstream master session id (sid)
   */
  async ensureMasterSession(forceRefresh = false) {
    const isExpired = !this.lastLoginTime || (Date.now() - this.lastLoginTime > 4 * 60 * 60 * 1000);
    if (!this.masterSid || forceRefresh || isExpired) {
      await this.loginMaster();
    }
    return this.masterSid;
  }

  /**
   * Perform upstream login with master credentials (sandip / Life)
   */
  async loginMaster() {
    try {
      const url = `${this.baseUrl}/APIServlet?api=LOGIN&loginid=${encodeURIComponent(config.lab.defaultUser)}&password=${encodeURIComponent(config.lab.defaultPass)}`;
      const res = await axios.post(url, null, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      });

      if (res.data && (res.data.STATUS === 'SUCCESS' || res.data.sid)) {
        this.masterSid = res.data.sid;
        this.lastLoginTime = Date.now();
        const setCookie = res.headers['set-cookie'];
        if (setCookie && setCookie.length > 0) {
          this.masterCookie = setCookie[0].split(';')[0];
        } else {
          this.masterCookie = `JSESSIONID=${this.masterSid}`;
        }
        console.log(`[Upstream] Master logged in successfully. sid: ${this.masterSid}`);
        return { sid: this.masterSid, data: res.data };
      } else {
        throw new Error(res.data?.Message || 'Upstream login failed');
      }
    } catch (err) {
      console.error('[Upstream] Master login error:', err.message);
      throw err;
    }
  }

  /**
   * User login via upstream APIServlet
   */
  async userLogin(loginId, password, totp = null) {
    try {
      let apiAction = 'LOGIN';
      let queryParams = `api=LOGIN&loginid=${encodeURIComponent(loginId)}&password=${encodeURIComponent(password)}`;
      
      if (totp) {
        apiAction = 'LOGIN2FA';
        queryParams = `api=LOGIN2FA&loginid=${encodeURIComponent(loginId)}&password=${encodeURIComponent(password)}&totp=${encodeURIComponent(totp)}`;
      }

      const url = `${this.baseUrl}/APIServlet?${queryParams}`;
      const res = await axios.post(url, null, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      });

      return res.data;
    } catch (err) {
      console.error(`[Upstream] User login failed for ${loginId}:`, err.message);
      throw err;
    }
  }

  /**
   * User logout via upstream
   */
  async userLogout(sid) {
    try {
      const url = `${this.baseUrl}/APIServlet;jsessionid=${sid}?api=LOGOUT`;
      const res = await axios.post(url, null, {
        headers: {
          'Cookie': `JSESSIONID=${sid}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 5000,
      });
      return res.data;
    } catch (err) {
      console.warn('[Upstream] Logout error:', err.message);
      return { STATUS: 'SUCCESS', Message: 'Logged out' };
    }
  }

  /**
   * Generic GET call to GetAPIServlet
   */
  async get(apiName, params = {}, sid = null) {
    const activeSid = sid || await this.ensureMasterSession();
    const query = new URLSearchParams({ api: apiName, ...params }).toString();
    const url = `${this.baseUrl}/GetAPIServlet;jsessionid=${activeSid}?${query}`;

    try {
      const res = await axios.get(url, {
        headers: {
          'Cookie': `JSESSIONID=${activeSid}`,
        },
        timeout: 15000,
      });

      // If session expired on upstream, try re-login and retry once
      if (res.data?.StatusCode === '1001' || res.data?.Message?.toLowerCase().includes('session')) {
        console.warn('[Upstream] Session expired on GET, refreshing master sid...');
        const newSid = await this.ensureMasterSession(true);
        const retryUrl = `${this.baseUrl}/GetAPIServlet;jsessionid=${newSid}?${query}`;
        const retryRes = await axios.get(retryUrl, {
          headers: { 'Cookie': `JSESSIONID=${newSid}` },
          timeout: 15000,
        });
        return retryRes.data;
      }

      return res.data;
    } catch (err) {
      console.error(`[Upstream] GET ${apiName} failed:`, err.message);
      throw err;
    }
  }

  /**
   * Generic POST call to APIServlet
   */
  async post(apiName, params = {}, body = null, sid = null) {
    const activeSid = sid || await this.ensureMasterSession();
    const query = new URLSearchParams({ api: apiName, ...params }).toString();
    const url = `${this.baseUrl}/APIServlet;jsessionid=${activeSid}?${query}`;

    try {
      const res = await axios.post(url, body, {
        headers: {
          'Cookie': `JSESSIONID=${activeSid}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      });

      // If session expired on upstream, try re-login and retry once
      if (res.data?.StatusCode === '1001' || res.data?.Message?.toLowerCase().includes('session')) {
        console.warn('[Upstream] Session expired on POST, refreshing master sid...');
        const newSid = await this.ensureMasterSession(true);
        const retryUrl = `${this.baseUrl}/APIServlet;jsessionid=${newSid}?${query}`;
        const retryRes = await axios.post(retryUrl, body, {
          headers: {
            'Cookie': `JSESSIONID=${newSid}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
        });
        return retryRes.data;
      }

      return res.data;
    } catch (err) {
      console.error(`[Upstream] POST ${apiName} failed:`, err.message);
      throw err;
    }
  }
}

export const upstreamService = new UpstreamService();
