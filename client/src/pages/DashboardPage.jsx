import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/context.auth.jsx';
import StatCards from '../components/dashboard/StatCards.jsx';
import PatientsPage from './PatientsPage.jsx';
import { UserPlus, RefreshCw } from 'lucide-react';

export default function DashboardPage({ onOpenNewPatient }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Compute live clinical metrics from patients loaded by PatientsPage
  const totalCount = patients.length;
  const samplePending = patients.filter((p) => {
    const s = String(p.status || '').toUpperCase();
    return s === 'REGISTERED';
  }).length;

  const inTesting = patients.filter((p) => {
    const s = String(p.status || '').toUpperCase();
    return ['SAMPLE', 'TESTING', 'SAVED'].includes(s);
  }).length;

  const readyPrint = patients.filter((p) => {
    const s = String(p.status || '').toUpperCase();
    return ['PRINTING', 'APPROVED', 'RELEASED', 'READY', 'REPORT READY', 'VERIFIED'].includes(s);
  }).length;

  const totalRevenue = patients.reduce((acc, p) => acc + (Number(p.totalBill) || 0), 0);

  return (
    <section className="space-y-4 pb-8">
      <Helmet>
        <title>Dashboard | Lab Expert</title>
        <meta
          name="description"
          content="Diagnostic laboratory operations dashboard and live worklist in Lab Expert."
        />
      </Helmet>

      {/* Top Welcome & Fast Action Bar */}
      <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">
            Diagnostic Operations Dashboard
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Central Lab Midnapore & Branches • Real-time Patient Queue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-600 transition-colors cursor-pointer shadow-2xs"
            title="Refresh Queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {onOpenNewPatient && (
            <button
              onClick={onOpenNewPatient}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ New Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* 5-Metric KPI Stat Cards */}
      <StatCards
        totalCount={totalCount}
        samplePending={samplePending}
        inTesting={inTesting}
        readyPrint={readyPrint}
        totalRevenue={totalRevenue}
      />

      {/* Primary Worklist Table (Screenshot 1) */}
      <PatientsPage
        onOpenNewPatient={onOpenNewPatient}
        onPatientsLoaded={setPatients}
        refreshTrigger={refreshTrigger}
      />
    </section>
  );
}
