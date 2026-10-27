import React, { useState } from 'react';
import {
  PieChart,
  ShieldAlert,
  Clock,
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import ClinicalGuideModal from '../common/ClinicalGuideModal.jsx';

export default function DepartmentStats({ totalPatients = 0 }) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Department workload distribution (realistic clinical lab metrics)
  const departments = [
    { name: 'Hematology (CBC, ESR, PT/INR)', share: 38, count: Math.max(1, Math.round(totalPatients * 0.38)), color: 'bg-indigo-600', text: 'text-indigo-600' },
    { name: 'Clinical Biochemistry (LFT, KFT, Lipids)', share: 29, count: Math.max(1, Math.round(totalPatients * 0.29)), color: 'bg-blue-500', text: 'text-blue-600' },
    { name: 'Microbiology & Culture', share: 14, count: Math.max(1, Math.round(totalPatients * 0.14)), color: 'bg-purple-600', text: 'text-purple-600' },
    { name: 'Serology & Immunology (Thyroid, Viral)', share: 12, count: Math.max(1, Math.round(totalPatients * 0.12)), color: 'bg-emerald-500', text: 'text-emerald-600' },
    { name: 'Clinical Pathology (Urine, Stool)', share: 7, count: Math.max(1, Math.round(totalPatients * 0.07)), color: 'bg-amber-500', text: 'text-amber-600' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 2 Cols: Department Test Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Departmental Workload Distribution</span>
              </h3>
              <p className="text-xs text-slate-500">Live split of diagnostic investigations across lab benches</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              NABL QC Passed
            </span>
          </div>

          <div className="space-y-3.5">
            {departments.map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{dept.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">{dept.count} tests</span>
                    <span className={`font-bold ${dept.text}`}>{dept.share}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${dept.color}`}
                    style={{ width: `${dept.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* SLA & Turnaround time stats */}
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Average Lab TAT</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">48 Mins</div>
              <div className="text-[10px] text-emerald-600 font-medium">Within 60m SLA</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Delayed Tests</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">0</div>
              <div className="text-[10px] text-slate-400 font-medium">100% on schedule</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Critical Panic Alerts</div>
              <div className="text-base font-extrabold text-rose-600 mt-0.5">2</div>
              <div className="text-[10px] text-rose-600 font-medium">Physician Notified</div>
            </div>
          </div>
        </div>

        {/* 1 Col: Urgent / Critical Alerts & Quality Bulletin */}
        <div className="space-y-4">
          {/* Urgent Critical Range Panel */}
          <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl border border-rose-200/90 p-4.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-rose-900 uppercase tracking-tight">
                    Panic Value Protocol
                  </h4>
                  <span className="text-[10px] text-rose-600 font-semibold">Immediate doctor alert</span>
                </div>
              </div>
              <button
                onClick={() => setIsGuideOpen(true)}
                className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
              >
                View Limits
              </button>
            </div>

            <div className="space-y-2 text-xs mt-3">
              <div className="p-2.5 rounded-xl bg-white/90 border border-rose-200 text-slate-800 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Barcode #1042 - Blood Sugar (F)</span>
                  <span className="text-rose-600 font-extrabold">412 mg/dL</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Ref: 70-100 mg/dL • Dr. P. K. Ghosh notified via telephone
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200 text-slate-800 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Barcode #1039 - Platelet Count</span>
                  <span className="text-amber-700 font-extrabold">28,000 /uL</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Ref: 1.5 - 4.5 Lakhs • Urgent verification pending
                </div>
              </div>
            </div>
          </div>

          {/* NABL Quality Compliance Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">ISO 9001:2015 & NABL Ready</div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Automated multi-point calibration & bio-rad external control active.
              </div>
            </div>
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
