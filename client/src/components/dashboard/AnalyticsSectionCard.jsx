import React from 'react';

/**
 * Universal Card layout matching the exact design in the user screenshot:
 * - Blue vertical accent indicator bar on title: "| Section Title"
 * - Left pane: Visual Chart (Stacked Bar / 3D Pie)
 * - Right pane: "Daily statistics" or "statistics" detailed metrics panel
 */
export default function AnalyticsSectionCard({
  title,
  rightHeader = 'Daily statistics',
  chart,
  statistics,
  className = '',
}) {
  return (
    <article
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow duration-200 overflow-hidden ${className}`}
    >
      {/* Title with Blue Accent Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-600 rounded-full inline-block shrink-0" />
          <span>{title}</span>
        </h2>
      </div>

      {/* 2-Column Split: Chart on Left, Statistics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Left Chart Area */}
        <div className="lg:col-span-7 p-4 md:p-5 flex items-center justify-center bg-white min-h-[290px]">
          {chart}
        </div>

        {/* Right Statistics Area */}
        <div className="lg:col-span-5 p-4 md:p-5 bg-slate-50/30 flex flex-col justify-start">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {rightHeader}
            </span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {statistics}
          </div>
        </div>
      </div>
    </article>
  );
}

