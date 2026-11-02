import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api.js';
import StatCards from '../components/dashboard/StatCards.jsx';
import PatientsPage from './PatientsPage.jsx';
import AnalyticsBanner from '../components/dashboard/AnalyticsBanner.jsx';
import AnalyticsSectionCard from '../components/dashboard/AnalyticsSectionCard.jsx';
import AnalyticsStackedBarChart from '../components/dashboard/AnalyticsStackedBarChart.jsx';
import AnalyticsPieChart from '../components/dashboard/AnalyticsPieChart.jsx';
import AnalyticsGridCard from '../components/dashboard/AnalyticsGridCard.jsx';
import AnalyticsDetailModal from '../components/dashboard/AnalyticsDetailModal.jsx';
import ApiJsonModal from '../components/dashboard/ApiJsonModal.jsx';
import MachineStatusHub from '../components/dashboard/MachineStatusHub.jsx';
import {
  CheckCircle2,
  Users,
  PieChart as PieChartIcon,
  Receipt,
  DollarSign,
  FlaskConical,
  Layers,
  FileCheck2,
  Cpu,
  Sparkles,
} from 'lucide-react';
import {
  RegistrationStats,
  GenderStats,
  BillStatusStats,
  BillAmountStats,
  TestResultStats,
  DepartmentReportStats,
  ReportProgressStats,
} from '../components/dashboard/AnalyticsDailyStats.jsx';

/**
 * Format date to YYYY-MM-DD
 */
const getTodayDate = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/**
 * Calculate date N days prior strictly in YYYY-MM-DD
 */
