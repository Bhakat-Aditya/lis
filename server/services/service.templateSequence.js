/**
 * Canonical fixed section sequence for clinical template reports on backend
 * Matching the existing webview (oldview) structure
 */

export const CANONICAL_SECTION_ORDER = {
  // T1, T2: URINE EXAMINATION
  URINE: [
    'Physical Examination',
    'Chemical Examination',
    'Microscopic Examination',
    'Others',
  ],

  // T3: STOOL EXAMINATION
  STOOL: [
    'Physical Examination',
    'Chemical Examination',
    'Microscopic Examination',
    'Others',
  ],

  // T12: SEMEN ANALYSIS
  SEMEN: [
    'Physical Examination',
    'Chemical Examination',
    'Microscopic Examination',
    'Others',
  ],

  // T4, T5, T6, T7: FLUID / CSF
  FLUID: [
    'Physical Examination',
    'Chemical Examination',
    'Microscopic / Cytological Examination',
    'Microbiological Examination',
    'Others',
  ],

  // T8: COMPLETE BLOOD COUNT
  CBC: [
    'INVESTIGATION',
    'RED CELL ABSOLUTE VALUES',
    'PLATELETS ABSOLUTE VALUES',
    'DIFFRENTIAL COUNT',
    'GBP',
    'Extra',
    'Others',
  ],

  // T9, T10: HISTOPATHOLOGY / FNAC / BIOPSY
  HISTO: [
    'Gross Examination',
    'Microscopic Examination',
    'Diagnostic Impression',
    'Others',
  ],

  // T11, T15: BACTERIOLOGY / PASS REPORT
  BACTERIOLOGY: [
    'Exam',
    'Others',
  ],

  // T14: HbA1C REPORT
  HBA1C: [
    'HbA1C Result',
    'Peak Data Table',
    'Summary Result',
    'Others',
    'Drawing Data',
  ],

  DEFAULT: [
    'Physical Examination',
    'Chemical Examination',
    'Microscopic Examination',
    'Microscopic / Cytological Examination',
    'Microbiological Examination',
    'Gross Examination',
    'Diagnostic Impression',
    'General Observations',
    'Clinical Findings',
    'Summary Result',
    'Impression / Remarks',
    'Others',
    'Drawing Data',
  ],
};

export const getCanonicalSectionOrder = (templateName = '') => {
  const norm = String(templateName || '').toUpperCase().trim();
  if (norm.includes('URINE')) return CANONICAL_SECTION_ORDER.URINE;
  if (norm.includes('STOOL')) return CANONICAL_SECTION_ORDER.STOOL;
  if (norm.includes('SEMEN')) return CANONICAL_SECTION_ORDER.SEMEN;
  if (
    norm.includes('BLOOD') ||
    norm.includes('CBC') ||
    norm.includes('HAEMATOLOGY') ||
    norm.includes('HEMA')
  ) {
    return CANONICAL_SECTION_ORDER.CBC;
  }
  if (
    norm.includes('FLUID') ||
    norm.includes('CSF') ||
    norm.includes('ASCITIC') ||
    norm.includes('SYNOVIAL') ||
    norm.includes('PLEURAL')
  ) {
    return CANONICAL_SECTION_ORDER.FLUID;
  }
  if (
    norm.includes('HISTO') ||
    norm.includes('FNAC') ||
    norm.includes('BIOPSY')
  ) {
    return CANONICAL_SECTION_ORDER.HISTO;
  }
  if (
    norm.includes('BACTERIO') ||
    norm.includes('PASS REPORT')
  ) {
    return CANONICAL_SECTION_ORDER.BACTERIOLOGY;
  }
  if (
    norm.includes('HBA1C') ||
    norm.includes('GLYCATED') ||
    norm.includes('A1C')
  ) {
    return CANONICAL_SECTION_ORDER.HBA1C;
  }
  return CANONICAL_SECTION_ORDER.DEFAULT;
};

export const isOthersSectionKey = (key = '') => {
  const norm = String(key || '').toLowerCase().trim();
  return norm === 'others' || norm.startsWith('other');
};

export const isDrawingSectionKey = (key = '') => {
  const norm = String(key || '').toLowerCase().trim();
  return norm.includes('drawing');
};

export const getSectionSortRank = (key = '', orderList = []) => {
  const norm = String(key || '').toLowerCase().trim();
  // Drawing data is always at the absolute bottom
  if (isDrawingSectionKey(norm)) return 99999;
  // Others section is always at the bottom (just above drawing data)
  if (isOthersSectionKey(norm)) return 99000;

  const idx = orderList.findIndex((o) => o.toLowerCase() === norm);
  if (idx !== -1) {
    return idx;
  }
  // Unlisted sections come after listed sections but ALWAYS before Others
  return 50000;
};

export const sortSectionKeys = (keys = [], templateName = '') => {
  const orderList = getCanonicalSectionOrder(templateName);
  return [...keys].sort((a, b) => {
    const rankA = getSectionSortRank(a, orderList);
    const rankB = getSectionSortRank(b, orderList);

    if (rankA !== rankB) return rankA - rankB;
    return a.localeCompare(b);
  });
};

export const orderExamObject = (examObj, templateName = '') => {
  if (!examObj || typeof examObj !== 'object') return examObj;
  const sortedKeys = sortSectionKeys(Object.keys(examObj), templateName);
  const result = {};
  sortedKeys.forEach((key) => {
    result[key] = Array.isArray(examObj[key]) ? [...examObj[key]] : examObj[key];
  });
  return result;
};

