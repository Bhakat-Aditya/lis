import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils.js';
import { useMaster } from '../../context/context.master.jsx';
import { groupInvestigationsIntoLots } from '../../utils/labTestUtils.js';
import PatientEmrHistory from './PatientEmrHistory.jsx';
import ReportActivityLog from './ReportActivityLog.jsx';


export default function PatientProfileView({
  patient,
  reports = [],
  onAddTests,
  onFillResults,
  onPrintInvoice,
  onPrintReport,
  onReceiveSample,
  onAddDeposit,
  onAddDiscount,
  onOpenSettings,
}) {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' or 'deposits'

  if (!patient) {
    return (
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400">
        No patient record loaded.
      </div>
    );
  }

  const pid = patient.patientId || patient.slNo || '';
  const { tests: catalogTests = [], profiles: catalogProfiles = [], packages: catalogPackages = [] } = useMaster();
  const [expandedLots, setExpandedLots] = useState({});

  const investigationLots = useMemo(() => {
    return groupInvestigationsIntoLots(reports, patient, catalogProfiles, catalogPackages, catalogTests);
  }, [reports, patient, catalogProfiles, catalogPackages, catalogTests]);

  const hasReports = reports && reports.length > 0;
  const lotsTotal = useMemo(() => {
    return investigationLots.reduce((acc, lot) => acc + (Number(lot.amount) || 0), 0);
  }, [investigationLots]);
  const reportsTotal = hasReports
    ? reports.reduce((acc, r) => acc + (Number(r.rate) || 0), 0)
    : 0;
  const testsTotal = Number(patient.totalBill) > 0
    ? Number(patient.totalBill)
    : (lotsTotal > 0 ? lotsTotal : (hasReports ? reportsTotal : 0));
  const isBilled = testsTotal > 0;
  const discountAmount = Number(patient.discount || 0);
  const netDue = Math.max(0, testsTotal - discountAmount);
  const depositsAmount = Number(patient.paidBill || 0);
  const explicitDue = (patient.balance !== undefined && patient.balance !== null)
    ? Number(patient.balance)
    : (patient.dueAmount !== undefined ? Number(patient.dueAmount) : null);
  const balanceDue = isBilled
    ? (explicitDue !== null ? explicitDue : Math.max(0, netDue - depositsAmount))
    : 0;
  const isPaid = isBilled && balanceDue <= 0 && (depositsAmount >= netDue || patient.billPayStatus === 2 || patient.billPayStatus === '2');
  const advanceAmount = Number(patient.advance || 0);
  const paymentLines = patient.paymentLines || patient.payments || [];

  // Status percentage
  const statusStr = String(patient.status || '').toUpperCase();
  const isReady = ['APPROVED', 'PRINTING', 'RELEASED', 'READY', 'REPORT READY'].includes(statusStr);
  const progressPercent = isReady ? 100 : statusStr.includes('TEST') ? 70 : statusStr.includes('SAMPLE') ? 50 : 25;

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
                <div className="text-[11px] text-blue-700 font-mono font-bold">PID: #{pid}</div>
              </div>
            </div>
            <button
              onClick={onOpenSettings}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg transition-colors text-slate-500 cursor-pointer"
              title="Patient Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
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
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 text-sky-600 font-bold text-center shrink-0">⚥</span>
              <span className="font-semibold text-slate-500 w-28 shrink-0">Gender/Age:</span>
              <span className="font-semibold text-slate-800">
                {patient.gender || 'Male'} / {patient.age || '1'}{!String(patient.age || '').toLowerCase().includes('year') && !String(patient.age || '').toLowerCase().includes('day') ? ` ${patient.age_unit || 'Days'}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-semibold text-slate-500 w-28 shrink-0">Collection Date:</span>
              <span className="font-semibold text-slate-800">
                {formatDisplayDate(patient.collectionDate || patient.regDate) || '—'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-semibold text-slate-500 w-28 shrink-0">Referred By:</span>
              <span className="font-semibold text-slate-800 truncate">
                {patient.referedDr || 'D. A . KHAN MD PEDIATRICS'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 text-sky-600 font-bold text-center shrink-0">🏥</span>
              <span className="font-semibold text-slate-500 w-28 shrink-0">Center:</span>
              <span className="font-semibold text-slate-800">{patient.center || 'Main'}</span>
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

            <div className="pt-1">
              {isReady ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#10b981] text-white text-[11px] font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Report Ready</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#3b82f6] text-white text-[11px] font-bold">
                  <User className="w-3.5 h-3.5" />
                  <span>Registered</span>
                </span>
              )}
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
              className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Order Tests</span>
            </button>

            {/* 1. Add Deposit / Record Payment (Vibrant Emerald) */}
            <button
              onClick={onAddDeposit}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Deposit</span>
            </button>

            {/* 2. Print Invoice (Vibrant Amber) */}
            <button
              onClick={onPrintInvoice}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            {/* 3. Add Discount (Soft Rose) */}
            <button
              onClick={onAddDiscount}
              className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 active:scale-95 text-rose-700 font-bold text-xs py-2.5 px-3 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <MinusCircle className="w-4 h-4 text-rose-500" />
              <span>Add Discount</span>
            </button>

            {/* 4. Fill Results (Vibrant Blue) */}
            <button
              onClick={onFillResults}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FileEdit className="w-4 h-4" />
              <span>Fill Results</span>
            </button>

            {/* 5. View Report (Vibrant Teal) */}
            <button
              onClick={onPrintReport}
              className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>View Report</span>
            </button>

            {/* 6. Receive Sample (Vibrant Indigo) */}
            <button
              onClick={onReceiveSample}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer col-span-2"
            >
              <TestTube className="w-4 h-4" />
              <span>Receive Sample Specimen</span>
            </button>
          </div>
        </div>

        {/* Financial Summary 4-Metric Cards matching Screenshot 2 */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <span>💳</span> Financial Summary
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Amount */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-center space-y-1">
              <div className="flex justify-center text-sky-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-base font-extrabold text-sky-600 font-mono">
                ₹{testsTotal.toFixed(2)}
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
                      ₹{testsTotal.toFixed(2)}
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
        </div>
      </div>

      {/* BOTTOM SECTION: Patient EMR History & Report Activity Log */}
      <div className="lg:col-span-12 space-y-4 pt-1">
        <PatientEmrHistory
          patientId={pid}
          currentPatient={patient}
        />

        <ReportActivityLog
          patientId={pid}
        />
      </div>
    </div>
  );
}

