import React from 'react';
import {
  CheckCircle,
  Clock,
  TestTube2,
  Cpu,
  FileCheck2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Send,
  UserCheck,
} from 'lucide-react';

export default function ClinicalJourneyTracker({ status = 'REGISTERED', reports = [], regDate = '' }) {
  const s = String(status || '').toUpperCase().trim();

  const getStageIndex = (currentStatus) => {
    if (currentStatus === 'REGISTERED') return 0;
    if (currentStatus === 'SAMPLE' || currentStatus === 'SAMPLE RECEIVED' || currentStatus === 'SAMPLE_RECEIVED') return 1;
    if (currentStatus === 'TESTING' || currentStatus === 'IN TESTING' || currentStatus === 'SAVED') return 2;
    if (currentStatus === 'VERIFIED') return 3;
    if (currentStatus === 'PRINTING' || currentStatus === 'APPROVED' || currentStatus === 'RELEASED') return 4;
    return 1;
  };

  const activeIndex = getStageIndex(s);

  const stages = [
    {
      id: 0,
      title: 'Registration',
      desc: 'Demographics & PID generated',
      icon: UserCheck,
      color: 'indigo',
    },
    {
      id: 1,
      title: 'Sample Collection',
      desc: 'Phlebotomy & tube barcoding',
      icon: TestTube2,
      color: 'amber',
    },
    {
      id: 2,
      title: 'Lab Analysis',
      desc: 'Hematology/Biochemistry auto-runs',
      icon: Cpu,
      color: 'purple',
    },
    {
      id: 3,
      title: 'Doctor Sign-off',
      desc: 'Pathologist clinical correlation',
      icon: FileCheck2,
      color: 'teal',
    },
    {
      id: 4,
      title: 'Report Dispatch',
      desc: 'Printed & WhatsApp delivered',
      icon: Send,
      color: 'emerald',
    },
  ];

  // Derive phlebotomy tubes needed from test names
  const testNames = reports.map((r) => String(r.testName || '').toUpperCase());
  const needsEdta =
    testNames.some((t) =>
      t.includes('CBC') ||
      t.includes('HAEM') ||
      t.includes('HEMOGLOBIN') ||
      t.includes('LEUCOCYTE') ||
      t.includes('TLC') ||
      t.includes('PLATELET') ||
      t.includes('ESR') ||
      t.includes('HBA1C') ||
      t.includes('BLOOD GROUP') ||
      t.includes('WBC') ||
      t.includes('RBC')
    );
  const needsFluoride = testNames.some((t) =>
    t.includes('SUGAR') || t.includes('GLUCOSE') || t.includes('FBS') || t.includes('PPBS') || t.includes('RBS')
  );
  const needsCitrate = testNames.some((t) =>
    t.includes('PT') || t.includes('INR') || t.includes('APTT') || t.includes('COAGULATION')
  );
  const needsSst =
    testNames.some((t) =>
      t.includes('LFT') ||
      t.includes('KFT') ||
      t.includes('LIPID') ||
      t.includes('THYROID') ||
      t.includes('CRP') ||
      t.includes('ELECTROLYTE') ||
      t.includes('LIVER') ||
      t.includes('KIDNEY') ||
      t.includes('BILIRUBIN') ||
      t.includes('SGPT') ||
      t.includes('SGOT') ||
      t.includes('CREATININE') ||
      t.includes('UREA') ||
      t.includes('CHOLESTEROL') ||
      t.includes('PROTEIN')
    ) || (reports.length > 0 && !needsEdta && !needsFluoride && !needsCitrate);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Clinical Diagnostic Lifecycle</h3>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              NABL Standard Path
            </span>
          </div>
          <p className="text-xs text-slate-500">Live clinical turnaround stage tracking & quality checkpoints</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Current Milestone:</span>
          <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
            {stages[activeIndex]?.title || 'Processing'}
          </span>
        </div>
      </div>

      {/* 5-Step Interactive Visual Timeline */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 hidden md:block" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-indigo-600 transition-all duration-500 hidden md:block"
          style={{ width: `${(activeIndex / 4) * 88}%` }}
        />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
          {stages.map((stage) => {
            const isCompleted = stage.id < activeIndex;
            const isCurrent = stage.id === activeIndex;
            const isPending = stage.id > activeIndex;
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-xl border transition-all flex md:flex-col items-center md:items-center text-left md:text-center gap-3 ${
                  isCurrent
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50/90 border-slate-200 text-slate-800'
                    : 'bg-white border-slate-200/60 opacity-60'
                }`}
              >
                {/* Stage Badge Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-colors shadow-2xs ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                      : 'bg-slate-100 text-slate-400 border border-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                {/* Stage Text */}
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{stage.title}</div>
                  <div className="text-[10px] text-slate-500 leading-tight hidden sm:block">{stage.desc}</div>
                  {isCurrent && (
                    <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded mt-1">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phlebotomy Tubes Protocol Card */}
      <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <TestTube2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-800">Required Phlebotomy Specimen Tubes:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {needsEdta && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              Lavender EDTA (Whole Blood)
            </span>
          )}
          {needsSst && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Yellow Gel SST (Serum)
            </span>
          )}
          {needsFluoride && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 border border-slate-300 font-bold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              Grey Fluoride (Plasma)
            </span>
          )}
          {needsCitrate && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Light Blue Citrate (Coagulation)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
