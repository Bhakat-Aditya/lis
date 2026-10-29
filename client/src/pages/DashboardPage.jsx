import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api.js';
import StatCards from '../components/dashboard/StatCards.jsx';
import PatientsPage from './PatientsPage.jsx';
import AnalyticsBanner from '../components/dashboard/AnalyticsBanner.jsx';
import AnalyticsSectionCard from '../components/dashboard/AnalyticsSectionCard.jsx';
import AnalyticsStackedBarChart from '../components/dashboard/AnalyticsStackedBarChart.jsx';
import AnalyticsPieChart from '../components/dashboard/AnalyticsPieChart.jsx';
import ApiJsonModal from '../components/dashboard/ApiJsonModal.jsx';
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

export default function DashboardPage({ onOpenNewPatient }) {
  const [activeView, setActiveView] = useState('analytics'); // 'analytics' | 'worklist'
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [refreshTrigger] = useState(0);

  // Fetch dashboard analytics from middleman backend
  const fetchAnalytics = useCallback(async (dateToFetch) => {
    try {
      setLoadingAnalytics(true);
      const res = await api.get('/analytics/dashboard', {
        params: {
          date: dateToFetch || selectedDate,
          days: 9,
        },
      });
      if (res.data && res.data.STATUS === 'SUCCESS') {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.warn('[Dashboard] Could not fetch remote analytics, using clinical aggregations:', err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAnalytics(selectedDate);
  }, [selectedDate, refreshTrigger, fetchAnalytics]);

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

  const readyPrint = analyticsData?.kpiSummary?.reportsReadyForPrinting ??
    patients.filter((p) => {
      const s = String(p.status || '').toUpperCase();
      return ['PRINTING', 'APPROVED', 'RELEASED', 'READY', 'REPORT READY', 'VERIFIED'].includes(s);
    }).length;

  const totalRevenue = analyticsData?.kpiSummary?.totalBilledAmount ??
    patients.reduce((acc, p) => acc + (Number(p.totalBill) || 0), 0);

  return (
    <section className="space-y-4 pb-12 overflow-x-hidden">
      <Helmet>
        <title>Analytics Overview & Operations | LIS System</title>
        <meta
          name="description"
          content="Comprehensive clinical laboratory analytics overview, daily statistics, 9-day patient volume, gender ratio, billing breakdown, test results, department volume, and live worklist."
        />
      </Helmet>

      {/* Top Banner with Date Selector, Clock, and API JSON Contract Shortcut */}
      <AnalyticsBanner
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onSubmitDate={(d) => fetchAnalytics(d)}
        onOpenNewPatient={onOpenNewPatient}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        activeView={activeView}
        onToggleView={setActiveView}
        loading={loadingAnalytics}
      />

      {/* 5-Metric Top KPI Stat Cards */}
      <StatCards
        totalCount={totalCount}
        samplePending={samplePending}
        inTesting={inTesting}
        readyPrint={readyPrint}
        totalRevenue={totalRevenue}
      />

      {/* VIEW 1: Analytics Overview (Faithful representation of the 7 screenshot sections) */}
      {activeView === 'analytics' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Section 1: Last 9 Days Patient Registration */}
          <AnalyticsSectionCard
            title="Last 9 Days Patient Registration"
            rightHeader="Daily statistics"
            chart={
              <AnalyticsStackedBarChart
                data={analyticsData?.last9DaysRegistration}
              />
            }
            statistics={
              <RegistrationStats
                data={analyticsData?.last9DaysRegistration}
              />
            }
          />

          {/* Section 2: Male-Female Ratio */}
          <AnalyticsSectionCard
            title="Male-Female Ratio"
            rightHeader="statistics"
            chart={
              <AnalyticsPieChart
                data={analyticsData?.maleFemaleRatio?.breakdown}
                title="Male Female Ratio"
              />
            }
            statistics={
              <GenderStats
                data={analyticsData?.maleFemaleRatio}
              />
            }
          />

          {/* Section 3: Patient Bill Status */}
          <AnalyticsSectionCard
            title="Patient Bill Status"
            rightHeader="Daily Statistics"
            chart={
              <AnalyticsPieChart
                data={analyticsData?.patientBillStatus?.breakdown}
                title="Patient Bill Status"
              />
            }
            statistics={
              <BillStatusStats
                data={analyticsData?.patientBillStatus}
              />
            }
          />

          {/* Section 4: Bill Amount Breakup */}
          <AnalyticsSectionCard
            title="Bill Amount Breakup"
            rightHeader="Daily statistics"
            chart={
              <AnalyticsPieChart
                data={analyticsData?.billAmountBreakup?.breakdown}
                title="Bill Amount Breakup"
              />
            }
            statistics={
              <BillAmountStats
                data={analyticsData?.billAmountBreakup}
              />
            }
          />

          {/* Section 5: Test Result Summary */}
          <AnalyticsSectionCard
            title="Test Result Summary"
            rightHeader="statistics"
            chart={
              <AnalyticsPieChart
                data={analyticsData?.testResultSummary?.breakdown}
                title="Test Result Summary"
              />
            }
            statistics={
              <TestResultStats
                data={analyticsData?.testResultSummary}
              />
            }
          />

          {/* Section 6: Department Wise Report Count */}
          <AnalyticsSectionCard
            title="Department Wise Report Count"
            rightHeader="statistics"
            chart={
              <AnalyticsPieChart
                data={analyticsData?.departmentWiseReportCount?.breakdown}
                title="Department Wise Report Count"
              />
            }
            statistics={
              <DepartmentReportStats
                data={analyticsData?.departmentWiseReportCount}
              />
            }
          />

          {/* Section 7: Patient Report Preparation Progress */}
          <AnalyticsSectionCard
            title="Patient Report Preparation Progress"
            rightHeader="statistics"
            chart={
              <AnalyticsPieChart
                data={analyticsData?.patientReportPreparationProgress?.breakdown}
                title="Report Preparation Progress"
              />
            }
            statistics={
              <ReportProgressStats
                data={analyticsData?.patientReportPreparationProgress}
              />
            }
          />
        </div>
      )}

      {/* VIEW 2: Primary Worklist Table (Operational Patient Queue) */}
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
    </section>
  );
}
