import React, { useState } from 'react';
import {
  FileEdit,
  Printer,
  FileText,
  PlusCircle,
  MinusCircle,
  FlaskConical,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Calendar,
  Stethoscope,
  Building,
  Settings,
  Share2,
} from 'lucide-react';
import { StatusBadge } from '../common/Badge.jsx';

export default function PatientProfileView({
  patient,
  reports = [],
  onFillResults,
  onPrintInvoice,
  onPrintReport,
  onReceiveSample,
  onAddDeposit,
  onAddDiscount,
  onSendWhatsApp,
}) {
  const [activeTab, setActiveTab] = useState('tests');

  if (!patient) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
        No patient selected
      </div>
    );
  }

  // Derive financial metrics
  const testsTotal = reports.reduce((acc, r) => acc + (Number(r.rate) || 0), 0) || Number(patient.totalBill) || 0;
  const discount = 0;
  const isPaid = patient.billPayStatus === 2 || patient.billPayStatus === '2';
  const deposits = isPaid ? testsTotal : 0;
  const advance = 0;
  const due = Math.max(0, testsTotal - discount - deposits);

  // Status progress percentage
  const getStatusProgress = (status = '') => {
    const s = status.toUpperCase();
    if (s === 'REGISTERED') return 25;
    if (s === 'SAMPLE') return 50;
    if (s === 'TESTING' || s === 'SAVED') return 75;
    if (s === 'VERIFIED' || s === 'PRINTING' || s === 'APPROVED') return 100;
    return 30;
  };

  const progress = getStatusProgress(patient.status);

  return (
    <div className="space-y-4">
      {/* Top Grid: Patient Info Card & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Patient Profile Card (Matching Screenshot 1) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Card Header with Indigo/Blue gradient */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">Patient Profile</h3>
                <span className="text-[11px] text-indigo-100 font-mono">
                  PID: {patient.patientId || patient.slNo || 'N/A'}
                </span>
              </div>
            </div>
            <button className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Details List */}
          <div className="p-4 space-y-3 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <User className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Name
                </span>
                <span className="font-semibold text-slate-900 text-sm">
                  {patient.title ? `${patient.title} ` : ''}{patient.name}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Mobile
                </span>
                <span className="font-medium text-slate-800">
                  {patient.mobile || 'Not Provided'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Gender / Age
                </span>
                <span className="font-medium text-slate-800">
                  {patient.gender || 'N/A'} / {patient.age || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Collection Date
                </span>
                <span className="font-medium text-slate-800">
                  {patient.sampleTime || patient.regDate || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Referred By
                </span>
                <span className="font-semibold text-slate-800">
                  {patient.referedDr || 'Self'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Building className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Center
                </span>
                <span className="font-medium text-slate-800">
                  {patient.branch === '2' ? 'Kolkata Branch' : 'Main Center (Midnapore)'}
                </span>
              </div>
            </div>
          </div>

          {/* Report & Payment Status Mini Card */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">Report Status</span>
                <span className="font-semibold text-indigo-700">{progress}% Complete</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <StatusBadge status={patient.status || 'Registered'} />
                {patient.sampleCollectionType && (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                    {patient.sampleCollectionType}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                Payment Status
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isPaid ? 'Payment Complete' : `Due: ₹${due.toFixed(2)}`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Action Buttons & Financial Summary */}
        <div className="lg:col-span-8 space-y-4">
          {/* Quick Actions Panel (Matching Screenshot 1 colored buttons) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span>Quick Actions</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Fill Results (Green) */}
              <button
                onClick={onFillResults}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2.5 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <FileEdit className="w-4 h-4" />
                <span>Fill Results</span>
              </button>

              {/* Print Invoice (Amber/Yellow) */}
              <button
                onClick={onPrintInvoice}
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs py-2.5 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>

              {/* Print Report (Cyan/Sky) */}
              <button
                onClick={onPrintReport}
                className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs py-2.5 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Print Report</span>
              </button>

              {/* Add Deposit (Navy/Blue) */}
              <button
                onClick={onAddDeposit}
                className="flex items-center justify-center gap-2 bg-indigo-900 hover:bg-indigo-950 text-white font-medium text-xs py-2.5 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Deposit</span>
              </button>

              {/* Add Discount (Red) */}
              <button
                onClick={onAddDiscount}
                className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs py-2.5 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <MinusCircle className="w-4 h-4" />
                <span>Add Discount</span>
              </button>

              {/* Receive Sample (White/Outline) */}
              <button
                onClick={onReceiveSample}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs py-2.5 px-3 rounded-lg border border-slate-300 shadow-xs transition-colors cursor-pointer"
              >
                <FlaskConical className="w-4 h-4 text-indigo-600" />
                <span>Receive Sample</span>
              </button>
            </div>
          </div>

          {/* Financial Summary (4 Metric Cards matching Screenshot 1) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Financial Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Amount */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[11px] font-medium text-slate-500 block mb-1">
                  Total Amount
                </span>
                <span className="text-base font-bold text-indigo-600">
                  ₹{testsTotal.toFixed(2)}
                </span>
              </div>

              {/* Discount */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[11px] font-medium text-slate-500 block mb-1">
                  Discount
                </span>
                <span className="text-base font-bold text-slate-600">
                  ₹{discount.toFixed(2)}
                </span>
              </div>

              {/* Deposits */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[11px] font-medium text-slate-500 block mb-1">
                  Deposits
                </span>
                <span className="text-base font-bold text-sky-600">
                  ₹{deposits.toFixed(2)}
                </span>
              </div>

              {/* Advance / Due */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-lg text-center">
                <span className="text-[11px] font-medium text-emerald-800 block mb-1">
                  {due > 0 ? 'Total Due' : 'Advance'}
                </span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{due > 0 ? due.toFixed(2) : advance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Tests & Deposits Tabs (Matching Screenshot 1) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50 px-3">
              <button
                onClick={() => setActiveTab('tests')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'tests'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Tests ({reports.length})
              </button>
              <button
                onClick={() => setActiveTab('deposits')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'deposits'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Deposits (1)
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'tests' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <th className="py-2 px-3 w-12">#</th>
                        <th className="py-2 px-3">Test Name</th>
                        <th className="py-2 px-3">Sample Type</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Rate (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.length > 0 ? (
                        reports.map((r, idx) => (
                          <tr key={r.reportId || idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {r.testName || `Test ${idx + 1}`}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {r.sampleType || 'Serum'}
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge status={r.status || 'SAMPLE'} />
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                              ₹{(Number(r.rate) || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-slate-400 italic">
                            No tests recorded for this patient.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 font-bold text-slate-900 bg-slate-50/60">
                        <td colSpan="4" className="py-2.5 px-3 text-right">Total:</td>
                        <td className="py-2.5 px-3 text-right text-indigo-600 text-sm">
                          ₹{testsTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">Cash Deposit</span>
                      <span className="block text-[11px] text-slate-400">
                        Receipt: #{patient.slNo || 'REC-001'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-sm">₹{deposits.toFixed(2)}</span>
                      <span className="block text-[10px] text-slate-400">Paid in Full</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
