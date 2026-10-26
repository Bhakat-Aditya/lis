/**
 * Laboratory Test & Specimen Utilities
 * Provides standardized medical vacutainer tube identification,
 * diagnostic phase progression mapping, and real-time result evaluation.
 */

/**
 * Universal Medical Vacutainer / Specimen Tube Color Mapping
 * Standard international laboratory vacutainer cap colors
 */
export function getSpecimenTubeInfo(sampleType = '', testName = '') {
  const type = String(sampleType || '').toLowerCase().trim();
  const name = String(testName || '').toLowerCase().trim();

  // 1. Lavender / Purple Cap: EDTA Whole Blood (Hematology)
  if (
    type.includes('edta') ||
    type.includes('whole blood') ||
    type.includes('blood') ||
    name.includes('hemoglobin') ||
    name.includes('cbc') ||
    name.includes('neutrophil') ||
    name.includes('lymphocyte') ||
    name.includes('monocyte') ||
    name.includes('eosinophil') ||
    name.includes('basophil') ||
    name.includes('platelet') ||
    name.includes('rbc') ||
    name.includes('wbc') ||
    name.includes('esr') ||
    name.includes('hba1c') ||
    name.includes('blood group')
  ) {
    return {
      tubeName: 'EDTA Whole Blood',
      capColor: 'Lavender / Purple',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
      dotClass: 'bg-purple-600',
      borderClass: 'border-l-purple-500',
      pillBg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: '🟣',
      department: 'Hematology & Clinical Pathology',
    };
  }

  // 2. Light Blue Cap: 3.2% Sodium Citrate Plasma (Coagulation)
  if (
    type.includes('citrate') ||
    type.includes('coag') ||
    name.includes('pt') ||
    name.includes('inr') ||
    name.includes('aptt') ||
    name.includes('prothrombin') ||
    name.includes('d-dimer') ||
    name.includes('fibrinogen')
  ) {
    return {
      tubeName: 'Sodium Citrate Plasma',
      capColor: 'Light Blue',
      badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
      dotClass: 'bg-sky-500',
      borderClass: 'border-l-sky-500',
      pillBg: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: '🔵',
      department: 'Coagulation & Hemostasis',
    };
  }

  // 3. Grey Cap: Sodium Fluoride / Potassium Oxalate (Glucose / Glycolysis Inhibitor)
  if (
    type.includes('fluoride') ||
    name.includes('fasting blood sugar') ||
    name.includes('fbs') ||
    name.includes('ppbs') ||
    name.includes('post prandial') ||
    name.includes('glucose tolerance') ||
    name.includes('gtt') ||
    name.includes('rbs')
  ) {
    return {
      tubeName: 'Fluoride Plasma',
      capColor: 'Grey',
      badgeClass: 'bg-slate-200 text-slate-900 border-slate-300',
      dotClass: 'bg-slate-500',
      borderClass: 'border-l-slate-500',
      pillBg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: '⚪',
      department: 'Clinical Biochemistry (Glucose)',
    };
  }

  // 4. Amber / Yellow Container: Sterile Urine
  if (
    type.includes('urine') ||
    name.includes('urine') ||
    name.includes('albumin') ||
    name.includes('pus cells') ||
    name.includes('epithelial') ||
    name.includes('casts') ||
    name.includes('crystals') ||
    name.includes('pregnancy') ||
    name.includes('bence jones')
  ) {
    return {
      tubeName: 'Urine Specimen',
      capColor: 'Amber / Yellow Cup',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      dotClass: 'bg-amber-500',
      borderClass: 'border-l-amber-500',
      pillBg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: '🟠',
      department: 'Clinical Pathology & Urinalysis',
    };
  }

  // 5. Green Cap: Sodium / Lithium Heparin Plasma (Special Biochem / Blood Gas)
  if (
    type.includes('heparin') ||
    name.includes('troponin') ||
    name.includes('abg') ||
    name.includes('arterial blood') ||
    name.includes('ammonia')
  ) {
    return {
      tubeName: 'Heparin Plasma',
      capColor: 'Green',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      dotClass: 'bg-emerald-600',
      borderClass: 'border-l-emerald-500',
      pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: '🟢',
      department: 'Special Biochemistry & Critical Care',
    };
  }

  // 6. Gold / Red Cap: SST Gel Separator / Plain Clot Activator Serum (Biochemistry & Serology default)
  return {
    tubeName: 'SST Serum (Gel)',
    capColor: 'Gold / Red',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    dotClass: 'bg-yellow-500',
    borderClass: 'border-l-yellow-500',
    pillBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    icon: '🟡',
    department: 'Biochemistry, Immunology & Serology',
  };
}

