import axios from 'axios';
import { config } from '../config/config.env.js';

export const UPSTREAM_ERROR_MAP = {
  '0001': 'API missing',
  '1140': 'Session invalid',
  '1150': 'Auto logout',
  '8888': 'Limit exceeded',
  '1210': 'No access / Access disabled',
};

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
   * User login via upstream APIServlet with IP and User-Agent
   */ 
  async userLogin(loginId, password, totp = null, ip = null, userAgent = null) {
    try {
      let queryParams = `api=LOGIN&loginid=${encodeURIComponent(loginId)}&password=${encodeURIComponent(password)}`;
      
      if (totp) {
        queryParams = `api=LOGIN2FA&loginid=${encodeURIComponent(loginId)}&password=${encodeURIComponent(password)}&totp=${encodeURIComponent(totp)}`;
      }
      if (ip) {
        queryParams += `&ip=${encodeURIComponent(ip)}`;
      }
      if (userAgent) {
        queryParams += `&userAgent=${encodeURIComponent(userAgent)}`;
      }

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      if (userAgent) {
        headers['User-Agent'] = userAgent;
      }
      if (ip) {
        headers['X-Forwarded-For'] = ip;
        headers['X-Real-IP'] = ip;
      }

      const url = `${this.baseUrl}/APIServlet?${queryParams}`;
      const res = await axios.post(url, null, {
        headers,
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

      if (res.data && res.data.StatusCode && UPSTREAM_ERROR_MAP[res.data.StatusCode]) {
        if (!res.data.Message || res.data.Message === 'FAILED') {
          res.data.Message = `${UPSTREAM_ERROR_MAP[res.data.StatusCode]} (${res.data.StatusCode})`;
        }
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

      if (res.data && res.data.StatusCode && UPSTREAM_ERROR_MAP[res.data.StatusCode]) {
        if (!res.data.Message || res.data.Message === 'FAILED') {
          res.data.Message = `${UPSTREAM_ERROR_MAP[res.data.StatusCode]} (${res.data.StatusCode})`;
        }
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
   * Fetch real-time billing summary (uses native GETBILLJSON)
   */
  async getBillingSummary(patientId, sid = null) {
    if (!patientId) return null;
    const rawId = String(patientId).trim();
    const cleanId = rawId.toUpperCase().startsWith('P') ? `P${rawId.replace(/^P+/i, '')}` : `P${rawId}`;
    const activeSid = sid || await this.ensureMasterSession();

    // 1. Try native GETBILLJSON (accurate, structured JSON from upstream database)
    try {
      let billData = await this.get('GETBILLJSON', { patientId: cleanId }, activeSid);
      if (!billData?.payLoadJSON?.bill && rawId !== cleanId) {
        billData = await this.get('GETBILLJSON', { patientId: rawId }, activeSid);
      }

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
      console.warn(`[Upstream] GETBILLJSON note for ${cleanId}:`, e.message);
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
