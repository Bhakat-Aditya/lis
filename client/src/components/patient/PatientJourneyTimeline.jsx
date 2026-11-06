import React, { useState } from 'react';
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
  Send,
  ExternalLink,
  Barcode,
  Radio,
  Undo2,
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils.js';

/**
 * 10-Stage Clinical Workflow Timeline (Flipkart Order History Style)
 * Workflow Stages:
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

const CLINICAL_ANALYZERS = [
  {
    name: 'AutoQuant 200 Excelus',
    shortName: 'AutoQuant 200',
    brand: 'Meril Life Sciences',
    dept: 'Biochemistry',
    image: '/images/machines/autoquant-200.jpg',
  },
  {
    name: 'Hematology Cell Counter 3-Part',
    shortName: 'CBC 3-Part',
    brand: 'Mindray Diagnostics',
    dept: 'Hematology',
    image: '/images/machines/cbc-3part.jpg',
  },
  {
    name: 'VIDAS® KUBE™',
    shortName: 'VIDAS® KUBE™',
    brand: 'bioMérieux',
    dept: 'Immunoassay',
    image: '/images/machines/vidas-kube.jpg',
  },
  {
    name: 'Labnovation LD-560',
    shortName: 'LD-560 HPLC',
    brand: 'Labnovation',
    dept: 'HbA1c Diabetes',
    image: '/images/machines/labnovation-ld560.jpg',
  },
  {
    name: 'HDC Lyte Electrolyte',
    shortName: 'HDC Lyte',
    brand: 'HDC Diagnostics',
    dept: 'Electrolytes',
    image: '/images/machines/hdc-lyte.jpg',
  },
  {
    name: 'Erba ECL 105',
    shortName: 'Erba ECL 105',
    brand: 'Erba Mannheim',
    dept: 'Coagulation',
    image: '/images/machines/erba-ecl105.jpg',
  },
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

  const statusStr = String(patient?.status || '').toUpperCase().trim();
  const regDateFormatted = formatDisplayDate(patient?.regDate || patient?.collectionDate || new Date());
  const sampleTime = patient?.sampleTime || '10:30 AM';

  // Determine current active stage index (0 to 9) dynamically from patient status and live report lot statuses
  const determineCurrentStageIndex = () => {
    const hasReleasedReports = reports.length > 0 && reports.some(r => String(r.status || '').toUpperCase() === 'RELEASED');
    const allReportsReleased = reports.length > 0 && reports.every(r => String(r.status || '').toUpperCase() === 'RELEASED');
    const hasApproved = reports.some(r => r.isApproved || String(r.status || '').toUpperCase() === 'APPROVED');
    const hasSampleReceived = reports.some(r => r.isReceived || String(r.status || '').toUpperCase() === 'SAMPLE');
    const hasResultsEntered = reports.some(r => r.isResultFilled || (r.testParameters && r.testParameters.some(p => p.resultValue)));

    if (allReportsReleased || statusStr === 'RELEASED') return 9; // Stage 10: Feedback (all 9 stages completed)
    if (statusStr === 'PRINTING' || statusStr === 'READY' || hasReleasedReports) return 8; // Stage 9: WhatsApp Delivery
    if (statusStr === 'APPROVED' || statusStr === 'VERIFIED' || hasApproved) return 7; // Stage 8: Final Report Generation
    if (statusStr === 'RESULT FULLY' || statusStr === 'SAVED' || (hasResultsEntered && reports.every(r => r.isResultFilled))) return 6; // Stage 7: Pathologist Verification
    if (statusStr === 'RESULT PARTLY' || statusStr === 'TESTING' || hasResultsEntered) return 4; // Stage 5: Result Transmission
    if (statusStr === 'SAMPLE' || hasSampleReceived) return 2; // Stage 3: Analyzer Connection
    return 1; // Stage 2: Sample Received (Awaiting Phlebotomy)
  };

  const currentStageIndex = determineCurrentStageIndex();

  const stages = [
    {
      id: 0,
      title: 'Patient Register',
      subtitle: 'Demographics & Barcode Registered',
      icon: UserCheck,
      color: 'indigo',
      timestamp: `${regDateFormatted} • 09:45 AM`,
      operator: 'Reception Desk (Sandip)',
      details: `Patient registered with ID #${patient?.slNo || patient?.barcode || patient?.patientId || '-'}. Requisition and barcode generated. Total Billed: ₹${patient?.totalBill || 0}.`,
      actionLabel: null,
    },
    {
      id: 1,
      title: 'Sample Received',
      subtitle: 'Phlebotomy & Accession Desk',
      icon: TestTube2,
      color: 'amber',
      timestamp: `${regDateFormatted} • ${sampleTime}`,
      operator: 'Central Phlebotomy Lab',
      details: 'Specimens accessioned (EDTA Whole Blood, Serum SST & Fluoride Vacutainers). Barcode scanned and verified.',
      actionLabel: currentStageIndex <= 1 && onReceiveSample ? 'Receive Sample Specimen' : null,
      onAction: onReceiveSample,
    },
    {
      id: 2,
      title: 'Analyzer Connection',
      subtitle: 'ASTM E1381 / HL7 Bidirectional Handshake',
      icon: Cpu,
      color: 'blue',
      timestamp: `${regDateFormatted} • 10:48 AM`,
      operator: 'AutoQuant 200, VIDAS KUBE, LD-560 HPLC, HDC Lyte, ECL 105',
      details: 'Bidirectional query protocol initiated across all 5 physical analyzers: Meril AutoQuant 200, bioMérieux VIDAS® KUBE™, Labnovation LD-560 HPLC, HDC Lyte, and Erba ECL 105. Barcodes synchronized with LIS.',
      actionLabel: null,
    },
    {
      id: 3,
      title: 'Generating Result',
      subtitle: 'Analyzer Optical & Impedance Measurement',
      icon: FlaskConical,
      color: 'purple',
      timestamp: `${regDateFormatted} • 11:15 AM`,
      operator: 'Laser Flow Cytometry & Photometry Unit',
      details: `${reports.length || 'Ordered'} parameters analyzed on automated benches. Calibration and internal QC controls passed.`,
      actionLabel: null,
    },
    {
      id: 4,
      title: 'Result Transmission',
      subtitle: 'Direct Data Feed into LIS Middleman',
      icon: Activity,
      color: 'cyan',
      timestamp: `${regDateFormatted} • 11:22 AM`,
      operator: 'LIS ASTM Receiver Socket',
      details: 'Raw parameter packets transmitted into LIS middleman without manual data entry. Zero transcription error protocol.',
      actionLabel: null,
    },
    {
      id: 5,
      title: 'Result Mapping to Patient',
      subtitle: 'Parameter Extraction & Panic Value Check',
      icon: FileSpreadsheet,
      color: 'teal',
      timestamp: `${regDateFormatted} • 11:30 AM`,
      operator: 'Automated Clinical Engine',
      details: 'Numerical values matched against gender/age-specific biological reference intervals. Panic alerts evaluated.',
      actionLabel: null,
    },
    {
      id: 6,
      title: 'Result Verification',
      subtitle: 'Doctor & Pathologist Sign-Off',
      icon: ShieldCheck,
      color: 'emerald',
      timestamp: `${regDateFormatted} • 11:45 AM`,
      operator: 'Dr. S. Mukherjee, MD Pathologist (WBMC-45920)',
      details: 'Clinical correlation and delta checks reviewed and certified by senior pathologist.',
      actionLabel: currentStageIndex <= 6 && onOpenApproval ? 'Pathologist Sign-off' : null,
      onAction: onOpenApproval,
    },
    {
      id: 7,
      title: 'Final Report',
      subtitle: 'NABL QR Code & Digital Signature PDF',
      icon: Printer,
      color: 'pink',
      timestamp: `${regDateFormatted} • 12:05 PM`,
      operator: 'Central Report Engine',
      details: 'Diagnostic PDF report compiled with cryptographically signed digital signature and instant verification QR code.',
      actionLabel: onReleaseReport ? 'Release Report' : null,
      onAction: onReleaseReport,
      secondaryActionLabel: onRecallReport ? 'Recall Report' : null,
      onSecondaryAction: onRecallReport,
    },
    {
      id: 8,
      title: 'WhatsApp Delivery',
      subtitle: 'Automated Dispatch to Registered Mobile',
      icon: MessageSquare,
      color: 'green',
      timestamp: `${regDateFormatted} • 12:10 PM`,
      operator: `Meta WhatsApp Cloud API (${patient?.mobile || 'Patient'})`,
      details: `Official diagnostic PDF and download link delivered to registered phone ${patient?.mobile || 'number'}. Supports 4 channels: Onboarding Msg, Report to Patient, Report to Doctor, Report to Referring Agent.`,
      actionLabel: (onOpenWhatsAppModal || onSendWhatsApp) ? 'Send WhatsApp' : null,
      onAction: () => {
        if (onOpenWhatsAppModal) {
          onOpenWhatsAppModal('patientReportMsg');
        } else if (onSendWhatsApp) {
          onSendWhatsApp('patientReportMsg');
        }
      },
    },
    {
      id: 9,
      title: 'Customer Feedback',
      subtitle: 'Patient Experience & Service Rating',
      icon: Sparkles,
      color: 'amber',
      timestamp: feedbackSubmitted ? 'Rating Recorded' : 'Awaiting Patient Rating',
      operator: 'Patient Experience Desk',
      details: 'Automated feedback survey dispatched. Rating helps lab maintain high clinical precision and care standards.',
      actionLabel: null,
    },
  ];

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
  };

  const progressPercent = Math.round(((currentStageIndex + 1) / stages.length) * 100);

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

      {/* Flipkart-Style Vertical Order Tracking Flow */}
      <div className="p-5 md:p-6 bg-white">
        <div className="relative space-y-0">
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isUpcoming = idx > currentStageIndex;
            const isLast = idx === stages.length - 1;
            const isExpanded = expandedStage === stage.id || isCurrent;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="relative flex items-start gap-4 group">
                {/* Vertical Connecting Spine Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[17px] top-[34px] bottom-[-6px] w-[3px] transition-colors duration-500 ${
                      idx < currentStageIndex ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Left Step Node Icon (Flipkart Style) */}
                <div className="relative z-10 shrink-0">
                  {isCompleted ? (
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
                        isCurrent
                          ? 'bg-blue-600 ring-4 ring-blue-100 shadow-md scale-105'
                          : 'bg-emerald-600 shadow-2xs'
                      }`}
                    >
                      {isCurrent ? (
                        <Icon className="w-4.5 h-4.5 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
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
                  onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 tracking-tight">
                        {idx + 1}. {stage.title}
                      </span>

                      {/* Status Badges */}
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                          Active Now
                        </span>
                      )}

                      {isCompleted && !isCurrent && (
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
                        {stage.timestamp}
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
                        {stage.details}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
                        <div>
                          <span className="text-slate-400">Station / Operator:</span>{' '}
                          <strong className="text-slate-700">{stage.operator}</strong>
                        </div>

                        {/* Interactive Action Button for this stage */}
                        <div className="flex items-center gap-2">
                          {stage.actionLabel && stage.onAction && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                stage.onAction();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <span>{stage.actionLabel}</span>
                            </button>
                          )}

                          {stage.secondaryActionLabel && stage.onSecondaryAction && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                stage.onSecondaryAction();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>{stage.secondaryActionLabel}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Physical Laboratory Analyzers Hardware Gallery for Stage 2 */}
                      {stage.id === 2 && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Connected Laboratory Analyzers ({CLINICAL_ANALYZERS.length})
                            </span>
                            <span className="text-[9px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              All 5 Online
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {CLINICAL_ANALYZERS.map((analyzer) => (
                              <div
                                key={analyzer.name}
                                className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl p-2 flex flex-col items-center text-center transition-all duration-200 shadow-2xs hover:shadow-xs group"
                              >
                                <div className="w-12 h-12 bg-slate-50 rounded-lg p-1 border border-slate-200/70 mb-1.5 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={analyzer.image}
                                    alt={analyzer.name}
                                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-900 leading-tight block truncate w-full">
                                  {analyzer.shortName}
                                </span>
                                <span className="text-[8.5px] text-slate-500 truncate w-full block mt-0.5">
                                  {analyzer.dept}
                                </span>
                                <span className="mt-1 text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                                  LINKED
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Customer Feedback form on Stage 10 */}
                      {stage.id === 9 && (
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

