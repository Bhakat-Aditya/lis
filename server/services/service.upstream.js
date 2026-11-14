import axios from 'axios';
import { config } from '../config/config.env.js';

export const API_LOGIN_V2 = "LOGINV2";
export const API_DASHBOARD_REFRESH = "DASHBOARDREFRESH";
export const API_GET_DASHBOARD_JSON = "GETDASHBOARDJSON";
export const API_RECALL_REPORT = "RECALLPORT";
export const API_ADD_TEST_MULTIPLE_REFRESH = "ADDTESTMULTIPLEREFRESH";
export const API_GET_JOURNEY_STAGES = "GETJOURNEYSTAGES";

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
   * Helper to inspect response and detect whether upstream session is dead, superseded, or logged out
   */
  isSessionInvalid(res, data = null) {
    if (!res && !data) return false;
    const { status, headers } = res || {};
    const d = data || res?.data;

    // 1. HTTP 302 Redirect to login.jsp
    if (status === 302) {
      const location = headers?.location || '';
      if (/login\.jsp/i.test(location)) return true;
    }

    // 2. HTML page returned containing login form
    if (typeof d === 'string') {
      if (/login\.jsp/i.test(d) || /<form[^>]*action=["'][^"']*login/i.test(d) || /name=["']loginid["']/i.test(d)) {
        return true;
      }
      return false;
    }

    // 3. JSON error structures
    if (typeof d === 'object' && d !== null) {
      const code = String(d.StatusCode || d.statusCode || '');
      if (code === '1140' || code === '1150' || code === '1000') {
        return true;
      }
      // Upstream 1211 is Tomcat processing failure when sid is superseded/revoked
      if (code === '1211' && d.STATUS === 'FAILED') {
        return true;
      }
      const msg = String(d.Message || d.message || '').toLowerCase();
      if (
        msg.includes('no such session') ||
        msg.includes('auto logout') ||
        msg.includes('session invalid') ||
        msg.includes('session expired') ||
        msg.includes('login again')
      ) {
        return true;
      }
      const redirect = String(d.redirectURL || d.redirectUrl || '').toLowerCase();
      if (redirect.includes('login.jsp')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Resolve the active upstream session ID to use from the authenticated user.
   * Never attempts background re-login using saved credentials.
   */
  async resolveActiveSid(requestedSid = null) {
    if (requestedSid) {
      return requestedSid;
    }
    if (this.masterSid) {
      return this.masterSid;
    }
    // Check if an active session exists in MongoDB
    try {
      const { Session } = await import('../models/model.session.js');
      const latestActive = await Session.findOne({ isActive: true }).sort({ createdAt: -1 });
      if (latestActive?.upstreamSid) {
        this.masterSid = latestActive.upstreamSid;
        this.lastLoginTime = Date.now();
        return this.masterSid;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  /**
   * User login via upstream APIServlet v2 (LOGINV2) with compulsory IP and User-Agent.
   * Uses strictly the credentials entered by the user.
   */ 
  async userLogin(loginId, password, totp = null, ip = null, userAgent = null, attempt = 1) {
    try {
      const clientIp = String(ip || '').trim();
      const clientUa = String(userAgent || '').trim();

      if (!clientIp || !clientUa) {
        throw new Error('IP and UserAgent are compulsory for Login v2 (LOGINV2)');
      }

      const params = {
        api: API_LOGIN_V2,
        loginid: String(loginId).trim(),
        password: String(password).trim(),
        ip: clientIp,
        userAgent: clientUa,
      };

      if (totp) {
        params.totp = String(totp).trim();
      }

      const queryParams = new URLSearchParams(params).toString();

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': clientUa,
        'X-Forwarded-For': clientIp,
        'X-Real-IP': clientIp,
      };

      const url = `${this.baseUrl}/APIServlet?${queryParams}`;
      const res = await axios.post(url, null, {
        headers,
        timeout: 10000,
      });

      // Handle 1130 rate limiting ("Currently not allowed, try again - 1130") with backoff
      if (res.data?.StatusCode === '1130' && attempt <= 2) {
        console.warn(`[Upstream] userLogin for ${loginId} received 1130 rate limit. Waiting 1500ms before retry (attempt ${attempt}/2)...`);
        await new Promise((r) => setTimeout(r, 1500));
        return await this.userLogin(loginId, password, totp, ip, userAgent, attempt + 1);
      }

      if (res.data && (res.data.STATUS === 'SUCCESS' || res.data.sid)) {
        this.masterSid = res.data.sid;
        this.lastLoginTime = Date.now();
        const setCookie = res.headers['set-cookie'];
        if (setCookie && setCookie.length > 0) {
          this.masterCookie = setCookie[0].split(';')[0];
        } else {
          this.masterCookie = `JSESSIONID=${this.masterSid}`;
        }
      }

      return res.data;
    } catch (err) {
      console.error(`[Upstream] User login failed for ${loginId} via ${API_LOGIN_V2}:`, err.message);
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
   * Check whether a given upstream session id is alive and accepted by editTemplateV2.jsp
   */
  async isSessionAlive(sid) {
    if (!sid) return false;
    try {
      const testUrl = `${this.baseUrl}/editTemplateV2.jsp;jsessionid=${sid}?patientId=P14&reportId=P14R1`;
      const res = await axios.get(testUrl, {
        maxRedirects: 0,
        validateStatus: null,
        timeout: 4000,
        headers: {
          'Cookie': `JSESSIONID=${sid}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      // 200 OK means valid active session; 302 means redirect to login.jsp
      return res.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Generic GET call to GetAPIServlet
   */
  async get(apiName, params = {}, sid = null) {
    const activeSid = await this.resolveActiveSid(sid);
    if (!activeSid) {
      return {
        STATUS: 'FAILED',
        StatusCode: '1140',
        Message: 'No active session found. Please login.',
        isSessionExpired: true,
      };
    }
    const query = new URLSearchParams({ api: apiName, ...this._sanitizeParams(params) }).toString();
    const url = `${this.baseUrl}/GetAPIServlet;jsessionid=${activeSid}?${query}`;

    try {
      const res = await axios.get(url, {
        headers: {
          'Cookie': `JSESSIONID=${activeSid}`,
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      // If session timed out or invalid, report session timeout immediately
      if (this.isSessionInvalid(res, res.data)) {
        console.warn(`[Upstream] Session ${activeSid} timed out/invalid on GET ${apiName}.`);
        this.masterSid = null;
        return {
          STATUS: 'FAILED',
          StatusCode: '1140',
          Message: 'Session timed out. Please login again.',
          isSessionExpired: true,
        };
      }

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
   * Generic GET call to APIServlet (used by ADDTEMPLATE, DELETEREPORT for templates, etc.)
   */
  async getAPIServlet(apiName, params = {}, sid = null) {
    const activeSid = await this.resolveActiveSid(sid);
    if (!activeSid) {
      return {
        STATUS: 'FAILED',
        StatusCode: '1140',
        Message: 'No active session found. Please login.',
        isSessionExpired: true,
      };
    }
    const query = new URLSearchParams({ api: apiName, ...this._sanitizeParams(params) }).toString();
    const url = `${this.baseUrl}/APIServlet;jsessionid=${activeSid}?${query}`;

    try {
      const res = await axios.get(url, {
        headers: {
          'Cookie': `JSESSIONID=${activeSid}`,
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (this.isSessionInvalid(res, res.data)) {
        console.warn(`[Upstream] Session ${activeSid} timed out/invalid on GET APIServlet ${apiName}.`);
        this.masterSid = null;
        return {
          STATUS: 'FAILED',
          StatusCode: '1140',
          Message: 'Session timed out. Please login again.',
          isSessionExpired: true,
        };
      }

      return res.data;
    } catch (err) {
      console.error(`[Upstream] GET APIServlet ${apiName} failed:`, err.message);
      throw err;
    }
  }

  /**
   * Generic POST call to APIServlet
   */
  async post(apiName, params = {}, body = null, sid = null, customHeaders = {}) {
    const activeSid = await this.resolveActiveSid(sid);
    if (!activeSid) {
      return {
        STATUS: 'FAILED',
        StatusCode: '1140',
        Message: 'No active session found. Please login.',
        isSessionExpired: true,
      };
    }
    const query = new URLSearchParams({ api: apiName, ...this._sanitizeParams(params) }).toString();
    const url = `${this.baseUrl}/APIServlet;jsessionid=${activeSid}?${query}`;

    const isJsonBody = typeof body === 'object' && body !== null && !(body instanceof URLSearchParams);
    const contentType = isJsonBody ? 'application/json' : 'application/x-www-form-urlencoded';

    try {
      const res = await axios.post(url, body || query, {
        headers: {
          'Cookie': `JSESSIONID=${activeSid}`,
          'Content-Type': contentType,
          ...customHeaders,
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (this.isSessionInvalid(res, res.data)) {
        console.warn(`[Upstream] Session ${activeSid} timed out/invalid on POST ${apiName}.`);
        this.masterSid = null;
        return {
          STATUS: 'FAILED',
          StatusCode: '1140',
          Message: 'Session timed out. Please login again.',
          isSessionExpired: true,
        };
      }

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
   * Fetch dashboard analytics via GETDASHBOARDJSON (GET)
   * Both fromDate & toDate strictly in yyyy-MM-dd format
   */
  async getDashboardJson(fromDate, toDate, sid = null) {
    return await this.get(
      API_GET_DASHBOARD_JSON,
      { fromDate, toDate },
      sid
    );
  }

  /**
   * Request upstream dashboard refresh via DASHBOARDREFRESH (POST)
   * Both fromDate & toDate strictly in yyyy-MM-dd format
   */
  async refreshDashboard(fromDate, toDate, sid = null) {
    return await this.post(
      API_DASHBOARD_REFRESH,
      { fromDate, toDate },
      null,
      sid
    );
  }

  /**
   * Post payment transaction to BillingServlet
   */
  async postBilling(params = {}, sid = null) {
    const activeSid = await this.resolveActiveSid(sid);
    if (!activeSid) {
      return {
        STATUS: 'FAILED',
        StatusCode: '1140',
        Message: 'No active session found. Please login.',
        isSessionExpired: true,
      };
    }
    const url = `${this.baseUrl}/BillingServlet;jsessionid=${activeSid}`;
    const formParams = new URLSearchParams(params);

    try {
      const res = await axios.post(url, formParams.toString(), {
        headers: {
          'Cookie': `JSESSIONID=${activeSid}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (this.isSessionInvalid(res, res.data)) {
        console.warn(`[Upstream] Session ${activeSid} timed out on BillingServlet.`);
        this.masterSid = null;
        return {
          STATUS: 'FAILED',
          StatusCode: '1140',
          Message: 'Session timed out. Please login again.',
          isSessionExpired: true,
        };
      }

      return { STATUS: 'SUCCESS', data: res.data };
    } catch (err) {
      console.error(`[Upstream] BillingServlet failed:`, err.message);
      throw err;
    }
  }

  /**
   * Recall approved or released report back to testing/draft (Task - 10: RECALLPORT)
   * /APIServlet?api=RECALLPORT&patientId=P47
   */
  async recallReport(patientId, sid = null) {
    const rawPid = String(patientId || '').trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;
    return await this.post(
      API_RECALL_REPORT,
      { patientId: cleanPatientId },
      null,
      sid
    );
  }

  /**
   * Fetch real-time billing summary (uses native GETBILLJSON)
   */
  async getBillingSummary(patientId, sid = null) {
    if (!patientId) return null;
    const rawId = String(patientId).trim();
    const cleanId = rawId.toUpperCase().startsWith('P') ? `P${rawId.replace(/^P+/i, '')}` : `P${rawId}`;
    const activeSid = await this.resolveActiveSid(sid);
    if (!activeSid) return null;

    // 1. Try native GETBILLJSON (accurate, structured JSON from upstream database)
    try {
      let billData = await this.get('GETBILLJSON', { patientId: cleanId }, activeSid);
      if (!billData?.payLoadJSON?.bill && rawId !== cleanId) {
        billData = await this.get('GETBILLJSON', { patientId: rawId }, activeSid);
      }

      const b = billData?.payLoadJSON?.bill;
      if (b && typeof b === 'object') {
        const total = parseFloat(b['Total Bill']) || 0;
        const discount = parseFloat(b['Discount Amount']) || 0;
        const roundoff = parseFloat(b['Round Off']) || 0;
        const parsedGross = parseFloat(b['Total Amount']) || 0;
        const gross = parsedGross > 0
          ? parsedGross
          : (total > 0 && discount > 0 ? total + discount + roundoff : total);
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
        gross: total > 0 && discount > 0 ? total + discount : total,
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

  /**
   * Clear billing cache for a specific patient or all
   */
  clearBillingCache(patientId = null) {
    if (!patientId) {
      this.billingCache.clear();
      return;
    }
    const clean = String(patientId).trim().toUpperCase();
    const alt = clean.startsWith('P') ? clean.slice(1) : `P${clean}`;
    this.billingCache.delete(clean);
    this.billingCache.delete(alt);
  }

  /**
   * Sync and persist template findings directly to upstream SaveTemplateData servlet.
   * Scrapes parameter labels from editTemplateV2.jsp and submits updated values via POST.
   */
  async saveTemplateData(patientId, reportId, resultJSON, templateId = null, sid = null) {
    if (!patientId || !reportId || !resultJSON) {
      return { success: false, message: 'Missing required parameters' };
    }

    const cleanPatientId = String(patientId).trim().toUpperCase();
    const cleanReportId = String(reportId).trim();
    let activeSid = await this.resolveActiveSid(sid);
    if (!activeSid) {
      return { success: false, message: 'No active session found. Please login.', isSessionExpired: true };
    }

    try {
      // 1. Fetch form from editTemplateV2.jsp
      const editUrl = `${this.baseUrl}/editTemplateV2.jsp;jsessionid=${activeSid}?patientId=${encodeURIComponent(cleanPatientId)}&reportId=${encodeURIComponent(cleanReportId)}`;
      let getRes = await axios.get(editUrl, {
        headers: { Cookie: `JSESSIONID=${activeSid}` },
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: () => true,
      });

      // Handle session expiry on GET
      if (getRes.status === 302 && getRes.headers?.location?.includes('login.jsp')) {
        this.masterSid = null;
        return { success: false, message: 'Session timed out. Please login again.', isSessionExpired: true };
      }

      const html = typeof getRes.data === 'string' ? getRes.data : '';
      const regFormMatch = html.match(/<form id="regForm"[\s\S]*?<\/form>/i);
      if (!regFormMatch) {
        console.warn(`[Upstream] regForm not found in editTemplateV2.jsp for ${cleanReportId}`);
        return { success: false, message: 'Template form not found upstream' };
      }

      const formHtml = regFormMatch[0];
      const inputs = [...formHtml.matchAll(/<(input|textarea|select)\s+[^>]*name=["']([^"']+)["'][^>]*>/gi)];

      // 1. Extract existing form state from inputs
      const inputDict = {};
      for (const inp of inputs) {
        const raw = inp[0];
        const name = inp[2];
        const valMatch = raw.match(/value=["']([^"']*)["']/i);
        let val = valMatch ? valMatch[1] : '';
        if (inp[1].toLowerCase() === 'textarea') {
          const textMatch = raw.match(/>([\s\S]*?)<\/textarea>/i);
          if (textMatch) val = textMatch[1].trim();
        }
        inputDict[name] = val;
      }

      const templateName = String(resultJSON.TEMPLATE_NAME || resultJSON.headingName || inputDict['data1'] || '').trim();
      const isHbA1c =
        templateName.toUpperCase().includes('HBA1C') ||
        resultJSON.templateType === 'HBA1C' ||
        inputDict['Peak'] !== undefined ||
        inputDict['data12'] === 'HbA1C(IFCC)';

      if (isHbA1c) {
        // =========================================================================
        // SPECIALIZED HBA1C TEMPLATE MAPPING (MATCHING OFFICIAL JSP SCHEMA)
        // =========================================================================
        // A. Heading
        if (inputDict['data1'] !== undefined) {
          inputDict['data1'] = templateName || 'HBA1C REPORT';
        }

        // B. HbA1C Result Section
        const resArr = resultJSON.hba1cResult || resultJSON.Exam?.Result || resultJSON.Exam?.['HbA1C Result'] || [];
        if (resArr[0]) {
          const r0 = resArr[0];
          inputDict['data2'] = r0.name || r0.Name || 'Glycated Haemoglobin (HbA1c)';
          inputDict['data3'] = r0.operator || r0.Method || r0.method || '-';
          inputDict['data4'] = r0.value !== undefined ? String(r0.value) : (r0.Value !== undefined ? String(r0.Value) : '');
          inputDict['data5'] = r0.unit || r0.Unit || '% ofTotal Hb';
          inputDict['data6'] = r0.refRange || r0.RefRange || r0['Ref Range'] || '<6%';
        }
        if (resArr[1]) {
          const r1 = resArr[1];
          inputDict['data7'] = r1.name || r1.Name || 'Estimated Average Glucose (eAG)';
          inputDict['data8'] = r1.operator || r1.Method || r1.method || '-';
          inputDict['data9'] = r1.value !== undefined ? String(r1.value) : (r1.Value !== undefined ? String(r1.Value) : '');
          inputDict['data10'] = r1.unit || r1.Unit || 'mg/dL';
          inputDict['data11'] = r1.refRange || r1.RefRange || r1['Ref Range'] || '';
        }

        // C. Peak Data Table (7 rows: data12 through data53)
        const peakArr = resultJSON.peakDataTable || resultJSON.Exam?.PeakData || resultJSON.Exam?.['Peak Data'] || [];
        const defaultPeaks = ['HbA1C(IFCC)', 'eAG[ADA]', 'Others 1', 'Others 2', 'Others 3', 'Peak Data', 'Graph Data'];
        for (let i = 0; i < 7; i++) {
          const base = 12 + i * 6;
          const row = peakArr[i] || {};
          inputDict[`data${base}`] = row.peak || row.Peak || row.name || row.Name || defaultPeaks[i];
          inputDict[`data${base + 1}`] = row.time !== undefined ? String(row.time) : (row.Time !== undefined ? String(row.Time) : '');
          inputDict[`data${base + 2}`] = row.abs !== undefined ? String(row.abs) : (row.ABS !== undefined ? String(row.ABS) : '');
          inputDict[`data${base + 3}`] = row.area !== undefined ? String(row.area) : (row.Area !== undefined ? String(row.Area) : '');
          inputDict[`data${base + 4}`] = row.result !== undefined ? String(row.result) : (row.Result !== undefined ? String(row.Result) : '');
          inputDict[`data${base + 5}`] = row.refRange || row.RefRange || row['Ref Range'] || '';
        }

        // D. Summary Result (5 rows: data54 through data68)
        const sumArr = resultJSON.summaryResult || resultJSON.Exam?.['Final Result'] || resultJSON.Exam?.['Summary Result'] || [];
        const defaultSummary = ['TotalArea', 'HbA1C(NGSP)', 'eAG(ADA)', 'HbA1C(IFCC)', 'eAG[ADA]'];
        for (let i = 0; i < 5; i++) {
          const base = 54 + i * 3;
          const row = sumArr[i] || {};
          inputDict[`data${base}`] = row.name || row.Name || defaultSummary[i];
          inputDict[`data${base + 1}`] = row.val1 !== undefined ? String(row.val1) : (row.Value !== undefined ? String(row.Value) : (row.value !== undefined ? String(row.value) : ''));
          inputDict[`data${base + 2}`] = row.val2 !== undefined ? String(row.val2) : (row.Unit !== undefined ? String(row.Unit) : (row.unit !== undefined ? String(row.unit) : ''));
        }

        // E. Others (3 rows: data69 through data74)
        const othArr = resultJSON.others || resultJSON.Exam?.Others || [];
        for (let i = 0; i < 3; i++) {
          const base = 69 + i * 2;
          const row = othArr[i] || {};
          inputDict[`data${base}`] = row.name || row.Name || `Others ${i + 1}`;
          inputDict[`data${base + 1}`] = row.value !== undefined ? String(row.value) : (row.Value !== undefined ? String(row.Value) : '');
        }
      } else {
        // =========================================================================
        // GENERAL CLINICAL TEMPLATES (URINE, STOOL, SEMEN, CSF, HISTOPATHOLOGY, ETC.)
        // =========================================================================
        if (inputDict['data1'] !== undefined) {
          inputDict['data1'] = templateName;
        }

        // Flatten incoming clinical items from resultJSON.Exam
        const incomingItems = [];
        if (resultJSON.Exam && typeof resultJSON.Exam === 'object') {
          for (const [sectionKey, items] of Object.entries(resultJSON.Exam)) {
            if (Array.isArray(items)) {
              for (const it of items) {
                if (it && typeof it === 'object') incomingItems.push(it);
              }
            }
          }
        }

        // Group inputs by clinical parameter roles
        // Only actual text inputs with blue styling signify parameter names (avoiding <select> or drawing tags)
        const paramsList = [];
        let currentParam = null;

        for (const inp of inputs) {
          const raw = inp[0];
          const tag = inp[1].toLowerCase();
          const name = inp[2];
          const valMatch = raw.match(/value=["']([^"']*)["']/i);
          let val = valMatch ? valMatch[1] : '';

          const isBlueInput =
            tag === 'input' &&
            raw.includes('#0000ff') &&
            !name.startsWith('drawing') &&
            (raw.includes('border: 3px solid #0000ff') ||
              raw.includes('border: 6px solid #0000ff') ||
              raw.includes('border: 8px solid #0000ff'));
          const isRed = raw.includes('#ff1a1a');
          const isGreen = raw.includes('#00cc00');
          const isOrange = raw.includes('#ff8000');

          if (isBlueInput) {
            currentParam = { labelField: name, label: val, valueField: null, unitField: null, refRangeField: null };
            paramsList.push(currentParam);
          } else if (isRed && currentParam && !currentParam.valueField) {
            currentParam.valueField = name;
          } else if (isGreen && currentParam && !currentParam.unitField) {
            currentParam.unitField = name;
          } else if (isOrange && currentParam && !currentParam.refRangeField) {
            currentParam.refRangeField = name;
          }
        }

        // Apply clinical findings to parameter inputs
        paramsList.forEach((param, pIdx) => {
          const normLabel = String(param.label || '').trim().toLowerCase();
          let matched = incomingItems.find(
            (it) => it && String(it.originalName || it.Name || it.name || '').trim().toLowerCase() === normLabel
          );
          if (!matched && incomingItems[pIdx]) {
            matched = incomingItems[pIdx];
          }

          if (matched) {
            const newName = matched.Name ?? matched.name;
            if (newName !== undefined && param.labelField) {
              inputDict[param.labelField] = String(newName);
            }
            const newVal = matched.Value ?? matched.value;
            if (newVal !== undefined && param.valueField) {
              inputDict[param.valueField] = String(newVal);
            }
            const newUnit = matched.Unit ?? matched.unit;
            if (newUnit !== undefined && param.unitField) {
              inputDict[param.unitField] = String(newUnit);
            }
            const newRefRange = matched.RefRange ?? matched['Ref Range'] ?? matched.refRange;
            if (newRefRange !== undefined && param.refRangeField) {
              inputDict[param.refRangeField] = String(newRefRange);
            }
          }
        });
      }

      // Build form payload in exact document sequence to support duplicate tag names like drawing1/drawing2
      const postData = new URLSearchParams();
      let drawingIdx = 0;
      for (const inp of inputs) {
        const name = inp[2];
        if (name === 'drawing2') {
          const drawArr = resultJSON.drawingData || resultJSON.Exam?.['Drawing Data'] || [];
          const it = drawArr[drawingIdx++];
          const val = it ? (it.value !== undefined ? String(it.value) : (it.Value !== undefined ? String(it.Value) : '')) : '';
          postData.append(name, val);
        } else {
          postData.append(name, inputDict[name] ?? '');
        }
      }

      // 2. Submit to SaveTemplateData servlet
      const saveUrl = `${this.baseUrl}/SaveTemplateData;jsessionid=${activeSid}`;
      const saveRes = await axios.post(saveUrl, postData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': `JSESSIONID=${activeSid}`,
        },
        timeout: 15000,
        maxRedirects: 0,
        validateStatus: () => true,
      });

      const isOk = saveRes.status === 302 || saveRes.status === 200;
      console.log(`[Upstream] SaveTemplateData for ${cleanReportId} status: ${saveRes.status}`);
      return {
        success: isOk,
        status: saveRes.status,
        message: isOk ? 'Template Saved' : 'Upstream Save Failed',
      };
    } catch (err) {
      console.warn(`[Upstream] SaveTemplateData error for ${cleanReportId}:`, err.message);
      return { success: false, message: err.message };
    }
  }

  /**
   * Fetch clinical journey stages for a patient (API_GET_JOURNEY_STAGES = "GETJOURNEYSTAGES")
   * Upstream URL format: /GetAPIServlet?api=GETJOURNEYSTAGES&patientId=P26
   * @param {string} patientId - Patient identifier (e.g. "P26")
   * @param {string} [sid] - Optional session ID
   */
  async getJourneyStages(patientId, sid = null) {
    const cleanPatientId = String(patientId || '').trim();
    if (!cleanPatientId) {
      throw new Error('patientId is required for GETJOURNEYSTAGES');
    }

    // 1. Primary: GetAPIServlet (All GET* APIs are hosted on GetAPIServlet)
    try {
      const res = await this.get(API_GET_JOURNEY_STAGES, { patientId: cleanPatientId }, sid);
      if (res && res.StatusCode !== '1001') {
        return res;
      }
    } catch (err) {
      console.warn(`[Upstream] GetAPIServlet GETJOURNEYSTAGES failed for ${cleanPatientId}:`, err.message);
    }

    // 2. Secondary fallback: APIServlet (in case upstream route is mapped to APIServlet)
    try {
      const resPost = await this.post(API_GET_JOURNEY_STAGES, { patientId: cleanPatientId }, null, sid);
      return resPost;
    } catch (postErr) {
      return {
        STATUS: 'FAILED',
        StatusCode: '1001',
        Message: postErr.message || 'GETJOURNEYSTAGES unreachable',
        api: API_GET_JOURNEY_STAGES,
        patientId: cleanPatientId,
      };
    }
  }
}

export const upstreamService = new UpstreamService();
