import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { orderExamObject } from './service.templateSequence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'local_template_store.json');

// In-memory cache for fast lookups
const store = new Map();
let isInitialized = false;

const normalizeReportId = (rid) => {
  if (!rid) return '';
  return String(rid).trim().toUpperCase();
};

/**
 * Load template reports from local disk
 */
const loadFromDisk = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(content || '{}');
      for (const [rid, report] of Object.entries(data)) {
        if (rid && report) {
          store.set(normalizeReportId(rid), report);
        }
      }
      console.log(`[TemplateStore] Loaded ${store.size} persisted template report(s) from disk.`);
    }
  } catch (err) {
    console.warn('[TemplateStore] Failed to load local_template_store.json:', err.message);
  } finally {
    isInitialized = true;
  }
};

/**
 * Save in-memory store to local disk
 */
const saveToDisk = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const plain = {};
    for (const [rid, report] of store.entries()) {
      plain[rid] = report;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(plain, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[TemplateStore] Failed to save local_template_store.json:', err.message);
  }
};

const ensureInitialized = () => {
  if (!isInitialized) {
    loadFromDisk();
  }
};

/**
 * Deep merge two Exam objects.
 * Upstream provides the base / latest structure and lab values.
 * Stored overrides provide customized parameter labels, added units, ref ranges, and custom added rows.
 */
export const mergeExamObjects = (upstreamExam, storedExam) => {
  if (!storedExam || typeof storedExam !== 'object') return upstreamExam || {};
  if (!upstreamExam || typeof upstreamExam !== 'object') return storedExam;

  const merged = { ...upstreamExam };

  for (const [sectionKey, storedItems] of Object.entries(storedExam)) {
    if (!Array.isArray(storedItems)) {
      if (merged[sectionKey] === undefined) {
        merged[sectionKey] = storedItems;
      }
      continue;
    }

    const currentItems = Array.isArray(merged[sectionKey]) ? [...merged[sectionKey]] : [];

    storedItems.forEach((storedItem, idx) => {
      if (!storedItem || typeof storedItem !== 'object') return;

      const normStoredName = String(storedItem.Name || storedItem.name || '').trim().toLowerCase();
      let matchIdx = -1;
      if (normStoredName) {
        matchIdx = currentItems.findIndex(
          (ci) => ci && String(ci.Name || ci.name || '').trim().toLowerCase() === normStoredName
        );
      }
      if (matchIdx === -1 && currentItems[idx]) {
        matchIdx = idx;
      }

      const storedUnit = storedItem.Unit !== undefined && storedItem.Unit !== null
        ? String(storedItem.Unit)
        : (storedItem.unit !== undefined && storedItem.unit !== null ? String(storedItem.unit) : '');
      const storedRef = storedItem.RefRange !== undefined && storedItem.RefRange !== null
        ? String(storedItem.RefRange)
        : (storedItem['Ref Range'] !== undefined && storedItem['Ref Range'] !== null ? String(storedItem['Ref Range']) : '');

      if (matchIdx !== -1) {
        const ci = currentItems[matchIdx] || {};
        const ciUnit = ci.Unit !== undefined && ci.Unit !== null
          ? String(ci.Unit)
          : (ci.unit !== undefined && ci.unit !== null ? String(ci.unit) : '');
        const ciRef = ci.RefRange !== undefined && ci.RefRange !== null
          ? String(ci.RefRange)
          : (ci['Ref Range'] !== undefined && ci['Ref Range'] !== null ? String(ci['Ref Range']) : '');

        const effectiveUnit = storedUnit !== '' ? storedUnit : ciUnit;
        const effectiveRef = storedRef !== '' ? storedRef : ciRef;
        const effectiveShowUnit = Boolean(
          storedItem.showUnitInput ||
          effectiveUnit !== '' ||
          ci.showUnitInput
        );

        // Keep upstream value if non-empty, otherwise keep stored value
        const ciVal = ci.Value !== undefined ? String(ci.Value) : (ci.value !== undefined ? String(ci.value) : '');
        const storedVal = storedItem.Value !== undefined ? String(storedItem.Value) : (storedItem.value !== undefined ? String(storedItem.value) : '');
        const effectiveVal = ciVal !== '' ? ciVal : storedVal;

        currentItems[matchIdx] = {
          ...ci,
          Name: ci.Name || ci.name || storedItem.Name || storedItem.name || '',
          Value: effectiveVal,
          Unit: effectiveUnit,
          showUnitInput: effectiveShowUnit,
          RefRange: effectiveRef,
          'Ref Range': effectiveRef,
        };
      } else {
        // User-added item not present in upstream
        currentItems.push({
          ...storedItem,
          Unit: storedUnit,
          RefRange: storedRef,
          'Ref Range': storedRef,
          showUnitInput: Boolean(storedItem.showUnitInput || storedUnit !== ''),
        });
      }
    });

    merged[sectionKey] = currentItems;
  }

  return merged;
};

