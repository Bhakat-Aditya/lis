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

      // If session expired on upstream (1001, 1201, 1002), try re-login and retry once with master session
      const isSessionError =
        res.data?.StatusCode === '1001' ||
        res.data?.StatusCode === '1201' ||
        res.data?.StatusCode === '1002' ||
        res.data?.Message?.toLowerCase().includes('session') ||
        (sid && res.data?.STATUS === 'FAILED');

      if (isSessionError) {
        console.warn(`[Upstream] Session error (${res.data?.StatusCode || 'FAILED'}) on GET, refreshing master sid...`);
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

      // If session expired on upstream (1001, 1201, 1002), try re-login and retry once with master session
      const isSessionError =
        res.data?.StatusCode === '1001' ||
        res.data?.StatusCode === '1201' ||
        res.data?.StatusCode === '1002' ||
        res.data?.Message?.toLowerCase().includes('session') ||
        (sid && res.data?.STATUS === 'FAILED' && res.data?.StatusCode !== '0000');

      if (isSessionError) {
        console.warn(`[Upstream] Session error (${res.data?.StatusCode || 'FAILED'}) on POST, refreshing master sid...`);
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

  /**
   * Post payment transaction to BillingServlet
   */
  async postBilling(params = {}, sid = null) {
    const activeSid = sid || await this.ensureMasterSession();
    const url = `${this.baseUrl}/BillingServlet;jsessionid=${activeSid}`;
    const formParams = new URLSearchParams(params);

    try {
      const res = await axios.post(url, formParams.toString(), {
        headers: {
          'Cookie': `JSESSIONID=${activeSid}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      });

      return { STATUS: 'SUCCESS', data: res.data };
    } catch (err) {
      console.error(`[Upstream] BillingServlet failed:`, err.message);
      throw err;
    }
  }

  /**
   * Scrape and parse real-time billing summary from billing.jsp
   */
  async getBillingSummary(patientId, sid = null) {
    if (!patientId) return null;
    const activeSid = sid || await this.ensureMasterSession();
    const url = `${this.baseUrl}/billing.jsp;jsessionid=${activeSid}?patientId=${encodeURIComponent(patientId)}`;

    try {
      const res = await axios.get(url, {
        headers: {
          'Cookie': `JSESSIONID=${activeSid}`,
        },
        timeout: 15000,
      });
      const html = res.data || '';

      const containerIdx = html.lastIndexOf('billing-summary-container');
      const containerHtml = containerIdx !== -1 ? html.substring(containerIdx, containerIdx + 3000) : html;

      const isPaid = containerHtml.includes('paid-stamp') || containerHtml.includes('status-stamp paid-stamp');

      const payMatch = containerHtml.match(/total-payment-row[\s\S]*?<span class="value">([^<]+)<\/span>/i);
      const paid = payMatch ? parseFloat(payMatch[1].replace(/[^0-9.]/g, '')) || 0 : 0;

      const outMatch = containerHtml.match(/total-outstanding-row[\s\S]*?<span class="value">([^<]+)<\/span>/i);
      const due = outMatch ? parseFloat(outMatch[1].replace(/[^0-9.]/g, '')) || 0 : 0;

      const billMatch = containerHtml.match(/total-bill-row[\s\S]*?<span class="value">([^<]+)<\/span>/i);
      const total = billMatch ? parseFloat(billMatch[1].replace(/[^0-9.]/g, '')) || 0 : 0;

      const discMatch = containerHtml.match(/Discount Amount[\s\S]*?<span class="value">([^<]+)<\/span>/i);
      const discount = discMatch ? parseFloat(discMatch[1].replace(/[^0-9.]/g, '')) || 0 : 0;

      const paymentLines = [];
      const lineRegex = /<div class="payment-sub-line">[\s\S]*?<span class="sub-label">[^A-Z]*([A-Z_]+)\s*<small>\(([^)]+)\)<\/small><\/span>[\s\S]*?<span class="sub-value">([^<]+)<\/span>/gi;
      let match;
      while ((match = lineRegex.exec(containerHtml)) !== null) {
        paymentLines.push({
          mode: match[1].trim(),
          date: match[2].trim(),
          amount: parseFloat(match[3].replace(/[^0-9.]/g, '')) || 0,
        });
      }

      return {
        isPaid,
        total,
        discount,
        paid,
        due,
        paymentLines,
      };
    } catch (err) {
      console.warn(`[Upstream] Could not fetch billing.jsp for ${patientId}:`, err.message);
      return null;
    }
  }
}

export const upstreamService = new UpstreamService();
