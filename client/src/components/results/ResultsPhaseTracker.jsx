import React from 'react';
import {
  FlaskConical,
  Clock,
  Cpu,
  Calculator,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export default function ResultsPhaseTracker({
  phaseStats = {},
  activePhaseFilter = 'ALL',
  onSelectPhaseFilter,
}) {
  const {
    total = 0,
    ENTRY = 0,
    SAMPLE = 0,
    RECEIVED = 0,
    RECEIVED_EDITED = 0,
    CALCULATED = 0,
    CALCULATED_EDITED = 0,
    SAVED = 0,
    SUBMITTED = 0,
    VERIFIED = 0,
    DELETED = 0,
  } = phaseStats;

  const activeTotal = Math.max(0, total - DELETED);

  // Exactly the 10 upstream LIS status parameters in requested order
  const filters = [
    {
      id: 'ENTRY',
      name: 'ENTRY',
      count: ENTRY,
      icon: FlaskConical,
      activeClass: 'bg-violet-600 text-white font-bold border-violet-700 shadow-2xs ring-2 ring-violet-300',
      defaultClass: 'bg-violet-50/90 text-violet-900 border-violet-200 hover:bg-violet-100',
      badgeBg: 'bg-violet-100 text-violet-900 font-extrabold',
      isPulse: ENTRY > 0,
    },
    {
      id: 'SAMPLE',
      name: 'SAMPLE',
      count: SAMPLE,
      icon: Clock,
      activeClass: 'bg-amber-500 text-white font-bold border-amber-600 shadow-2xs ring-2 ring-amber-300',
      defaultClass: 'bg-amber-50/90 text-amber-900 border-amber-200 hover:bg-amber-100',
      badgeBg: 'bg-amber-100 text-amber-900 font-extrabold',
    },
    {
      id: 'RECEIVED',
      name: 'RECEIVED',
      count: RECEIVED,
      icon: Cpu,
      activeClass: 'bg-cyan-600 text-white font-bold border-cyan-700 shadow-2xs ring-2 ring-cyan-300',
      defaultClass: 'bg-cyan-50/90 text-cyan-950 border-cyan-300 hover:bg-cyan-100',
      badgeBg: 'bg-cyan-200 text-cyan-950 font-black',
      isPulse: RECEIVED > 0,
    },
    {
      id: 'RECEIVED_EDITED',
      name: 'RECEIVED_EDITED',
      count: RECEIVED_EDITED,
      icon: Cpu,
      activeClass: 'bg-sky-600 text-white font-bold border-sky-700 shadow-2xs ring-2 ring-sky-300',
      defaultClass: 'bg-sky-50/90 text-sky-900 border-sky-200 hover:bg-sky-100',
      badgeBg: 'bg-sky-100 text-sky-900 font-extrabold',
    },
    {
      id: 'CALCULATED',
      name: 'CALCULATED',
      count: CALCULATED,
      icon: Calculator,
      activeClass: 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-2xs ring-2 ring-indigo-300',
      defaultClass: 'bg-indigo-50/90 text-indigo-900 border-indigo-200 hover:bg-indigo-100',
      badgeBg: 'bg-indigo-100 text-indigo-900 font-extrabold',
    },
    {
      id: 'CALCULATED_EDITED',
      name: 'CALCULATED_EDITED',
      count: CALCULATED_EDITED,
      icon: Calculator,
      activeClass: 'bg-purple-600 text-white font-bold border-purple-700 shadow-2xs ring-2 ring-purple-300',
      defaultClass: 'bg-purple-50/90 text-purple-900 border-purple-200 hover:bg-purple-100',
      badgeBg: 'bg-purple-100 text-purple-900 font-extrabold',
    },
    {
      id: 'SAVED',
      name: 'SAVED',
      count: SAVED,
      icon: CheckCircle2,
      activeClass: 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-2xs ring-2 ring-emerald-300',
      defaultClass: 'bg-emerald-50/90 text-emerald-900 border-emerald-200 hover:bg-emerald-100',
      badgeBg: 'bg-emerald-100 text-emerald-900 font-extrabold',
    },
    {
      id: 'SUBMITTED',
      name: 'SUBMITTED',
      count: SUBMITTED,
      icon: FileCheck,
      activeClass: 'bg-blue-600 text-white font-bold border-blue-700 shadow-2xs ring-2 ring-blue-300',
      defaultClass: 'bg-blue-50/90 text-blue-900 border-blue-200 hover:bg-blue-100',
      badgeBg: 'bg-blue-100 text-blue-900 font-extrabold',
    },
    {
      id: 'VERIFIED',
      name: 'VERIFIED',
      count: VERIFIED,
      icon: ShieldCheck,
      activeClass: 'bg-teal-600 text-white font-bold border-teal-700 shadow-2xs ring-2 ring-teal-300',
      defaultClass: 'bg-teal-50/90 text-teal-900 border-teal-200 hover:bg-teal-100',
      badgeBg: 'bg-teal-100 text-teal-900 font-extrabold',
    },
    {
      id: 'DELETED',
      name: 'DELETED',
      count: DELETED,
      icon: Trash2,
      activeClass: 'bg-rose-600 text-white font-bold border-rose-700 shadow-2xs ring-2 ring-rose-300',
      defaultClass: 'bg-rose-50/90 text-rose-900 border-rose-200 hover:bg-rose-100',
      badgeBg: 'bg-rose-100 text-rose-900 font-extrabold',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs py-1.5 px-3 flex flex-wrap items-center gap-1.5 text-xs">
      {/* ALL Filter */}
      <button
        type="button"
        onClick={() => onSelectPhaseFilter('ALL')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
          activePhaseFilter === 'ALL'
            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs ring-2 ring-slate-400'
            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
        }`}
        title="Show all active tests"
      >
        <span>ALL</span>
        <span
          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-extrabold ${
            activePhaseFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-white text-slate-900 shadow-2xs'
          }`}
        >
          {activeTotal}
        </span>
      </button>

      <span className="text-slate-300 hidden sm:inline">|</span>

      {/* Exactly the 10 Upstream LIS Status Filters Only */}
      {filters.map((item) => {
        const IconComp = item.icon;
        const isActive = activePhaseFilter === item.id;
        const hasTests = item.count > 0;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectPhaseFilter(isActive ? 'ALL' : item.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              isActive ? item.activeClass : item.defaultClass
            } ${!hasTests && !isActive ? 'opacity-65 hover:opacity-100' : ''}`}
            title={`Filter by STATUS: ${item.name} (${item.count} test${item.count === 1 ? '' : 's'})`}
          >
            <IconComp className="w-3.5 h-3.5 shrink-0" />
            <span>{item.name}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-extrabold ${
                isActive
                  ? 'bg-white/25 text-white'
                  : hasTests
                  ? item.badgeBg
                  : 'bg-white/70 text-slate-500'
              }`}
            >
              {item.count}
            </span>
            {item.isPulse && !isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-ping inline-block" />
            )}
          </button>
        );
      })}
    </div>
  );
}
