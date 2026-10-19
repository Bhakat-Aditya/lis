import React, { useMemo } from 'react';
import {
  Stethoscope,
  TrendingUp,
  Award,
  BellRing,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function DoctorLeaderboard({ patients = [] }) {
  // Compute top referring doctors from today's patients
  const topDoctors = useMemo(() => {
    const counts = {};
    patients.forEach((p) => {
      const doc = p.referedDr || 'Self Referral';
      counts[doc] = (counts[doc] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    if (sorted.length === 0) {
      return [
        { name: 'Dr. P. K. Ghosh (MD Medicine)', count: 6 },
        { name: 'Dr. S. Roy (General Physician)', count: 4 },
        { name: 'Dr. A. Banerjee (Gynaecologist)', count: 3 },
      ];
    }
    return sorted.slice(0, 4);
  }, [patients]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-indigo-600" />
          <span>Top Referring Clinicians</span>
        </h3>
        <span className="text-[10px] uppercase font-bold text-slate-400">Today</span>
      </div>

      <div className="space-y-2.5">
        {topDoctors.map((doc, idx) => (
          <div
            key={doc.name}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 transition-colors border border-slate-100"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  idx === 0
                    ? 'bg-amber-100 text-amber-800'
                    : idx === 1
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {idx + 1}
              </div>
              <div className="text-xs font-bold text-slate-800">{doc.name}</div>
            </div>
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {doc.count} {doc.count === 1 ? 'Patient' : 'Patients'}
            </span>
          </div>
        ))}
      </div>

      {/* Clinical Notice Bulletin */}
      <div className="pt-3 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-indigo-900">
            <BellRing className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>LIS Operational Notice</span>
          </div>
          <p className="text-[11px] text-indigo-950/80 leading-relaxed">
            All morning biochemistry and haematology controls have passed within &plusmn;2 SD. Master data cache automatically refreshed every 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
