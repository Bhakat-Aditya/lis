import React, { useState } from 'react';

/**
 * AnalyticsPieChart - Highly versatile, responsive SVG Pie & Donut Chart
 * Supports:
 * 1. Modern Donut with central KPI metric & hover glowing ring
 * 2. 3D Extruded Pie with shaded depth rim and leader callouts
 * 3. Compact Legend badge row
 */
export default function AnalyticsPieChart({
  data = [],
  title = '',
  height = 240,
  show3D = false,
  donut = true,
  centerValue = null,
  centerLabel = null,
  showLegend = true,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [view3D, setView3D] = useState(show3D);

  // Filter out zero or negative percentages unless all are 0
  const validData = (data || []).filter((d) => (d.percentage || 0) > 0 || (d.count || 0) > 0 || (d.amount || 0) > 0);
  const items = validData.length > 0 ? validData : [{ label: 'No Data', percentage: 100, count: 0, color: '#CBD5E1' }];

  const totalPercentage = items.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0) || 100;
  const totalCount = items.reduce((sum, item) => sum + (Number(item.count || item.amount || 0)), 0);

  // Polar to Cartesian conversion
  const polarToCartesian = (centerX, centerY, radiusX, radiusY, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radiusX * Math.cos(angleInRadians),
      y: centerY + radiusY * Math.sin(angleInRadians),
    };
  };

  // Dimensions
  const width = 360;
  const cx = 180;
  const cy = view3D ? 115 : 110;
  const rx = view3D ? 90 : (donut ? 84 : 88);
  const ry = view3D ? 58 : (donut ? 84 : 88);
  const innerR = donut && !view3D ? 52 : 0;
  const depth3D = view3D ? 16 : 0;

  // Darken color helper for 3D bottom rim
  const darkenColor = (hex, percent = 30) => {
    try {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map((x) => x + x).join('');
      const num = parseInt(c, 16);
      let r = (num >> 16) - Math.round(255 * (percent / 100));
      let g = ((num >> 8) & 0x00ff) - Math.round(255 * (percent / 100));
      let b = (num & 0x0000ff) - Math.round(255 * (percent / 100));
      r = Math.max(0, r);
      g = Math.max(0, g);
      b = Math.max(0, b);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch {
      return hex;
    }
  };

  // Generate slice paths
  let currentAngle = 0;
  const slices = items.map((item, idx) => {
    const itemPct = Number(item.percentage) || 0;
    const sliceAngle = (itemPct / totalPercentage) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const midAngle = startAngle + sliceAngle / 2;
    const isLargeArc = sliceAngle > 180 ? 1 : 0;

    // Top surface coordinates
    const p1 = polarToCartesian(cx, cy, rx, ry, startAngle);
    const p2 = polarToCartesian(cx, cy, rx, ry, endAngle);

    let topPath = '';
    if (innerR > 0) {
      // Donut slice path with inner cutout
      const p3 = polarToCartesian(cx, cy, innerR, innerR, endAngle);
      const p4 = polarToCartesian(cx, cy, innerR, innerR, startAngle);
      topPath = `M ${p1.x} ${p1.y} A ${rx} ${ry} 0 ${isLargeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${innerR} ${innerR} 0 ${isLargeArc} 0 ${p4.x} ${p4.y} Z`;
    } else {
      topPath = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${rx} ${ry} 0 ${isLargeArc} 1 ${p2.x} ${p2.y} Z`;
    }

    // 3D bottom extrusion coordinates (if 3D enabled)
    const p1Bottom = polarToCartesian(cx, cy + depth3D, rx, ry, startAngle);
    const p2Bottom = polarToCartesian(cx, cy + depth3D, rx, ry, endAngle);
    const bottomRimPath = `M ${p1.x} ${p1.y} L ${p1Bottom.x} ${p1Bottom.y} A ${rx} ${ry} 0 ${isLargeArc} 1 ${p2Bottom.x} ${p2Bottom.y} L ${p2.x} ${p2.y} Z`;

    // Leader line anchor & text position (for 3D mode)
    const labelRadiusX = rx + 30;
    const labelRadiusY = ry + 22;
    const lineStart = polarToCartesian(cx, cy, rx * 0.85, ry * 0.85, midAngle);
    const lineMid = polarToCartesian(cx, cy, labelRadiusX, labelRadiusY, midAngle);
    const isRightSide = lineMid.x >= cx;
    const lineEnd = {
      x: isRightSide ? Math.min(width - 8, lineMid.x + 14) : Math.max(8, lineMid.x - 14),
      y: lineMid.y,
    };

    return {
      ...item,
      idx,
      startAngle,
      endAngle,
      midAngle,
      topPath,
      bottomRimPath,
      lineStart,
      lineMid,
      lineEnd,
      isRightSide,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full">
      {/* 3D / Donut Mode Toggle (Subtle micro-pill) */}
      <div className="absolute top-0 right-1 z-10">
        <button
          type="button"
          onClick={() => setView3D((prev) => !prev)}
          className="text-[9.5px] font-bold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
          title="Toggle 2D Donut / 3D Extruded view"
        >
          {view3D ? '2D Donut' : '3D View'}
        </button>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height - (showLegend ? 40 : 10)}`}
        className="w-full h-auto max-w-[340px] overflow-visible drop-shadow-xs"
        style={{ minHeight: `${height - 50}px` }}
      >
        <defs>
          <filter id={`pie-shadow-${title.replace(/\s+/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.1" floodColor="#0F172A" />
          </filter>
        </defs>

        {/* 3D Base Shadow */}
        {view3D && (
          <ellipse
            cx={cx}
            cy={cy + depth3D + 4}
            rx={rx * 0.95}
            ry={ry * 0.95}
            fill="#0F172A"
            opacity="0.12"
            filter="blur(8px)"
          />
        )}

        {/* 3D Bottom Rims (drawn first for depth) */}
        {view3D &&
          slices.map((slice) => {
            const isFacingFront = slice.startAngle < 180 || slice.endAngle > 0;
            if (!isFacingFront) return null;
            const darkColor = darkenColor(slice.color || '#3B82F6', 32);

            return (
              <path
                key={`rim-${slice.idx}`}
                d={slice.bottomRimPath}
                fill={darkColor}
                stroke={darkColor}
                strokeWidth="0.5"
                opacity={hoveredIdx !== null && hoveredIdx !== slice.idx ? 0.5 : 1}
                className="transition-opacity duration-200"
              />
            );
          })}

        {/* Top Pie / Donut Slices */}
        {slices.map((slice) => {
          const isHovered = hoveredIdx === slice.idx;
          const offsetDist = isHovered ? 5 : 0;
          const offsetAngleRad = ((slice.midAngle - 90) * Math.PI) / 180;
          const offsetX = offsetDist * Math.cos(offsetAngleRad);
          const offsetY = offsetDist * Math.sin(offsetAngleRad) * (view3D ? 0.65 : 1);

          return (
            <g
              key={`slice-${slice.idx}`}
              transform={`translate(${offsetX}, ${offsetY})`}
              className="cursor-pointer transition-transform duration-200"
              onMouseEnter={() => setHoveredIdx(slice.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <path
                d={slice.topPath}
                fill={slice.color || '#3B82F6'}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                opacity={hoveredIdx !== null && !isHovered ? 0.6 : 1}
                className="transition-all duration-200 hover:drop-shadow-sm"
              />
            </g>
          );
        })}

        {/* Central Metric in Donut Mode */}
        {donut && !view3D && (
          <g className="pointer-events-none">
            <circle cx={cx} cy={cy} r={innerR - 2} fill="#FFFFFF" opacity="0.95" />
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              className="text-lg font-black fill-slate-900 font-mono tracking-tight"
            >
              {activeSlice
                ? `${Number(activeSlice.percentage || 0).toFixed(1)}%`
                : (centerValue !== null ? centerValue : (totalCount > 0 ? totalCount : '100%'))}
            </text>
            <text
              x={cx}
              y={cy + 13}
              textAnchor="middle"
              className="text-[9.5px] font-bold fill-slate-400 uppercase tracking-wider truncate max-w-[80px]"
            >
              {activeSlice ? activeSlice.label : (centerLabel || 'Total Share')}
            </text>
          </g>
        )}

        {/* Leader Lines and Callout Labels (when in 3D mode) */}
        {view3D &&
          slices.map((slice) => {
            const pctText = `${Number(slice.percentage || 0).toFixed(1)} %`;
            const isHovered = hoveredIdx === slice.idx;

            return (
              <g
                key={`label-${slice.idx}`}
                className="transition-all duration-200 pointer-events-none"
                opacity={hoveredIdx !== null && !isHovered ? 0.4 : 1}
              >
                <polyline
                  points={`${slice.lineStart.x},${slice.lineStart.y} ${slice.lineMid.x},${slice.lineMid.y} ${slice.lineEnd.x},${slice.lineEnd.y}`}
                  fill="none"
                  stroke={slice.color || '#64748B'}
                  strokeWidth="0.85"
                />
                <circle cx={slice.lineEnd.x} cy={slice.lineEnd.y} r="1.5" fill={slice.color || '#64748B'} />
                <text
                  x={slice.isRightSide ? slice.lineEnd.x + 4 : slice.lineEnd.x - 4}
                  y={slice.lineEnd.y + 3}
                  textAnchor={slice.isRightSide ? 'start' : 'end'}
                  className={`text-[9.5px] font-bold ${
                    isHovered ? 'fill-slate-950 font-black' : 'fill-slate-700'
                  }`}
                >
                  {pctText}
                </text>
              </g>
            );
          })}
      </svg>

      {/* Modern Compact Legend Strip below chart */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 px-2 max-w-full">
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;
            return (
              <button
                type="button"
                key={`legend-${slice.idx}`}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-all border cursor-pointer ${
                  isHovered
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs scale-105'
                    : 'bg-slate-50/80 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: slice.color || '#3B82F6' }}
                />
                <span className="truncate max-w-[110px]">{slice.label}</span>
                <span className={`font-mono text-[10px] font-bold ${isHovered ? 'text-blue-300' : 'text-slate-500'}`}>
                  {Number(slice.percentage || 0).toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