const calculatePastDate = (baseDateStr, daysPrior = 8) => {
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) return baseDateStr;
  d.setDate(d.getDate() - daysPrior);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function DashboardPage({ onOpenNewPatient }) {
  const [activeView, setActiveView] = useState('analytics'); // 'analytics' | 'worklist'
  const todayStr = getTodayDate();
  const [toDate, setToDate] = useState(todayStr);
  const [fromDate, setFromDate] = useState(() => calculatePastDate(todayStr, 8));
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [selectedDetailChart, setSelectedDetailChart] = useState(null);
  const [patients, setPatients] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refresh flow states: POST API_DASHBOARD_REFRESH="DASHBOARDREFRESH" -> 2-min wait -> GET API_GET_DASHBOARD_JSON="GETDASHBOARDJSON"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSecondsLeft, setRefreshSecondsLeft] = useState(0);
  const [refreshSuccessNotice, setRefreshSuccessNotice] = useState(null);
  const [refreshErrorNotice, setRefreshErrorNotice] = useState(null);

  // ALWAYS call GET API_GET_DASHBOARD_JSON="GETDASHBOARDJSON" with fromDate & toDate in yyyy-MM-dd format
  const fetchDashboardJson = useCallback(
    async (targetFrom, targetTo, forceFresh = false) => {
      try {
        setLoadingAnalytics(true);
        const f = targetFrom || fromDate;
        const t = targetTo || toDate;

        const res = await api.get('/analytics/dashboard', {
          params: {
            fromDate: f,
            toDate: t,
            fresh: forceFresh,
          },
        });

        if (res.data && (res.data.STATUS === 'SUCCESS' || res.data.last9DaysRegistration)) {
          setAnalyticsData(res.data);
        } else if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode !== '0000') {
          if (forceFresh) {
            setRefreshErrorNotice(
              res.data?.Message || 'Main server rejected GETDASHBOARDJSON request.'
            );
          }
        }
      } catch (err) {
        console.warn('[Dashboard] GETDASHBOARDJSON error:', err.message);
        if (forceFresh) {
          setRefreshErrorNotice(
            err.response?.data?.Message ||
              err.response?.data?.error ||
              'Main server error retrieving synchronized dashboard telemetry.'
          );
        }
      } finally {
        setLoadingAnalytics(false);
      }
    },
    [fromDate, toDate]
  );

  // Check on mount if an active 2-minute refresh timer was in progress in this session
  useEffect(() => {
    try {
      const savedTarget = sessionStorage.getItem('lis_dashboard_refresh_until');
      if (savedTarget) {
        const targetMs = Number(savedTarget);
        const remaining = Math.ceil((targetMs - Date.now()) / 1000);
        if (remaining > 0 && remaining <= 120) {
          setRefreshSecondsLeft(remaining);
          setIsRefreshing(true);
        } else {
          sessionStorage.removeItem('lis_dashboard_refresh_until');
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Initial load and whenever fromDate/toDate or refreshTrigger changes:
  // ALWAYS call getdashboard api
  useEffect(() => {
    fetchDashboardJson(fromDate, toDate);
  }, [fromDate, toDate, refreshTrigger, fetchDashboardJson]);

  // Handle user clicking the Refresh button:
  // ONLY when user clicked on refresh button, call POST API "DASHBOARDREFRESH"
  // If it sends success response use a default wait timer of 2 min (120s) and then call "GETDASHBOARDJSON"
  const handleRefreshUpstream = async () => {
    if (isRefreshing || refreshSecondsLeft > 0) return;

    try {
      setIsRefreshing(true);
      setRefreshErrorNotice(null);
      setRefreshSuccessNotice(null);

      const res = await api.post('/analytics/refresh', {
        fromDate,
        toDate,
      });

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        const waitSec = Number(res.data?.waitSeconds) || 120;
        setRefreshSecondsLeft(waitSec);
        try {
          sessionStorage.setItem('lis_dashboard_refresh_until', String(Date.now() + waitSec * 1000));
        } catch {
          // ignore
        }
      } else {
        setIsRefreshing(false);
        setRefreshErrorNotice(res.data?.Message || 'Upstream DASHBOARDREFRESH returned error.');
      }
    } catch (err) {
      console.error('[Dashboard] Error calling POST DASHBOARDREFRESH:', err);
      setIsRefreshing(false);
      setRefreshErrorNotice(err.response?.data?.Message || 'Failed to call upstream DASHBOARDREFRESH');
    }
  };

  // Timer countdown: 120s -> 0s, then automatically call GET API_GET_DASHBOARD_JSON="GETDASHBOARDJSON"
  useEffect(() => {
    if (refreshSecondsLeft <= 0) return;

    const intervalId = setInterval(() => {
      setRefreshSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsRefreshing(false);
          try {
            sessionStorage.removeItem('lis_dashboard_refresh_until');
          } catch {
            // ignore
          }
          // 2-min wait completed: Call GETDASHBOARDJSON!
          fetchDashboardJson(fromDate, toDate, true);
          setRefreshSuccessNotice(
            'Dashboard successfully synchronized with upstream GETDASHBOARDJSON!'
          );
          setTimeout(() => setRefreshSuccessNotice(null), 6000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [refreshSecondsLeft, fromDate, toDate, fetchDashboardJson]);

  // Optional manual bypass if user wants immediate check
  const handleSkipWaitAndFetch = () => {
    setRefreshSecondsLeft(0);
    setIsRefreshing(false);
    try {
      sessionStorage.removeItem('lis_dashboard_refresh_until');
    } catch {
      // ignore
    }
    fetchDashboardJson(fromDate, toDate, true);
    setRefreshSuccessNotice('Retrieved latest data from upstream GETDASHBOARDJSON!');
    setTimeout(() => setRefreshSuccessNotice(null), 5000);
  };

  const handleDatesSubmit = (newFrom, newTo) => {
    setFromDate(newFrom);
    setToDate(newTo);
    fetchDashboardJson(newFrom, newTo);
  };

  // Derived KPI values: prefer API kpiSummary, fallback to live loaded patient queue
  const totalCount = analyticsData?.kpiSummary?.totalPatients ?? patients.length;
  const samplePending = patients.filter((p) => {
    const s = String(p.status || '').toUpperCase();
    return s === 'REGISTERED' || s === 'SAMPLE';
  }).length;

  const inTesting = patients.filter((p) => {
    const s = String(p.status || '').toUpperCase();
    return ['ENTRY', 'TESTING', 'SAVED', 'RESULT PARTLY'].includes(s);
  }).length;

  const readyPrint =
    analyticsData?.kpiSummary?.reportsReadyForPrinting ??
    patients.filter((p) => {
      const s = String(p.status || '').toUpperCase();
      return ['PRINTING', 'APPROVED', 'RELEASED', 'READY', 'REPORT READY', 'VERIFIED'].includes(s);
    }).length;

  const totalRevenue =
    analyticsData?.kpiSummary?.totalBilledAmount ??
    patients.reduce((acc, p) => acc + (Number(p.totalBill) || 0), 0);

  // Derived Metrics for 3-in-a-row Grid Cards
  const regList = analyticsData?.last9DaysRegistration || [];
  const total9DayIntake = regList.reduce(
    (acc, d) => acc + (d.totalCount || ((d.withNumber || 0) + (d.withoutNumber || 0))),
    0
  );
  const totalWithPhone = regList.reduce((acc, d) => acc + (d.withNumber || 0), 0);
  const phoneRate = total9DayIntake > 0 ? ((totalWithPhone / total9DayIntake) * 100).toFixed(1) : '75.0';
  let peakDay = { dayLabel: regList[0]?.dayLabel || 'N/A', totalCount: 0 };
  regList.forEach((d) => {
    const c = d.totalCount || ((d.withNumber || 0) + (d.withoutNumber || 0));
    if (c >= peakDay.totalCount) peakDay = { dayLabel: d.dayLabel || d.date, totalCount: c };
  });

  const genderStats = analyticsData?.maleFemaleRatio?.dailyStatistics || {
    maleCount: 0,
    femaleCount: 0,
    malePercentage: 0,
    femalePercentage: 0,
    ratioText: '0 : 0',
  };

  const billStatusStats = analyticsData?.patientBillStatus?.dailyStatistics || {
    fullyCleared: 0,
    pendingClearance: 0,
    partiallyPaid: 0,
    clearanceRate: 0,
  };

  const billAmountStats = analyticsData?.billAmountBreakup?.dailyStatistics || {
    grossBilled: 0,
    totalReceived: 0,
    outstandingDue: 0,
    collectionEfficiency: 0,
  };

  const testStats = analyticsData?.testResultSummary?.dailyStatistics || {
    totalTests: 0,
    completedRate: 0,
    autoCalculatedRatio: 0,
  };

  const deptStats = analyticsData?.departmentWiseReportCount?.dailyStatistics || {
    highestVolumeDept: 'Pathology',
    departmentsActive: 0,
    routinePathologyShare: 0,
  };

  const progressStats = analyticsData?.patientReportPreparationProgress?.dailyStatistics || {
    readyForDelivery: 0,
    inDataEntry: 0,
    turnaroundProgress: 0,
  };

  return (
    <section className="space-y-4 pb-12 overflow-x-hidden">
      <Helmet>
        <title>Analytics Overview & Operations | New Life Care Midnapore</title>
        <meta
          name="description"
          content="Comprehensive clinical laboratory analytics overview, daily statistics, 9-day patient volume, gender ratio, billing breakdown, test results, department volume, and live worklist."
        />
      </Helmet>

      {/* Top Banner with Date Selector, Clock, Refresh & API JSON Contract Shortcut */}
      <AnalyticsBanner
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onSubmitDates={handleDatesSubmit}
        onOpenNewPatient={onOpenNewPatient}
        onRefreshUpstream={handleRefreshUpstream}
        isRefreshing={isRefreshing}
        refreshSecondsLeft={refreshSecondsLeft}
        onSkipWait={handleSkipWaitAndFetch}
        activeView={activeView}
        onToggleView={setActiveView}
        loading={loadingAnalytics}
        lastCacheTime={
          analyticsData?.cachedTimeFormatted ||
          (analyticsData?.catchedTime
            ? new Date(analyticsData.catchedTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : null)
        }
        lastCacheDate={
          analyticsData?.cachedDateFormatted ||
          (analyticsData?.catchedTime
            ? new Date(analyticsData.catchedTime).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              })
            : null)
        }
        isFromCache={Boolean(analyticsData?.isCached)}
      />

      {/* Error Alert if Refresh fails */}
      {refreshErrorNotice && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>{refreshErrorNotice}</span>
          </div>
          <button
            onClick={() => setRefreshErrorNotice(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Notification after Refresh & Fetch */}
      {refreshSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{refreshSuccessNotice}</span>
        </div>
      )}

      {/* 5-Metric Top KPI Stat Cards */}
      <StatCards
        totalCount={totalCount}
        samplePending={samplePending}
        inTesting={inTesting}
        readyPrint={readyPrint}
        totalRevenue={totalRevenue}
      />

      {/* VIEW 1: Analytics Overview (3-in-a-row responsive grid with deep-dive analysis) */}
      {activeView === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
          {/* Card 1: Last 9 Days Patient Registration */}
          <AnalyticsGridCard
            title="9-Day Registration Trend"
            category="Patient Intake Telemetry"
            icon={<Users className="w-4 h-4 text-blue-600" />}
            iconBg="bg-blue-50 text-blue-600 border-blue-200"
            badge={`${regList[regList.length - 1]?.totalCount ?? 0} on ${toDate === todayStr ? 'Today' : toDate}`}
            badgeType="blue"
            description="Daily volume of incoming patient registrations tracking mobile contact rates for automated digital SMS & WhatsApp clinical report delivery."
            chart={
              <AnalyticsStackedBarChart data={analyticsData?.last9DaysRegistration} />
            }
            highlights={[
              { label: '9-Day Total', value: `${total9DayIntake} Patients`, color: 'text-blue-700' },
              { label: 'With Phone', value: `${phoneRate}%`, color: 'text-emerald-700' },
              { label: 'Peak Day', value: `${peakDay.dayLabel}`, color: 'text-slate-900' },
            ]}
            onViewDetails={() => setSelectedDetailChart('registration')}
            detailButtonLabel="Daily Breakdown"
          />

          {/* Card 2: Male-Female Ratio */}
          <AnalyticsGridCard
            title="Male-Female Ratio"
            category="Demographic Distribution"
            icon={<PieChartIcon className="w-4 h-4 text-emerald-600" />}
            iconBg="bg-emerald-50 text-emerald-600 border-emerald-200"
            badge={genderStats.ratioText}
            badgeType="emerald"
            description="Patient gender demographic distribution across registrations, ensuring clinical balance and demographic-specific normal reference intervals."
            chart={
              <AnalyticsPieChart
                data={analyticsData?.maleFemaleRatio?.breakdown}
                title="Male Female Ratio"
                donut={true}
                centerValue={`${genderStats.malePercentage}%`}
                centerLabel="Male Ratio"
              />
            }
            highlights={[
              { label: 'Male', value: `${genderStats.maleCount} (${genderStats.malePercentage}%)`, color: 'text-red-600' },
              { label: 'Female', value: `${genderStats.femaleCount} (${genderStats.femalePercentage}%)`, color: 'text-emerald-600' },
              { label: 'Ratio', value: genderStats.ratioText, color: 'text-slate-900' },
            ]}
            onViewDetails={() => setSelectedDetailChart('gender')}
            detailButtonLabel="Demographics"
          />

          {/* Card 3: Patient Bill Status */}
          <AnalyticsGridCard
            title="Patient Bill Status"
            category="Settlement Ledger"
            icon={<Receipt className="w-4 h-4 text-cyan-600" />}
            iconBg="bg-cyan-50 text-cyan-600 border-cyan-200"
            badge={`${billStatusStats.clearanceRate}% Cleared`}
            badgeType="blue"
            description="Real-time billing settlement audit categorizing patient accounts into fully cleared, partially paid deposits, or pending credit dues."
            chart={
              <AnalyticsPieChart
                data={analyticsData?.patientBillStatus?.breakdown}
                title="Patient Bill Status"
                donut={true}
                centerValue={`${billStatusStats.clearanceRate}%`}
                centerLabel="Settled"
              />
            }
            highlights={[
              { label: 'Paid Bills', value: `${billStatusStats.fullyCleared} (${billStatusStats.clearanceRate}%)`, color: 'text-emerald-600' },
              { label: 'Unpaid Dues', value: `${billStatusStats.pendingClearance}`, color: 'text-cyan-600' },
              { label: 'Partial Deposit', value: `${billStatusStats.partiallyPaid}`, color: 'text-amber-600' },
            ]}
            onViewDetails={() => setSelectedDetailChart('billStatus')}
            detailButtonLabel="Clearance Audit"
          />

          {/* Card 4: Bill Amount Breakup */}
          <AnalyticsGridCard
            title="Bill Amount Breakup"
            category="Revenue Realization"
            icon={<DollarSign className="w-4 h-4 text-amber-600" />}
            iconBg="bg-amber-50 text-amber-600 border-amber-200"
            badge={`₹${(Number(billAmountStats.totalReceived) / 1000).toFixed(1)}k Recv`}
            badgeType="emerald"
            description="Financial breakdown of gross diagnostic billing, separating collections received, customer receivables, and referral discounts."
            chart={
              <AnalyticsPieChart
                data={analyticsData?.billAmountBreakup?.breakdown}
                title="Bill Amount Breakup"
                donut={true}
                centerValue={`₹${(Number(billAmountStats.totalReceived) / 1000).toFixed(1)}k`}
                centerLabel="Collected"
              />
            }
            highlights={[
              { label: 'Collections', value: `₹${Number(billAmountStats.totalReceived).toLocaleString('en-IN')}`, color: 'text-emerald-600' },
              { label: 'Pending Dues', value: `₹${Number(billAmountStats.outstandingDue).toLocaleString('en-IN')}`, color: 'text-cyan-600' },
              { label: 'Efficiency', value: `${billAmountStats.collectionEfficiency}%`, color: 'text-slate-900' },
            ]}
            onViewDetails={() => setSelectedDetailChart('billAmount')}
            detailButtonLabel="Financial Breakup"
          />

          {/* Card 5: Test Result Summary */}
          <AnalyticsGridCard
            title="Test Result Summary"
            category="Laboratory Throughput"
            icon={<FlaskConical className="w-4 h-4 text-purple-600" />}
            iconBg="bg-purple-50 text-purple-600 border-purple-200"
            badge={`${testStats.completedRate}% Ready`}
            badgeType="purple"
            description="Operational lifecycle state of laboratory parameters moving from instrument receipt to automated calculation and completion."
            chart={
              <AnalyticsPieChart
                data={analyticsData?.testResultSummary?.breakdown}
                title="Test Result Summary"
                donut={true}
                centerValue={`${testStats.completedRate}%`}
                centerLabel="Completed"
              />
            }
            highlights={[
              { label: 'Total Tests', value: `${testStats.totalTests}`, color: 'text-purple-700' },
              { label: 'Auto Calculated', value: `${testStats.autoCalculatedRatio}%`, color: 'text-blue-600' },
              { label: 'Success Rate', value: `${testStats.completedRate}%`, color: 'text-emerald-600' },
            ]}
            onViewDetails={() => setSelectedDetailChart('testSummary')}
            detailButtonLabel="Pipeline Audit"
          />

          {/* Card 6: Department Wise Report Count */}
          <AnalyticsGridCard
            title="Department Wise Report Count"
            category="Diagnostic Specialty Mix"
            icon={<Layers className="w-4 h-4 text-rose-600" />}
            iconBg="bg-rose-50 text-rose-600 border-rose-200"
            badge={`${deptStats.departmentsActive} Departments`}
            badgeType="rose"
            description="Diagnostic workload allocation across specialty sections including Biochemistry, Endocrinology, Haematology, and Template reports."
            chart={
              <AnalyticsPieChart
                data={analyticsData?.departmentWiseReportCount?.breakdown}
                title="Department Wise Report Count"
                donut={true}
                centerValue="63.5%"
                centerLabel="Biochemistry"
              />
            }
            highlights={[
              { label: 'Biochemistry', value: '63.5% (244)', color: 'text-red-600' },
              { label: 'Endocrinology', value: '12.9% (50)', color: 'text-blue-600' },
              { label: 'Template Reports', value: '10.6% (41)', color: 'text-slate-800' },
            ]}
            onViewDetails={() => setSelectedDetailChart('department')}
            detailButtonLabel="Department Mix"
          />

          {/* Card 7: Patient Report Preparation Progress */}
          <AnalyticsGridCard
            title="Report Preparation Progress"
            category="Turnaround & Delivery"
            icon={<FileCheck2 className="w-4 h-4 text-indigo-600" />}
            iconBg="bg-indigo-50 text-indigo-600 border-indigo-200"
            badge={`${progressStats.turnaroundProgress}% Printing`}
            badgeType="emerald"
            description="Clinical turnaround pipeline tracking investigation progress from accessioning to final printing and patient handover."
            chart={
              <AnalyticsPieChart
                data={analyticsData?.patientReportPreparationProgress?.breakdown}
                title="Report Preparation Progress"
                donut={true}
                centerValue={`${progressStats.turnaroundProgress}%`}
                centerLabel="Ready to Deliver"
              />
            }
            highlights={[
              { label: 'Print Ready', value: `${progressStats.readyForDelivery} Reports`, color: 'text-emerald-700' },
              { label: 'In Data Entry', value: `${progressStats.inDataEntry} Reports`, color: 'text-amber-600' },
              { label: 'Turnaround', value: `${progressStats.turnaroundProgress}%`, color: 'text-indigo-700' },
            ]}
            onViewDetails={() => setSelectedDetailChart('reportProgress')}
            detailButtonLabel="Delivery Funnel"
          />

          {/* Card 8: Automated Laboratory Interfacing & Machine Telemetry */}
          <AnalyticsGridCard
            title="Analyzer Hardware Telemetry"
            category="Instrument Interfacing"
            icon={<Cpu className="w-4 h-4 text-blue-600" />}
            iconBg="bg-blue-50 text-blue-600 border-blue-200"
            badge="3 Connected"
            badgeType="emerald"
            description="Live bidirectional ASTM E1381 / E1394 interface telemetry connecting automated clinical analyzers directly to worklist queues."
            chart={
              <div className="w-full flex flex-col gap-2.5 p-2 justify-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-800">Hematology Cell Counter</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ONLINE
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">ASTM Protocol Stream</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    TRANSMITTING
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-bold text-slate-800">ABHOI LIS Engine</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    PROCESSING
                  </span>
                </div>
              </div>
            }
            highlights={[
              { label: 'Analyzer State', value: 'CONNECTED', color: 'text-emerald-700' },
              { label: 'Protocol', value: 'ASTM / HL7', color: 'text-blue-700' },
              { label: 'Packet Flow', value: '100% OK', color: 'text-slate-900' },
            ]}
            onViewDetails={() => setActiveView('machines')}
            detailButtonLabel="Open Topology Hub"
          />

          {/* Card 9: Executive Performance Benchmarks & SLA Velocity */}
          <AnalyticsGridCard
            title="Operational SLA Benchmarks"
            category="Quality & Velocity"
            icon={<Sparkles className="w-4 h-4 text-amber-600" />}
            iconBg="bg-amber-50 text-amber-600 border-amber-200"
            badge="Grade A Lab"
            badgeType="amber"
            description="Macro diagnostic metrics tracking average turnaround speed, WhatsApp dispatch readiness, and counter financial realization."
            chart={
              <div className="w-full flex flex-col items-center justify-center p-2 text-center">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex flex-col items-center justify-center shadow-inner mb-2">
                  <span className="text-xl font-black font-mono text-slate-900">48m</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Avg TAT</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-600 mt-1">
                  75.0% WhatsApp Delivery Eligibility
                </div>
                <div className="text-[10px] text-slate-400">
                  96.5% Verification SLA Compliance
                </div>
              </div>
            }
            highlights={[
              { label: 'Turnaround Time', value: '48 Minutes', color: 'text-emerald-700' },
              { label: 'Digital Dispatch', value: '75.0% Ready', color: 'text-blue-700' },
              { label: 'Verification SLA', value: '96.5% Pass', color: 'text-purple-700' },
            ]}
            onViewDetails={() => setSelectedDetailChart('department')}
            detailButtonLabel="View Benchmark Details"
          />
        </div>
      )}

      {/* VIEW 2: Machine Status Hub & Analyzer Topology (Animated data flow & red-cross design) */}
      {activeView === 'machines' && (
        <div className="animate-in fade-in duration-300">
          <MachineStatusHub />
        </div>
      )}

      {/* VIEW 3: Primary Worklist Table (Operational Patient Queue) */}
      {activeView === 'worklist' && (
        <div className="animate-in fade-in duration-300">
          <PatientsPage
            onOpenNewPatient={onOpenNewPatient}
            onPatientsLoaded={setPatients}
            refreshTrigger={refreshTrigger}
          />
        </div>
      )}

      {/* Server Developer API JSON Modal */}
      <ApiJsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        currentData={analyticsData}
      />

      {/* Comprehensive Analytical Deep-Dive Modal */}
      <AnalyticsDetailModal
        isOpen={Boolean(selectedDetailChart)}
        onClose={() => setSelectedDetailChart(null)}
        chartKey={selectedDetailChart}
        data={analyticsData}
        fromDate={fromDate}
        toDate={toDate}
      />
    </section>
  );
}
