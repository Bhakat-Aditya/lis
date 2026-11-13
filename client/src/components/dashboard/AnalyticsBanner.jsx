import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  UserPlus,
  RefreshCw,
  Activity,
  Layers,
  Sparkles,
  Timer,
  AlertCircle,
  Cpu,
} from 'lucide-react';

export default function AnalyticsBanner({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onSubmitDates,
  onOpenNewPatient,
  onRefreshUpstream,
  isRefreshing = false,
  refreshSecondsLeft = 0,
  onSkipWait,
  activeView,
  onToggleView,
  loading = false,
  lastCacheTime = null,
  lastCacheDate = null,
  isFromCache = false,
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Kolkata',
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSeconds = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatD = (d) => {
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const todayDateObj = new Date();
  const todayStr = formatD(todayDateObj);

  const isTodayActive = fromDate === todayStr && toDate === todayStr;

  const handleQuickPreset = (preset) => {
    if (preset === 'today') {
      onFromDateChange(todayStr);
      onToDateChange(todayStr);
      if (onSubmitDates) onSubmitDates(todayStr, todayStr);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top System Status & Navigation Bar - Clean, Reconstructed, Professional */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
        {/* Row 1: Hospital Lab Identity & Live Telemetry Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xs shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  New Life Care Midnapore
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Hospital Information & Diagnostic Laboratory System
              </p>
            </div>
          </div>

          {/* Right: Date & Cache Arrival Metadata */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold">{lastCacheDate || currentDateFormatted}</span>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-950 font-mono"
              title={
                lastCacheTime
                  ? `Telemetry Cache Arrival Time: ${lastCacheTime}`
                  : 'Current System Time'
              }
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-[11px] font-sans font-medium text-indigo-700">Last Synced:</span>
              <strong className="text-xs font-bold text-indigo-900">{lastCacheTime || currentTime}</strong>
            </div>
          </div>
        </div>

        {/* Row 2: View Switcher Tabs (Left) and Action Buttons (Right) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Segmented Tabs */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center text-xs font-semibold self-start sm:self-auto border border-slate-200/60 shadow-inner">
            <button
              onClick={() => onToggleView('analytics')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'analytics'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Analytics Overview</span>
            </button>
            <button
              onClick={() => onToggleView('machines')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'machines'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>Machine Status Hub</span>
            </button>
            <button
              onClick={() => onToggleView('worklist')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'worklist'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Patient Queue</span>
            </button>
          </div>

          {/* Action Buttons: Refresh Analytics & Patient Entry */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Upstream DASHBOARDREFRESH Button */}
            <button
              onClick={onRefreshUpstream}
              disabled={isRefreshing || refreshSecondsLeft > 0}
              className={`flex items-center gap-1.5 font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer ${
                refreshSecondsLeft > 0
                  ? 'bg-amber-500/15 text-amber-700 border border-amber-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
              }`}
              title="Fetch fresh synchronized telemetry from upstream LIS server"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  refreshSecondsLeft > 0 || isRefreshing ? 'animate-spin' : ''
                }`}
              />
              <span>
                {refreshSecondsLeft > 0
                  ? `Refreshing (${formatSeconds(refreshSecondsLeft)})`
                  : isRefreshing
                  ? 'Requesting Refresh...'
                  : 'Refresh Analytics'}
              </span>
            </button>

            {/* Patient Entry Shortcut */}
            {onOpenNewPatient && (
              <button
                onClick={onOpenNewPatient}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Patient Entry</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2-Minute Sync Countdown Banner when DASHBOARDREFRESH was triggered */}
      {refreshSecondsLeft > 0 && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl border border-indigo-500/50 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-200">
                  POST DASHBOARDREFRESH Successful
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  2-Minute Processing Timer
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Upstream server is refreshing statistics for{' '}
                <strong className="text-white font-mono">{fromDate}</strong> to{' '}
                <strong className="text-white font-mono">{toDate}</strong>. Calling{' '}
                <code className="text-emerald-400 font-mono font-bold">GETDASHBOARDJSON</code> in{' '}
                <span className="text-amber-300 font-bold font-mono text-xs">
                  {formatSeconds(refreshSecondsLeft)}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center shrink-0">
            <div className="w-28 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${((120 - refreshSecondsLeft) / 120) * 100}%` }}
              />
            </div>
            <button
              onClick={onSkipWait}
              className="text-[11px] text-indigo-300 hover:text-white underline cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              Skip wait & fetch now
            </button>
          </div>
        </div>
      )}

      {/* Green Calendar / Date Selector Bar (Exact Visual from Screenshot) */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 rounded-2xl shadow-xs text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm tracking-wide text-white">Select Date</h3>
              <span className="text-[10px] bg-white/20 text-emerald-100 font-mono px-2 py-0.5 rounded-md">
                Range: {fromDate} to {toDate}
              </span>
            </div>
            <p className="text-[10px] text-emerald-100 font-medium hidden sm:block">
              Always calls GETDASHBOARDJSON for real-time laboratory analytics
            </p>
          </div>
        </div>

        {/* Date Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onSubmitDates) onSubmitDates(fromDate, toDate);
          }}
          className="flex items-center gap-2 flex-wrap"
        >
          {/* Quick Date Preset: Only Today */}
          <div className="flex items-center text-xs mr-1">
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                isTodayActive
                  ? 'bg-white text-emerald-800 font-extrabold shadow-sm scale-105 ring-2 ring-white/60'
                  : 'bg-white/15 hover:bg-white/25 text-emerald-50 font-semibold'
              }`}
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-xl border border-white/20">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold px-2 py-1 rounded-lg border border-emerald-300 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-xl border border-white/20">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold px-2 py-1 rounded-lg border border-emerald-300 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
            />
          </div>

          {/* Filter / Submit button: ALWAYS calls GET API_GET_DASHBOARD_JSON="GETDASHBOARDJSON" */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs py-1.5 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Always calls GET API_GET_DASHBOARD_JSON='GETDASHBOARDJSON'"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Filter</span>
          </button>

          {/* Upstream DASHBOARDREFRESH Button */}
          <button
            type="button"
            onClick={onRefreshUpstream}
            disabled={isRefreshing || refreshSecondsLeft > 0}
            className={`flex items-center gap-1.5 font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer ${
              refreshSecondsLeft > 0
                ? 'bg-amber-400/20 text-amber-100 border border-amber-300/40 cursor-not-allowed'
                : 'bg-emerald-900/60 hover:bg-emerald-900 text-white border border-emerald-400/40 active:scale-95'
            }`}
            title="Calls POST DASHBOARDREFRESH with fromDate & toDate, waits 2 min timer, then calls GETDASHBOARDJSON"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                refreshSecondsLeft > 0 || isRefreshing ? 'animate-spin' : ''
              }`}
            />
            <span>
              {refreshSecondsLeft > 0
                ? `Wait ${formatSeconds(refreshSecondsLeft)}`
                : 'Refresh'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