/**
 * Diagnostic Lifecycle Phase Detection
 * Maps every laboratory test parameter to 1 of 5 standard workflow phases
 */
export function getTestPhaseInfo(report = {}, patient = {}) {
  const rStatus = String(report.status || '').toUpperCase().trim();
  const pStatus = String(patient.status || '').toUpperCase().trim();
  const hasValue = Boolean(report.resultData && String(report.resultData).trim() !== '' && report.resultData !== '-');

  // Phase 0: Soft Deleted Test Parameter
  if (rStatus === 'DELETED') {
    return {
      phase: 0,
      phaseId: 'DELETED',
      name: 'Deleted Parameter',
      shortLabel: 'Deleted',
      colorName: 'rose',
      theme: {
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
        dot: 'bg-rose-600',
        ring: 'ring-rose-400',
        border: 'border-rose-300',
        cardGlow: 'bg-rose-50/40 line-through opacity-75',
        stepperBg: 'bg-rose-600 text-white',
      },
      icon: 'Trash2',
      desc: 'Test parameter deleted from this panel — click Restore to recover',
    };
  }

  // Phase 5: Verified & Pathologist Approved / Released / Printing
  if (
    rStatus === 'APPROVED' ||
    rStatus === 'RELEASED' ||
    rStatus === 'PRINTING' ||
    pStatus === 'PRINTING' ||
    pStatus === 'APPROVED' ||
    pStatus === 'RELEASED'
  ) {
    return {
      phase: 5,
      phaseId: 'APPROVED',
      name: 'Approved & Signed',
      shortLabel: 'Approved',
      colorName: 'emerald',
      theme: {
        badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        dot: 'bg-emerald-600',
        ring: 'ring-emerald-400',
        border: 'border-emerald-300',
        cardGlow: 'bg-emerald-50/40',
        stepperBg: 'bg-emerald-600 text-white',
      },
      icon: 'Award',
      desc: 'Clinically verified & officially signed off by consultant pathologist',
    };
  }

  // Phase 4.1: Doctor / Pathologist Verified
  if (rStatus === 'VERIFIED') {
    return {
      phase: 4,
      phaseId: 'VERIFIED',
      name: 'Doctor Verified',
      shortLabel: 'Verified',
      colorName: 'teal',
      theme: {
        badgeBg: 'bg-teal-100 text-teal-950 border-teal-300',
        dot: 'bg-teal-600',
        ring: 'ring-teal-400',
        border: 'border-teal-300',
        cardGlow: 'bg-teal-50/40',
        stepperBg: 'bg-teal-600 text-white',
      },
      icon: 'ShieldCheck',
      desc: 'Technical & medical review complete — verified by doctor',
    };
  }

  // Phase 4.2: Submitted for Verification
  if (rStatus === 'SUBMITTED') {
    return {
      phase: 4,
      phaseId: 'SUBMITTED',
      name: 'Report Submitted',
      shortLabel: 'Submitted',
      colorName: 'blue',
      theme: {
        badgeBg: 'bg-blue-100 text-blue-950 border-blue-300',
        dot: 'bg-blue-600',
        ring: 'ring-blue-400',
        border: 'border-blue-300',
        cardGlow: 'bg-blue-50/40',
        stepperBg: 'bg-blue-600 text-white',
      },
      icon: 'CheckCircle2',
      desc: 'Results entered and submitted to pathologist for verification',
    };
  }

  // Phase 4.3: Auto-Calculated Formula Result
  if (rStatus === 'CALCULATED') {
    return {
      phase: 4,
      phaseId: 'CALCULATED',
      name: 'Calculated Result',
      shortLabel: 'Calculated',
      colorName: 'indigo',
      theme: {
        badgeBg: 'bg-indigo-100 text-indigo-950 border-indigo-300',
        dot: 'bg-indigo-600',
        ring: 'ring-indigo-400',
        border: 'border-indigo-300',
        cardGlow: 'bg-indigo-50/40',
        stepperBg: 'bg-indigo-600 text-white',
      },
      icon: 'Calculator',
      desc: 'Computed via laboratory automated formula algorithm',
    };
  }

  // Phase 4.4: Calculated Result Edited by Technician
  if (rStatus === 'CALCULATED_EDITED') {
    return {
      phase: 4,
      phaseId: 'CALCULATED_EDITED',
      name: 'Calculated (Edited)',
      shortLabel: 'Calc Edited',
      colorName: 'indigo',
      theme: {
        badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
        dot: 'bg-indigo-500',
        ring: 'ring-indigo-400',
        border: 'border-indigo-300',
        cardGlow: 'bg-indigo-50/30',
        stepperBg: 'bg-indigo-600 text-white',
      },
      icon: 'Calculator',
      desc: 'Automated formula calculation adjusted by bench technician',
    };
  }

  // Phase 4.5: Analyzer Machine Direct Feed Received
  if (rStatus === 'RECEIVED') {
    return {
      phase: 4,
      phaseId: 'RECEIVED',
      name: 'Received from Analyzer',
      shortLabel: 'Analyzer',
      colorName: 'cyan',
      theme: {
        badgeBg: 'bg-cyan-100 text-cyan-950 border-cyan-300',
        dot: 'bg-cyan-600',
        ring: 'ring-cyan-400',
        border: 'border-cyan-300',
        cardGlow: 'bg-cyan-50/40',
        stepperBg: 'bg-cyan-600 text-white',
      },
      icon: 'Cpu',
      desc: 'Observed reading transmitted directly by automated analyzer machine',
    };
  }

  // Phase 4.6: Analyzer Machine Result Edited by Technician
  if (rStatus === 'RECEIVED_EDITED') {
    return {
      phase: 4,
      phaseId: 'RECEIVED_EDITED',
      name: 'Analyzer (Edited)',
      shortLabel: 'Recd Edited',
      colorName: 'cyan',
      theme: {
        badgeBg: 'bg-cyan-50 text-cyan-900 border-cyan-200',
        dot: 'bg-cyan-500',
        ring: 'ring-cyan-400',
        border: 'border-cyan-300',
        cardGlow: 'bg-cyan-50/30',
        stepperBg: 'bg-cyan-600 text-white',
      },
      icon: 'Cpu',
      desc: 'Machine analyzer result reviewed & edited by technician',
    };
  }

  // Phase 4.7: Manually Saved / Recorded Reading
  if (rStatus === 'SAVED' || rStatus === 'RECORDED' || hasValue) {
    return {
      phase: 4,
      phaseId: 'SAVED',
      name: 'Result Recorded',
      shortLabel: 'Recorded',
      colorName: 'emerald',
      theme: {
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-400',
        border: 'border-emerald-300',
        cardGlow: 'bg-emerald-50/30',
        stepperBg: 'bg-emerald-600 text-white',
      },
      icon: 'CheckCircle2',
      desc: 'Observed value recorded in laboratory database',
    };
  }

  // Phase 3: In Testing / Bench Entry (Active Processing)
  if (rStatus === 'ENTRY' || rStatus === 'TESTING' || rStatus === 'IN TESTING' || pStatus === 'ENTRY') {
    return {
      phase: 3,
      phaseId: 'TESTING',
      name: 'In Testing / Entry',
      shortLabel: 'In Testing',
      colorName: 'violet',
      theme: {
        badgeBg: 'bg-violet-100 text-violet-900 border-violet-300 animate-pulse',
        dot: 'bg-violet-600',
        ring: 'ring-violet-400',
        border: 'border-violet-300',
        cardGlow: 'bg-violet-50/40',
        stepperBg: 'bg-violet-600 text-white',
      },
      icon: 'FlaskConical',
      desc: 'Active testing on analyzer bench — awaiting reading entry or machine sync',
    };
  }

  // Phase 2: Sample Received in Lab (Accessioned)
  if (rStatus === 'SAMPLE RECEIVED' || pStatus === 'RECEIVE') {
    return {
      phase: 2,
      phaseId: 'IN_LAB',
      name: 'Sample in Lab',
      shortLabel: 'In Lab',
      colorName: 'sky',
      theme: {
        badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
        dot: 'bg-sky-500',
        ring: 'ring-sky-400',
        border: 'border-sky-300',
        cardGlow: 'bg-sky-50/40',
        stepperBg: 'bg-sky-600 text-white',
      },
      icon: 'Beaker',
      desc: 'Specimen checked into laboratory accession desk',
    };
  }

  // Phase 1: Sample Collection / Pending Reception
  return {
    phase: 1,
    phaseId: 'SAMPLE',
    name: 'Sample Pending',
    shortLabel: 'Sample',
    colorName: 'amber',
    theme: {
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      dot: 'bg-amber-500',
      ring: 'ring-amber-400',
      border: 'border-amber-300',
      cardGlow: 'bg-amber-50/40',
      stepperBg: 'bg-amber-500 text-white',
    },
    icon: 'Clock',
    desc: 'Sample tube awaiting collection or accession barcode scan',
  };
}

