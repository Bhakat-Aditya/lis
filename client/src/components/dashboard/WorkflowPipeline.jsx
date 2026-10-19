import React from 'react';
import {
  ClipboardList,
  TestTube2,
  Microscope,
  Stethoscope,
  Printer,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

export default function WorkflowPipeline({
  totalCount = 0,
  registeredCount = 0,
  sampleCount = 0,
  testingCount = 0,
  verifiedCount = 0,
  approvedCount = 0,
  activeStage = '',
  onSelectStage,
}) {
  const stages = [
    {
      id: 'REGISTERED',
      name: '1. Registration',
      subtitle: 'Order Booked',
      count: registeredCount,
      icon: ClipboardList,
      color: 'indigo',
      activeBg: 'bg-indigo-600 text-white',
      badgeBg: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'SAMPLE',
      name: '2. Phlebotomy',
      subtitle: 'Sample Drawn',
      count: sampleCount,
      icon: TestTube2,
      color: 'amber',
      activeBg: 'bg-amber-600 text-white',
      badgeBg: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'TESTING',
      name: '3. Lab Testing',
      subtitle: 'Analyzer & Entry',
      count: testingCount,
      icon: Microscope,
      color: 'purple',
      activeBg: 'bg-purple-600 text-white',
      badgeBg: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'VERIFIED',
      name: '4. Doctor Review',
      subtitle: 'Pathology Review',
      count: verifiedCount,
      icon: Stethoscope,
      color: 'teal',
      activeBg: 'bg-teal-600 text-white',
      badgeBg: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'APPROVED',
      name: '5. Release & Print',
      subtitle: 'Ready for Patient',
      count: approvedCount,
      icon: Printer,
      color: 'emerald',
      activeBg: 'bg-emerald-600 text-white',
      badgeBg: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <span>Laboratory Workflow Pipeline</span>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              Live Stage Tracker
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Click any clinical stage to isolate patients currently in that phase
          </p>
        </div>

        {activeStage && (
          <button
            onClick={() => onSelectStage('')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            Clear Stage Filter &times;
          </button>
        )}
      </div>

      {/* Stage Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          const percentage = totalCount > 0 ? Math.round((stage.count / totalCount) * 100) : 0;

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStage(isActive ? '' : stage.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative select-none ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{stage.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{stage.subtitle}</div>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                    isActive ? 'bg-indigo-600 text-white' : stage.badgeBg
                  }`}
                >
                  {stage.count}
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stage.color === 'indigo'
                      ? 'bg-indigo-600'
                      : stage.color === 'amber'
                      ? 'bg-amber-500'
                      : stage.color === 'purple'
                      ? 'bg-purple-600'
                      : stage.color === 'teal'
                      ? 'bg-teal-600'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(8, percentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                <span>{percentage}% of active orders</span>
                {isActive && <span className="font-bold text-indigo-600">Active</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