export const mergeHbA1cResult = (upstreamResult = [], storedResult = []) => {
  const uArr = Array.isArray(upstreamResult) ? upstreamResult : [];
  const sArr = Array.isArray(storedResult) ? storedResult : [];
  const maxLen = Math.max(uArr.length, sArr.length, 2);
  const defaultNames = ['Glycated Haemoglobin (HbA1c)', 'Estimated Average Glucose (eAG)'];
  const defaultUnits = ['% ofTotal Hb', 'mg/dL'];

  const merged = [];
  for (let i = 0; i < maxLen; i++) {
    const u = uArr[i] || {};
    const uName = String(u.Name || u.name || defaultNames[i] || '').trim().toLowerCase();

    // Match stored item by name keyword if possible, otherwise by index
    let s = sArr[i];
    if (uName) {
      const match = sArr.find((si) => {
        const sNorm = String(si?.Name || si?.name || '').trim().toLowerCase();
        if (sNorm === uName) return true;
        if (uName.includes('glucose') && sNorm.includes('glucose')) return true;
        if (uName.includes('glycated') && sNorm.includes('glycated')) return true;
        return false;
      });
      if (match) s = match;
    }
    s = s || {};

    const uVal = u.Value !== undefined ? String(u.Value) : (u.value !== undefined ? String(u.value) : '');
    const sVal = s.Value !== undefined ? String(s.Value) : (s.value !== undefined ? String(s.value) : '');
    // Clinical value from upstream always takes precedence if non-empty
    const effectiveVal = uVal.trim() !== '' ? uVal : sVal;

    const uUnit = u.Unit || u.unit || '';
    const sUnit = s.Unit || s.unit || '';
    const effectiveUnit = sUnit.trim() !== '' ? sUnit : (uUnit.trim() !== '' ? uUnit : defaultUnits[i] || '');

    const uRef = u['Ref Range'] || u.RefRange || u.refRange || '';
    const sRef = s['Ref Range'] || s.RefRange || s.refRange || '';
    const effectiveRef = sRef.trim() !== '' ? sRef : uRef;

    const uOp = u.operator || u.Method || u.method || '';
    const sOp = s.operator || s.Method || s.method || '';
    const effectiveOp = (uOp && uOp !== '-') ? uOp : (sOp || '-');

    merged.push({
      name: u.Name || u.name || s.Name || s.name || defaultNames[i] || `Result ${i + 1}`,
      operator: effectiveOp,
      value: effectiveVal,
      unit: effectiveUnit,
      refRange: effectiveRef,
    });
  }
  return merged;
};

export const mergePeakDataTable = (upstreamPeaks = [], storedPeaks = []) => {
  const uArr = Array.isArray(upstreamPeaks) ? upstreamPeaks : [];
  const sArr = Array.isArray(storedPeaks) ? storedPeaks : [];
  const defaultPeaks = ['HbA1C(IFCC)', 'eAG[ADA]', 'Others 1', 'Others 2', 'Others 3', 'Peak Data', 'Graph Data'];
  const maxLen = Math.max(uArr.length, sArr.length, 7);

  const merged = [];
  for (let i = 0; i < maxLen; i++) {
    const u = uArr[i] || {};
    const uName = String(u.Peak || u.peak || u.Name || u.name || defaultPeaks[i] || '').trim().toLowerCase();

    let s = sArr[i];
    if (uName) {
      const match = sArr.find((si) => {
        const sNorm = String(si?.Peak || si?.peak || si?.Name || si?.name || '').trim().toLowerCase();
        return sNorm === uName;
      });
      if (match) s = match;
    }
    s = s || {};

    const uTime = u.Time !== undefined ? String(u.Time) : (u.time !== undefined ? String(u.time) : '');
    const sTime = s.Time !== undefined ? String(s.Time) : (s.time !== undefined ? String(s.time) : '');
    const time = uTime.trim() !== '' ? uTime : sTime;

    const uAbs = u.ABS !== undefined ? String(u.ABS) : (u.abs !== undefined ? String(u.abs) : '');
    const sAbs = s.ABS !== undefined ? String(s.ABS) : (s.abs !== undefined ? String(s.abs) : '');
    const abs = uAbs.trim() !== '' ? uAbs : sAbs;

    const uArea = u.Area !== undefined ? String(u.Area) : (u.area !== undefined ? String(u.area) : '');
    const sArea = s.Area !== undefined ? String(s.Area) : (s.area !== undefined ? String(s.area) : '');
    const area = uArea.trim() !== '' ? uArea : sArea;

    const uRes = u.Result !== undefined ? String(u.Result) : (u.result !== undefined ? String(u.result) : '');
    const sRes = s.Result !== undefined ? String(s.Result) : (s.result !== undefined ? String(s.result) : '');
    const result = uRes.trim() !== '' ? uRes : sRes;

    const uRef = u['Ref Range'] || u.RefRange || u.refRange || '';
    const sRef = s['Ref Range'] || s.RefRange || s.refRange || '';
    const refRange = sRef.trim() !== '' ? sRef : uRef;

    merged.push({
      peak: u.Peak || u.peak || u.Name || u.name || s.Peak || s.peak || s.Name || s.name || defaultPeaks[i] || `Peak ${i + 1}`,
      time,
      abs,
      area,
      result,
      refRange,
    });
  }
  return merged;
};

