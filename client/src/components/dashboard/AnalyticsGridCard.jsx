import React from 'react';
import { ArrowUpRight, ChevronRight, BarChart3, Info } from 'lucide-react';

/**
 * AnalyticsGridCard - Ultra-modern analytical card designed for a 3-column responsive dashboard grid.
 * Displays:
 * 1. Themed header with category icon, title, and quick status KPI badge
 * 2. Meaningful descriptive summary (contextual clinical & operational intelligence)
 * 3. High-resolution visual chart (stacked bar, donut/pie)
 * 4. 2-3 key takeaway highlight metric metrics
 * 5. Distinct "Detailed Breakdown" action button that opens comprehensive drill-down modal
 */
export default function AnalyticsGridCard({
  title,
  category = 'Analytics',
  icon,
  iconBg = 'bg-blue-50 text-blue-600 border-blue-200',
  badge,
  badgeType = 'default', // 'emerald', 'blue', 'amber', 'purple', 'rose'
  description,
  chart,
  highlights = [],
  onViewDetails,
  detailButtonLabel = 'Detailed Analysis',
  className = '',
}) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <article
      className={`group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${className}`}
    >
      {/* Top Header */}
      <div className="p-4 pb-3 border-b border-slate-100/90 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-50/70 to-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${iconBg} transition-transform duration-200 group-hover:scale-105`}
          >
            {icon || <BarChart3 className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-extrabold text-slate-900 tracking-tight leading-snug truncate">
              {title}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
              {category}
            </span>
          </div>
        </div>

        {badge && (
          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border font-mono shrink-0 shadow-2xs ${getBadgeStyle()}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Meaningful Contextual Description */}
      {description && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11.5px] text-slate-500 leading-relaxed font-normal min-h-[34px]">
            {description}
          </p>
        </div>
      )}

      {/* Interactive Chart Canvas */}
      <div className="px-3 py-2 flex-1 flex items-center justify-center min-h-[220px]">
        {chart}
      </div>

      {/* Quick Key Metric Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {highlights.map((h, idx) => (
            <div key={idx} className="flex flex-col min-w-0">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {h.label}
              </span>
              <span className={`text-xs font-black font-mono tracking-tight mt-0.5 ${h.color || 'text-slate-800'}`}>
                {h.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer with Detailed Analysis Button */}
      <div className="p-3 px-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>Real-time Telemetry</span>
        </span>

        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50/80 active:scale-95 text-blue-700 hover:text-blue-900 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer group-hover:border-blue-300 group-hover:shadow-xs"
          title={`View exhaustive breakdown and operational metrics for ${title}`}
        >
          <span>{detailButtonLabel}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </article>
  );
}

