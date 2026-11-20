import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'deleted_patients.json');

// In-memory store: patientId (uppercase) -> details
const deletedPatientsMap = new Map();
let isInitialized = false;

const loadFromFile = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw || '{}');
      for (const [pid, val] of Object.entries(data)) {
        deletedPatientsMap.set(String(pid).toUpperCase().trim(), val);
      }
      console.log(`[DeletedPatient] Loaded ${deletedPatientsMap.size} deleted patient record(s) from local file.`);
    }
    isInitialized = true;
  } catch (err) {
    console.warn('[DeletedPatient] File load error:', err.message);
  }
};

const saveToFile = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const plainObj = Object.fromEntries(deletedPatientsMap.entries());
    fs.writeFileSync(DATA_FILE, JSON.stringify(plainObj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DeletedPatient] File save error:', err.message);
  }
};

export const deletedPatientService = {
  isDeleted(patientId) {
    if (!isInitialized) loadFromFile();
    if (!patientId) return false;
    return deletedPatientsMap.has(String(patientId).toUpperCase().trim());
  },

  getAllDeletedIds() {
    if (!isInitialized) loadFromFile();
    return new Set(deletedPatientsMap.keys());
  },

  markDeleted(patientId, meta = {}) {
    if (!isInitialized) loadFromFile();
    if (!patientId) return;
    const cleanId = String(patientId).toUpperCase().trim();
    deletedPatientsMap.set(cleanId, {
      patientId: cleanId,
      ...meta,
      deletedAt: new Date().toISOString(),
    });
    saveToFile();
    console.log(`[DeletedPatient] Patient ${cleanId} marked as deleted.`);
  },

  unmarkDeleted(patientId) {
    if (!isInitialized) loadFromFile();
    if (!patientId) return;
    const cleanId = String(patientId).toUpperCase().trim();
    deletedPatientsMap.delete(cleanId);
    saveToFile();
    console.log(`[DeletedPatient] Patient ${cleanId} unmarked from deleted.`);
  },
};
