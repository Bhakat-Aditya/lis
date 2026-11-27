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
  const pStatus = String(patient?.status || '').toUpperCase().trim();
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

  // Phase 1: Test explicitly in Sample Collection / Pending stage
  if (rStatus === 'SAMPLE') {
    // If technician has entered a value right now on screen, it advances to Recorded
    if (hasValue) {
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

  // Phase 2: In Testing / Bench Entry (Active Processing)
  if (rStatus === 'ENTRY' || rStatus === 'TESTING' || rStatus === 'IN TESTING') {
    if (hasValue) {
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

  // Phase 3: Sample Received in Lab (Accessioned)
  if (rStatus === 'SAMPLE RECEIVED') {
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

  // Phase 4: Machine Analyzer Direct Feed
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

  // Phase 5: Auto-Calculated Formula Result
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

  // Phase 6: Submitted for Verification
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

  // Phase 7: Doctor / Pathologist Verified
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

  // Phase 8: Officially Approved / Signed / Released / Printing
  if (rStatus === 'APPROVED' || rStatus === 'RELEASED' || rStatus === 'PRINTING') {
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

  // Phase 9: Manually Saved / Recorded Reading
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

  // Fallbacks if individual test report.status is not explicitly set:
  if (pStatus === 'PRINTING' || pStatus === 'APPROVED' || pStatus === 'RELEASED') {
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

  if (pStatus === 'ENTRY') {
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

  if (pStatus === 'RECEIVE') {
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
  catalogTests = [],
  catalogTemplates = [],
  templates = []
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

  const templateMapById = new Map();
  const templateMapByName = new Map();
  (catalogTemplates || []).forEach((t) => {
    const id = String(t.templatesId || t.id || t.reportId || '').trim();
    const name = String(t.TEMPLATE_NAME || t.name || '').trim();
    if (id) {
      templateMapById.set(id.toLowerCase(), t);
      templateMapById.set(id.replace(/^T+/i, '').toLowerCase(), t);
      templateMapById.set(`t${id.replace(/^T+/i, '').toLowerCase()}`, t);
    }
    if (name) {
      templateMapByName.set(name.toLowerCase(), t);
    }
  });

  // 1. If patient has official testList from billing, use that as the primary source of truth
  const lots = [];
  const processedReports = new Set();
  const processedLotKeys = new Set();
  const processedLotNames = new Set();

  const billTestList = patient?.testList || patient?.billing?.testList;
  if (Array.isArray(billTestList) && billTestList.length > 0) {
    const validBillList = billTestList.filter(
      (item) => item && String(item['Bill Particulars'] || item.name || '').trim() !== ''
    );
    validBillList.forEach((item, idx) => {
      const rawName = item['Bill Particulars'] || item.name || `Item ${idx + 1}`;
      const name = String(rawName).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      const rawAmt = item.Amount !== undefined ? item.Amount : item.amount;
      const isExplicitBillAmount = rawAmt !== undefined && rawAmt !== null;
      const billAmount = isExplicitBillAmount
        ? (String(rawAmt).trim() === '' ? 0 : (!isNaN(Number(rawAmt)) ? Number(rawAmt) : 0))
        : null;
      const lower = name.toLowerCase().trim();
      const rawLower = String(rawName).toLowerCase().trim();

      // Check if it's a Package
      const matchedPkg =
        packageMapByName.get(lower) ||
        packageMapByName.get(rawLower) ||
        (catalogPackages || []).find((k) => {
          const kn = String(k.Name || '').toLowerCase().trim();
          return kn === lower || kn === rawLower;
        });

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
        const pkgCatalogRate = Number(matchedPkg.Rate) || Number(matchedPkg.Rate1) || Number(matchedPkg.Rate2) || 0;
        let effectivePkgAmount = isExplicitBillAmount && billAmount > 0
          ? billAmount
          : (pkgCatalogRate || (repWithRate ? Number(repWithRate.rate) : (isExplicitBillAmount ? billAmount : 0)));
        if ((!effectivePkgAmount || effectivePkgAmount <= 0) && pkgReports.length > 0) {
          const sumSubRates = pkgReports.reduce((acc, r) => acc + (parseFloat(r.rate) || 0), 0);
          if (sumSubRates > 0) effectivePkgAmount = sumSubRates;
        }

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
        profileMapByName.get(rawLower) ||
        (catalogProfiles || []).find((p) => {
          const pn = String(p.Name || '').toLowerCase().trim();
          return pn === lower || pn === rawLower;
        });

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
        const profCatalogRate = Number(matchedProf.Rate) || Number(matchedProf.Rate1) || Number(matchedProf.Rate2) || 0;
        let effectiveProfAmount = isExplicitBillAmount && billAmount > 0
          ? billAmount
          : (profCatalogRate || (profRepWithRate ? Number(profRepWithRate.rate) : (isExplicitBillAmount ? billAmount : 0)));
        if ((!effectiveProfAmount || effectiveProfAmount <= 0) && profReports.length > 0) {
          const sumSubRates = profReports.reduce((acc, r) => acc + (parseFloat(r.rate) || 0), 0);
          if (sumSubRates > 0) effectiveProfAmount = sumSubRates;
        }

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

      // Check if it's a Template
      const matchedTmpl =
        templateMapByName.get(lower) ||
        templateMapByName.get(rawLower) ||
        (catalogTemplates || []).find((t) => {
          const tn = String(t.TEMPLATE_NAME || t.name || '').toLowerCase().trim();
          return tn === lower || tn === rawLower || (lower.length > 4 && tn.includes(lower)) || (tn.length > 4 && lower.includes(tn));
        });

      if (matchedTmpl) {
        const tmplId = String(matchedTmpl.templatesId || matchedTmpl.id || matchedTmpl.reportId || '').trim();
        const matchedPatientTmpl = (templates || []).find((t) => {
          if (t.status === 'DELETED' || t.isDeleted || String(t.status || '').toUpperCase() === 'DELETED') return false;
          const tn = String(t.TEMPLATE_NAME || t.name || t.testName || '').toLowerCase().trim();
          const trId = String(t.reportId || t.templatesId || '').toLowerCase().trim();
          return tn === lower || tn === rawLower || (tmplId && trId.includes(tmplId.toLowerCase()));
        });

        const effectiveReportId = matchedPatientTmpl?.reportId || matchedTmpl.reportId || '';
        processedLotKeys.add(`TEMPLATE|${tmplId.toUpperCase()}`);
        if (effectiveReportId) processedLotKeys.add(`TEMPLATE|${effectiveReportId.toUpperCase()}`);
        processedLotNames.add(lower);
        processedLotNames.add(String(matchedTmpl.TEMPLATE_NAME || matchedTmpl.name || name).toLowerCase().trim());

        const tmplRate = Number(matchedTmpl.price || matchedTmpl.Rate || matchedTmpl.Rate1 || 0);
        const effectiveTmplAmount = isExplicitBillAmount && billAmount > 0
          ? billAmount
          : (tmplRate > 0 ? tmplRate : (isExplicitBillAmount ? billAmount : 0));

        lots.push({
          id: `EXISTING_TEMPLATE_${effectiveReportId || tmplId || idx + 1}`,
          testId: tmplId || effectiveReportId,
          reportId: effectiveReportId,
          type: 'TEMPLATE',
          name: matchedTmpl.TEMPLATE_NAME || matchedTmpl.name || name,
          amount: effectiveTmplAmount,
          category: 'Template',
          isNew: false,
          subTestCount: 0,
          subTests: [],
        });
        return;
      }

      // Standalone Individual Test: resolve actual testId from catalog or reports
      const matchedReport = (reports || []).find((r) => {
        const rName = String(r.testName || '').toLowerCase().trim();
        return rName === lower || rName === rawLower || (rName && (lower.includes(rName) || rName.includes(lower)));
      });
      if (matchedReport) processedReports.add(matchedReport.reportId);

      const matchedTestId =
        testMapByName.get(lower) ||
        testMapByName.get(rawLower) ||
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
      // Prioritize official invoice amount from billing list (including explicit 0 rate)
      const finalTestAmount = isExplicitBillAmount
        ? billAmount
        : (matchedReportRate !== null ? matchedReportRate : (Number(matchedReport?.rate) || 0));

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
    if (r && r.status !== 'DELETED' && !r.isDeleted && !processedReports.has(r.reportId) && r.packageName) {
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
    if (r && r.status !== 'DELETED' && !r.isDeleted && !processedReports.has(r.reportId) && r.profileName) {
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
    if (r && r.status !== 'DELETED' && !r.isDeleted && !processedReports.has(r.reportId)) {
      const tName = r.testName || `Test ${r.testId || idx + 1}`;
      const tid = r.testId || `T_${idx + 1}`;
      const lowerName = tName.toLowerCase().trim();

      const isTemplate =
        r.isTemplate === true ||
        Number(r.reportType) === 1 ||
        String(r.category || '').toLowerCase() === 'template' ||
        templateMapByName.has(lowerName);

      if (isTemplate) {
        if (!processedLotKeys.has(`TEMPLATE|${String(tid).toUpperCase()}`) && !processedLotNames.has(lowerName)) {
          processedLotKeys.add(`TEMPLATE|${String(tid).toUpperCase()}`);
          if (r.reportId) processedLotKeys.add(`TEMPLATE|${String(r.reportId).toUpperCase()}`);
          processedLotNames.add(lowerName);
          lots.push({
            id: `EXISTING_TEMPLATE_${r.reportId || idx + 1}`,
            testId: tid,
            reportId: r.reportId,
            type: 'TEMPLATE',
            name: tName,
            amount: Number(r.rate) || 0,
            category: 'Template',
            isNew: false,
            subTestCount: 0,
            subTests: [],
          });
        }
        return;
      }

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

  // Step D: Add patient Template Reports that were not covered by billTestList
  const effectiveTemplates = [
    ...(Array.isArray(templates) ? templates : []),
    ...(Array.isArray(patient?.templates) ? patient.templates : []),
  ];

  effectiveTemplates.forEach((t, idx) => {
    if (t && t.status !== 'DELETED' && !t.isDeleted) {
      const tmplName = t.TEMPLATE_NAME || t.name || t.testName || `Template Report ${t.templatesId || idx + 1}`;
      const lower = String(tmplName).toLowerCase().trim();
      const tmplId = String(t.templatesId || t.id || '').toUpperCase().trim();
      const repId = String(t.reportId || '').toUpperCase().trim();

      const isAlreadyProcessed =
        (tmplId && (processedLotKeys.has(`TEMPLATE|${tmplId}`) || processedLotKeys.has(`TEMPLATE|${tmplId.replace(/^T+/i, '')}`))) ||
        (repId && processedLotKeys.has(`TEMPLATE|${repId}`)) ||
        processedLotNames.has(lower);

      if (!isAlreadyProcessed) {
        if (tmplId) processedLotKeys.add(`TEMPLATE|${tmplId}`);
        if (repId) processedLotKeys.add(`TEMPLATE|${repId}`);
        processedLotNames.add(lower);

        const matchedCatalog = (catalogTemplates || []).find((ct) => {
          const cn = String(ct.TEMPLATE_NAME || ct.name || '').toLowerCase().trim();
          const cid = String(ct.templatesId || ct.id || '').toUpperCase().trim();
          return cn === lower || (tmplId && (cid === tmplId || cid === `T${tmplId}`));
        });

        lots.push({
          id: `EXISTING_TEMPLATE_${repId || tmplId || idx + 1}`,
          testId: tmplId || matchedCatalog?.templatesId || repId,
          reportId: t.reportId || repId,
          type: 'TEMPLATE',
          name: tmplName,
          amount: Number(t.price || matchedCatalog?.price || matchedCatalog?.Rate || 0),
          category: 'Template',
          isNew: false,
          subTestCount: 0,
          subTests: [],
        });
      }
    }
  });

  return lots;
}

/**
 * Normalizes boolean values from strings, numbers, or booleans.
 */
function toBooleanFlag(val, defaultVal = false) {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  const str = String(val).toLowerCase().trim();
  if (str === 'true' || str === '1' || str === 'yes') return true;
  if (str === 'false' || str === '0' || str === 'no') return false;
  return defaultVal;
}

/**
 * Maps a patient test report to its master test in TEST_LIST
 * and evaluates whether calculate, download, result entry, and upload
 * operations are enabled or disabled.
 *
 * Parameters checked:
 * - possibleCalculate: boolean
 * - possibleDownload: boolean
 * - possibleEntry: boolean
 * - possibleUpload: boolean
 *
 * @param {Object} report - Patient test report object (with testId, testName, etc.)
 * @param {Array} masterTests - Array of tests from master data (TEST_LIST)
 * @returns {Object} { possibleCalculate, possibleDownload, possibleEntry, possibleUpload, matchedTest }
 */
export function getTestOperationPermissions(report = {}, masterTests = []) {
  if (!report) {
    return {
      possibleCalculate: false,
      possibleDownload: true,
      possibleEntry: true,
      possibleUpload: false,
      matchedTest: null,
    };
  }

  let matchedTest = null;

  if (Array.isArray(masterTests) && masterTests.length > 0) {
    const rawTestId = String(report.testId || report['Test Id'] || report.id || '').trim();
    const normalizedTestId = rawTestId.replace(/^t/i, '').trim();
    const rawTestName = String(report.testName || report.name || report['Bill Particulars'] || '').toLowerCase().trim();

    // 1. Match by Test ID (exact match, or stripped 'T' prefix match)
    if (rawTestId) {
      matchedTest = masterTests.find((t) => {
        const mId = String(t['Test Id'] || t.testId || t.id || '').trim();
        if (mId.toLowerCase() === rawTestId.toLowerCase()) return true;
        const mNorm = mId.replace(/^t/i, '').trim();
        return mNorm && normalizedTestId && mNorm.toLowerCase() === normalizedTestId.toLowerCase();
      });
    }

    // 2. Fallback: Match by Test Name or Short Name
    if (!matchedTest && rawTestName) {
      matchedTest = masterTests.find((t) => {
        const mName = String(t.Name || t.name || '').toLowerCase().trim();
        const mShort = String(t['Short Name'] || t.shortName || '').toLowerCase().trim();
        return (mName && mName === rawTestName) || (mShort && mShort === rawTestName);
      });
    }
  }

  const resolveFlag = (keys, defaultVal) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    // 1. Priority to direct flag on report object if present
    for (const k of keyList) {
      if (report[k] !== undefined && report[k] !== null && report[k] !== '') {
        return toBooleanFlag(report[k], defaultVal);
      }
    }
    // 2. From matched master test
    if (matchedTest) {
      for (const k of keyList) {
        if (matchedTest[k] !== undefined && matchedTest[k] !== null && matchedTest[k] !== '') {
          return toBooleanFlag(matchedTest[k], defaultVal);
        }
      }
    }
    // 3. Fallback default
    return defaultVal;
  };

  // Automated Formula Calculate check:
  // Checks all possible flag variations: possibleCalculate, calculate, isCalculate, isFormula, formula
  let isCalc = resolveFlag(
    ['possibleCalculate', 'PossibleCalculate', 'calculate', 'Calculate', 'isCalculate', 'isFormula', 'formula', 'Formula'],
    false
  );

  if (!isCalc) {
    const tName = String(report.testName || report.name || matchedTest?.Name || matchedTest?.name || '').toLowerCase();
    const isKnownCalc =
      tName.includes('mcv') ||
      tName.includes('mch') ||
      tName.includes('mchc') ||
      tName.includes('mean corpuscular') ||
      tName.includes('globulin') ||
      tName.includes('a/g ratio') ||
      tName.includes('ag ratio') ||
      tName.includes('vldl') ||
      tName.includes('ldl cholesterol') ||
      tName.includes('indirect bilirubin') ||
      tName.includes('bilirubin indirect') ||
      tName.includes('egfr');
    if (isKnownCalc) {
      isCalc = true;
    }
  }

  return {
    possibleCalculate: isCalc,
    possibleDownload: resolveFlag(['possibleDownload', 'PossibleDownload', 'download', 'Download'], true),
    possibleEntry: resolveFlag(['possibleEntry', 'PossibleEntry', 'entry', 'Entry'], true),
    possibleUpload: resolveFlag(['possibleUpload', 'PossibleUpload', 'upload', 'Upload'], false),
    matchedTest,
  };
}

/**
 * Static master unit mapping covering standard LIS measurement unit IDs.
 * Ensures receptionists, nurses, and lab staff see clinical units (mg/dl, gm/dl, etc.)
 * rather than opaque internal database codes (U1, U2, U13, etc.).
 */
export const STATIC_UNIT_MAP = {
  u1: 'mg%',
  '1': 'mg%',
  u2: 'mg/dl',
  '2': 'mg/dl',
  u3: 'ng/ml',
  '3': 'ng/ml',
  u4: 'μIU/ml',
  '4': 'μIU/ml',
  u5: 'ml/minute',
  '5': 'ml/minute',
  u6: 'u/ml',
  '6': 'u/ml',
  u7: '/cumm',
  '7': '/cumm',
  u8: 'millions/cumm',
  '8': 'millions/cumm',
  u9: 'lakhs/cumm',
  '9': 'lakhs/cumm',
  u10: '%',
  '10': '%',
  u11: 'fl',
  '11': 'fl',
  u12: 'pg',
  '12': 'pg',
  u13: 'gm/dl',
  '13': 'gm/dl',
  u14: 'mm/hrs',
  '14': 'mm/hrs',
  u15: 'mg / L',
  '15': 'mg / L',
  u16: '10^9/L',
  '16': '10^9/L',
  u17: 'gm%',
  '17': 'gm%',
  u18: 'Index',
  '18': 'Index',
  u19: 'mEq/L',
  '19': 'mEq/L',
  u20: 'million/cumm',
  '20': 'million/cumm',
  u28: '-',
  '28': '-',
  u41: 'mm/hrs',
  '41': 'mm/hrs',
  u42: 'Sec',
  '42': 'Sec',
  u43: 'U/L',
  '43': 'U/L',
  u44: 'U/g of HB',
  '44': 'U/g of HB',
  u45: 'mmol/L',
  '45': 'mmol/L',
  u46: 'g/dl',
  '46': 'g/dl',
  u47: 'OD',
  '47': 'OD',
  u48: 'Pan Bio Unit',
  '48': 'Pan Bio Unit',
  u49: 'ug/dl',
  '49': 'ug/dl',
  u50: 'ulU/mL',
  '50': 'ulU/mL',
  u51: 'pg/ml',
  '51': 'pg/ml',
  u52: 'ng/dl',
  '52': 'ng/dl',
  u53: 'μIU/ml',
  '53': 'μIU/ml',
  u54: 'mg/g creatinine',
  '54': 'mg/g creatinine',
  u55: 'mIU/ml',
  '55': 'mIU/ml',
  u56: 'mg/Lit',
  '56': 'mg/Lit',
};

/**
 * Sanitizes scientific measurement unit strings, fixing replacement characters
 * (like \uFFFD from mis-decoded latin1 / UTF-8 transfers) and standardizing Greek 'μ' (U+03BC / U+00B5).
 */
export function sanitizeScientificUnit(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\uFFFD\u00BF\uFEFF]/g, 'μ')
    .replace(/^\?iu/i, 'μIU')
    .replace(/^iu\/ml$/i, 'μIU/ml')
    .replace(/uIu\/ml/i, 'μIU/ml')
    .trim();
}

/**
 * Formats any raw unit identifier into its human-readable clinical unit name.
 * Resolves codes like 'U2' -> 'mg/dl', 'U13' -> 'gm/dl', 'U1' -> 'mg%', 'U11' -> 'fl'.
 */
export function formatUnitName(rawUnit, masterUnits = []) {
  if (!rawUnit && rawUnit !== 0) return '';
  let clean = sanitizeScientificUnit(String(rawUnit));
  if (!clean || clean === '-') return clean;

  const cleanLower = clean.toLowerCase();
  const cleanNoU = cleanLower.replace(/^u/i, '');
  const cleanWithU = `u${cleanNoU}`;

  // 1. Dynamic lookup against active masterUnits catalog if provided
  if (Array.isArray(masterUnits) && masterUnits.length > 0) {
    const foundById = masterUnits.find((u) => {
      const uId = String(u['Unit Id'] || u.id || '').trim().toLowerCase();
      const uNoU = uId.replace(/^u/i, '');
      return uId === cleanLower || uId === cleanNoU || (uNoU && cleanNoU && uNoU === cleanNoU);
    });
    if (foundById && (foundById.Name || foundById.name)) {
      const foundName = sanitizeScientificUnit(String(foundById.Name || foundById.name));
      if (foundName) return foundName;
    }

    const foundByName = masterUnits.find((u) => {
      const name = String(u.Name || u.name || '').trim().toLowerCase();
      return name === cleanLower;
    });
    if (foundByName && (foundByName.Name || foundByName.name)) {
      const foundName = sanitizeScientificUnit(String(foundByName.Name || foundByName.name));
      if (foundName) return foundName;
    }
  }

  // 2. High-speed lookup against static unit catalog
  const staticFound = STATIC_UNIT_MAP[cleanLower] || STATIC_UNIT_MAP[cleanNoU] || STATIC_UNIT_MAP[cleanWithU];
  if (staticFound) {
    return sanitizeScientificUnit(staticFound);
  }

  return clean;
}

/**
 * Canonical high-speed department ID to clean human-readable name map
 */
const STATIC_DEPT_MAP = {
  '1': 'Haematology',
  'd1': 'Haematology',
  'hema': 'Haematology',
  '2': 'Biochemistry',
  'd2': 'Biochemistry',
  'bio': 'Biochemistry',
  '3': 'Clinical Pathology',
  'd3': 'Clinical Pathology',
  'cpath': 'Clinical Pathology',
  '4': 'Serology & Immunology',
  'd4': 'Serology & Immunology',
  'sero': 'Serology & Immunology',
  '5': 'Microbiology',
  'd5': 'Microbiology',
  'micro': 'Microbiology',
  '6': 'Histopathology',
  'd6': 'Histopathology',
  'histo': 'Histopathology',
  '7': 'Cytology',
  'd7': 'Cytology',
  'cyto': 'Cytology',
  '8': 'Coagulation',
  'd8': 'Coagulation',
  'coag': 'Coagulation',
  '9': 'Endocrinology & Hormones',
  'd9': 'Endocrinology & Hormones',
  'endo': 'Endocrinology & Hormones',
  '10': 'Molecular Biology',
  'd10': 'Molecular Biology',
  'mol': 'Molecular Biology',
};

/**
 * Canonical reverse map from department codes/names/aliases to standard Department ID ('D1', 'D2', etc.)
 */
export const STATIC_DEPT_TO_ID_MAP = {
  '1': 'D1',
  'd1': 'D1',
  'hema': 'D1',
  'hematology': 'D1',
  'haematology': 'D1',
  'dept haematology tests': 'D1',
  'dept hematology tests': 'D1',
  '2': 'D2',
  'd2': 'D2',
  'bio': 'D2',
  'biochemistry': 'D2',
  'dept biochemistry tests': 'D2',
  '3': 'D3',
  'd3': 'D3',
  'cpath': 'D3',
  'clinical pathology': 'D3',
  'pathology': 'D3',
  '4': 'D4',
  'd4': 'D4',
  'sero': 'D4',
  'serology': 'D4',
  'immunology': 'D4',
  'serology & immunology': 'D4',
  '5': 'D5',
  'd5': 'D5',
  'micro': 'D5',
  'microbiology': 'D5',
  'culture': 'D5',
  '6': 'D6',
  'd6': 'D6',
  'histo': 'D6',
  'histopathology': 'D6',
  '7': 'D7',
  'd7': 'D7',
  'cyto': 'D7',
  'cytology': 'D7',
  '8': 'D8',
  'd8': 'D8',
  'coag': 'D8',
  'coagulation': 'D8',
  '9': 'D9',
  'd9': 'D9',
  'endo': 'D9',
  'endocrinology': 'D9',
  'hormones': 'D9',
  'endocrinology & hormones': 'D9',
  '10': 'D10',
  'd10': 'D10',
  'mol': 'D10',
  'molecular': 'D10',
  'molecular biology': 'D10',
};

/**
 * Resolves any raw department string, name, or code into canonical Department ID ('D1', 'D2', etc.)
 * e.g. 'DEPT HAEMATOLOGY TESTS' -> 'D1', 'Haematology' -> 'D1', '1' -> 'D1', 'D1' -> 'D1', 'Biochemistry' -> 'D2'
 */
export function resolveDepartmentId(rawDept, masterDepartments = []) {
  if (!rawDept && rawDept !== 0) return 'D1';
  const clean = String(rawDept).trim();
  if (!clean || clean === '-') return 'D1';

  // 1. If already standard D-prefixed ID like D1, D2, D10
  if (/^d\d+$/i.test(clean)) {
    return clean.toUpperCase();
  }
  // 2. If pure number like 1, 2, 10
  if (/^\d+$/.test(clean)) {
    return `D${clean}`;
  }

  const lower = clean.toLowerCase();

  // 3. Check against static inverse map
  if (STATIC_DEPT_TO_ID_MAP[lower]) {
    return STATIC_DEPT_TO_ID_MAP[lower];
  }

  // 4. Dynamic lookup against active masterDepartments catalog if provided
  if (Array.isArray(masterDepartments) && masterDepartments.length > 0) {
    const found = masterDepartments.find((d) => {
      const dName = String(d.Name || d.name || '').toLowerCase().trim();
      const dShort = String(d['Short Name'] || d.shortName || '').toLowerCase().trim();
      return (
        dName === lower ||
        (dName && (lower.includes(dName) || dName.includes(lower))) ||
        (dShort && dShort === lower)
      );
    });
    if (found) {
      const dId = String(found['Dept Id'] || found.id || found.deptId || '').trim();
      if (/^d\d+$/i.test(dId)) return dId.toUpperCase();
      if (/^\d+$/.test(dId)) return `D${dId}`;
    }
  }

  // 5. Keyword substring matching for common diagnostic departments
  if (lower.includes('haem') || lower.includes('hem') || lower.includes('blood') || lower.includes('cbc')) return 'D1';
  if (lower.includes('bio') || lower.includes('chem') || lower.includes('lft') || lower.includes('kft') || lower.includes('lipid')) return 'D2';
  if (lower.includes('cpath') || lower.includes('path') || lower.includes('urine') || lower.includes('stool')) return 'D3';
  if (lower.includes('sero') || lower.includes('immun') || lower.includes('widal') || lower.includes('elisa') || lower.includes('hiv') || lower.includes('hbsag')) return 'D4';
  if (lower.includes('micro') || lower.includes('culture') || lower.includes('sensitiv')) return 'D5';
  if (lower.includes('histo') || lower.includes('biopsy')) return 'D6';
  if (lower.includes('cyto') || lower.includes('fnac') || lower.includes('pap')) return 'D7';
  if (lower.includes('coag') || /\bpt\b/i.test(lower) || /\binr\b/i.test(lower) || /\baptt\b/i.test(lower)) return 'D8';
  if (lower.includes('endo') || lower.includes('hormon') || lower.includes('thyroid') || /\b(t3|t4|tsh)\b/i.test(lower)) return 'D9';
  if (lower.includes('mol') || /\bpcr\b/i.test(lower) || /\bdna\b/i.test(lower) || /\brna\b/i.test(lower)) return 'D10';

  return 'D1';
}

/**
 * Resolves a raw department identifier (e.g. 'D1', '1', 'D2') to a clean, human-readable Department Name.
 */
export function getDepartmentDisplayName(rawDept, tubeDept = '', masterDepartments = []) {
  if (!rawDept && rawDept !== 0) {
    return tubeDept || 'Haematology';
  }
  const clean = String(rawDept).trim();
  if (!clean || clean === '-') {
    return tubeDept || 'Haematology';
  }

  // 1. Dynamic lookup against active masterDepartments catalog if provided
  if (Array.isArray(masterDepartments) && masterDepartments.length > 0) {
    const cleanLower = clean.toLowerCase();
    const cleanNoD = cleanLower.replace(/^d/i, '').trim();
    const found = masterDepartments.find((d) => {
      const dId = String(d['Dept Id'] || d.id || d.deptId || '').trim().toLowerCase();
      const dNoD = dId.replace(/^d/i, '').trim();
      const dName = String(d.Name || d.name || '').trim().toLowerCase();
      return (
        dId === cleanLower ||
        (cleanNoD && dNoD && dNoD === cleanNoD) ||
        dName === cleanLower
      );
    });
    if (found && (found.Name || found.name)) {
      const foundName = String(found.Name || found.name).trim();
      if (foundName) return foundName;
    }
  }

  // 2. High-speed lookup against static department catalog
  const lower = clean.toLowerCase();
  if (STATIC_DEPT_MAP[lower]) {
    return STATIC_DEPT_MAP[lower];
  }
  const noD = lower.replace(/^d/i, '').trim();
  if (STATIC_DEPT_MAP[noD]) {
    return STATIC_DEPT_MAP[noD];
  }

  // 3. If raw is already a descriptive name (e.g. "Haematology", "Biochemistry", not "D1", "D2", "1", "2")
  if (!/^d\d+$/i.test(clean) && !/^\d+$/.test(clean)) {
    return clean;
  }

  // 4. Fallback to tube department or default
  return tubeDept || 'Haematology';
}

/**
 * Resolves a branch code (e.g. '0', '1', '01', 0, 1) or patient record
 * to its human-readable branch name from the master catalog (BRANCH_LIST).
 *
 * @param {Object|string|number} patientOrBranch - Patient object or raw branch code/name
 * @param {Array} branches - Array of branches from useMaster() (BRANCH_LIST)
 * @returns {string} Human-readable branch name (e.g. 'Main Diagnostic Lab (Central)', 'New Life Care Diagnostic Branch 1')
 */
export function getBranchDisplayName(patientOrBranch, branches = []) {
  if (patientOrBranch === null || patientOrBranch === undefined) {
    return 'Main Diagnostic Lab (Central)';
  }

  let raw = '';
  if (typeof patientOrBranch === 'object') {
    raw = String(
      patientOrBranch.branch !== undefined && patientOrBranch.branch !== null && patientOrBranch.branch !== ''
        ? patientOrBranch.branch
        : patientOrBranch.center !== undefined && patientOrBranch.center !== null && patientOrBranch.center !== ''
        ? patientOrBranch.center
        : patientOrBranch.branchId || patientOrBranch['Branch Id'] || patientOrBranch['Branch'] || patientOrBranch['Center'] || patientOrBranch.accessBranch || ''
    ).trim();
  } else {
    raw = String(patientOrBranch).trim();
  }

  // If already a long descriptive name (not a code like '0', '1', '01', 'B1')
  if (raw && raw.length > 3 && isNaN(Number(raw)) && !/^b\d+$/i.test(raw)) {
    return raw;
  }

  // 1. Match from master catalog branches array by exact string
  if (Array.isArray(branches) && branches.length > 0) {
    let matched = branches.find((b) => {
      const bId = String(b.branchId ?? b['Branch Id'] ?? b.id ?? '').trim();
      return bId.toLowerCase() === raw.toLowerCase();
    });

    // 2. Try numeric match (e.g. '01' === 1, '0' === 0, '1' === 1)
    if (!matched && raw !== '') {
      const rawNum = parseInt(raw, 10);
      if (!isNaN(rawNum)) {
        matched = branches.find((b) => {
          const bId = String(b.branchId ?? b['Branch Id'] ?? b.id ?? '').trim();
          const bNum = parseInt(bId, 10);
          return !isNaN(bNum) && bNum === rawNum;
        });
      }
    }

    if (matched) {
      return matched.Name || matched.name || matched.branchName || `Branch ${raw}`;
    }
  }

  // 3. Fallback defaults if master list isn't ready or code not present
  const rawNum = parseInt(raw, 10);
  if (raw === '' || raw === '0' || rawNum === 0 || raw.toLowerCase() === 'main' || raw.toLowerCase() === 'central') {
    const b0 = Array.isArray(branches) ? branches.find((b) => String(b.branchId ?? b['Branch Id'] ?? b.id) === '0') : null;
    return b0?.Name || b0?.name || 'Main Diagnostic Lab (Central)';
  }

  if (raw === '1' || raw === '01' || rawNum === 1) {
    const b1 = Array.isArray(branches) ? branches.find((b) => String(b.branchId ?? b['Branch Id'] ?? b.id) === '1') : null;
    return b1?.Name || b1?.name || 'New Life Care Diagnostic Branch 1';
  }

  if (raw === '2' || raw === '02' || rawNum === 2) {
    const b2 = Array.isArray(branches) ? branches.find((b) => String(b.branchId ?? b['Branch Id'] ?? b.id) === '2') : null;
    return b2?.Name || b2?.name || 'New Life Care Collection Center - Station Road';
  }

  return raw ? `Branch ${raw}` : 'Main Diagnostic Lab (Central)';
}
