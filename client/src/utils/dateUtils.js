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

  // Try standard parse (handles 'Mon Oct 19 00:00:00 UTC 2026', '2026-10-19', ISO strings)
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  // Handle DD/MM/YYYY or DD-MM-YYYY formats e.g. '18/10/2026 06:36 PM'
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
 * Format registration date and time together for table rows
 */
export const formatPatientDateTime = (patient) => {
  if (!patient) return '-';
  const regDate = patient.regDate || patient.collectionDate;
  const sampleTime = patient.sampleTime || patient.regTime;

  const d = parseLISDate(regDate);
  if (!d) {
    return sampleTime ? `${sampleTime}` : '-';
  }

  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const dateShort = `${day} ${month}`;

  if (sampleTime && !sampleTime.includes('/')) {
    return `${dateShort}, ${sampleTime}`;
  }

  return `${dateShort} ${d.getFullYear()}`;
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

