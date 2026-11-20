import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'report_overrides.json');

// Memory store: normalized patientId -> Map(reportId -> overrideObject)
const memoryStore = new Map();
let isInitialized = false;

const normalizePid = (pid) => {
  if (!pid) return '';
  const raw = String(pid).trim().toUpperCase();
  return raw.startsWith('P') ? `P${raw.replace(/^P+/i, '')}` : `P${raw}`;
};

/**
 * Load persisted overrides from local JSON file
 */
const loadFromFile = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(content || '{}');
      for (const [pid, reports] of Object.entries(data)) {
        const normPid = normalizePid(pid);
        const repMap = new Map();
        for (const [rid, repData] of Object.entries(reports)) {
          repMap.set(String(rid).trim(), repData);
        }
        memoryStore.set(normPid, repMap);
      }
      console.log(`[ReportOverride] Loaded persisted overrides from local store for ${memoryStore.size} patient(s).`);
    }
    isInitialized = true;
  } catch (err) {
    console.warn('[ReportOverride] Error loading from local file:', err.message);
  }
};

/**
 * Save in-memory store to local JSON file
 */
const saveToFile = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const plainObj = {};
    for (const [pid, repMap] of memoryStore.entries()) {
      if (repMap.size > 0) {
        plainObj[pid] = Object.fromEntries(repMap.entries());
      }
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(plainObj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ReportOverride] Error saving to local file:', err.message);
  }
};

const ensureInitialized = () => {
  if (!isInitialized) {
    loadFromFile();
    isInitialized = true;
  }
};

// Initial load on import
loadFromFile();

export const reportOverrideService = {
  /**
   * Mark a test report as DELETED for a patient
   */
  async markDeleted(patientId, reportId, meta = {}) {
    ensureInitialized();
    const normPid = normalizePid(patientId);
    const cleanRid = String(reportId).trim();
    if (!normPid || !cleanRid) return;

    if (!memoryStore.has(normPid)) {
      memoryStore.set(normPid, new Map());
    }

    const overrideData = {
      status: 'DELETED',
      testName: meta.testName || '',
      profileName: meta.profileName || '',
      deptName: meta.deptName || '',
      rate: meta.rate || '',
      deletedAt: new Date().toISOString(),
    };

    memoryStore.get(normPid).set(cleanRid, overrideData);
    saveToFile();
    console.log(`[ReportOverride] Report ${cleanRid} marked as DELETED for patient ${normPid}`);
  },

  /**
   * Restore a deleted test report back to active for a patient
   */
  async restoreDeleted(patientId, reportId) {
    ensureInitialized();
    const normPid = normalizePid(patientId);
    const cleanRid = String(reportId).trim();
    if (!normPid || !cleanRid) return;

    if (memoryStore.has(normPid)) {
      memoryStore.get(normPid).delete(cleanRid);
      if (memoryStore.get(normPid).size === 0) {
        memoryStore.delete(normPid);
      }
      saveToFile();
    }
    console.log(`[ReportOverride] Report ${cleanRid} restored for patient ${normPid}`);
  },

  /**
   * Get all overrides (e.g., DELETED) for a patient
   * Returns: { [reportId]: { status: 'DELETED', ... } }
   */
  async getOverrides(patientId) {
    ensureInitialized();
    const normPid = normalizePid(patientId);
    const altPid = normPid.startsWith('P') ? normPid.slice(1) : normPid;

    const result = {};

    const map = memoryStore.get(normPid) || memoryStore.get(altPid);
    if (map) {
      for (const [rid, data] of map.entries()) {
        result[rid] = data;
      }
    }

    return result;
  },
};
