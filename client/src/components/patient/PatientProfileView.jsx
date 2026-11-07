import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Calendar,
  Settings,
  CheckCircle,
  AlertTriangle,
  FileEdit,
  Printer,
  Plus,
  PlusCircle,
  MinusCircle,
  TestTube,
  FileText,
  FileCheck,
  CreditCard,
  ArrowDownRight,
  Banknote,
  DollarSign,
  Package,
  Layers,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  ListTree,
  Edit,
  Send,
  MessageSquare,
  Activity,
  UserCheck,
  Stethoscope,
  Building2,
  Undo2,
  ExternalLink,
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils.js';
import { useMaster } from '../../context/context.master.jsx';
import { useAuth } from '../../context/context.auth.jsx';
import { groupInvestigationsIntoLots } from '../../utils/labTestUtils.js';
import PatientEmrHistory from './PatientEmrHistory.jsx';
import ReportActivityLog from './ReportActivityLog.jsx';
import PatientJourneyTimeline from './PatientJourneyTimeline.jsx';

const formatGender = (raw) => {
  const s = String(raw || '').trim().toLowerCase();
  if (s.startsWith('m')) return 'Male';
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('t') || s.startsWith('o')) return 'Transgender';
  return raw || 'Male';
};

export default function PatientProfileView({
  patient,
  reports = [],
  templates = [],
  onAddTests,
  onFillResults,
  onPrintInvoice,
  onPrintReport,
  onReceiveSample,
  onReleaseReport,
  onRecallReport,
  onSendWhatsApp,
  onOpenWhatsAppModal,
  onAddDeposit,
  onAddDiscount,
  onOpenSettings,
  onEditPatient,
  onEditBill,
  onTrackJourney,
}) {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'timeline' | 'deposits'
  const [showWhatsAppDropdown, setShowWhatsAppDropdown] = useState(false);

  if (!patient) {
    return (
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400">
        No patient record loaded.
      </div>
    );
  }

  const rawPid = String(patient.patientId || patient.slNo || '').trim();
  const pid = rawPid.toUpperCase().startsWith('P')
    ? `P${rawPid.replace(/^P+/i, '')}`
    : rawPid;
  const navigate = useNavigate();
  const { canViewPatientLogs, canViewPatientEmr } = useAuth();
  const { tests: catalogTests = [], profiles: catalogProfiles = [], packages: catalogPackages = [], templates: catalogTemplates = [] } = useMaster();
  const [expandedLots, setExpandedLots] = useState({});

  const investigationLots = useMemo(() => {
    return groupInvestigationsIntoLots(
      reports,
      patient,
      catalogProfiles,
      catalogPackages,
      catalogTests,
      catalogTemplates,
      templates
    );
  }, [reports, patient, catalogProfiles, catalogPackages, catalogTests, catalogTemplates, templates]);

  const hasReports = reports && reports.length > 0;
  const lotsTotal = useMemo(() => {
    return investigationLots.reduce((acc, lot) => acc + (Number(lot.amount) || 0), 0);
  }, [investigationLots]);
  const reportsTotal = hasReports
    ? reports.reduce((acc, r) => acc + (Number(r.rate) || 0), 0)
    : 0;

  // Financial calculation aligned strictly with official LIS invoice:
  // Gross Total = Sum of test lot rates before discount (e.g. ₹800.00)
  // Discount = Discount Amount (e.g. ₹200.00)
  // Net Bill = Gross Total - Discount = Total Bill (e.g. ₹600.00)
  // Deposits = Total payments received (e.g. ₹0.00)
  // Balance Due = Net Bill - Deposits = Outstanding Due (e.g. ₹600.00)
  const discountAmount = Number(patient.discount || 0);
  const syncedGross = Number(patient.grossTotal || 0);
  const syncedNet = Number(patient.totalBill || 0);

  const grossTotal = lotsTotal > 0
    ? lotsTotal
    : (syncedGross > 0
        ? syncedGross
        : (syncedNet > 0 && discountAmount > 0
            ? syncedNet + discountAmount
            : (syncedNet > 0 ? syncedNet : (hasReports ? reportsTotal : 0))));

  const netBill = syncedNet > 0 && syncedNet !== grossTotal
    ? syncedNet
    : Math.max(0, grossTotal - discountAmount);

  const isStatusPaid = patient.billPayStatus === 2 || patient.billPayStatus === '2';
  const rawPaid = Number(patient.paidBill || 0);
  const depositsAmount = rawPaid > 0
    ? rawPaid
    : (isStatusPaid && netBill > 0 ? netBill : 0);

  const explicitDue =
    patient.dueAmount !== undefined && patient.dueAmount !== null
      ? Number(patient.dueAmount)
      : (patient.balance !== undefined && patient.balance !== null
          ? Number(patient.balance)
          : null);

  const isBilled = grossTotal > 0 || netBill > 0;
  const balanceDue = isBilled
    ? (isStatusPaid
        ? 0
        : (explicitDue !== null && !isNaN(explicitDue)
            ? Math.max(0, explicitDue)
            : Math.max(0, netBill - depositsAmount)))
    : 0;

  const isPaid = isBilled && (isStatusPaid || (balanceDue <= 0 && depositsAmount >= netBill));
  const advanceAmount = Number(patient.advance || 0);
  const paymentLines = patient.paymentLines || patient.payments || [];

  // Status percentage and normalization
  const statusStr = String(patient.status || '').toUpperCase();
  const isReady = ['APPROVED', 'PRINTING', 'RELEASED', 'READY', 'REPORT READY', 'VERIFIED'].includes(statusStr);
  const progressPercent = isReady
    ? 100
    : statusStr.includes('PRINT')
    ? 85
    : statusStr.includes('FULL') || statusStr.includes('TEST')
    ? 70
    : statusStr.includes('PART')
    ? 60
    : statusStr.includes('SAMPLE')
    ? 50
    : 25;

  const renderStatusBadge = () => {
    if (statusStr.includes('SAMPLE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-2xs whitespace-nowrap">
          <FlaskConical className="w-3 h-3" />
          <span>SAMPLE</span>
        </span>
      );
    }
    if (statusStr.includes('PART')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold shadow-2xs whitespace-nowrap">
          <FileText className="w-3 h-3" />
          <span>RESULT PARTLY</span>
        </span>
      );
    }
    if (statusStr.includes('FULL') || statusStr.includes('TEST')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow-2xs whitespace-nowrap">
          <FileCheck className="w-3 h-3" />
          <span>RESULT FULLY</span>
        </span>
      );
    }
    if (statusStr.includes('PRINT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold shadow-2xs whitespace-nowrap">
          <Printer className="w-3 h-3" />
          <span>PRINTING</span>
        </span>
      );
    }
    if (isReady) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10b981] text-white text-[10px] font-bold shadow-2xs whitespace-nowrap">
          <CheckCircle className="w-3 h-3" />
          <span>RELEASED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-2xs whitespace-nowrap">
        <User className="w-3 h-3" />
        <span>{patient.status || 'ENTRY'}</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* LEFT COLUMN: Patient Profile Card & Status Cards (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Card 1: Patient Profile matching Screenshot 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Header Banner (Clean White Theme) */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">Patient Profile</h2>
                <div className="text-[11px] text-blue-700 font-mono font-bold">Barcode: {patient.slNo || patient.barcode || '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEditPatient && onEditPatient(patient)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Edit Patient Demographic Details"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={onOpenSettings}
                className="p-1.5 hover:bg-slate-200/70 rounded-lg transition-colors text-slate-500 cursor-pointer"
                title="Patient Settings / Barcode"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Demographic Rows matching Screenshot 2 */}
          <div className="p-4 space-y-3 text-xs text-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-semibold text-slate-500 w-28 shrink-0">Name:</span>
              <span className="font-bold text-slate-900 truncate">
                {patient.title ? `${patient.title} ` : ''}
                {patient.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-semibold text-slate-500 w-28 shrink-0">Mobile:</span>
              <span className="font-semibold text-slate-800">{patient.mobile || '-'}</span>
              {patient.mobile && (onOpenWhatsAppModal || onSendWhatsApp) && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenWhatsAppModal
                      ? onOpenWhatsAppModal('patientReportMsg')
                      : onSendWhatsApp && onSendWhatsApp('patientReportMsg')
                  }
                  className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer shadow-2xs"
                  title="Open WhatsApp Notification Hub (4 message channels)"
                >
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp Hub</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 text-sky-600 font-bold text-center shrink-0">⚥</span>
              <span className="font-semibold text-slate-500 w-28 shrink-0">Gender/Age:</span>
              <span className="font-semibold text-slate-800">
                {formatGender(patient.gender)} / {patient.age ? `${patient.age}${!String(patient.age).toLowerCase().includes('year') && !String(patient.age).toLowerCase().includes('day') ? ` ${patient.age_unit || 'Years'}` : ''}` : '-'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-semibold text-slate-500 w-28 shrink-0">Reg Date:</span>
              <span className="font-semibold text-slate-800">
                {formatDisplayDate(patient.regDate || patient.collectionDate) || '—'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-slate-500 w-28 shrink-0">Sample Time:</span>
              <span className={patient.sampleTime ? "font-semibold text-slate-800" : "text-slate-400 font-normal italic"}>
                {patient.sampleTime || 'Pending Collection'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-semibold text-slate-500 w-28 shrink-0">Referred By:</span>
              <span className="font-semibold text-slate-800 truncate">
                {patient.referedDr || patient.doctor || patient.referDr || 'Self'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 text-sky-600 font-bold text-center shrink-0">🏥</span>
              <span className="font-semibold text-slate-500 w-28 shrink-0">Center:</span>
              <span className="font-semibold text-slate-800">{patient.center || patient.branch || 'Main'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Report Status & Payment Status matching Screenshot 2 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
          {/* Report Status */}
          <div className="space-y-2">
            <div className="font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>📈</span> Report Status
              </span>
              <span className="text-slate-400 text-[11px] font-medium">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="pt-1 flex items-center justify-between">
              {renderStatusBadge()}
              <button
                type="button"
                onClick={() => {
                  if (onTrackJourney) {
                    onTrackJourney();
                  } else {
                    setActiveTab('timeline');
                  }
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                title="View 10-Stage Flipkart-style diagnostic journey"
              >
                <span>Track 10-Stage Journey →</span>
              </button>
            </div>
          </div>

          {/* Payment Status */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <span>💳</span> Payment Status
            </div>

            <div>
              {!isBilled ? (
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                  <span>Unbilled (No tests ordered)</span>
                </div>
              ) : isPaid ? (
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Payment Complete</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-600 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Payment Pending - Due ₹{balanceDue}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Quick Actions, Financials, Tests Tab (8 cols) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Quick Actions (Screenshot 2: 6 Colorful Buttons) */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <span>🚀</span> Quick Actions
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 0. Order Tests (Vibrant Violet) */}
            <button
              onClick={onAddTests}
              className="flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Order Tests</span>
            </button>

            {/* 1. Add Deposit / Record Payment (Vibrant Emerald) */}
            <button
              onClick={onAddDeposit}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Add Deposit</span>
            </button>

            {/* 2. Print Invoice (Vibrant Amber) */}
            <button
              onClick={onPrintInvoice}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Print Invoice</span>
            </button>

            {/* 3. Add Discount (Vibrant Rose) */}
            <button
              onClick={onAddDiscount}
              className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <MinusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Add Discount</span>
            </button>

            {/* 4. Fill Results (Vibrant Blue) */}
            <button
              onClick={onFillResults}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Fill Results</span>
            </button>

            {/* 5. Receive Sample (Vibrant Indigo) */}
            <button
              onClick={onReceiveSample}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <TestTube className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Receive Sample</span>
            </button>

            {/* 6. Release Report (Vibrant Teal) */}
            <button
              onClick={onReleaseReport}
              className="flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
              title="Release finalized diagnostic report (RELEASEREPORT)"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Release Report</span>
            </button>

            {/* 6b. Recall Report (Task 10: RECALLPORT) */}
            {onRecallReport && (
              <button
                onClick={onRecallReport}
                className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                title="Recall report back to testing/draft status (RECALLPORT)"
              >
                <Undo2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Recall Report</span>
              </button>
            )}

            {/* 7. WhatsApp Resend with Message Type Dropdown (Task 11) */}
            <div className="relative">
              <div className="flex rounded-xl shadow-xs overflow-hidden h-full">
                <button
                  type="button"
                  onClick={() =>
                    onOpenWhatsAppModal
                      ? onOpenWhatsAppModal('patientReportMsg')
                      : onSendWhatsApp && onSendWhatsApp('patientReportMsg')
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2 px-2 transition-all cursor-pointer truncate"
                  title="Send report directly to patient via WhatsApp (sendType=patientReportMsg)"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppDropdown((prev) => !prev)}
                  className="px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center border-l border-emerald-500/50 cursor-pointer transition-colors"
                  title="Select WhatsApp Message Type"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showWhatsAppDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown Menu for all 4 types */}
              {showWhatsAppDropdown && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-xs"
                  onClick={() => setShowWhatsAppDropdown(false)}
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>Select Message Type</span>
                    <span className="font-mono text-indigo-600">sendType</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onSendWhatsApp
                        ? onSendWhatsApp('onboardingMsg')
                        : onOpenWhatsAppModal && onOpenWhatsAppModal('onboardingMsg')
                    }
                    className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="font-bold block text-xs text-slate-900">1. Onboarding Message</span>
                      <span className="text-[10px] text-slate-400 font-mono">sendType=onboardingMsg</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onSendWhatsApp
                        ? onSendWhatsApp('patientReportMsg')
                        : onOpenWhatsAppModal && onOpenWhatsAppModal('patientReportMsg')
                    }
                    className="w-full text-left px-2.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-bold block text-xs text-slate-900">2. Report to Patient</span>
                      <span className="text-[10px] text-slate-400 font-mono">sendType=patientReportMsg</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onSendWhatsApp
                        ? onSendWhatsApp('doctorReportMsg')
                        : onOpenWhatsAppModal && onOpenWhatsAppModal('doctorReportMsg')
                    }
                    className="w-full text-left px-2.5 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-800 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold block text-xs text-slate-900">3. Report to Doctor</span>
                      <span className="text-[10px] text-slate-400 font-mono">sendType=doctorReportMsg</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onSendWhatsApp
                        ? onSendWhatsApp('agentReportMsg')
                        : onOpenWhatsAppModal && onOpenWhatsAppModal('agentReportMsg')
                    }
                    className="w-full text-left px-2.5 py-2 hover:bg-purple-50 text-slate-700 hover:text-purple-800 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div>
                      <span className="font-bold block text-xs text-slate-900">4. Report to Agent</span>
                      <span className="text-[10px] text-slate-400 font-mono">sendType=agentReportMsg</span>
                    </div>
                  </button>

                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onOpenWhatsAppModal && onOpenWhatsAppModal('patientReportMsg')}
                      className="w-full text-center py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl cursor-pointer transition-colors"
                    >
                      Open WhatsApp Notification Hub...
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dedicated WhatsApp Report Dispatch Section (Task 11: 4 Channels) */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">
                WhatsApp Dispatch Center
              </h4>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                4 Supported Channels
              </span>
            </div>

            {onOpenWhatsAppModal && (
              <button
                type="button"
                onClick={() => onOpenWhatsAppModal('patientReportMsg')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Dispatch Hub & Preview →</span>
              </button>
            )}
          </div>

          {/* 4 Separate Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Button 1: Onboarding Message */}
            <button
              type="button"
              onClick={() =>
                onSendWhatsApp
                  ? onSendWhatsApp('onboardingMsg')
                  : onOpenWhatsAppModal && onOpenWhatsAppModal('onboardingMsg')
              }
              className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-bold text-xs py-2 px-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Dispatches welcome greetings, patient ID & barcode (sendType=onboardingMsg)"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">1. Onboarding Msg</span>
            </button>

            {/* Button 2: Report to Patient */}
            <button
              type="button"
              onClick={() =>
                onSendWhatsApp
                  ? onSendWhatsApp('patientReportMsg')
                  : onOpenWhatsAppModal && onOpenWhatsAppModal('patientReportMsg')
              }
              className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs py-2 px-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Dispatches official diagnostic PDF report link to patient (sendType=patientReportMsg)"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">2. Report to Patient</span>
            </button>

            {/* Button 3: Report to Doctor */}
            <button
              type="button"
              onClick={() =>
                onSendWhatsApp
                  ? onSendWhatsApp('doctorReportMsg')
                  : onOpenWhatsAppModal && onOpenWhatsAppModal('doctorReportMsg')
              }
              className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold text-xs py-2 px-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Dispatches diagnostic findings & report to referring doctor (sendType=doctorReportMsg)"
            >
              <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">3. Report to Doctor</span>
            </button>

            {/* Button 4: Report to Referring Agent */}
            <button
              type="button"
              onClick={() =>
                onSendWhatsApp
                  ? onSendWhatsApp('agentReportMsg')
                  : onOpenWhatsAppModal && onOpenWhatsAppModal('agentReportMsg')
              }
              className="flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-bold text-xs py-2 px-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Dispatches report copy & collection update to referring agent (sendType=agentReportMsg)"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">4. Report to Agent</span>
            </button>
          </div>
        </div>

        {/* Financial Summary 4-Metric Cards matching Screenshot 2 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>💳</span> Financial Summary
            </div>
            {onEditBill && (
              <button
                onClick={onEditBill}
                className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Edit bill particulars and rates (BILLUPDATE)"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Amount */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-center space-y-1">
              <div className="flex justify-center text-sky-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-base font-extrabold text-sky-600 font-mono">
                ₹{grossTotal.toFixed(2)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Total Amount</div>
            </div>

            {/* Discount */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-center space-y-1">
              <div className="flex justify-center text-emerald-600">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div className="text-base font-extrabold text-emerald-600 font-mono">
                ₹{discountAmount.toFixed(2)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Discount</div>
            </div>

            {/* Deposits */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-center space-y-1">
              <div className="flex justify-center text-sky-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-base font-extrabold text-sky-700 font-mono">
                ₹{depositsAmount.toFixed(2)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">Deposits</div>
            </div>

            {/* Balance Due (Outstanding) */}
            <div className={`p-3 border rounded-lg text-center space-y-1 ${
              balanceDue > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className={`flex justify-center ${balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                <Banknote className="w-5 h-5" />
              </div>
              <div className={`text-base font-extrabold font-mono ${
                balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                ₹{balanceDue.toFixed(2)}
              </div>
              <div className={`text-[11px] font-bold ${
                balanceDue > 0 ? 'text-amber-900' : 'text-emerald-800'
              }`}>
                {balanceDue > 0 ? 'Balance Due' : 'Fully Settled'}
              </div>
            </div>
          </div>
        </div>

        {/* Tests & Deposits Tabbed Section matching Screenshot 2 */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-3 pt-2 text-xs font-bold">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('tests')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'tests'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tests ({reports.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'timeline'
                    ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>10-Stage Workflow Journey</span>
              </button>

              <button
                onClick={() => setActiveTab('deposits')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'deposits'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Deposits ({paymentLines.length > 0 ? paymentLines.length : (depositsAmount > 0 ? 1 : 0)})</span>
              </button>
            </div>

            {activeTab === 'tests' && (
              <button
                onClick={onAddTests}
                className="mb-1.5 flex items-center gap-1 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs py-1 px-3 rounded-lg shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Add Tests</span>
              </button>
            )}

            {activeTab === 'deposits' && (
              <button
                onClick={onAddDeposit}
                className="mb-1.5 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-1 px-3 rounded-lg shadow-xs cursor-pointer transition-all"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Add Deposit</span>
              </button>
            )}
          </div>

          {/* Tab 1: Tests Table */}
          {activeTab === 'tests' && (
            <div className="p-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                    <th className="py-2 px-3 w-12">#</th>
                    <th className="py-2 px-3">Investigation Lot Name</th>
                    <th className="py-2 px-3 text-right w-32">Lot Rate (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {investigationLots.length > 0 ? (
                    investigationLots.map((lot, i) => {
                      const isExpanded = Boolean(expandedLots[lot.id]);
                      const hasSubTests = lot.subTests && lot.subTests.length > 0;

                      let badgeColor = 'bg-sky-50 text-sky-800 border-sky-300';
                      let catIcon = <FlaskConical className="w-3 h-3 text-sky-600" />;
                      if (lot.category === 'Package') {
                        badgeColor = 'bg-amber-50 text-amber-900 border-amber-300';
                        catIcon = <Package className="w-3 h-3 text-amber-600" />;
                      } else if (lot.category === 'Profile') {
                        badgeColor = 'bg-purple-50 text-purple-900 border-purple-300';
                        catIcon = <Layers className="w-3 h-3 text-purple-600" />;
                      } else if (lot.category === 'Template') {
                        badgeColor = 'bg-rose-50 text-rose-900 border-rose-300';
                        catIcon = <FileText className="w-3 h-3 text-rose-600" />;
                      }

                      return (
                        <React.Fragment key={lot.id || i}>
                          <tr className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-500">{i + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}
                                  >
                                    {catIcon}
                                    <span>{lot.category} Lot</span>
                                  </span>
                                  <span className="font-bold text-slate-900">{lot.name}</span>
                                  {lot.category === 'Template' && (
                                    <div className="inline-flex items-center gap-1.5 ml-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const repId = lot.reportId || lot.testId || 'P14R1';
                                          navigate(`/patients/${pid}/template/${repId}?name=${encodeURIComponent(lot.name)}`);
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[11px] transition-all shadow-2xs cursor-pointer"
                                        title="Open template workspace and fill findings for this patient"
                                      >
                                        <FileEdit className="w-3 h-3" />
                                        <span>Open Template</span>
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {hasSubTests && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedLots((prev) => ({
                                        ...prev,
                                        [lot.id]: !prev[lot.id],
                                      }))
                                    }
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <ListTree className="w-3 h-3" />
                                    <span>
                                      {lot.subTestCount} Included Parameter{lot.subTestCount === 1 ? '' : 's'}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {Number(lot.amount || 0).toFixed(2)}
                            </td>
                          </tr>

                          {/* Expanded sub-test chips */}
                          {isExpanded && hasSubTests && (
                            <tr className="bg-slate-50/60">
                              <td colSpan="3" className="py-2.5 px-6">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Included tests in {lot.name}:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {lot.subTests.map((sub, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="text-[10px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                                      >
                                        {sub}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <TestTube className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600">No diagnostic tests ordered yet</p>
                          <p className="text-[11px] text-slate-400">Click below to search tests catalog and order investigations.</p>
                          <button
                            onClick={onAddTests}
                            className="mt-1 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs cursor-pointer transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Order Tests for this Patient</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50/50">
                    <td colSpan="2" className="py-2.5 px-3 text-right font-bold text-slate-800">
                      Total:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-indigo-700">
                      ₹{grossTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Tab 2: Deposits Table */}
          {activeTab === 'deposits' && (
            <div className="p-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                    <th className="py-2 px-3 w-12">#</th>
                    <th className="py-2 px-3">Receipt / Mode</th>
                    <th className="py-2 px-3">Date & Time</th>
                    <th className="py-2 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paymentLines.length > 0 ? (
                    paymentLines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{line.mode || 'CASH'} (Counter Receipt)</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {line.date || formatDisplayDate(patient.regDate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          ₹{Number(line.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : depositsAmount > 0 ? (
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-500">1</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cash (Counter Receipt)</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {formatDisplayDate(patient.collectionDate || patient.regDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        ₹{depositsAmount.toFixed(2)}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400 italic">
                        No deposits recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
                {depositsAmount > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50/70 font-bold text-xs">
                      <td colSpan="3" className="py-2 px-3 text-right text-slate-600">
                        Total Deposited:
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700 font-extrabold">
                        ₹{depositsAmount.toFixed(2)}
                      </td>
                    </tr>
                    {balanceDue > 0 && (
                      <tr className="bg-amber-50/50 font-bold text-xs">
                        <td colSpan="3" className="py-2 px-3 text-right text-amber-800">
                          Remaining Balance Due:
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-700 font-extrabold">
                          ₹{balanceDue.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* Tab 3: 10-Stage Journey Timeline (Flipkart Order Tracking Style) */}
          {activeTab === 'timeline' && (
            <div className="p-3 bg-slate-50/50">
              <PatientJourneyTimeline
                patient={patient}
                reports={reports}
                onReceiveSample={onReceiveSample}
                onReleaseReport={onReleaseReport}
                onSendWhatsApp={onSendWhatsApp}
                onOpenWhatsAppModal={onOpenWhatsAppModal}
              />
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Patient EMR History & Report Activity Log (Restricted for Branch) */}
      {(canViewPatientEmr || canViewPatientLogs) && (
        <div className="lg:col-span-12 space-y-4 pt-1">
          {canViewPatientEmr && (
            <PatientEmrHistory
              patientId={pid}
              currentPatient={patient}
            />
          )}

          {canViewPatientLogs && (
            <ReportActivityLog
              patientId={pid}
            />
          )}
        </div>
      )}
    </div>
  );
}

