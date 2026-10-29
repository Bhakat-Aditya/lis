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
} from 'lucide-react';

export default function AnalyticsBanner({
  selectedDate,
  onDateChange,
  onSubmitDate,
  onOpenNewPatient,
  onOpenJsonModal,
  activeView,
  onToggleView,
  loading = false,
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

  const handleQuickPreset = (daysBack) => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    const y = d.getFullYear();
    const dateStr = `${y}-${month}-${day}`;
    onDateChange(dateStr);
    onSubmitDate(dateStr);
  };

  return (
    <div className="space-y-3">
      {/* Top System Status & Navigation Bar (Matching Screenshot Header) */}
      <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Analytics Overview</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 divide-x divide-slate-200">
            <span className="px-1.5 font-semibold text-slate-700">LIS System</span>
            <span className="px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {currentDateFormatted}
            </span>
            <span className="px-2 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {currentTime}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
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

      {/* Green Calendar / Date Selector Bar (Exact Visual from Screenshot) */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 rounded-2xl shadow-xs text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wide text-white">Select Date</h3>
            <p className="text-[10px] text-emerald-100 font-medium hidden sm:block">
              Filter clinical laboratory operations, billings & test volumes
            </p>
          </div>
        </div>

        {/* Date Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitDate(selectedDate);
          }}
          className="flex items-center gap-2 flex-wrap"
        >
          {/* Quick Date Presets */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-emerald-100 mr-2">
            <button
              type="button"
              onClick={() => handleQuickPreset(0)}
              className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/25 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(1)}
              className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/25 transition-colors cursor-pointer"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(8)}
              className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/25 transition-colors cursor-pointer"
            >
              9-Day Window
            </button>
          </div>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-300 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs py-1.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Submit</span>
          </button>
        </form>
      </div>
    </div>
  );
}

