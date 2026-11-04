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

  // T9, T10: HISTOPATHOLOGY / FNAC / BIOPSY
  HISTO: [
    'Gross Examination',
    'Microscopic Examination',
    'Diagnostic Impression',
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
    norm.includes('HBA1C') ||
    norm.includes('GLYCATED') ||
    norm.includes('A1C')
  ) {
    return CANONICAL_SECTION_ORDER.HBA1C;
  }
  return CANONICAL_SECTION_ORDER.DEFAULT;
};

export const sortSectionKeys = (keys = [], templateName = '') => {
  const orderList = getCanonicalSectionOrder(templateName);
  return [...keys].sort((a, b) => {
    const normA = String(a).toLowerCase().trim();
    const normB = String(b).toLowerCase().trim();

    const idxA = orderList.findIndex((o) => o.toLowerCase() === normA);
    const idxB = orderList.findIndex((o) => o.toLowerCase() === normB);

    const rankA = idxA !== -1 ? idxA : 999;
    const rankB = idxB !== -1 ? idxB : 999;

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