/**
 * Real-time Clinical Reference Range Evaluator
 * Evaluates patient value against standard reference ranges or qualitative cutoffs.
 */
export function evaluateResultValue(value, refRange = '', unit = '') {
  if (value === undefined || value === null || String(value).trim() === '' || String(value).trim() === '-') {
    return {
      status: 'EMPTY',
      label: 'Awaiting Entry',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      inputBorder: 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20 bg-slate-50/60',
      rowHighlight: '',
      isAbnormal: false,
      isCritical: false,
      deviation: null,
    };
  }

  const rawVal = String(value).trim();
  const lowerVal = rawVal.toLowerCase();
  const lowerRef = String(refRange || '').toLowerCase();

  // Qualitative checks (Negative / Positive, Reactive / Non-Reactive)
  if (
    lowerVal.includes('positive') ||
    lowerVal.includes('reactive') ||
    lowerVal.includes('detected') ||
    lowerVal.includes('present')
  ) {
    return {
      status: 'REACTIVE',
      label: 'POSITIVE / REACTIVE (▲)',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
      inputBorder: 'border-rose-500 ring-2 ring-rose-400/40 bg-rose-50/60 text-rose-950 font-bold',
      rowHighlight: 'bg-rose-50/40 border-l-4 border-l-rose-500',
      isAbnormal: true,
      isCritical: true,
      deviation: 'Positive Finding',
    };
  }

  if (
    lowerVal.includes('negative') ||
    lowerVal.includes('non-reactive') ||
    lowerVal.includes('not detected') ||
    lowerVal.includes('nil') ||
    lowerVal.includes('absent')
  ) {
    return {
      status: 'NORMAL',
      label: 'NEGATIVE / NORMAL (✓)',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
      inputBorder: 'border-emerald-400 bg-emerald-50/50 text-emerald-950 font-bold',
      rowHighlight: '',
      isAbnormal: false,
      isCritical: false,
      deviation: 'Non-Reactive',
    };
  }

  // Quantitative Cut-off format e.g. "Cut-off-0.50" or "< 0.50"
  if (lowerRef.includes('cut-off') || lowerRef.includes('<') || lowerRef.includes('>')) {
    const numCut = parseFloat(lowerRef.replace(/[^0-9.]/g, '').trim());
    const numVal = parseFloat(rawVal.replace(/[^0-9.]/g, '').trim());

    if (!isNaN(numCut) && !isNaN(numVal)) {
      if (numVal > numCut) {
        return {
          status: 'HIGH',
          label: 'ABOVE CUT-OFF (▲)',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          inputBorder: 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/60 text-amber-950 font-bold',
          rowHighlight: 'bg-amber-50/40 border-l-4 border-l-amber-500',
          isAbnormal: true,
          isCritical: numVal > numCut * 1.5,
          deviation: `>${numCut} Index`,
        };
      } else {
        return {
          status: 'NORMAL',
          label: 'WITHIN LIMITS (✓)',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          inputBorder: 'border-emerald-400 bg-emerald-50/50 text-emerald-950 font-bold',
          rowHighlight: '',
          isAbnormal: false,
          isCritical: false,
          deviation: 'Normal Index',
        };
      }
    }
  }

  // Standard numeric range format "min - max" e.g. "12-18", "40 - 70"
  if (refRange && refRange.includes('-')) {
    const parts = refRange.split('-').map((s) => parseFloat(s.replace(/[^0-9.]/g, '').trim()));
    const numVal = parseFloat(rawVal.replace(/[^0-9.]/g, '').trim());

    if (!isNaN(numVal) && parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [minRef, maxRef] = parts;

      // Check Critical / Panic Limits (>50% above max or <40% below min)
      if (numVal > maxRef * 1.5) {
        const pctAbove = Math.round(((numVal - maxRef) / maxRef) * 100);
        return {
          status: 'PANIC_HIGH',
          label: `CRITICAL HIGH (+${pctAbove}%) ⚠️`,
          badgeClass: 'bg-rose-600 text-white border-rose-700 font-extrabold animate-pulse shadow-xs',
          inputBorder: 'border-rose-600 ring-2 ring-rose-500/50 bg-rose-50 text-rose-950 font-extrabold',
          rowHighlight: 'bg-rose-50/60 border-l-4 border-l-rose-600',
          isAbnormal: true,
          isCritical: true,
          deviation: `+${pctAbove}%`,
        };
      }

      if (numVal < minRef * 0.6) {
        const pctBelow = Math.round(((minRef - numVal) / minRef) * 100);
        return {
          status: 'PANIC_LOW',
          label: `CRITICAL LOW (-${pctBelow}%) ⚠️`,
          badgeClass: 'bg-rose-600 text-white border-rose-700 font-extrabold animate-pulse shadow-xs',
          inputBorder: 'border-rose-600 ring-2 ring-rose-500/50 bg-rose-50 text-rose-950 font-extrabold',
          rowHighlight: 'bg-rose-50/60 border-l-4 border-l-rose-600',
          isAbnormal: true,
          isCritical: true,
          deviation: `-${pctBelow}%`,
        };
      }

      // Standard High
      if (numVal > maxRef) {
        const pctAbove = Math.round(((numVal - maxRef) / maxRef) * 100);
        return {
          status: 'HIGH',
          label: `HIGH (+${pctAbove}%) ▲`,
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          inputBorder: 'border-amber-400 focus:border-amber-500 ring-1 ring-amber-400/30 bg-amber-50/60 text-amber-950 font-bold',
          rowHighlight: 'bg-amber-50/30 border-l-4 border-l-amber-400',
          isAbnormal: true,
          isCritical: false,
          deviation: `+${pctAbove}%`,
        };
      }

      // Standard Low
      if (numVal < minRef) {
        const pctBelow = Math.round(((minRef - numVal) / minRef) * 100);
        return {
          status: 'LOW',
          label: `LOW (-${pctBelow}%) ▼`,
          badgeClass: 'bg-sky-100 text-sky-900 border-sky-300 font-bold',
          inputBorder: 'border-sky-400 focus:border-sky-500 ring-1 ring-sky-400/30 bg-sky-50/60 text-sky-950 font-bold',
          rowHighlight: 'bg-sky-50/30 border-l-4 border-l-sky-400',
          isAbnormal: true,
          isCritical: false,
          deviation: `-${pctBelow}%`,
        };
      }

      // Normal within therapeutic reference range
      return {
        status: 'NORMAL',
        label: 'NORMAL (✓)',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
        inputBorder: 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold',
        rowHighlight: '',
        isAbnormal: false,
        isCritical: false,
        deviation: 'In Range',
      };
    }
  }

  // Default fallback if refRange is text or unparsed
  return {
    status: 'RECORDED',
    label: 'Recorded Value',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    inputBorder: 'border-slate-300 focus:border-indigo-500 bg-white text-slate-900',
    rowHighlight: '',
    isAbnormal: false,
    isCritical: false,
    deviation: null,
  };
}

