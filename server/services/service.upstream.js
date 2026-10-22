import axios from 'axios';
import { config } from '../config/config.env.js';

class UpstreamService {
  constructor() {
    this.baseUrl = config.lab.url;
    this.masterSid = null;
    this.masterCookie = null;
    this.lastLoginTime = null;
    this.billingCache = new Map();
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

  _sanitizeParams(params = {}) {
    const clean = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== 'undefined') {
        clean[k] = v;
      }
    }
    return clean;
  }

  /**
   * Generic GET call to GetAPIServlet
   */
  async get(apiName, params = {}, sid = null) {
    const activeSid = sid || await this.ensureMasterSession();
    const query = new URLSearchParams({ api: apiName, ...this._sanitizeParams(params) }).toString();
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
    const query = new URLSearchParams({ api: apiName, ...this._sanitizeParams(params) }).toString();
    const url = `${this.baseUrl}/APIServlet;jsessionid=${activeSid}?${query}`;

    try {
      const res = await axios.post(url, body || query, {
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
        const retryRes = await axios.post(retryUrl, body || query, {
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
   * Fetch real-time billing summary (uses native GETBILLJSON first, fallbacks to billing.jsp)
   */
  async getBillingSummary(patientId, sid = null) {
    if (!patientId) return null;
    const cleanId = String(patientId).trim();
    const activeSid = sid || await this.ensureMasterSession();

    // 1. Try native GETBILLJSON (accurate, structured JSON from upstream database)
    try {
      const billData = await this.get('GETBILLJSON', { patientId: cleanId }, activeSid);
      const b = billData?.payLoadJSON?.bill;
      if (b && typeof b === 'object') {
        const total = parseFloat(b['Total Bill']) || 0;
        const gross = parseFloat(b['Total Amount']) || total;
        const discount = parseFloat(b['Discount Amount']) || 0;
        const roundoff = parseFloat(b['Round Off']) || 0;
        const paid = parseFloat(b['Total Payment']) || 0;
        const due = parseFloat(b['Total Outstanding']) || 0;
        const isPaid = (total > 0 && due <= 0 && paid >= total) || (total === 0 && paid === 0 && due === 0);

        const paymentLines = (b['Payment List'] || []).map((p) => ({
          mode: p['Payment Mode'] || 'CASH',
          amount: parseFloat(p['Amount']) || 0,
          date: p['Payment Date'] || '',
          info: p['Info'] || '',
        }));

        const summary = {
          patientId: cleanId,
          isPaid,
          total,
          gross,
          discount,
          roundoff,
          paid,
          due,
          paymentLines,
          testList: b['Test List'] || [],
          billUrl: billData?.payLoadJSON?.billUrl || '',
          timestamp: Date.now(),
        };

        const uId = cleanId.toUpperCase();
        const altId = uId.startsWith('P') ? uId.slice(1) : `P${uId}`;
        this.billingCache.set(uId, summary);
        this.billingCache.set(altId, summary);
        return summary;
      }
    } catch (e) {
      console.warn(`[Upstream] GETBILLJSON failed for ${cleanId}, falling back to billing.jsp:`, e.message);
    }

    // 2. Fallback to billing.jsp scraping
    const url = `${this.baseUrl}/billing.jsp;jsessionid=${activeSid}?patientId=${encodeURIComponent(cleanId)}`;

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

      const payMatch = containerHtml.match(/total-payment-row[\s\S]*?<span class="value">([^<]+)<\/span>/i);
      const paid = payMatch ? parseFloat(payMatch[1].replace(/[^0-9.]/g, '')) || 0 : 0;

      const outMatch = containerHtml.match(/total-outstanding-row[\s\S]*?<span class="value">([^<]+)<\/span>/i);
      const due = outMatch ? parseFloat(outMatch[1].replace(/[^0-9.]/g, '')) || 0 : 0;

      const billMatch = containerHtml.match(/total-bill-row[\s\S]*?<span class="value">([^<]+)<\/span>/i);
      const total = billMatch ? parseFloat(billMatch[1].replace(/[^0-9.]/g, '')) || 0 : 0;

      const discMatch = containerHtml.match(/Discount Amount[\s\S]*?<span class="value">([^<]+)<\/span>/i);
      const discount = discMatch ? parseFloat(discMatch[1].replace(/[^0-9.]/g, '')) || 0 : 0;

      // Robust check: never mark as paid if due > 0 or if explicitly unpaid-stamp
      const isExplicitUnpaid = containerHtml.includes('unpaid-stamp');
      const isExplicitPaidStamp = !isExplicitUnpaid && (containerHtml.includes('status-stamp paid-stamp') || (containerHtml.includes('paid-stamp') && !containerHtml.includes('unpaid-stamp')));
      const isPaid = (total > 0 && due <= 0 && paid >= total) || (isExplicitPaidStamp && due <= 0);

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

      const summary = {
        patientId: cleanId,
        isPaid,
        total,
        discount,
        paid,
        due,
        paymentLines,
        timestamp: Date.now(),
      };

      // Store in memory cache
      this.billingCache.set(cleanId.toUpperCase(), summary);

      return summary;
    } catch (err) {
      console.warn(`[Upstream] Could not fetch billing.jsp for ${patientId}:`, err.message);
      return null;
    }
  }

  /**
   * Get cached billing summary for a patient
   */
  getCachedBilling(patientId) {
    if (!patientId) return null;
    const clean = String(patientId).trim().toUpperCase();
    const entry = this.billingCache.get(clean);
    if (entry && Date.now() - entry.timestamp < 30000) return entry;
    const alt = clean.startsWith('P') ? clean.slice(1) : `P${clean}`;
    const altEntry = this.billingCache.get(alt);
    if (altEntry && Date.now() - altEntry.timestamp < 30000) return altEntry;
    return null;
  }

  /**
   * Manually update or seed cached billing summary
   */
  setCachedBilling(patientId, summary) {
    if (!patientId || !summary) return;
    const clean = String(patientId).trim().toUpperCase();
    const alt = clean.startsWith('P') ? clean.slice(1) : `P${clean}`;
    const entry = {
      ...summary,
      timestamp: Date.now(),
    };
    this.billingCache.set(clean, entry);
    this.billingCache.set(alt, entry);
  }
}

export const upstreamService = new UpstreamService();
