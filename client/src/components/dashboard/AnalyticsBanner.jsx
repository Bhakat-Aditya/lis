import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  Activity,
  Timer,
  Cpu,
  Check,
} from 'lucide-react';

const getTodayStr = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function AnalyticsBanner({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onSubmitDates,
  loading = false,
  onRefreshUpstream,
  isRefreshing = false,
  refreshSecondsLeft = 0,
  onSkipWait,
  activeView,
  onToggleView,
  lastCacheTime = null,
  lastCacheDate = null,
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  const todayStr = getTodayStr();

  const [localFrom, setLocalFrom] = useState(fromDate || todayStr);
  const [localTo, setLocalTo] = useState(toDate || todayStr);

  useEffect(() => {
    if (fromDate) setLocalFrom(fromDate);
  }, [fromDate]);

  useEffect(() => {
    if (toDate) setLocalTo(toDate);
  }, [toDate]);

  const isTodayActive = localFrom === todayStr && localTo === todayStr;

  const handleTodayClick = () => {
    const t = getTodayStr();
    setLocalFrom(t);
    setLocalTo(t);
    if (onSubmitDates) {
      onSubmitDates(t, t);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSubmitDates) {
      onSubmitDates(localFrom, localTo);
    }
  };

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

  return (
    <div className="space-y-3">
      {/* Top System Status & Navigation Bar - Clean, Professional */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
        {/* Row 1: Hospital Lab Identity & Live Telemetry Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="New Life Care Diagnostic Centre"
              className="w-9 h-9 rounded-full object-contain bg-white border border-slate-200/80 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  New Life Care Diagnostic Centre
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Location: Midnapore • Diagnostic Laboratory Information System
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

        {/* Row 2: View Switcher Tabs (Left) and Refresh Action (Right) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Segmented Tabs */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center text-xs font-semibold self-start sm:self-auto border border-slate-200/60 shadow-inner">
            <button
              onClick={() => onToggleView('analytics')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
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
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
                activeView === 'machines'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>Machine Status Hub</span>
            </button>
          </div>

          {/* Action Button: Refresh Analytics */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
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

      {/* Green Calendar / Date Selector Bar - Minimal & Clean */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 rounded-2xl shadow-xs text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wide text-white">Select Date</h3>
            <p className="text-[10px] text-emerald-100 font-medium hidden sm:block">
              Always calls GETDASHBOARDJSON for real-time laboratory analytics
            </p>
          </div>
        </div>

        {/* Date Form: Today Shortcut, From & To Inputs, and Submit Button */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
          {/* Today Button */}
          <button
            type="button"
            onClick={handleTodayClick}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer outline-none ${
              isTodayActive
                ? 'bg-white text-emerald-800 shadow-sm ring-2 ring-white/60 font-black'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
            title="Set date range to Today"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* From Date */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/20">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">From:</span>
            <input
              type="date"
              value={localFrom}
              onChange={(e) => setLocalFrom(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold px-2 py-1 rounded-lg border border-emerald-300 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/20">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">To:</span>
            <input
              type="date"
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold px-2 py-1 rounded-lg border border-emerald-300 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900/90 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            title="Submit date range and load analytics"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300" />
            ) : (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{loading ? 'Submitting...' : 'Submit'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
