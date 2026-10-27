/**
 * LIS Universal Date & Time Utilities
 */

/**
 * Format any date input (UTC string, ISO string, DD/MM/YYYY, Date object) to a valid Date
 */
export const parseLISDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;

  const str = String(dateVal).trim();
  if (!str) return null;

  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  // 1. Handle Java Date.toString() e.g. "Mon Oct 26 00:00:00 UTC 2026"
  const javaDateMatch = str.match(/^[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+(?:[A-Za-z0-9_+-]+)\s+(\d{4})/);
  if (javaDateMatch) {
    const [, monthStr, dayStr, hours, mins, secs, yearStr] = javaDateMatch;
    const mIdx = monthMap[monthStr.toLowerCase()];
    if (mIdx !== undefined) {
      return new Date(Number(yearStr), mIdx, Number(dayStr), Number(hours), Number(mins), Number(secs));
    }
  }

  // 2. Handle "Oct 26, 2026, 12:00:00 AM" or "Oct 26, 2026"
  const monthDayYearMatch = str.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthDayYearMatch) {
    const [, monthStr, dayStr, yearStr] = monthDayYearMatch;
    const mIdx = monthMap[monthStr.toLowerCase()];
    if (mIdx !== undefined) {
      return new Date(Number(yearStr), mIdx, Number(dayStr));
    }
  }

  // 3. Try standard parse (handles ISO strings, standard formats)
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  // 4. Handle DD/MM/YYYY or DD-MM-YYYY formats e.g. '18/10/2026 06:36 PM'
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(.*))?$/);
  if (dmyMatch) {
    const [, day, month, year, timePart] = dmyMatch;
    const isoLike = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${timePart ? ` ${timePart}` : ''}`;
    const dmyParsed = new Date(isoLike);
    if (!isNaN(dmyParsed.getTime())) return dmyParsed;
  }

  return null;
};

/**
 * Format date to YYYY-MM-DD in LOCAL timezone (avoids UTC offset shifts)
 */
export const getLocalDateString = (date = new Date()) => {
  if (typeof date === 'string') {
    const s = date.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    const monthMap = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    // Handle Java Date.toString() e.g. "Mon Oct 26 00:00:00 UTC 2026"
    const javaDateMatch = s.match(/^[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+\d{2}:\d{2}:\d{2}\s+(?:[A-Za-z0-9_+-]+)\s+(\d{4})/);
    if (javaDateMatch) {
      const [, monthStr, dayStr, yearStr] = javaDateMatch;
      const mm = monthMap[monthStr.toLowerCase()];
      if (mm) return `${yearStr}-${mm}-${dayStr.padStart(2, '0')}`;
    }

    // Handle "Oct 26, 2026, 12:00:00 AM" or "Oct 26, 2026"
    const monthDayYearMatch = s.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/);
    if (monthDayYearMatch) {
      const [, monthStr, dayStr, yearStr] = monthDayYearMatch;
      const mm = monthMap[monthStr.toLowerCase()];
      if (mm) return `${yearStr}-${mm}-${dayStr.padStart(2, '0')}`;
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  const d = date instanceof Date ? date : parseLISDate(date) || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get yesterday's date in YYYY-MM-DD
 */
export const getYesterdayDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
};

/**
 * Add or subtract days from a YYYY-MM-DD string
 */
export const shiftDateDays = (dateStr, days) => {
  const d = parseLISDate(dateStr) || new Date();
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
};

/**
 * Clean human-readable display date (e.g. '19 Oct 2026')
 */
export const formatDisplayDate = (dateVal, includeTime = false) => {
  if (!dateVal) return '-';
  const d = parseLISDate(dateVal);
  if (!d) return String(dateVal).slice(0, 10);

  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let formatted = `${day} ${month} ${year}`;

  if (includeTime) {
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    formatted += `, ${hour12}:${minutes} ${ampm}`;
  }

  return formatted;
};

/**
 * Extract clean, human-readable time string from patient record (e.g. '01:15 PM', '06:02 PM', or '--:--')
 */
export const getPatientTime = (patient) => {
  if (!patient) return '--:--';
  const raw = patient.sampleTime || patient.reportTime || patient.regTime || patient.time || '';
  if (raw) {
    const match = String(raw).match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
    if (match) {
      return match[1].trim().toUpperCase();
    }
    return String(raw).trim();
  }
  return '--:--';
};

/**
 * Format sample collection time distinctly from registration date.
 * If sampleTime is missing or empty, returns null (no fake fallback time!).
 * If sample collection date differs from registration date, includes the date (e.g. '26 Oct, 06:54 AM').
 * Otherwise returns time only (e.g. '05:56 PM').
 */
export const getSampleTimeDisplay = (sampleTime, regDate = null) => {
  if (!sampleTime || String(sampleTime).trim() === '') return null;
  const raw = String(sampleTime).trim();

  // Match time part e.g. '05:56 PM' or '06:54 AM'
  const timeMatch = raw.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
  const timeOnly = timeMatch ? timeMatch[1].trim().toUpperCase() : raw;

  // Check if sample date differs from regDate
  const dateMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dateMatch && regDate) {
    const [, d, m, y] = dateMatch;
    const sampleDateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const regDateObj = parseLISDate(regDate);

    if (
      regDateObj &&
      (sampleDateObj.getDate() !== regDateObj.getDate() ||
       sampleDateObj.getMonth() !== regDateObj.getMonth() ||
       sampleDateObj.getFullYear() !== regDateObj.getFullYear())
    ) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const smDay = String(sampleDateObj.getDate()).padStart(2, '0');
      const smMon = monthNames[sampleDateObj.getMonth()];
      return `${smDay} ${smMon}, ${timeOnly}`;
    }
  }

  return timeOnly;
};

/**
 * Format registration date and time together for table rows
 */
export const formatPatientDateTime = (patient) => {
  if (!patient) return '-';
  const regDate = patient.regDate || patient.collectionDate;
  const timeStr = getPatientTime(patient);

  const d = parseLISDate(regDate);
  const dateFormatted = d ? formatDisplayDate(d) : '-';

  if (timeStr && timeStr !== '--:--') {
    return `${dateFormatted}, ${timeStr}`;
  }
  return dateFormatted;
};

/**
 * Sort patients descending: newest dates and highest IDs first
 */
export const sortPatientsByRecent = (patients) => {
  if (!Array.isArray(patients)) return [];

  return [...patients].sort((a, b) => {
    // 1. Sort by registration date/timestamp (descending)
    const dateA = a.regDate ? parseLISDate(a.regDate) : null;
    const dateB = b.regDate ? parseLISDate(b.regDate) : null;
    const timeA = dateA ? dateA.getTime() : 0;
    const timeB = dateB ? dateB.getTime() : 0;

    if (timeB !== timeA) {
      return timeB - timeA;
    }

    // 2. Sort by numeric ID descending (e.g. P107 > P106 > P105 > P10)
    const numA = parseInt(String(a.patientId || a.slNo || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(String(b.patientId || b.slNo || '').replace(/\D/g, ''), 10) || 0;
    return numB - numA;
  });
};

/**
 * Format date specifically for EMR History: '23-October-2026'
 */
export const formatEmrDate = (dateVal) => {
  if (!dateVal) return '-';
  const d = parseLISDate(dateVal);
  if (!d) return String(dateVal);

  const day = d.getDate();
  const monthsFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthsFull[d.getMonth()];
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Format date & time for Report Activity Log console: '23-10-2026 06:43:20 PM'
 */
export const formatLogDateTime = (dateVal) => {
  if (!dateVal) return '';
  const d = parseLISDate(dateVal);
  if (!d) return String(dateVal);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = String(hours % 12 || 12).padStart(2, '0');

  return `${day}-${month}-${year} ${hour12}:${minutes}:${seconds} ${ampm}`;
};

