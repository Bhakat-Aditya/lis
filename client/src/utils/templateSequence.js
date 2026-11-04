/**
 * Canonical fixed section sequence for clinical template reports
 * Matching the existing webview (oldview) structure as requested:
 * 
 * For Template T1 - "URINE EXAMINATION":
 * 1st Come "Physical Examination"
 * 2nd - "Chemical Examination"
 * 3rd - "Microscopic Examination"
 * 4th - "Others"
 * 
 * Inside individual array sequence and size as per array item.
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

  // Global canonical fallback
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

/**
 * Returns canonical section sequence list for a template by name or ID
 */
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

/**
 * Sorts section keys strictly according to canonical sequence
 */
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

/**
 * Takes an Exam object and returns a new object with keys ordered canonically,
 * keeping inside each individual array the exact sequence and items.
 */
export const orderExamObject = (examObj, templateName = '') => {
  if (!examObj || typeof examObj !== 'object') return examObj;
  const sortedKeys = sortSectionKeys(Object.keys(examObj), templateName);
  const result = {};
  sortedKeys.forEach((key) => {
    result[key] = Array.isArray(examObj[key]) ? [...examObj[key]] : examObj[key];
  });
  return result;
};

export const getDefaultTemplateSchema = (templateName = 'CLINICAL EXAMINATION') => {
  const norm = String(templateName || '').toUpperCase().trim();

  if (norm.includes('URINE')) {
    return {
      TEMPLATE_NAME: norm.includes('COMPLETE') ? 'URINE EXAMINATION - COMPLETE' : 'URINE EXAMINATION',
      headingName: norm.includes('COMPLETE') ? 'URINE EXAMINATION - COMPLETE' : 'URINE EXAMINATION',
      Exam: {
        'Physical Examination': [
          { Name: 'Quantity', Value: '' },
          { Name: 'Colour', Value: '' },
          { Name: 'Appearance', Value: '' },
          { Name: 'Specific Gravity', Value: '' },
          { Name: 'Deposit', Value: '' },
        ],
        'Chemical Examination': [
          { Name: 'Reaction (pH)', Value: '' },
          { Name: 'Protein / Albumin', Value: '' },
          { Name: 'Sugar / Glucose', Value: '' },
          { Name: 'Ketone Bodies', Value: '' },
          { Name: 'Bile Salts', Value: '' },
          { Name: 'Bile Pigments', Value: '' },
          { Name: 'Urobilinogen', Value: '' },
          { Name: 'Blood / Hemoglobin', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'Pus Cells', Value: '' },
          { Name: 'R.B.C.', Value: '' },
          { Name: 'Epithelial Cells', Value: '' },
          { Name: 'Casts', Value: '' },
          { Name: 'Crystals', Value: '' },
          { Name: 'Bacteria', Value: '' },
          { Name: 'Yeast Cells', Value: '' },
        ],
        Others: [
          { Name: 'Mucus Threads', Value: '' },
          { Name: 'Amorphous Phosphates', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('STOOL')) {
    return {
      TEMPLATE_NAME: 'STOOL EXAMINATION',
      headingName: 'STOOL EXAMINATION',
      Exam: {
        'Physical Examination': [
          { Name: 'Quantity', Value: '' },
          { Name: 'Colour', Value: '' },
          { Name: 'Odour', Value: '' },
          { Name: 'Consistency', Value: '' },
          { Name: 'Mucus', Value: '' },
          { Name: 'Parasite', Value: '' },
        ],
        'Chemical Examination': [
          { Name: 'Occult Blood', Value: '' },
          { Name: 'Reducing Substance', Value: '' },
          { Name: 'pH', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'OVA / LARVAE', Value: '' },
          { Name: 'Trophozoites', Value: '' },
          { Name: 'Crystals', Value: '' },
          { Name: 'Ghost Cells', Value: '' },
          { Name: 'RBC', Value: '' },
          { Name: 'Bacteria', Value: '' },
          { Name: 'Cysts', Value: '' },
          { Name: 'Pyknotic Bodies', Value: '' },
          { Name: 'Pus cells', Value: '' },
          { Name: 'Epithelial Cells', Value: '' },
          { Name: 'Veg. cells', Value: '' },
        ],
        Others: [
          { Name: 'Others 1', Value: '' },
          { Name: 'Others 2', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('SEMEN')) {
    return {
      TEMPLATE_NAME: 'SEMEN ANALYSIS',
      headingName: 'SEMEN ANALYSIS',
      Exam: {
        'Physical Examination': [
          { Name: 'Period of Abstinence', Value: '' },
          { Name: 'Time of Collection', Value: '' },
          { Name: 'Time of Examination', Value: '' },
          { Name: 'Volume', Value: '' },
          { Name: 'Colour & Appearance', Value: '' },
          { Name: 'Liquefaction Time', Value: '' },
          { Name: 'Viscosity', Value: '' },
          { Name: 'pH', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'Total Sperm Count', Value: '' },
          { Name: 'Active Motility (Grade a)', Value: '' },
          { Name: 'Sluggish Motility (Grade b)', Value: '' },
          { Name: 'Non-Progressive (Grade c)', Value: '' },
          { Name: 'Immotile (Grade d)', Value: '' },
          { Name: 'Normal Morphology', Value: '' },
          { Name: 'Abnormal Forms', Value: '' },
          { Name: 'Pus Cells', Value: '' },
          { Name: 'Epithelial Cells', Value: '' },
          { Name: 'Agglutination', Value: '' },
        ],
        Others: [
          { Name: 'Fructose', Value: '' },
          { Name: 'Impression / Note', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('CSF') || norm.includes('FLUID') || norm.includes('ASCITIC') || norm.includes('SYNOVIAL') || norm.includes('PLEURAL')) {
    return {
      TEMPLATE_NAME: templateName,
      headingName: templateName,
      Exam: {
        'Physical Examination': [
          { Name: 'Quantity', Value: '' },
          { Name: 'Colour', Value: '' },
          { Name: 'Appearance / Clarity', Value: '' },
          { Name: 'Coagulum / Clot', Value: '' },
          { Name: 'Specific Gravity', Value: '' },
        ],
        'Chemical Examination': [
          { Name: 'Protein', Value: '' },
          { Name: 'Glucose', Value: '' },
          { Name: 'Chloride', Value: '' },
          { Name: 'L.D.H.', Value: '' },
          { Name: 'Adenosine Deaminase (ADA)', Value: '' },
        ],
        'Microscopic / Cytological Examination': [
          { Name: 'Total WBC Count', Value: '' },
          { Name: 'Polymorphs (Neutrophils)', Value: '' },
          { Name: 'Lymphocytes', Value: '' },
          { Name: 'RBCs', Value: '' },
          { Name: 'Malignant / Atypical Cells', Value: '' },
        ],
        'Microbiological Examination': [
          { Name: 'Gram Stain', Value: '' },
          { Name: 'ZN Stain for AFB', Value: '' },
          { Name: 'India Ink Preparation', Value: '' },
        ],
        Others: [
          { Name: 'Special Comments', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('HISTOPATHOLOGY') || norm.includes('FNAC') || norm.includes('BIOPSY')) {
    return {
      TEMPLATE_NAME: templateName,
      headingName: templateName,
      Exam: {
        'Gross Examination': [
          { Name: 'Specimen Received', Value: '' },
          { Name: 'Dimensions / Weight', Value: '' },
          { Name: 'External Surface & Cut Surface', Value: '' },
          { Name: 'Number of Blocks Processed', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'Section Findings', Value: '' },
          { Name: 'Cellular Architecture', Value: '' },
          { Name: 'Nuclear Atypia / Mitotic Figures', Value: '' },
          { Name: 'Stromal / Vascular Infiltration', Value: '' },
          { Name: 'Surgical Resection Margins', Value: '' },
        ],
        'Diagnostic Impression': [
          { Name: 'Final Histopathological Diagnosis', Value: '' },
          { Name: 'Pathological Staging / Grade', Value: '' },
          { Name: 'Comments / Recommendations', Value: '' },
        ],
        Others: [
          { Name: 'Special Note', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('HBA1C') || norm.includes('GLYCATED') || norm.includes('A1C')) {
    return {
      TEMPLATE_NAME: 'HbA1C Report',
      headingName: 'HbA1C Report',
      templateType: 'HBA1C',
      Exam: {
        'HbA1C Result': [
          { Name: 'Glycated Haemoglobin (HbA1c)', Value: '', Unit: '% ofTotal Hb', RefRange: '<6%' },
          { Name: 'Estimated Average Glucose', Value: '', Unit: 'mg/dL', RefRange: '' },
        ],
        'Peak Data Table': [
          { Name: 'HbA1a', Value: '' },
          { Name: 'HbA1b', Value: '' },
          { Name: 'HbF', Value: '' },
          { Name: 'LA1c', Value: '' },
          { Name: 'HbA1c', Value: '' },
          { Name: 'HbA0', Value: '' },
          { Name: 'V_Win', Value: '' },
        ],
        'Summary Result': [
          { Name: 'TotalArea', Value: '' },
          { Name: 'HbA1C(NGSP)', Value: '' },
          { Name: 'eAG(ADA)', Value: '' },
          { Name: 'HbA1C(IFCC)', Value: '' },
          { Name: 'eAG[ADA]', Value: '' },
        ],
        Others: [
          { Name: 'Others 1', Value: '' },
          { Name: 'Others 2', Value: '' },
          { Name: 'Others 3', Value: '' },
        ],
        'Drawing Data': [
          { Name: 'Peak Data', Value: '' },
          { Name: 'Graph Data', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  return {
    TEMPLATE_NAME: templateName,
    headingName: templateName,
    Exam: {
      'General Observations': [
        { Name: 'Parameter 1', Value: '' },
        { Name: 'Parameter 2', Value: '' },
      ],
      'Impression / Remarks': [
        { Name: 'Clinical Remarks', Value: '' },
      ],
    },
    Impression: '',
  };
};

