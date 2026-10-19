import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/context.auth.jsx';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  ArrowRight,
  Search,
  Activity,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import ClinicalGuideModal from '../common/ClinicalGuideModal.jsx';

export default function DashboardHeader({
  onOpenNewPatient,
  onOpenTestLookup,
  onRefresh,
  refreshing = false,
  totalPatients = 0,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Live time ticker
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-based greeting
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-slate-800 text-white shadow-lg p-5 md:p-6">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Left: Salutation & Clinic Details */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AWS Cloud Live
              </span>
              <span className="text-[11px] font-medium text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                Midnapore Main Center
              </span>
              <span className="text-[11px] font-medium text-indigo-200 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                ISO 9001:2015 & NABL Ready
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{getGreeting()}, {user?.name || user?.loginId}</span>
              <Sparkles className="w-5 h-5 text-indigo-400 hidden sm:inline" />
            </h1>

            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Role: <strong className="text-indigo-300 uppercase tracking-wide">{user?.role}</strong></span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {formattedDate}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                {formattedTime}
              </span>
            </p>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {onOpenNewPatient && (
              <button
                onClick={onOpenNewPatient}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Patient</span>
              </button>
            )}

            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 active:scale-95 text-indigo-200 font-semibold text-xs py-2.5 px-3.5 rounded-xl border border-indigo-400/30 backdrop-blur-xs transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-300" />
              <span>Clinical Guide</span>
            </button>

            {onOpenTestLookup && (
              <button
                onClick={onOpenTestLookup}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs py-2.5 px-3.5 rounded-xl border border-white/15 backdrop-blur-xs transition-all cursor-pointer"
              >
                <Search className="w-4 h-4 text-indigo-300" />
                <span>Test Rates</span>
              </button>
            )}

            <button
              onClick={() => navigate('/patients')}
              className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs py-2.5 px-3.5 rounded-xl border border-white/15 backdrop-blur-xs transition-all cursor-pointer"
              title="View entire patient worklist"
            >
              <span>Worklist</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-300" />
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition-all cursor-pointer disabled:opacity-50"
                title="Refresh live data"
              >
                <RefreshCw className={`w-4 h-4 text-slate-300 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      <ClinicalGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </>
  );
}
