import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Server, Database, Sparkles } from 'lucide-react';

export default function ApiJsonModal({ isOpen, onClose, currentData }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('json');

  if (!isOpen) return null;

  const jsonString = JSON.stringify(
    currentData || {
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      date: '2026-10-28',
      timestamp: '2026-10-28T15:58:00+05:30',
      clinic: {
        name: 'New Life Care Diagnostic Center',
        system: 'LIS System',
        branch: 'Central Lab Midnapore',
      },
      kpiSummary: {
        totalPatients: 88,
        totalBilledAmount: 142500,
        paymentReceived: 78232.5,
        paymentDue: 54577.5,
        totalDiscount: 9547.5,
        roundOff: 0.0,
        totalTestsOrdered: 384,
        reportsReadyForPrinting: 305,
        reportsReleased: 0,
        avgTurnaroundMinutes: 48,
      },
      last9DaysRegistration: [
        { date: '2026-10-20', dayLabel: 'Tue (20)', totalCount: 2, withNumber: 0, withoutNumber: 2, billedAmount: 1600, receivedAmount: 1600 },
        { date: '2026-10-21', dayLabel: 'Wed (21)', totalCount: 1, withNumber: 0, withoutNumber: 1, billedAmount: 800, receivedAmount: 800 },
        { date: '2026-10-22', dayLabel: 'Thu (22)', totalCount: 3, withNumber: 1, withoutNumber: 2, billedAmount: 3400, receivedAmount: 2800 },
        { date: '2026-10-23', dayLabel: 'Fri (23)', totalCount: 85, withNumber: 72, withoutNumber: 13, billedAmount: 98400, receivedAmount: 65000 },
        { date: '2026-10-24', dayLabel: 'Sat (24)', totalCount: 98, withNumber: 75, withoutNumber: 23, billedAmount: 124000, receivedAmount: 82000 },
        { date: '2026-10-25', dayLabel: 'Sun (25)', totalCount: 56, withNumber: 45, withoutNumber: 11, billedAmount: 68000, receivedAmount: 49000 },
        { date: '2026-10-26', dayLabel: 'Mon (26)', totalCount: 82, withNumber: 65, withoutNumber: 17, billedAmount: 105000, receivedAmount: 71000 },
        { date: '2026-10-27', dayLabel: 'Tue (27)', totalCount: 124, withNumber: 102, withoutNumber: 22, billedAmount: 165000, receivedAmount: 115000 },
        { date: '2026-10-28', dayLabel: 'Wed (28)', totalCount: 88, withNumber: 66, withoutNumber: 22, billedAmount: 142500, receivedAmount: 78232.5 },
      ],
      maleFemaleRatio: {
        total: 88,
        breakdown: [
          { label: 'Male', count: 49, percentage: 55.7, color: '#EF4444' },
          { label: 'Female', count: 39, percentage: 44.3, color: '#22C55E' },
          { label: 'Others', count: 0, percentage: 0.0, color: '#6B7280' },
        ],
        dailyStatistics: {
          maleCount: 49,
          femaleCount: 39,
          otherCount: 0,
          malePercentage: 55.7,
          femalePercentage: 44.3,
          ratioText: '1.26 : 1',
        },
      },
      patientBillStatus: {
        total: 88,
        breakdown: [
          { label: 'Total Paid', count: 55, percentage: 62.5, color: '#059669' },
          { label: 'Total Unpaid', count: 23, percentage: 26.1, color: '#06B6D4' },
          { label: 'Partial Paid', count: 10, percentage: 11.4, color: '#F59E0B' },
          { label: 'No Bill', count: 0, percentage: 0.0, color: '#EF4444' },
        ],
        dailyStatistics: {
          totalInvoices: 88,
          fullyCleared: 55,
          pendingClearance: 23,
          partiallyPaid: 10,
          zeroBilled: 0,
          clearanceRate: 62.5,
        },
      },
      billAmountBreakup: {
        grossAmount: 142500,
        breakdown: [
          { label: 'Payment Received', amount: 78232.5, percentage: 54.9, color: '#059669' },
          { label: 'Payment Due', amount: 54577.5, percentage: 38.3, color: '#06B6D4' },
          { label: 'Total Discount', amount: 9547.5, percentage: 6.7, color: '#F59E0B' },
          { label: 'Round Off', amount: 0.0, percentage: 0.0, color: '#EF4444' },
        ],
        dailyStatistics: {
          grossBilled: 142500,
          totalReceived: 78232.5,
          outstandingDue: 54577.5,
          discountProvided: 9547.5,
          roundOffAdjustment: 0,
          collectionEfficiency: 54.9,
        },
      },
      testResultSummary: {
        totalTests: 384,
        breakdown: [
          { label: 'RECEIVED', count: 265, percentage: 69.0, color: '#22C55E' },
          { label: 'CALCULATED', count: 66, percentage: 17.2, color: '#3B82F6' },
          { label: 'SAVED', count: 40, percentage: 10.3, color: '#EC4899' },
          { label: 'EDITED', count: 3, percentage: 0.7, color: '#06B6D4' },
          { label: 'DELETED', count: 10, percentage: 2.8, color: '#EAB308' },
          { label: 'SAMPLE', count: 0, percentage: 0.0, color: '#EF4444' },
          { label: 'Others', count: 0, percentage: 0.0, color: '#6B7280' },
        ],
        dailyStatistics: {
          totalTests: 384,
          completedRate: 96.5,
          autoCalculatedRatio: 17.2,
          deletedTests: 10,
          editedTests: 3,
        },
      },
      departmentWiseReportCount: {
        totalReports: 384,
        breakdown: [
          { label: 'BIOCHEMISTRY TESTS', count: 244, percentage: 63.5, color: '#EF4444' },
          { label: 'ENDOCRINOLOGY & SPECIAL TESTS', count: 50, percentage: 12.9, color: '#3B82F6' },
          { label: 'HAEMATOLOGY TESTS', count: 17, percentage: 4.4, color: '#22C55E' },
          { label: 'URINE EXAMINATION', count: 12, percentage: 3.1, color: '#06B6D4' },
          { label: 'SEROLOGY', count: 11, percentage: 2.9, color: '#8B5CF6' },
          { label: 'Template Report', count: 41, percentage: 10.6, color: '#78716C' },
          { label: 'Deleted Report', count: 9, percentage: 2.6, color: '#EAB308' },
        ],
        dailyStatistics: {
          highestVolumeDept: 'BIOCHEMISTRY TESTS',
          departmentsActive: 7,
          routinePathologyShare: 67.9,
          specializedInvestigations: 61,
        },
      },
      patientReportPreparationProgress: {
        totalWorklist: 88,
        breakdown: [
          { label: 'PRINTING', count: 70, percentage: 79.5, color: '#EC4899' },
          { label: 'ENTRY', count: 8, percentage: 9.1, color: '#EF4444' },
          { label: 'RESULT FULLY', count: 6, percentage: 6.8, color: '#3B82F6' },
          { label: 'RESULT PARTLY', count: 4, percentage: 4.5, color: '#22C55E' },
          { label: 'RELEASED', count: 0, percentage: 0.0, color: '#EAB308' },
          { label: 'Others', count: 0, percentage: 0.0, color: '#6B7280' },
        ],
        dailyStatistics: {
          readyForDelivery: 70,
          inDataEntry: 8,
          partiallyResulted: 4,
          fullyResulted: 6,
          turnaroundProgress: 86.3,
        },
      },
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>API JSON Contract Specification</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Ready for Server Developer
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Send this specification to the backend engineer to implement the dashboard API
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Full JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw JSON Payload
            </button>
            <button
              onClick={() => setActiveTab('endpoint')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'endpoint'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              API Endpoint Guide
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'fields'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Field Reference (7 Sections)
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {jsonString.length.toLocaleString()} characters
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 font-sans">
          {activeTab === 'json' && (
            <div className="relative">
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 selection:bg-emerald-900 selection:text-white">
                <code>{jsonString}</code>
              </pre>
            </div>
          )}

          {activeTab === 'endpoint' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <h4 className="font-bold text-sm text-blue-900 mb-1 flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span>Target API Endpoint for Upstream Java / Medipath Server</span>
                </h4>
                <p className="text-slate-600 text-xs">
                  The upstream LIS backend engineer should expose this servlet endpoint:
                </p>
                <div className="bg-white rounded-xl p-2.5 mt-2 border border-blue-200 font-mono text-xs text-blue-700 font-bold">
                  GET /GetAPIServlet?api=GETDASHBOARDANALYTICS&date=2026-10-28&days=9&branch=ALL
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <h4 className="font-bold text-sm text-emerald-900 mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Middleman Proxy Endpoint</span>
                </h4>
                <p className="text-slate-600 text-xs">
                  Our Node/Express middleman server exposes this route to the client frontend:
                </p>
                <div className="bg-white rounded-xl p-2.5 mt-2 border border-emerald-200 font-mono text-xs text-emerald-700 font-bold">
                  GET /api/analytics/dashboard?date=2026-10-28&days=9&branch=Central
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Request Parameters:
                </h5>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><code className="font-bold text-slate-900">date</code>: (String, YYYY-MM-DD) Filter day for the 6 pie charts & daily statistics.</li>
                  <li><code className="font-bold text-slate-900">days</code>: (Number, default: 9) Number of past consecutive days for the stacked patient registration bar chart.</li>
                  <li><code className="font-bold text-slate-900">branch</code>: (Optional String) Clinic branch name for multi-location isolation.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'fields' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-700">1. last9DaysRegistration</span>
                  <p className="text-slate-500 text-[11px]">
                    Array of 9 daily records with <code>withNumber</code> (patients with phone) and <code>withoutNumber</code>.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-700">2. maleFemaleRatio</span>
                  <p className="text-slate-500 text-[11px]">
                    Male vs Female ratio percentages and exact counts for the selected date.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-700">3. patientBillStatus</span>
                  <p className="text-slate-500 text-[11px]">
                    Total Paid (100%), Total Unpaid (0%), Partial Paid (&gt;0% &lt;100%), No Bill.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-700">4. billAmountBreakup</span>
                  <p className="text-slate-500 text-[11px]">
                    Monetary breakdown: Payment Received, Payment Due, Total Discount, Round Off.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-700">5. testResultSummary</span>
                  <p className="text-slate-500 text-[11px]">
                    Investigation status: RECEIVED, CALCULATED, SAVED, EDITED, DELETED, SAMPLE, Others.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-700">6. departmentWiseReportCount</span>
                  <p className="text-slate-500 text-[11px]">
                    Volume by lab bench: Biochemistry, Endocrinology, Haematology, Urine, Serology, Template.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 md:col-span-2">
                  <span className="font-bold text-indigo-700">7. patientReportPreparationProgress</span>
                  <p className="text-slate-500 text-[11px]">
                    End-to-end report journey: ENTRY, SAMPLE, RESULT PARTLY, RESULT FULLY, PRINTING, RELEASED.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            LIS System Medipath Architecture Specification • v2.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

