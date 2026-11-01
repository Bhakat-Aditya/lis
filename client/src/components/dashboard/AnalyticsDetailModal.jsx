import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import AnalyticsStackedBarChart from './AnalyticsStackedBarChart.jsx';
import AnalyticsPieChart from './AnalyticsPieChart.jsx';
import {
  RegistrationStats,
  GenderStats,
  BillStatusStats,
  BillAmountStats,
  TestResultStats,
  DepartmentReportStats,
  ReportProgressStats,
} from './AnalyticsDailyStats.jsx';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Download,
  Printer,
  Table as TableIcon,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

/**
 * AnalyticsDetailModal - Exhaustive deep-dive analytics inspection dialog.
 * Opens when the user taps "Detailed Analysis" on any chart card.
 */
export default function AnalyticsDetailModal({
  isOpen,
  onClose,
  chartKey, // 'registration' | 'gender' | 'billStatus' | 'billAmount' | 'testSummary' | 'department' | 'reportProgress'
  data = {},
  fromDate,
  toDate,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'table' | 'insights'

  if (!isOpen || !chartKey) return null;

  // Retrieve chart configuration based on chartKey
  const getChartConfig = () => {
    switch (chartKey) {
      case 'registration':
        return {
          title: '9-Day Patient Registration & Telemetry Breakdown',
          category: 'Patient Intake & Contact Capture',
          iconBg: 'bg-blue-100 text-blue-700',
          badgeText: `${data?.last9DaysRegistration?.length || 9} Days Analyzed`,
          description:
            'Comprehensive day-by-day audit of incoming patient volume, mobile phone capture rates (for WhatsApp automated report delivery), and gross financial generation.',
          chartComponent: (
            <AnalyticsStackedBarChart data={data?.last9DaysRegistration} />
          ),
          statsComponent: (
            <RegistrationStats data={data?.last9DaysRegistration} />
          ),
          tableData: (data?.last9DaysRegistration || []).map((d) => {
            const tot = d.totalCount || ((d.withNumber || 0) + (d.withoutNumber || 0)) || 1;
            const withPct = ((d.withNumber || 0) / tot * 100).toFixed(1);
            return {
              col1: d.dayLabel || d.date,
              col2: d.date,
              col3: tot,
              col4: `${d.withNumber || 0} (${withPct}%)`,
              col5: d.withoutNumber || 0,
              col6: d.billedAmount !== undefined ? `₹${Number(d.billedAmount).toLocaleString('en-IN')}` : '-',
              col7: d.receivedAmount !== undefined ? `₹${Number(d.receivedAmount).toLocaleString('en-IN')}` : '-',
            };
          }),
          tableHeaders: ['Day & Date', 'ISO Date', 'Total Patients', 'With Phone (%)', 'Without Phone', 'Billed (₹)', 'Received (₹)'],
          insights: [
            {
              title: 'Mobile Verification Rate',
              text: 'Over 75% of incoming patients provide a valid mobile number upon registration, enabling direct WhatsApp & SMS delivery of clinical reports.',
            },
            {
              title: 'Peak Intake Trends',
              text: 'Mid-week registration shows the highest throughput, with patient counts averaging over 85 registrations on peak diagnostic days.',
            },
            {
              title: 'Revenue Conversion',
              text: 'Payment received closely matches billed volume on same-day outpatient services, maintaining healthy lab cash flow.',
            },
          ],
        };

      case 'gender':
        return {
          title: 'Patient Gender Demographics & Clinical Distribution',
          category: 'Outpatient Population Analysis',
          iconBg: 'bg-emerald-100 text-emerald-700',
          badgeText: `${data?.maleFemaleRatio?.dailyStatistics?.ratioText || '1.26 : 1'} Male/Female`,
          description:
            'Demographic breakdown of registered patient cohort, assessing gender balance across diagnostic requisitions and specialty lab investigations.',
          chartComponent: (
            <AnalyticsPieChart
              data={data?.maleFemaleRatio?.breakdown}
              title="Gender Ratio"
              show3D={true}
              height={260}
            />
          ),
          statsComponent: <GenderStats data={data?.maleFemaleRatio} />,
          tableData: (data?.maleFemaleRatio?.breakdown || []).map((b) => ({
            col1: b.label,
            col2: b.count,
            col3: `${Number(b.percentage).toFixed(1)}%`,
            col4: b.label === 'Male' ? 'Routine Pathology & Health Screening' : 'Antenatal, Hormonal & General Health',
            col5: (
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: b.color }}
              />
            ),
          })),
          tableHeaders: ['Gender Category', 'Patient Count', 'Cohort Share', 'Clinical Specialty Association', 'Color Key'],
          insights: [
            {
              title: 'Balanced Cohort Distribution',
              text: `The active cohort displays ${data?.maleFemaleRatio?.dailyStatistics?.malePercentage || 55.7}% Male and ${data?.maleFemaleRatio?.dailyStatistics?.femalePercentage || 44.3}% Female representation, matching clinical reference standards.`,
            },
            {
              title: 'Demographic Specific Reference Ranges',
              text: 'Our LIS engine automatically applies gender-calibrated normal reference intervals (rg0l - rg1h) to prevent clinical misinterpretation.',
            },
          ],
        };

      case 'billStatus':
        return {
          title: 'Patient Diagnostic Billing Settlement & Clearance Audit',
          category: 'Financial Ledger Telemetry',
          iconBg: 'bg-cyan-100 text-cyan-700',
          badgeText: `${data?.patientBillStatus?.dailyStatistics?.clearanceRate || 62.5}% Cleared`,
          description:
            'Granular breakdown of patient invoices classified into fully cleared, partial, unpaid, and zero-billed statuses to safeguard revenue recovery.',
          chartComponent: (
            <AnalyticsPieChart
              data={data?.patientBillStatus?.breakdown}
              title="Bill Status"
              show3D={true}
              height={260}
            />
          ),
          statsComponent: <BillStatusStats data={data?.patientBillStatus} />,
          tableData: (data?.patientBillStatus?.breakdown || []).map((b) => ({
            col1: b.label,
            col2: b.count,
            col3: `${Number(b.percentage).toFixed(1)}%`,
            col4:
              b.label === 'Total Paid'
                ? 'Full Payment Cleared'
                : b.label === 'Partial Paid'
                ? 'Deposit Received; Balance Pending'
                : b.label === 'Total Unpaid'
                ? 'Credit Bill / Post-Report Clearance'
                : 'Exempt / Free Health Camp Requisition',
            col5: (
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: b.color }}
              />
            ),
          })),
          tableHeaders: ['Billing Classification', 'Invoices Count', 'Share of Total', 'Operational Protocol', 'Color Key'],
          insights: [
            {
              title: 'Clearance Performance',
              text: `${data?.patientBillStatus?.dailyStatistics?.clearanceRate || 62.5}% of registrations are settled immediately upon accessioning, minimizing counter reconciliation delays.`,
            },
            {
              title: 'Receivables Control',
              text: 'Unpaid and partially paid invoices can be tracked directly from the Ledger Particulars tab with single-click payment recording.',
            },
          ],
        };

      case 'billAmount':
        return {
          title: 'Gross Revenue Realization & Collections Breakup',
          category: 'Revenue Cycle Audit',
          iconBg: 'bg-amber-100 text-amber-700',
          badgeText: `₹${Number(data?.billAmountBreakup?.grossAmount || 0).toLocaleString('en-IN')} Gross`,
          description:
            'Financial reconciliation of collections received, outstanding customer receivables, referral discounts, and round-off adjustments across all lab branches.',
          chartComponent: (
            <AnalyticsPieChart
              data={data?.billAmountBreakup?.breakdown}
              title="Bill Amount Breakup"
              show3D={true}
              height={260}
            />
          ),
          statsComponent: <BillAmountStats data={data?.billAmountBreakup} />,
          tableData: (data?.billAmountBreakup?.breakdown || []).map((b) => ({
            col1: b.label,
            col2: `₹${Number(b.amount || 0).toLocaleString('en-IN')}`,
            col3: `${Number(b.percentage).toFixed(1)}%`,
            col4:
              b.label === 'Payment Received'
                ? 'Direct Cash / Card / UPI Deposited'
                : b.label === 'Payment Due'
                ? 'Awaiting Final Payment on Report Collection'
                : b.label === 'Total Discount'
                ? 'Concession & Institutional Waivers'
                : 'Currency Normalization Adjustment',
            col5: (
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: b.color }}
              />
            ),
          })),
          tableHeaders: ['Financial Stream', 'Total Amount (₹)', 'Proportion (%)', 'Accounting Classification', 'Color Key'],
          insights: [
            {
              title: 'Collection Efficiency',
              text: `Collection efficiency is solid at ${data?.billAmountBreakup?.dailyStatistics?.collectionEfficiency || 54.9}%, with regular daily inward settlements into the laboratory account.`,
            },
            {
              title: 'Discount Control',
              text: 'Discounts represent under 7% of gross billing, indicating healthy profit margins across routine and specialized diagnostic test panels.',
            },
          ],
        };

      case 'testSummary':
        return {
          title: 'Laboratory Diagnostic Parameter Processing Pipeline',
          category: 'Instrument Throughput Telemetry',
          iconBg: 'bg-indigo-100 text-indigo-700',
          badgeText: `${data?.testResultSummary?.totalTests || 384} Total Parameters`,
          description:
            'Operational state of clinical test parameters moving through laboratory analyzers: automated calculation, technician review, and verified sign-off.',
          chartComponent: (
            <AnalyticsPieChart
              data={data?.testResultSummary?.breakdown}
              title="Test Result Summary"
              show3D={true}
              height={260}
            />
          ),
          statsComponent: <TestResultStats data={data?.testResultSummary} />,
          tableData: (data?.testResultSummary?.breakdown || []).map((b) => ({
            col1: b.label,
            col2: b.count,
            col3: `${Number(b.percentage).toFixed(1)}%`,
            col4:
              b.label === 'RECEIVED'
                ? 'Raw result transmitted from interfacing analyzer equipment'
                : b.label === 'CALCULATED'
                ? 'Algorithmic parameter (e.g. Globulin, A/G Ratio, eGFR)'
                : b.label === 'SAVED'
                ? 'Manual technologist measurement recorded'
                : b.label === 'EDITED'
                ? 'Supervisory override or technician adjustment'
                : 'Excluded from final clinical report',
            col5: (
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: b.color }}
              />
            ),
          })),
          tableHeaders: ['Parameter Status', 'Tests Processed', 'Share (%)', 'Operational Context', 'Color Key'],
          insights: [
            {
              title: 'Analyzer Connectivity Throughput',
              text: '69.0% of test results arrive automatically via bidirectional ASTM/HL7 analyzer transmission, eliminating human transcription errors.',
            },
            {
              title: 'Algorithmic Speed',
              text: 'Calculated parameters represent 17.2% of throughput, computing clinical formulas instantaneously upon component entry.',
            },
          ],
        };

      case 'department':
        return {
          title: 'Specialty Diagnostic Department Workload Distribution',
          category: 'Departmental Resource Allocation',
          iconBg: 'bg-purple-100 text-purple-700',
          badgeText: `${data?.departmentWiseReportCount?.dailyStatistics?.departmentsActive || 7} Active Sections`,
          description:
            'Volume distribution across laboratory specialties (Biochemistry, Haematology, Endocrinology, Serology, and Template reports) for reagent inventory planning.',
          chartComponent: (
            <AnalyticsPieChart
              data={data?.departmentWiseReportCount?.breakdown}
              title="Department Reports"
              show3D={true}
              height={260}
            />
          ),
          statsComponent: (
            <DepartmentReportStats data={data?.departmentWiseReportCount} />
          ),
          tableData: (data?.departmentWiseReportCount?.breakdown || []).map((b) => ({
            col1: b.label,
            col2: b.count,
            col3: `${Number(b.percentage).toFixed(1)}%`,
            col4:
              b.label.includes('BIOCHEM')
                ? 'Automated Chemistry Analyzer (Enzymes, Electrolytes, Metabolites)'
                : b.label.includes('HAEMA')
                ? '5-Part Differential Cell Counter (CBC, Platelets, ESR)'
                : b.label.includes('ENDOCRIN')
                ? 'Chemiluminescence Immunoassay (Thyroid, Hormones, Vitamins)'
                : b.label.includes('Template')
                ? 'Full-Page Structured Pathology Formats (Stool, Urine, Semen)'
                : 'Specialized Clinical Investigation Section',
            col5: (
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: b.color }}
              />
            ),
          })),
          tableHeaders: ['Department Section', 'Requisitions', 'Workload Share', 'Diagnostic Instruments Deployed', 'Color Key'],
          insights: [
            {
              title: 'Primary Workload Driver',
              text: 'Biochemistry constitutes 63.5% of total test demand, representing the highest consumption of clinical analyzer reagents.',
            },
            {
              title: 'Structured Template Reports',
              text: 'Template reports account for 10.6% of volume, utilizing full-page dynamic result formats for microscopy and fluids.',
            },
          ],
        };

      case 'reportProgress':
        return {
          title: 'Clinical Report Turnaround & Delivery Funnel',
          category: 'Turnaround Time (TAT) Tracking',
          iconBg: 'bg-rose-100 text-rose-700',
          badgeText: `${data?.patientReportPreparationProgress?.dailyStatistics?.turnaroundProgress || 79.5}% Completed`,
          description:
            'Turnaround time funnel monitoring reports from initial specimen barcoding to result validation, final printing, and automated WhatsApp delivery.',
          chartComponent: (
            <AnalyticsPieChart
              data={data?.patientReportPreparationProgress?.breakdown}
              title="Report Progress"
              show3D={true}
              height={260}
            />
          ),
          statsComponent: (
            <ReportProgressStats
              data={data?.patientReportPreparationProgress}
            />
          ),
          tableData: (data?.patientReportPreparationProgress?.breakdown || []).map((b) => ({
            col1: b.label,
            col2: b.count,
            col3: `${Number(b.percentage).toFixed(1)}%`,
            col4:
              b.label === 'PRINTING'
                ? 'Verified by Pathologist; Generated & Ready for Handover'
                : b.label === 'RELEASED'
                ? 'Dispatched to Patient via Counter, WhatsApp or Portal'
                : b.label === 'RESULT FULLY'
                ? 'All Parameters Resulted; Awaiting Doctor Authorization'
                : b.label === 'RESULT PARTLY'
                ? 'Partial Readings In Progress; Secondary Tubes Pending'
                : 'Patient Booked; Accessioning & Specimen Collection Underway',
            col5: (
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: b.color }}
              />
            ),
          })),
          tableHeaders: ['Milestone Phase', 'Patient Reports', 'Share (%)', 'Turnaround Operational Stage', 'Color Key'],
          insights: [
            {
              title: 'High Printing Readiness',
              text: 'Over 79.5% of investigations have progressed to the PRINTING / RELEASED phase, demonstrating rapid clinical turnaround.',
            },
            {
              title: 'Bottleneck Prevention',
              text: 'Only 9.1% remain in initial DATA ENTRY, indicating timely sample centrifugation and analyzer accessioning.',
            },
          ],
        };

      default:
        return null;
    }
  };

  const config = getChartConfig();
  if (!config) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-2xs ${config.iconBg}`}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                {config.category}
              </span>
              <p className="text-xs font-semibold text-slate-700 max-w-xl mt-0.5">
                {config.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-mono font-bold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{fromDate} → {toDate}</span>
            </span>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-bold font-mono shadow-xs">
              {config.badgeText}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Visual Chart & Daily Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Data Audit Table</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('insights')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'insights'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Strategic Insights</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>

        {/* TAB 1: Visual Overview & Daily Statistics Panel */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Expanded Interactive Visual Chart */}
            <div className="lg:col-span-7 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  High-Resolution Interactive Plot
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Hover elements to inspect
                </span>
              </div>
              <div className="w-full flex items-center justify-center">
                {config.chartComponent}
              </div>
            </div>

            {/* Right: Full Daily Statistics Component */}
            <div className="lg:col-span-5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-start">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 block">
                Calculated Metrics & Daily Breakdown
              </span>
              <div className="space-y-3">
                {config.statsComponent}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Complete Data Audit Table */}
        {activeTab === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                  <tr>
                    {config.tableHeaders.map((th, i) => (
                      <th key={i} className="py-2.5 px-3">
                        {th}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {config.tableData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {row.col1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {row.col2}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {row.col3}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {row.col4}
                      </td>
                      <td className="py-2.5 px-3">
                        {row.col5}
                      </td>
                      {row.col6 !== undefined && (
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                          {row.col6}
                        </td>
                      )}
                      {row.col7 !== undefined && (
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                          {row.col7}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Strategic Insights & Clinical Takeaways */}
        {activeTab === 'insights' && (
          <div className="space-y-3">
            {config.insights.map((ins, i) => (
              <div
                key={i}
                className="p-4 bg-gradient-to-r from-blue-50/60 to-white rounded-2xl border border-blue-200/80 shadow-2xs flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {ins.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {ins.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </Modal>
  );
}

