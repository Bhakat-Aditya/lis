import React, { useState } from 'react';

/**
 * Stacked Bar Chart for "Last 9 Days Patient Registration"
 * Blue bar: With Number (Patients registered with mobile)
 * Red bar: Without Number (Patients registered without mobile)
 */
export default function AnalyticsStackedBarChart({ data = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const days = data.length > 0 ? data : [
    { date: '2026-10-20', dayLabel: 'Tue (20)', totalCount: 2, withNumber: 0, withoutNumber: 2 },
    { date: '2026-10-21', dayLabel: 'Wed (21)', totalCount: 1, withNumber: 0, withoutNumber: 1 },
    { date: '2026-10-22', dayLabel: 'Thu (22)', totalCount: 3, withNumber: 1, withoutNumber: 2 },
    { date: '2026-10-23', dayLabel: 'Fri (23)', totalCount: 85, withNumber: 72, withoutNumber: 13 },
    { date: '2026-10-24', dayLabel: 'Sat (24)', totalCount: 98, withNumber: 75, withoutNumber: 23 },
    { date: '2026-10-25', dayLabel: 'Sun (25)', totalCount: 56, withNumber: 45, withoutNumber: 11 },
    { date: '2026-10-26', dayLabel: 'Mon (26)', totalCount: 82, withNumber: 65, withoutNumber: 17 },
    { date: '2026-10-27', dayLabel: 'Tue (27)', totalCount: 124, withNumber: 102, withoutNumber: 22 },
    { date: '2026-10-28', dayLabel: 'Wed (28)', totalCount: 88, withNumber: 66, withoutNumber: 22 },
  ];

  // Determine peak for Y-Axis scale
  const maxTotal = Math.max(...days.map((d) => (d.withNumber || 0) + (d.withoutNumber || 0)), 140);
  // Round up to nice interval (e.g. 180 or 200)
  const yAxisMax = Math.ceil(maxTotal / 20) * 20 + 20;

  // Y-axis tick intervals (typically 9-10 steps of 20)
  const step = 20;
  const tickCount = Math.floor(yAxisMax / step);
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    ticks.push(i * step);
  }

  // Dimensions
  const svgWidth = 560;
  const svgHeight = 270;
  const marginLeft = 48;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 45;
  const plotWidth = svgWidth - marginLeft - marginRight;
  const plotHeight = svgHeight - marginTop - marginBottom;

  const barSlotWidth = plotWidth / days.length;
  const barWidth = Math.min(22, barSlotWidth * 0.55);

  return (
    <div className="relative flex flex-col items-center select-none w-full">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ minHeight: '260px' }}
      >
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        {/* Y-Axis Label */}
        <text
          x={-(marginTop + plotHeight / 2)}
          y="15"
          transform="rotate(-90)"
          textAnchor="middle"
          className="text-[10px] font-semibold fill-slate-400 uppercase tracking-wider"
        >
          Patient Count
        </text>

        {/* Horizontal Grid lines & Ticks */}
        {ticks.map((val) => {
          const y = marginTop + plotHeight - (val / yAxisMax) * plotHeight;
          return (
            <g key={`tick-${val}`}>
              <line
                x1={marginLeft}
                y1={y}
                x2={svgWidth - marginRight}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth={val === 0 ? '1.5' : '0.75'}
                strokeDasharray={val === 0 ? 'none' : '3,3'}
              />
              <text
                x={marginLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] font-mono fill-slate-400 font-medium"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Stacked Bars for each day */}
        {days.map((item, idx) => {
          const withCount = Number(item.withNumber) || 0;
          const withoutCount = Number(item.withoutNumber) || 0;
          const total = withCount + withoutCount;

          const withHeight = (withCount / yAxisMax) * plotHeight;
          const withoutHeight = (withoutCount / yAxisMax) * plotHeight;

          const barCenterX = marginLeft + idx * barSlotWidth + barSlotWidth / 2;
          const barLeft = barCenterX - barWidth / 2;

          // Bottom bar: With Number (Blue)
          const blueY = marginTop + plotHeight - withHeight;
          // Top bar: Without Number (Red, stacked on top of blue)
          const redY = blueY - withoutHeight;

          const isHovered = hoveredDay?.date === item.date;

          return (
            <g
              key={item.date || idx}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredDay(item)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Invisible wider hit area for easy hover on mobile/desktop */}
              <rect
                x={barCenterX - barSlotWidth / 2}
                y={marginTop}
                width={barSlotWidth}
                height={plotHeight}
                fill="transparent"
              />

              {/* Blue Bar: With Number */}
              {withHeight > 0 && (
                <rect
                  x={barLeft}
                  y={blueY}
                  width={barWidth}
                  height={withHeight}
                  fill="url(#blueGradient)"
                  rx={withoutHeight > 0 ? 0 : 2}
                  className="transition-all duration-300"
                  opacity={hoveredDay && !isHovered ? 0.6 : 1}
                />
              )}

              {/* Red Bar: Without Number (stacked on top) */}
              {withoutHeight > 0 && (
                <rect
                  x={barLeft}
                  y={redY}
                  width={barWidth}
                  height={withoutHeight}
                  fill="url(#redGradient)"
                  rx={2}
                  className="transition-all duration-300"
                  opacity={hoveredDay && !isHovered ? 0.6 : 1}
                />
              )}

              {/* X-Axis Day Label (Rotated like the screenshot: Tue (20)) */}
              <text
                x={barCenterX}
                y={marginTop + plotHeight + 14}
                transform={`rotate(-45, ${barCenterX}, ${marginTop + plotHeight + 14})`}
                textAnchor="end"
                className={`text-[9.5px] font-semibold transition-colors duration-200 ${
                  isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-600'
                }`}
              >
                {item.dayLabel || item.date}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend at bottom matching screenshot: Red = Without Number, Blue = With Number */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs" />
          <span className="font-semibold text-slate-700 text-[11px]">Without Number</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
          <span className="font-semibold text-slate-700 text-[11px]">With Number</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredDay && (
        <div className="absolute top-1 right-2 bg-slate-900/95 backdrop-blur-xs text-white text-xs p-2.5 rounded-xl shadow-xl z-20 border border-slate-700 pointer-events-none min-w-[150px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center">
            <span>{hoveredDay.dayLabel}</span>
            <span className="text-[10px] text-slate-400 font-mono">{hoveredDay.date}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                With Mobile:
              </span>
              <span className="font-bold text-blue-300">{hoveredDay.withNumber || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Without Mobile:
              </span>
              <span className="font-bold text-red-300">{hoveredDay.withoutNumber || 0}</span>
            </div>
            <div className="pt-1 mt-1 border-t border-slate-800 flex justify-between items-center font-bold">
              <span>Total Registered:</span>
              <span className="text-amber-400">{hoveredDay.totalCount || ((hoveredDay.withNumber || 0) + (hoveredDay.withoutNumber || 0))}</span>
            </div>
            {hoveredDay.billedAmount !== undefined && (
              <div className="text-[10px] text-emerald-400 pt-0.5 flex justify-between">
                <span>Billed:</span>
                <span>₹{Number(hoveredDay.billedAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

