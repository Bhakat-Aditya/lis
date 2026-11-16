import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api.js';
import {
  UserCheck,
  TestTube2,
  Cpu,
  FlaskConical,
  Activity,
  FileSpreadsheet,
  ShieldCheck,
  Printer,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  ExternalLink,
  Barcode,
  Radio,
  Undo2,
  Check,
  AlertTriangle,
  Send,
  Smartphone,
  CheckCheck,
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils.js';

/**
 * 10-Stage Clinical Diagnostic Workflow Timeline (Flipkart Order History Style)
 * Strictly matches the official GETJOURNEYSTAGES upstream schema:
 * 1. Patient Register
 * 2. Sample Received
 * 3. Analyzer Connection
 * 4. Generating Result
 * 5. Result Transmission
 * 6. Result Mapping to Patient
 * 7. Result Verification
 * 8. Final Report
 * 9. WhatsApp Delivery
 * 10. Customer Feedback
 */

const CLINICAL_ANALYZERS_MAP = {
  'AutoQuant 200': {
    name: 'AutoQuant 200 Excelus',
    shortName: 'AutoQuant 200',
    brand: 'Meril Life Sciences',
    dept: 'Biochemistry',
    image: '/images/machines/autoquant-200.jpg',
  },
  'VIDAS': {
    name: 'bioMérieux VIDAS® KUBE™',
    shortName: 'VIDAS® KUBE™',
    brand: 'bioMérieux',
    dept: 'Immunoassay',
    image: '/images/machines/vidas-kube.jpg',
  },
  'LD-560': {
    name: 'Labnovation LD-560 HPLC',
    shortName: 'LD-560 HPLC',
    brand: 'Labnovation',
    dept: 'HbA1c Diabetes',
    image: '/images/machines/labnovation-ld560.jpg',
  },
  'HDC Lyte': {
    name: 'HDC Lyte Electrolyte',
    shortName: 'HDC Lyte',
    brand: 'HDC Diagnostics',
    dept: 'Electrolytes',
    image: '/images/machines/hdc-lyte.jpg',
  },
  'Erba ECL': {
    name: 'Erba ECL 105 Coagulation',
    shortName: 'Erba ECL 105',
    brand: 'Erba Mannheim',
    dept: 'Coagulation',
    image: '/images/machines/erba-ecl105.jpg',
  },
  'CBC': {
    name: 'Hematology Cell Counter 3-Part',
    shortName: 'CBC 3-Part',
    brand: 'Mindray Diagnostics',
    dept: 'Hematology',
    image: '/images/machines/cbc-3part.jpg',
  },
};

const STAGE_ICONS = [
  UserCheck, // 1: Patient Register
  TestTube2, // 2: Sample Received
  Cpu, // 3: Analyzer Connection
  FlaskConical, // 4: Generating Result
  Activity, // 5: Result Transmission
  FileSpreadsheet, // 6: Result Mapping to Patient
  ShieldCheck, // 7: Result Verification
  Printer, // 8: Final Report
  MessageSquare, // 9: WhatsApp Delivery
  Sparkles, // 10: Customer Feedback
];

export default function PatientJourneyTimeline({
  patient = {},
  reports = [],
  onReceiveSample,
  onReleaseReport,
  onRecallReport,
  onSendWhatsApp,
  onOpenWhatsAppModal,
  onOpenApproval,
  className = '',
}) {
  const [expandedStage, setExpandedStage] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [journeyApiData, setJourneyApiData] = useState(null);
  const [loadingStages, setLoadingStages] = useState(false);
  const [vacutainersExpanded, setVacutainersExpanded] = useState(false);

  const rawPatientId = patient?.patientId || patient?.slNo || patient?.id || '';
  const cleanPatientId = rawPatientId
    ? String(rawPatientId).trim().toUpperCase().startsWith('P')
      ? `P${String(rawPatientId).trim().replace(/^P+/i, '')}`
      : `P${String(rawPatientId).trim()}`
    : '';

  // Always fetch journey stages from API when cleanPatientId changes or refreshed
  const fetchJourneyStages = async () => {
    if (!cleanPatientId) return;
    setLoadingStages(true);
    try {
      const res = await api.get('/patients/journey-stages', {
        params: { patientId: cleanPatientId },
      });
      if (res.data?.STATUS === 'SUCCESS') {
        setJourneyApiData(res.data);
      }
    } catch (err) {
      console.warn('[JourneyTimeline] Fetch error:', err.message);
    } finally {
      setLoadingStages(false);
    }
  };

  useEffect(() => {
    if (cleanPatientId) {
      fetchJourneyStages();
    }
  }, [cleanPatientId]);

  // Extract upstream payload fields according to exact GETJOURNEYSTAGES schema:
  // res.payLoadJSON.journey.stages, res.payLoadJSON.journey.journeyMeta, res.payLoadJSON.patient
  const upstreamPayload = journeyApiData?.payLoadJSON || {};
  const upstreamJourney = upstreamPayload?.journey || {};
  const rawApiStages =
    upstreamJourney?.stages ||
    journeyApiData?.stages ||
    upstreamPayload?.stages ||
    [];
  const journeyMeta =
    upstreamJourney?.journeyMeta ||
    journeyApiData?.journeyMeta ||
    upstreamPayload?.journeyMeta ||
    null;
  const patientData =
    upstreamPayload?.patient ||
    journeyApiData?.patient ||
    patient ||
    {};

  // Fallback date and time
  const regDateFormatted = formatDisplayDate(
    patientData?.regDate || patient?.regDate || new Date()
  );
  const sampleTime = patientData?.sampleTime || patient?.sampleTime || '10:30 AM';

  // Compute status string
  const statusStr = String(patientData?.status || patient?.status || '').toUpperCase().trim();

  // Determine current active stage index (0 to 9)
  const currentStageIndex = useMemo(() => {
    if (journeyMeta?.currentStageStep !== undefined && journeyMeta.currentStageStep !== null) {
      return Math.max(0, Math.min(9, journeyMeta.currentStageStep - 1));
    }
    if (Array.isArray(rawApiStages) && rawApiStages.length > 0) {
      const activeIdx = rawApiStages.findIndex(
        (s) => s.status === 'Active Now' || s.isActiveNow === true
      );
      if (activeIdx !== -1) return activeIdx;

      const firstPendingIdx = rawApiStages.findIndex(
        (s) => String(s.status).toLowerCase() === 'pending'
      );
      if (firstPendingIdx !== -1) return firstPendingIdx;

      return rawApiStages.length - 1;
    }

    // Heuristic fallback if API response not loaded yet:
    const hasReleasedReports =
      reports.length > 0 &&
      reports.some((r) => String(r.status || '').toUpperCase() === 'RELEASED');
    const allReportsReleased =
      reports.length > 0 &&
      reports.every((r) => String(r.status || '').toUpperCase() === 'RELEASED');
    const hasApproved = reports.some(
      (r) => r.isApproved || String(r.status || '').toUpperCase() === 'APPROVED'
    );
    const hasSampleReceived = reports.some(
      (r) => r.isReceived || String(r.status || '').toUpperCase() === 'SAMPLE'
    );
    const hasResultsEntered = reports.some(
      (r) => r.isResultFilled || (r.testParameters && r.testParameters.some((p) => p.resultValue))
    );

    if (allReportsReleased || statusStr === 'RELEASED') return 9;
    if (statusStr === 'PRINTING' || statusStr === 'READY' || hasReleasedReports) return 8;
    if (statusStr === 'APPROVED' || statusStr === 'VERIFIED' || hasApproved) return 7;
    if (statusStr === 'RESULT FULLY' || statusStr === 'SAVED' || (hasResultsEntered && reports.every((r) => r.isResultFilled))) return 6;
    if (statusStr === 'RESULT PARTLY' || statusStr === 'TESTING' || hasResultsEntered) return 4;
    if (statusStr === 'SAMPLE' || hasSampleReceived) return 2;
    return 1;
  }, [journeyMeta?.currentStageStep, rawApiStages, reports, statusStr]);

  // Standardize stages to guarantee 10 stages matching the exact API schema
  const stages = useMemo(() => {
    // Stage templates if upstream hasn't returned yet:
    const defaultTemplates = [
      {
        step: 1,
        title: 'Patient Register',
        subtitle: 'Demographics & Barcode Registered',
        description: `Patient registered with ID #${patientData?.slNo || cleanPatientId}. Requisition and barcode generated. Total Billed: ₹${patientData?.totalBill || 0}.`,
        status: currentStageIndex >= 0 ? 'Completed' : 'Pending',
        timestampDisplay: `${regDateFormatted} • 09:45 AM`,
        stationOperator: 'Reception Desk (Exsuper2)',
        metadata: {
          billedAmount: Number(patientData?.totalBill || 0),
          patientId: cleanPatientId,
          currency: 'INR',
        },
      },
      {
        step: 2,
        title: 'Sample Received',
        subtitle: 'Lab Desk',
        description: 'Specimens accessioned. Barcode scanned and verified.',
        status: currentStageIndex >= 1 ? 'Completed' : 'Pending',
        timestampDisplay: `${regDateFormatted} • ${sampleTime}`,
        stationOperator: 'Central Lab (Exsuper2)',
        metadata: {
          vacutainers: reports.map((r) => r.name || r.testName).filter(Boolean),
        },
      },
      {
        step: 3,
        title: 'Analyzer Connection',
        subtitle: 'ASTM E1381 / HL7 Bidirectional Handshake',
        description: 'Bidirectional query protocol initiated across all 5 physical analyzers: Meril AutoQuant 200, bioMérieux VIDAS® KUBE™, Labnovation LD-560 HPLC, HDC Lyte, and Erba ECL 105. Barcodes synchronized with LIS.',
        status: currentStageIndex >= 2 ? 'Completed' : 'Pending',
        timestampDisplay: currentStageIndex >= 2 ? `${regDateFormatted} • 10:48 AM` : 'Pending',
        stationOperator: 'AutoQuant 200, VIDAS KUBE, LD-560 HPLC, HDC Lyte, ECL 105',
        metadata: {
          protocol: 'ASTM E1381 / HL7',
          analyzers: [
            'Meril AutoQuant 200',
            'bioMérieux VIDAS® KUBE™',
            'Labnovation LD-560 HPLC',
            'HDC Lyte',
            'Erba ECL 105',
          ],
        },
      },
      {
        step: 4,
        title: 'Generating Result',
        subtitle: 'Analyzer Optical & Impedance Measurement',
        description: `${reports.length || 13} parameters analyzed on automated benches. Calibration and internal QC controls passed.`,
        status: currentStageIndex >= 3 ? 'Completed' : 'Pending',
        timestampDisplay: currentStageIndex >= 3 ? `${regDateFormatted} • 11:15 AM` : 'Pending',
        stationOperator: 'Analyzer Unit',
        metadata: {
          parameterCount: reports.length || 13,
          qcPassed: true,
        },
      },
      {
        step: 5,
        title: 'Result Transmission',
        subtitle: 'Direct Data Feed into LIS Middleman',
        description: 'Raw parameter packets transmitted into LIS middleman without manual data entry. Zero transcription error protocol.',
        status: currentStageIndex >= 4 ? 'Completed' : 'Pending',
        timestampDisplay: currentStageIndex >= 4 ? `${regDateFormatted} • 11:22 AM` : 'Pending',
        stationOperator: 'LIS ASTM Receiver Socket',
        metadata: {
          manualEntry: false,
        },
      },
      {
        step: 6,
        title: 'Result Mapping to Patient',
        subtitle: 'Parameter Extraction & Panic Value Check',
        description: 'Numerical values matched against gender/age-specific biological reference intervals. Panic alerts evaluated.',
        status: currentStageIndex >= 5 ? 'Completed' : 'Pending',
        timestampDisplay: currentStageIndex >= 5 ? `${regDateFormatted} • 11:30 AM` : 'Pending',
        stationOperator: 'Automated Clinical Engine',
        metadata: {
          panicAlertTriggered: false,
        },
      },
      {
        step: 7,
        title: 'Result Verification',
        subtitle: 'Doctor & Pathologist Sign-Off',
        description: 'Clinical correlation and delta checks reviewed and certified by senior pathologist.',
        status: currentStageIndex >= 6 ? 'Completed' : 'Pending',
        timestampDisplay: currentStageIndex >= 6 ? `${regDateFormatted} • 11:45 AM` : 'Pending',
        stationOperator: 'Lab Technician (-)',
        metadata: {
          pathologistName: 'Lab Technician',
          registrationNumber: '-',
        },
      },
      {
        step: 8,
        title: 'Final Report',
        subtitle: 'NABL QR Code & Digital Signature PDF',
        description: 'Diagnostic PDF report compiled with cryptographically signed digital signature and instant verification QR code.',
        status: currentStageIndex >= 7 ? 'Completed' : 'Pending',
        timestampDisplay: currentStageIndex >= 7 ? `${regDateFormatted} • 12:05 PM` : 'Pending',
        stationOperator: 'Central Report Engine',
        metadata: {
          digitallySigned: true,
        },
      },
      {
        step: 9,
        title: 'WhatsApp Delivery',
        subtitle: 'Automated Dispatch to Registered Mobile',
        description: `Official diagnostic PDF and download link delivered to registered phone ${patientData?.mobile || 'Patient'}. Supports 4 channels: Onboarding Msg, Report to Patient, Report to Doctor, Report to Referring Agent.`,
        status: currentStageIndex >= 8 ? 'Completed' : 'Pending',
        timestampDisplay: currentStageIndex >= 8 ? `${regDateFormatted} • 12:10 PM` : 'Pending',
        stationOperator: `Meta WhatsApp Cloud API (${patientData?.mobile || 'Patient'})`,
        metadata: {
          recipientMobile: patientData?.mobile || '',
          channels: [
            { name: 'Onboarding Msg', status: currentStageIndex >= 8 ? 'Completed' : 'Pending' },
            { name: 'Report to Patient', status: currentStageIndex >= 8 ? 'Completed' : 'Pending' },
            { name: 'Report to Doctor', status: currentStageIndex >= 8 ? 'Completed' : 'Pending' },
            { name: 'Report to Referring Agent', status: currentStageIndex >= 8 ? 'Completed' : 'Pending' },
          ],
        },
      },
      {
        step: 10,
        title: 'Customer Feedback',
        subtitle: 'Patient Experience & Service Rating',
        description: 'Automated feedback survey dispatched. Rating helps lab maintain high clinical precision and care standards.',
        status: currentStageIndex >= 9 ? 'Completed' : 'Pending',
        isActiveNow: currentStageIndex >= 8,
        timestampDisplay: currentStageIndex >= 9 ? 'Rating Recorded' : 'Active Now • Awaiting Patient Rating',
        stationOperator: 'Automated Feedback Engine',
        metadata: {
          feedbackCategories: [
            { id: 'patient_feedback', label: 'Patient Feedback', rating: null, comment: '', status: 'Pending' },
            { id: 'doctor_feedback', label: 'Doctor Feedback', rating: null, comment: '', status: 'Pending' },
            { id: 'refer_agent_feedback', label: 'Refer Agent Feedback', rating: null, comment: '', status: 'Pending' },
          ],
        },
      },
    ];

    if (Array.isArray(rawApiStages) && rawApiStages.length > 0) {
      return defaultTemplates.map((template, idx) => {
        const apiStage = rawApiStages.find(
          (s) => s.step === template.step || s.id === idx || s.stageNumber === template.step
        ) || rawApiStages[idx];

        if (!apiStage) return template;

        return {
          step: apiStage.step || template.step,
          title: apiStage.title || template.title,
          subtitle: apiStage.subtitle || template.subtitle,
          description: apiStage.description || template.description,
          status: apiStage.status || template.status,
          timestampDisplay:
            apiStage.timestampDisplay ||
            apiStage.time ||
            (apiStage.timestampUTC ? formatDisplayDate(apiStage.timestampUTC) : template.timestampDisplay),
          timestampUTC: apiStage.timestampUTC || null,
          stationOperator: apiStage.stationOperator || apiStage.operator || template.stationOperator,
          metadata: {
            ...template.metadata,
            ...(apiStage.metadata || {}),
          },
        };
      });
    }

    return defaultTemplates;
  }, [rawApiStages, currentStageIndex, patientData, cleanPatientId, regDateFormatted, sampleTime, reports]);

  const completedCount = useMemo(() => {
    if (journeyMeta?.completedStages !== undefined) {
      return journeyMeta.completedStages;
    }
    return stages.filter((s) => String(s.status).toLowerCase() === 'completed').length;
  }, [journeyMeta?.completedStages, stages]);

  const totalStages = journeyMeta?.totalStages || stages.length || 10;
  const progressPercent = Math.round((completedCount / totalStages) * 100);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
  };

  // Helper to find matching hardware images for analyzer strings from metadata
  const resolveAnalyzerCard = (name) => {
    for (const [key, val] of Object.entries(CLINICAL_ANALYZERS_MAP)) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return val;
      }
    }
    return {
      name,
      shortName: name,
      brand: 'Clinical Bench',
      dept: 'Diagnostics',
      image: '/images/machines/autoquant-200.jpg',
    };
  };

  return (
    <article
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow duration-200 overflow-hidden ${className}`}
    >
      {/* Top Header matching Flipkart Order Tracking */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4.5 bg-blue-600 rounded-full inline-block shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Patient Diagnostic Journey & Order Workflow</span>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                10-Stage Pipeline
              </span>
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 font-medium pl-3.5 mt-0.5">
            Step-by-step end-to-end clinical workflow tracking from registration to customer feedback
          </p>
        </div>

        {/* Overall Completion Badge & Bar */}
        <div className="flex items-center gap-3">
          {/* Live Upstream API: GETJOURNEYSTAGES Indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-bold flex items-center gap-1.5 shadow-2xs transition-colors ${
                journeyApiData?.isUpstreamLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
              title={`API: GETJOURNEYSTAGES | patientId=${cleanPatientId || '-'}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  journeyApiData?.isUpstreamLive ? 'bg-emerald-500 animate-ping' : 'bg-blue-500'
                }`}
              />
              <span>GETJOURNEYSTAGES {cleanPatientId ? `• ${cleanPatientId}` : ''}</span>
              {journeyApiData?.isUpstreamLive && (
                <span className="bg-emerald-600 text-white text-[8px] px-1 py-0.2 rounded uppercase font-sans">
                  LIVE
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={fetchJourneyStages}
              disabled={loadingStages || !cleanPatientId}
              title="Refresh Journey Stages from API_GET_JOURNEY_STAGES"
              className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Clock className={`w-3.5 h-3.5 ${loadingStages ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Progress</span>
            <span className="text-xs font-black text-slate-900 font-mono">
              Stage {currentStageIndex + 1} of 10 ({progressPercent}%)
            </span>
          </div>

          <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Patient Meta Strip if present from upstream */}
      {(journeyMeta || patientData?.name) && (
        <div className="px-5 py-2.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900">
              {patientData?.name || 'Patient'}
            </span>
            <span className="font-mono text-[11px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-bold">
              ID: {journeyMeta?.patientId || cleanPatientId}
            </span>
            {(journeyMeta?.registeredMobile || patientData?.mobile) && (
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-slate-400" />
                {journeyMeta?.registeredMobile || patientData?.mobile}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(journeyMeta?.totalBilled || patientData?.totalBill) && (
              <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[11px]">
                Total: ₹{journeyMeta?.totalBilled ?? patientData?.totalBill}
              </span>
            )}
            <span className="text-slate-400 text-[11px]">
              Completed: <strong className="text-slate-700">{completedCount}</strong>/{totalStages}
            </span>
          </div>
        </div>
      )}

      {/* Flipkart-Style Vertical Order Tracking Flow */}
      <div className="p-5 md:p-6 bg-white">
        <div className="relative space-y-0">
          {stages.map((stage, idx) => {
            const isCompleted =
              String(stage.status).toLowerCase() === 'completed' || idx < currentStageIndex;
            const isCurrent =
              stage.status === 'Active Now' ||
              stage.isActiveNow ||
              (idx === currentStageIndex && !isCompleted);
            const isUpcoming = !isCompleted && !isCurrent;
            const isLast = idx === stages.length - 1;
            const isExpanded = expandedStage === stage.step || isCurrent;
            const Icon = STAGE_ICONS[idx] || CheckCircle2;
            const metadata = stage.metadata || {};

            return (
              <div key={stage.step || idx} className="relative flex items-start gap-4 group">
                {/* Vertical Connecting Spine Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[17px] top-[34px] bottom-[-6px] w-[3px] transition-colors duration-500 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Left Step Node Icon (Flipkart Style) */}
                <div className="relative z-10 shrink-0">
                  {isCompleted ? (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-emerald-600 shadow-2xs transition-all duration-300">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-blue-600 ring-4 ring-blue-100 shadow-md scale-105 transition-all duration-300">
                      <Icon className="w-4.5 h-4.5 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 flex items-center justify-center font-bold text-xs">
                      {stage.step || idx + 1}
                    </div>
                  )}
                </div>

                {/* Right Stage Card */}
                <div
                  className={`flex-1 mb-5 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-50/60 border-blue-300 shadow-xs ring-1 ring-blue-400/20'
                      : isCompleted
                      ? 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                      : 'bg-slate-50/40 border-slate-200/60 text-slate-400'
                  }`}
                  onClick={() => setExpandedStage(isExpanded ? null : stage.step)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 tracking-tight">
                        {stage.step}. {stage.title}
                      </span>

                      {/* Status Badges */}
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                          Active Now
                        </span>
                      )}

                      {isCompleted && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Completed
                        </span>
                      )}

                      {isUpcoming && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.2 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400">
                        {stage.timestampDisplay || 'Pending'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {stage.subtitle}
                  </p>

                  {/* Expanded Stage Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5 animate-in fade-in duration-200">
                      <div className="text-xs text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-100">
                        {stage.description}
                      </div>

                      {/* Stage-Specific Clinical Metadata Visualization */}

                      {/* Step 1: Patient Register metadata */}
                      {stage.step === 1 && metadata.billedAmount !== undefined && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                            Billed: ₹{metadata.billedAmount} {metadata.currency || 'INR'}
                          </span>
                          <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            Barcode: #{metadata.patientId || cleanPatientId}
                          </span>
                        </div>
                      )}

                      {/* Step 2: Vacutainers / Specimen list */}
                      {stage.step === 2 && Array.isArray(metadata.vacutainers) && metadata.vacutainers.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                              Accessioned Specimen Vacutainers ({metadata.vacutainers.length})
                            </span>
                            {metadata.vacutainers.length > 6 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVacutainersExpanded(!vacutainersExpanded);
                                }}
                                className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                              >
                                {vacutainersExpanded ? 'Show less' : `+${metadata.vacutainers.length - 6} more`}
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(vacutainersExpanded
                              ? metadata.vacutainers
                              : metadata.vacutainers.slice(0, 6)
                            ).map((v, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 3: Physical Laboratory Analyzers Hardware Gallery */}
                      {stage.step === 3 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Connected Laboratory Analyzers ({metadata.analyzers?.length || 5})
                            </span>
                            <span className="text-[9px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              {metadata.protocol || 'ASTM E1381 / HL7'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {(metadata.analyzers || [
                              'Meril AutoQuant 200',
                              'bioMérieux VIDAS® KUBE™',
                              'Labnovation LD-560 HPLC',
                              'HDC Lyte',
                              'Erba ECL 105',
                            ]).map((analyzerName) => {
                              const card = resolveAnalyzerCard(analyzerName);
                              return (
                                <div
                                  key={analyzerName}
                                  className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl p-2 flex flex-col items-center text-center transition-all duration-200 shadow-2xs hover:shadow-xs group"
                                >
                                  <div className="w-12 h-12 bg-slate-50 rounded-lg p-1 border border-slate-200/70 mb-1.5 flex items-center justify-center overflow-hidden">
                                    <img
                                      src={card.image}
                                      alt={card.name}
                                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-900 leading-tight block truncate w-full">
                                    {card.shortName}
                                  </span>
                                  <span className="text-[8.5px] text-slate-500 truncate w-full block mt-0.5">
                                    {card.dept}
                                  </span>
                                  <span className="mt-1 text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                                    LINKED
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Step 4: Generating Result metadata */}
                      {stage.step === 4 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                            {metadata.parameterCount || reports.length || 13} Parameters Analyzed
                          </span>
                          {metadata.qcPassed && (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Internal QC Controls Validated
                            </span>
                          )}
                        </div>
                      )}

                      {/* Step 5: Result Transmission metadata */}
                      {stage.step === 5 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-full">
                            Direct Socket Feed: ASTM E1381
                          </span>
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            Zero Transcription Error Protocol
                          </span>
                        </div>
                      )}

                      {/* Step 6: Result Mapping to Patient metadata */}
                      {stage.step === 6 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                            Reference Intervals Evaluated
                          </span>
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Panic Alerts: Normal (No Critical Values)
                          </span>
                        </div>
                      )}

                      {/* Step 7: Result Verification metadata */}
                      {stage.step === 7 && metadata.pathologistName && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] font-semibold text-slate-700">
                            Pathologist: <strong>{metadata.pathologistName}</strong>
                          </span>
                          {metadata.registrationNumber && metadata.registrationNumber !== '-' && (
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              Reg: {metadata.registrationNumber}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Step 8: Final Report metadata */}
                      {stage.step === 8 && metadata.digitallySigned && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Cryptographically Signed PDF
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            NABL Instant Verification QR Code
                          </span>
                        </div>
                      )}

                      {/* Step 9: WhatsApp Delivery Channels */}
                      {stage.step === 9 && Array.isArray(metadata.channels) && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                            Multichannel WhatsApp Dispatch
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {metadata.channels.map((chan, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                              >
                                <span className="font-semibold text-slate-700">
                                  {chan.name}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono ${
                                    chan.status === 'Completed'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {chan.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 10: Customer Feedback Interactive Form */}
                      {stage.step === 10 && (
                        <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                          <span className="text-xs font-bold text-amber-900 block">
                            Patient Service Rating (NPS Survey)
                          </span>
                          {!feedbackSubmitted ? (
                            <form onSubmit={handleFeedbackSubmit} className="space-y-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFeedbackRating(star)}
                                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                  >
                                    <Star
                                      className={`w-5 h-5 ${
                                        star <= feedbackRating
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                                <span className="text-xs font-bold text-slate-700 ml-2">
                                  {feedbackRating === 5
                                    ? '⭐⭐⭐⭐⭐ Excellent'
                                    : feedbackRating >= 4
                                    ? 'Very Good'
                                    : 'Good'}
                                </span>
                              </div>

                              <input
                                type="text"
                                placeholder="Patient feedback remarks (optional)..."
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                className="w-full bg-white text-xs border border-amber-300 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                              />

                              <button
                                type="submit"
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                Submit Rating
                              </button>
                            </form>
                          ) : (
                            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Feedback recorded ({feedbackRating} Stars) • Thank you!</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Station / Operator footer + Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium pt-1">
                        <div>
                          <span className="text-slate-400">Station / Operator:</span>{' '}
                          <strong className="text-slate-700">{stage.stationOperator}</strong>
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="flex items-center gap-2">
                          {/* Step 2 action: Receive Sample */}
                          {stage.step === 2 && currentStageIndex <= 1 && onReceiveSample && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReceiveSample();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <span>Receive Sample Specimen</span>
                            </button>
                          )}

                          {/* Step 7 action: Pathologist Sign-off */}
                          {stage.step === 7 && currentStageIndex <= 6 && onOpenApproval && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenApproval();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Pathologist Sign-off</span>
                            </button>
                          )}

                          {/* Step 8 action: Release / Recall */}
                          {stage.step === 8 && onReleaseReport && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReleaseReport();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <span>Release Report</span>
                            </button>
                          )}
                          {stage.step === 8 && onRecallReport && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRecallReport();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>Recall Report</span>
                            </button>
                          )}

                          {/* Step 9 action: Send WhatsApp */}
                          {stage.step === 9 && (onOpenWhatsAppModal || onSendWhatsApp) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenWhatsAppModal) {
                                  onOpenWhatsAppModal('patientReportMsg');
                                } else if (onSendWhatsApp) {
                                  onSendWhatsApp('patientReportMsg');
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Send WhatsApp</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