/**
 * Calculates healthy midpoint or standard qualitative default for a test
 */
export function getDefaultHealthyValue(refRange = '', testName = '') {
  const name = String(testName || '').toLowerCase();
  const lowerRef = String(refRange || '').toLowerCase();

  // Qualitative tests default to Negative / Non-Reactive
  if (
    lowerRef.includes('cut-off') ||
    lowerRef.includes('reactive') ||
    name.includes('typhus') ||
    name.includes('widal') ||
    name.includes('dengue') ||
    name.includes('hiv') ||
    name.includes('hbsag') ||
    name.includes('vdrl') ||
    name.includes('malaria')
  ) {
    if (lowerRef.includes('cut-off')) {
      const cut = parseFloat(lowerRef.replace(/[^0-9.]/g, '').trim());
      if (!isNaN(cut)) {
        return (cut * 0.4).toFixed(2);
      }
    }
    return 'Negative';
  }

  // Standard numeric range: calculate healthy midpoint
  if (refRange && refRange.includes('-')) {
    const parts = refRange.split('-').map((s) => parseFloat(s.replace(/[^0-9.]/g, '').trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [min, max] = parts;
      const mid = min + (max - min) * 0.5;

      // Format decimal points according to reference values
      if (Number.isInteger(min) && Number.isInteger(max)) {
        return Math.round(mid).toString();
      }
      return mid.toFixed(1);
    }
  }

  return '';
}

/**
 * Groups patient reports and bill items into clean Package, Profile, and Test lots.
 * Prevents repeating individual sub-tests when ordered in a Package or Profile.
 */
export function groupInvestigationsIntoLots(
  reports = [],
  patient = {},
  catalogProfiles = [],
  catalogPackages = [],
  catalogTests = []
) {
  const profileMapById = new Map();
  const profileMapByName = new Map();
  (catalogProfiles || []).forEach((p) => {
    const id = String(p['Profile Id'] || p.id || '').trim();
    const name = String(p.Name || p.name || '').trim();
    if (id) profileMapById.set(id.toLowerCase(), p);
    if (name) profileMapByName.set(name.toLowerCase(), p);
  });

  const packageMapById = new Map();
  const packageMapByName = new Map();
  (catalogPackages || []).forEach((k) => {
    const id = String(k['Package Id'] || k.id || '').trim();
    const name = String(k.Name || k.name || '').trim();
    if (id) packageMapById.set(id.toLowerCase(), k);
    if (name) packageMapByName.set(name.toLowerCase(), k);
  });

  const testMapByName = new Map();
  (catalogTests || []).forEach((t) => {
    const id = String(t['Test Id'] || t.id || '').trim();
    const name = String(t.Name || t.name || '').trim();
    const shortName = String(t['Short Name'] || '').trim();
    if (name && id) testMapByName.set(name.toLowerCase(), id);
    if (shortName && id) testMapByName.set(shortName.toLowerCase(), id);
  });

  // 1. If patient has official testList from billing, use that as the primary source of truth
  const lots = [];
  const processedReports = new Set();
  const processedLotKeys = new Set();
  const processedLotNames = new Set();

  const billTestList = patient?.testList || patient?.billing?.testList;
  if (Array.isArray(billTestList) && billTestList.length > 0) {
    billTestList.forEach((item, idx) => {
      const name = item['Bill Particulars'] || item.name || `Item ${idx + 1}`;
      const amount = Number(item.Amount || item.amount || 0);
      const lower = name.toLowerCase().trim();

      // Check if it's a Package
      const matchedPkg =
        packageMapByName.get(lower) ||
        (catalogPackages || []).find((k) => lower === String(k.Name || '').toLowerCase().trim());

      if (matchedPkg) {
        const pkgId = String(matchedPkg['Package Id'] || matchedPkg.id || '').trim();
        const pkgReports = (reports || []).filter(
          (r) =>
            String(r.packageName || '').toLowerCase() === pkgId.toLowerCase() ||
            String(r.profileName || '').toLowerCase() === pkgId.toLowerCase()
        );
        pkgReports.forEach((r) => processedReports.add(r.reportId));

        const subTests = pkgReports.map((r) => r.testName).filter(Boolean);

        processedLotKeys.add(`PKG|${pkgId.toUpperCase()}`);
        processedLotNames.add(String(matchedPkg.Name || name).toLowerCase().trim());

        const repWithRate = pkgReports.find((r) => r.rate !== undefined && r.rate !== '' && !isNaN(Number(r.rate)) && Number(r.rate) > 0);
        const effectivePkgAmount = repWithRate ? Number(repWithRate.rate) : (amount || Number(matchedPkg.Rate) || 0);

        lots.push({
          id: `EXISTING_PKG_${pkgId || idx + 1}`,
          testId: pkgId,
          type: 'PKG',
          name: matchedPkg.Name || name,
          amount: effectivePkgAmount,
          category: 'Package',
          isNew: false,
          subTestCount: subTests.length,
          subTests,
        });
        return;
      }

      // Check if it's a Profile
      const matchedProf =
        profileMapByName.get(lower) ||
        (catalogProfiles || []).find((p) => lower === String(p.Name || '').toLowerCase().trim());

      if (matchedProf) {
        const profId = String(matchedProf['Profile Id'] || matchedProf.id || '').trim();
        const profReports = (reports || []).filter(
          (r) =>
            String(r.profileName || '').toLowerCase() === profId.toLowerCase() && !r.packageName
        );
        profReports.forEach((r) => processedReports.add(r.reportId));

        const subTests = profReports.map((r) => r.testName).filter(Boolean);

        processedLotKeys.add(`PROF|${profId.toUpperCase()}`);
        processedLotNames.add(String(matchedProf.Name || name).toLowerCase().trim());

        const profRepWithRate = profReports.find((r) => r.rate !== undefined && r.rate !== '' && !isNaN(Number(r.rate)) && Number(r.rate) > 0);
        const effectiveProfAmount = profRepWithRate ? Number(profRepWithRate.rate) : (amount || Number(matchedProf.Rate) || 0);

        lots.push({
          id: `EXISTING_PROF_${profId || idx + 1}`,
          testId: profId,
          type: 'PROF',
          name: matchedProf.Name || name,
          amount: effectiveProfAmount,
          category: 'Profile',
          isNew: false,
          subTestCount: subTests.length,
          subTests,
        });
        return;
      }

      // Standalone Individual Test: resolve actual testId from catalog or reports
      const matchedReport = (reports || []).find((r) => {
        const rName = String(r.testName || '').toLowerCase().trim();
        return rName === lower || (rName && (lower.includes(rName) || rName.includes(lower)));
      });
      if (matchedReport) processedReports.add(matchedReport.reportId);

      const matchedTestId =
        testMapByName.get(lower) ||
        matchedReport?.testId ||
        `T_${idx + 1}`;

      processedLotKeys.add(`TEST|${String(matchedTestId).toUpperCase()}`);
      processedLotNames.add(lower);

      const matchedReportRate =
        matchedReport &&
        matchedReport.rate !== undefined &&
        matchedReport.rate !== '' &&
        !isNaN(Number(matchedReport.rate))
          ? Number(matchedReport.rate)
          : null;
      const finalTestAmount = matchedReportRate !== null ? matchedReportRate : amount;

      lots.push({
        id: `EXISTING_TEST_${matchedTestId || idx + 1}`,
        testId: matchedTestId,
        type: 'TEST',
        name: name,
        amount: finalTestAmount,
        category: 'Test',
        isNew: false,
        subTestCount: 0,
        subTests: [],
      });
    });
  }

  // 2. Append any reports that were not covered by billTestList (e.g. tests added later)
  // Step A: Group by Package
  const packageGroups = new Map();
  (reports || []).forEach((r) => {
    if (!processedReports.has(r.reportId) && r.packageName) {
      const kId = String(r.packageName).trim();
      if (!packageGroups.has(kId)) packageGroups.set(kId, []);
      packageGroups.get(kId).push(r);
      processedReports.add(r.reportId);
    }
  });

  packageGroups.forEach((reps, kId) => {
    const pkg = packageMapById.get(kId.toLowerCase());
    const pkgName = pkg?.Name || `Package ${kId}`;
    if (!processedLotKeys.has(`PKG|${kId.toUpperCase()}`) && !processedLotNames.has(pkgName.toLowerCase().trim())) {
      processedLotKeys.add(`PKG|${kId.toUpperCase()}`);
      processedLotNames.add(pkgName.toLowerCase().trim());
      lots.push({
        id: `EXISTING_PKG_${kId}`,
        testId: kId,
        type: 'PKG',
        name: pkgName,
        amount: Number(pkg?.Rate) || 0,
        category: 'Package',
        isNew: false,
        subTestCount: reps.length,
        subTests: reps.map((r) => r.testName).filter(Boolean),
      });
    }
  });

  // Step B: Group by Profile (for reports not already in a package)
  const profileGroups = new Map();
  (reports || []).forEach((r) => {
    if (!processedReports.has(r.reportId) && r.profileName) {
      const pId = String(r.profileName).trim();
      if (!profileGroups.has(pId)) profileGroups.set(pId, []);
      profileGroups.get(pId).push(r);
      processedReports.add(r.reportId);
    }
  });

  profileGroups.forEach((reps, pId) => {
    const prof = profileMapById.get(pId.toLowerCase());
    const profName = prof?.Name || `Profile ${pId}`;
    if (!processedLotKeys.has(`PROF|${pId.toUpperCase()}`) && !processedLotNames.has(profName.toLowerCase().trim())) {
      processedLotKeys.add(`PROF|${pId.toUpperCase()}`);
      processedLotNames.add(profName.toLowerCase().trim());
      lots.push({
        id: `EXISTING_PROF_${pId}`,
        testId: pId,
        type: 'PROF',
        name: profName,
        amount: Number(prof?.Rate) || 0,
        category: 'Profile',
        isNew: false,
        subTestCount: reps.length,
        subTests: reps.map((r) => r.testName).filter(Boolean),
      });
    }
  });

  // Step C: Standalone Individual Tests
  (reports || []).forEach((r, idx) => {
    if (!processedReports.has(r.reportId)) {
      const tName = r.testName || `Test ${r.testId || idx + 1}`;
      const tid = r.testId || `T_${idx + 1}`;
      const lowerName = tName.toLowerCase().trim();
      if (!processedLotKeys.has(`TEST|${String(tid).toUpperCase()}`) && !processedLotNames.has(lowerName)) {
        processedLotKeys.add(`TEST|${String(tid).toUpperCase()}`);
        processedLotNames.add(lowerName);
        lots.push({
          id: `EXISTING_TEST_${r.reportId || idx + 1}`,
          testId: tid,
          type: 'TEST',
          name: tName,
          amount: Number(r.rate) || 0,
          category: 'Test',
          isNew: false,
          subTestCount: 0,
          subTests: [],
        });
      }
    }
  });

  return lots;
}

