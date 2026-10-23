import React from 'react';
import {
  Users,
  Clock,
  FlaskConical,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

export default function StatCards({
  totalCount = 0,
  samplePending = 0,
  inTesting = 0,
  readyPrint = 0,
  totalRevenue = 0,
}) {
  const cards = [
    {
      id: 'ALL',
      title: 'Total Patients',
      value: totalCount,
      subtitle: "Today's registered queue",
      icon: Users,
      color: 'indigo',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    {
      id: 'SAMPLE_PENDING',
      title: 'Sample Pending',
      value: samplePending,
      subtitle: 'Awaiting blood/urine draw',
      icon: Clock,
      color: 'amber',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'TESTING',
      title: 'In Testing',
      value: inTesting,
      subtitle: 'On analyzers / technician entry',
      icon: FlaskConical,
      color: 'purple',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'READY',
      title: 'Ready to Print',
      value: readyPrint,
      subtitle: 'Verified & ready for release',
      icon: CheckCircle2,
      color: 'emerald',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'BILLING',
      title: "Today's Billing",
      value: `₹${Number(totalRevenue || 0).toLocaleString('en-IN')}`,
      subtitle: 'Total diagnostics billed',
      icon: DollarSign,
      color: 'blue',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-50 text-blue-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs transition-all duration-200 relative select-none"
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Value */}
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {card.value}
            </div>

            {/* Subtitle */}
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
