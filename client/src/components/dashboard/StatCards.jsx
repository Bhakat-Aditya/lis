import React from 'react';
import {
  Users,
  Clock,
  FlaskConical,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

export default function StatCards({
  totalCount = 0,
  samplePending = 0,
  inTesting = 0,
  readyPrint = 0,
  totalRevenue = 0,
  activeFilter = '',
  onFilterClick,
}) {
  const cards = [
    {
      id: 'ALL',
      title: 'Total Patients',
      value: totalCount,
      trend: '+12% vs yesterday',
      trendPositive: true,
      subtitle: "Today's registered queue",
      icon: Users,
      color: 'indigo',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      iconBg: 'bg-indigo-50 text-indigo-600',
      activeRing: 'ring-2 ring-indigo-500 border-indigo-500',
    },
    {
      id: 'SAMPLE_PENDING',
      title: 'Sample Pending',
      value: samplePending,
      trend: 'Phlebotomy queue',
      trendPositive: false,
      subtitle: 'Awaiting blood/urine draw',
      icon: Clock,
      color: 'amber',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      iconBg: 'bg-amber-50 text-amber-600',
      activeRing: 'ring-2 ring-amber-500 border-amber-500',
    },
    {
      id: 'TESTING',
      title: 'In Testing',
      value: inTesting,
      trend: 'Laboratory Entry',
      trendPositive: true,
      subtitle: 'On analyzers / technician entry',
      icon: FlaskConical,
      color: 'purple',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
      iconBg: 'bg-purple-50 text-purple-600',
      activeRing: 'ring-2 ring-purple-500 border-purple-500',
    },
    {
      id: 'READY',
      title: 'Ready to Print',
      value: readyPrint,
      trend: 'Doctor Approved',
      trendPositive: true,
      subtitle: 'Verified & ready for release',
      icon: CheckCircle2,
      color: 'emerald',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-500',
    },
    {
      id: 'BILLING',
      title: "Today's Billing",
      value: `₹${Number(totalRevenue || 0).toLocaleString('en-IN')}`,
      trend: 'Invoiced Revenue',
      trendPositive: true,
      subtitle: 'Total diagnostics billed',
      icon: DollarSign,
      color: 'blue',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-50 text-blue-600',
      activeRing: 'ring-2 ring-blue-500 border-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onFilterClick && onFilterClick(card.id)}
            className={`bg-white rounded-2xl border p-4.5 shadow-xs transition-all duration-200 cursor-pointer select-none relative group hover:shadow-md hover:-translate-y-0.5 ${
              isSelected
                ? `${card.activeRing} bg-slate-50/50`
                : 'border-slate-200/90 hover:border-slate-300'
            }`}
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

            {/* Subtitle & Trend */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 truncate">{card.subtitle}</span>
              <span className="inline-flex items-center gap-0.5 font-bold text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">
                Filter
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