export const mergeSummaryResult = (upstreamSummary = [], storedSummary = []) => {
  const uArr = Array.isArray(upstreamSummary) ? upstreamSummary : [];
  const sArr = Array.isArray(storedSummary) ? storedSummary : [];
  const defaultSummary = ['TotalArea', 'HbA1C(NGSP)', 'eAG(ADA)', 'HbA1C(IFCC)', 'eAG[ADA]'];
  const maxLen = Math.max(uArr.length, sArr.length, 5);

  const merged = [];
  for (let i = 0; i < maxLen; i++) {
    const u = uArr[i] || {};
    const uName = String(u.Name || u.name || defaultSummary[i] || '').trim().toLowerCase();

    let s = sArr[i];
    if (uName) {
      const match = sArr.find((si) => {
        const sNorm = String(si?.Name || si?.name || '').trim().toLowerCase();
        return sNorm === uName;
      });
      if (match) s = match;
    }
    s = s || {};

    const uVal1 = u.val1 !== undefined ? String(u.val1) : (u.Value !== undefined ? String(u.Value) : (u.value !== undefined ? String(u.value) : ''));
    const sVal1 = s.val1 !== undefined ? String(s.val1) : (s.Value !== undefined ? String(s.Value) : (s.value !== undefined ? String(s.value) : ''));
    const val1 = uVal1.trim() !== '' ? uVal1 : sVal1;

    const uVal2 = u.val2 !== undefined ? String(u.val2) : (u.Unit !== undefined ? String(u.Unit) : (u.unit !== undefined ? String(u.unit) : ''));
    const sVal2 = s.val2 !== undefined ? String(s.val2) : (s.Unit !== undefined ? String(s.Unit) : (s.unit !== undefined ? String(s.unit) : ''));
    const val2 = sVal2.trim() !== '' ? sVal2 : uVal2;

    merged.push({
      name: u.Name || u.name || s.Name || s.name || defaultSummary[i] || `Summary ${i + 1}`,
      val1,
      val2,
    });
  }
  return merged;
};

export const templateStore = {
  get(reportId) {
    ensureInitialized();
    const clean = normalizeReportId(reportId);
    return store.get(clean) || null;
  },

  has(reportId) {
    ensureInitialized();
    const clean = normalizeReportId(reportId);
    return store.has(clean);
  },

  set(reportId, reportData) {
    ensureInitialized();
    const clean = normalizeReportId(reportId);
    if (!clean || !reportData) return;

    store.set(clean, reportData);
    saveToDisk();
    console.log(`[TemplateStore] Persisted report ${clean} to disk storage.`);
  },

  delete(reportId) {
    ensureInitialized();
    const clean = normalizeReportId(reportId);
    if (store.has(clean)) {
      store.delete(clean);
      saveToDisk();
    }
  },

  mergeExam: mergeExamObjects,
  mergeHbA1c: mergeHbA1cResult,
  mergePeaks: mergePeakDataTable,
  mergeSummary: mergeSummaryResult,

  /**
   * Merge stored template data into an upstream TemplateReport object.
   */
  mergeTemplateReport(upstreamReport, storedReport) {
    if (!storedReport) return upstreamReport;
    if (!upstreamReport) return storedReport;

    const res = { ...upstreamReport };
    const uJson = upstreamReport.resultJSON || upstreamReport.resultJson || {};
    const sJson = storedReport.resultJSON || storedReport.resultJson || {};
    const tmplName = res.TEMPLATE_NAME || uJson.TEMPLATE_NAME || sJson.TEMPLATE_NAME || '';

    const mergedExam = mergeExamObjects(uJson.Exam, sJson.Exam);
    const orderedExam = orderExamObject(mergedExam, tmplName);

    const mergedHba1cResult = mergeHbA1cResult(
      uJson.hba1cResult || uJson.Exam?.Result || uJson.Exam?.['HbA1C Result'],
      sJson.hba1cResult || sJson.Exam?.Result || sJson.Exam?.['HbA1C Result']
    );

    const mergedPeakData = mergePeakDataTable(
      uJson.peakDataTable || uJson.Exam?.PeakData || uJson.Exam?.['Peak Data'],
      sJson.peakDataTable || sJson.Exam?.PeakData || sJson.Exam?.['Peak Data']
    );

    const mergedSummary = mergeSummaryResult(
      uJson.summaryResult || uJson.Exam?.['Final Result'] || uJson.Exam?.['Summary Result'],
      sJson.summaryResult || sJson.Exam?.['Final Result'] || sJson.Exam?.['Summary Result']
    );

    res.resultJSON = {
      ...uJson,
      ...sJson,
      Exam: orderedExam,
      hba1cResult: mergedHba1cResult,
      peakDataTable: mergedPeakData,
      summaryResult: mergedSummary,
      others: sJson.others || uJson.others,
      drawingData: sJson.drawingData || uJson.drawingData,
    };

    if (sJson.TEMPLATE_NAME) res.resultJSON.TEMPLATE_NAME = sJson.TEMPLATE_NAME;
    if (sJson.headingName) res.resultJSON.headingName = sJson.headingName;

    return res;
  },
};

