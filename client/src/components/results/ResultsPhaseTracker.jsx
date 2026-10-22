import React from 'react';
import {
  Clock,
  Beaker,
  FlaskConical,
  CheckCircle2,
  Award,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export default function ResultsPhaseTracker({
  phaseStats = {
    total: 0,
    phase1: 0, // Sample Pending
    phase2: 0, // In Lab
    phase3: 0, // In Testing
    phase4: 0, // Recorded / Verified
    phase5: 0, // Approved
    abnormal: 0,
  },
  activePhaseFilter = 'ALL',
  onSelectPhaseFilter,
  onReceiveAllSamples,
  receivingAll = false,
}) {
  const { total, phase1, phase2, phase3, phase4, phase5, abnormal } = phaseStats;
  const completedCount = phase4 + phase5;
  const percentCompleted = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const phases = [
    {
      id: 'PHASE_1',
      num: '1',
      title: 'Sample',
      count: phase1,
      color: 'amber',
      icon: Clock,
      activeClass: 'bg-amber-500 text-white shadow-2xs font-bold border-amber-600',
      defaultClass: 'bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100',
    },
    {
      id: 'PHASE_2',
      num: '2',
      title: 'In Lab',
      count: phase2,
      color: 'sky',
      icon: Beaker,
      activeClass: 'bg-sky-600 text-white shadow-2xs font-bold border-sky-700',
      defaultClass: 'bg-sky-50/80 text-sky-900 border-sky-200 hover:bg-sky-100',
    },
    {
      id: 'PHASE_3',
      num: '3',
      title: 'Testing',
      count: phase3,
      color: 'violet',
      icon: FlaskConical,
      activeClass: 'bg-violet-600 text-white shadow-2xs font-bold border-violet-700',
      defaultClass: 'bg-violet-50/80 text-violet-900 border-violet-200 hover:bg-violet-100',
      isPulse: phase3 > 0,
    },
    {
      id: 'PHASE_4',
      num: '4',
      title: 'Recorded',
      count: phase4,
      color: 'emerald',
      icon: CheckCircle2,
      activeClass: 'bg-emerald-600 text-white shadow-2xs font-bold border-emerald-700',
      defaultClass: 'bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100',
    },
    {
      id: 'PHASE_5',
      num: '5',
      title: 'Approved',
      count: phase5,
      color: 'indigo',
      icon: Award,
      activeClass: 'bg-indigo-600 text-white shadow-2xs font-bold border-indigo-700',
      defaultClass: 'bg-indigo-50/80 text-indigo-900 border-indigo-200 hover:bg-indigo-100',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs py-1.5 px-3 flex flex-wrap items-center justify-between gap-2 text-xs">
      {/* Left: 5-Stage Compact Pill Stepper */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSelectPhaseFilter('ALL')}
          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
            activePhaseFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          All ({total})
        </button>

        <span className="text-slate-300 hidden sm:inline">|</span>

        {phases.map((p, idx) => {
          const IconComp = p.icon;
          const isActive = activePhaseFilter === p.id;
          return (
            <React.Fragment key={p.id}>
              <button
                type="button"
                onClick={() => onSelectPhaseFilter(isActive ? 'ALL' : p.id)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isActive ? p.activeClass : p.defaultClass
                }`}
                title={`Filter tests in ${p.title} phase`}
              >
                <IconComp className="w-3.5 h-3.5 shrink-0" />
                <span>{p.title}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-white/80 text-slate-800'
                }`}>
                  {p.count}
                </span>
                {p.isPulse && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-ping inline-block" />
                )}
              </button>
              {idx < phases.length - 1 && (
                <span className="text-slate-300 text-[10px] hidden md:inline">→</span>
              )}
            </React.Fragment>
          );
        })}

        {phase1 > 0 && onReceiveAllSamples && (
          <button
            type="button"
            onClick={onReceiveAllSamples}
            disabled={receivingAll}
            className="ml-1 px-2.5 py-0.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {receivingAll ? 'Receiving...' : `Receive (${phase1})`}
          </button>
        )}
      </div>

      {/* Right: Progress Metric & Abnormal Indicator */}
      <div className="flex items-center gap-2 ml-auto">
        {abnormal > 0 && (
          <button
            type="button"
            onClick={() => onSelectPhaseFilter(activePhaseFilter === 'ABNORMAL' ? 'ALL' : 'ABNORMAL')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-extrabold border shadow-2xs transition-all cursor-pointer ${
              activePhaseFilter === 'ABNORMAL'
                ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400 animate-pulse'
                : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${activePhaseFilter === 'ABNORMAL' ? 'text-white' : 'text-rose-600'}`} />
            <span>{abnormal} Flagged Abnormal</span>
          </button>
        )}

        {/* Mini Completion Progress Meter */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          <span>{completedCount}/{total} Complete</span>
          <div className="w-14 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
          <span className="font-bold text-slate-800 font-mono">{percentCompleted}%</span>
        </div>
      </div>
    </div>
  );
}
