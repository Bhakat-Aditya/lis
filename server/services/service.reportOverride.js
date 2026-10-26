import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { ReportOverride } from '../models/model.report.js';

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

/**
 * Synchronize with MongoDB if connected
 */
const syncFromMongoDB = async () => {
  try {
    if (mongoose.connection?.readyState === 1) {
      const records = await ReportOverride.find({}).lean();
      for (const rec of records) {
        const normPid = normalizePid(rec.patientId);
        if (!memoryStore.has(normPid)) {
          memoryStore.set(normPid, new Map());
        }
        memoryStore.get(normPid).set(String(rec.reportId).trim(), {
          status: rec.status || 'DELETED',
          testName: rec.testName || '',
          profileName: rec.profileName || '',
          deptName: rec.deptName || '',
          rate: rec.rate || '',
          deletedAt: rec.deletedAt || rec.createdAt || new Date(),
        });
      }
      if (records && records.length > 0) {
        saveToFile();
      }
    }
  } catch (err) {
    console.warn('[ReportOverride] MongoDB sync warning:', err.message);
  }
};

const ensureInitialized = async () => {
  if (!isInitialized) {
    loadFromFile();
    await syncFromMongoDB();
    isInitialized = true;
  }
};

// Initial load
loadFromFile();

export const reportOverrideService = {
  /**
   * Mark a test report as DELETED for a patient
   */
  async markDeleted(patientId, reportId, meta = {}) {
    await ensureInitialized();
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
      deletedAt: new Date(),
    };

    memoryStore.get(normPid).set(cleanRid, overrideData);
    saveToFile();

    // Persist to MongoDB if connected
    if (mongoose.connection?.readyState === 1) {
      try {
        await ReportOverride.findOneAndUpdate(
          { patientId: normPid, reportId: cleanRid },
          {
            patientId: normPid,
            reportId: cleanRid,
            status: 'DELETED',
            testName: meta.testName || '',
            profileName: meta.profileName || '',
            deptName: meta.deptName || '',
            rate: meta.rate || '',
            deletedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn(`[ReportOverride] MongoDB update failed for ${cleanRid}:`, err.message);
      }
    }
    console.log(`[ReportOverride] Report ${cleanRid} marked as DELETED for patient ${normPid}`);
  },

  /**
   * Restore a deleted test report back to active for a patient
   */
  async restoreDeleted(patientId, reportId) {
    await ensureInitialized();
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

    // Remove from MongoDB if connected
    if (mongoose.connection?.readyState === 1) {
      try {
        await ReportOverride.deleteOne({
          patientId: normPid,
          reportId: cleanRid,
        });
      } catch (err) {
        console.warn(`[ReportOverride] MongoDB delete failed for ${cleanRid}:`, err.message);
      }
    }
    console.log(`[ReportOverride] Report ${cleanRid} restored for patient ${normPid}`);
  },

  /**
   * Get all overrides (e.g., DELETED) for a patient
   * Returns: { [reportId]: { status: 'DELETED', ... } }
   */
  async getOverrides(patientId) {
    await ensureInitialized();
    const normPid = normalizePid(patientId);
    const altPid = normPid.startsWith('P') ? normPid.slice(1) : normPid;

    const result = {};

    // 1. Check in-memory store (primary, high-speed)
    const map = memoryStore.get(normPid) || memoryStore.get(altPid);
    if (map) {
      for (const [rid, data] of map.entries()) {
        result[rid] = data;
      }
    }

    // 2. Fallback to MongoDB if empty and connected
    if (Object.keys(result).length === 0 && mongoose.connection?.readyState === 1) {
      try {
        const records = await ReportOverride.find({
          patientId: { $in: [normPid, altPid] },
        }).lean();

        if (records.length > 0) {
          if (!memoryStore.has(normPid)) memoryStore.set(normPid, new Map());
          for (const rec of records) {
            const data = {
              status: rec.status || 'DELETED',
              testName: rec.testName || '',
              profileName: rec.profileName || '',
              deptName: rec.deptName || '',
              rate: rec.rate || '',
            };
            result[rec.reportId] = data;
            memoryStore.get(normPid).set(String(rec.reportId).trim(), data);
          }
          saveToFile();
        }
      } catch (err) {
        console.warn('[ReportOverride] MongoDB query failed:', err.message);
      }
    }

    return result;
  },
};
