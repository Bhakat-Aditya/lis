import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileCode,
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
  onOpenJsonModal,
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
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString('en-US', {
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

  const yestDateObj = new Date(todayDateObj);
  yestDateObj.setDate(todayDateObj.getDate() - 1);
  const yestStr = formatD(yestDateObj);

  const past7DateObj = new Date(todayDateObj);
  past7DateObj.setDate(todayDateObj.getDate() - 6);
  const past7Str = formatD(past7DateObj);

  const past9DateObj = new Date(todayDateObj);
  past9DateObj.setDate(todayDateObj.getDate() - 8);
  const past9Str = formatD(past9DateObj);

  const isTodayActive = fromDate === todayStr && toDate === todayStr;
  const isYesterdayActive = fromDate === yestStr && toDate === yestStr;
  const is7DaysActive = fromDate === past7Str && toDate === todayStr;
  const is9DaysActive = fromDate === past9Str && toDate === todayStr;

  const handleQuickPreset = (preset) => {
    if (preset === 'today') {
      onFromDateChange(todayStr);
      onToDateChange(todayStr);
      if (onSubmitDates) onSubmitDates(todayStr, todayStr);
    } else if (preset === 'yesterday') {
      onFromDateChange(yestStr);
      onToDateChange(yestStr);
      if (onSubmitDates) onSubmitDates(yestStr, yestStr);
    } else if (preset === 'last7days') {
      onFromDateChange(past7Str);
      onToDateChange(todayStr);
      if (onSubmitDates) onSubmitDates(past7Str, todayStr);
    } else if (preset === 'last9days') {
      onFromDateChange(past9Str);
      onToDateChange(todayStr);
      if (onSubmitDates) onSubmitDates(past9Str, todayStr);
    } else if (preset === 'thismonth') {
      const firstDay = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), 1);
      const firstStr = formatD(firstDay);
      onFromDateChange(firstStr);
      onToDateChange(todayStr);
      if (onSubmitDates) onSubmitDates(firstStr, todayStr);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top System Status & Navigation Bar */}
      <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Analytics Overview</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 divide-x divide-slate-200">
            <span className="px-1.5 font-bold text-slate-800">New Life Care Midnapore</span>
            <span className="px-2 flex items-center gap-1" title="Date of Analytical Telemetry Window">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{lastCacheDate || currentDateFormatted}</span>
            </span>
            <span
              className="px-2 flex items-center gap-1.5 font-mono text-slate-800 bg-slate-100/90 py-0.5 px-2.5 rounded-lg border border-slate-200/80"
              title={
                lastCacheTime
                  ? `Telemetry Cache Arrival Time: ${lastCacheTime}`
                  : 'Current System Time'
              }
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500">Last Cache:</span>
              <strong className="text-slate-900 font-extrabold">{lastCacheTime || currentTime}</strong>
            </span>
          </div>

          {/* Mobile Cache Arrival Pill */}
          <div className="sm:hidden flex items-center gap-1 text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
            <Clock className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Cache: <strong className="font-bold">{lastCacheTime || currentTime}</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => onToggleView('analytics')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'analytics'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Analytics Overview</span>
            </button>
            <button
              onClick={() => onToggleView('machines')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'machines'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>Machine Status Hub</span>
            </button>
            <button
              onClick={() => onToggleView('worklist')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'worklist'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Patient Queue</span>
            </button>
          </div>

          {/* Upstream DASHBOARDREFRESH Button */}
          <button
            onClick={onRefreshUpstream}
            disabled={isRefreshing || refreshSecondsLeft > 0}
            className={`flex items-center gap-1.5 font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer ${
              refreshSecondsLeft > 0
                ? 'bg-amber-500/15 text-amber-700 border border-amber-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
            }`}
            title="Calls POST DASHBOARDREFRESH with fromDate & toDate, waits 2 mins, then calls GETDASHBOARDJSON"
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

          {/* View/Copy API JSON Contract */}
          <button
            onClick={onOpenJsonModal}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-1.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Open API JSON contract specification for upstream backend developer"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">API JSON Contract</span>
          </button>

          {/* Patient Entry Shortcut */}
          {onOpenNewPatient && (
            <button
              onClick={onOpenNewPatient}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Patient Entry</span>
            </button>
          )}
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
          {/* Quick Date Presets (Visible across all screens with active highlighting) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs mr-1">
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                isTodayActive
                  ? 'bg-white text-emerald-800 font-extrabold shadow-sm scale-105 ring-2 ring-white/60'
                  : 'bg-white/15 hover:bg-white/25 text-emerald-50 font-semibold'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('yesterday')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                isYesterdayActive
                  ? 'bg-white text-emerald-800 font-extrabold shadow-sm scale-105 ring-2 ring-white/60'
                  : 'bg-white/15 hover:bg-white/25 text-emerald-50 font-semibold'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('last7days')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                is7DaysActive
                  ? 'bg-white text-emerald-800 font-extrabold shadow-sm scale-105 ring-2 ring-white/60'
                  : 'bg-white/15 hover:bg-white/25 text-emerald-50 font-semibold'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('last9days')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                is9DaysActive
                  ? 'bg-white text-emerald-800 font-extrabold shadow-sm scale-105 ring-2 ring-white/60'
                  : 'bg-white/15 hover:bg-white/25 text-emerald-50 font-semibold'
              }`}
            >
              9-Day Window
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
