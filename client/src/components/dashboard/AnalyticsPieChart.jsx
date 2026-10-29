import React, { useState } from 'react';

/**
 * 3D-styled SVG Pie Chart with leader lines and percentage callouts
 * Designed to faithfully render the analytical pie charts from the LIS system
 */
export default function AnalyticsPieChart({
  data = [],
  title = '',
  height = 260,
  show3D = true,
  donut = false,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Filter out zero or negative percentages unless all are 0
  const validData = (data || []).filter((d) => (d.percentage || 0) > 0 || (d.count || 0) > 0);
  const items = validData.length > 0 ? validData : [{ label: 'No Data', percentage: 100, count: 0, color: '#CBD5E1' }];

  const totalPercentage = items.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0) || 100;

  // Polar to Cartesian conversion
  const polarToCartesian = (centerX, centerY, radiusX, radiusY, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radiusX * Math.cos(angleInRadians),
      y: centerY + radiusY * Math.sin(angleInRadians),
    };
  };

  // SVG dimensions & centers
  const width = 380;
  const cx = 190;
  const cy = show3D ? 125 : 130;
  const rx = 100;
  const ry = show3D ? 65 : 100; // Elliptical 3D perspective when show3D is true
  const depth3D = show3D ? 16 : 0; // 3D extrusion depth

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

    // Top slice path
    const topPath = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${rx} ${ry} 0 ${isLargeArc} 1 ${p2.x} ${p2.y} Z`;

    // 3D bottom extrusion coordinates (if 3D enabled)
    const p1Bottom = polarToCartesian(cx, cy + depth3D, rx, ry, startAngle);
    const p2Bottom = polarToCartesian(cx, cy + depth3D, rx, ry, endAngle);

    // Bottom arc path for 3D rim
    const bottomRimPath = `M ${p1.x} ${p1.y} L ${p1Bottom.x} ${p1Bottom.y} A ${rx} ${ry} 0 ${isLargeArc} 1 ${p2Bottom.x} ${p2Bottom.y} L ${p2.x} ${p2.y} Z`;

    // Leader line anchor & text position
    const labelRadiusX = rx + 36;
    const labelRadiusY = ry + 26;
    const lineStart = polarToCartesian(cx, cy, rx * 0.85, ry * 0.85, midAngle);
    const lineMid = polarToCartesian(cx, cy, labelRadiusX, labelRadiusY, midAngle);
    const isRightSide = lineMid.x >= cx;
    const lineEnd = {
      x: isRightSide ? lineMid.x + 18 : lineMid.x - 18,
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

  // Calculate darker color for 3D rim edge
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

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-w-[420px] overflow-visible drop-shadow-xs"
        style={{ minHeight: `${height}px` }}
      >
        <defs>
          <filter id={`pie-shadow-${title.replace(/\s+/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.12" floodColor="#0F172A" />
          </filter>
        </defs>

        {/* 3D Base Shadow */}
        {show3D && (
          <ellipse
            cx={cx}
            cy={cy + depth3D + 4}
            rx={rx * 0.96}
            ry={ry * 0.96}
            fill="#0F172A"
            opacity="0.15"
            filter="blur(8px)"
          />
        )}

        {/* 3D Bottom Rims (drawn first for correct depth stacking) */}
        {show3D &&
          slices.map((slice) => {
            // Render 3D rim if the slice faces front (angles between 0° and 180°)
            const isFacingFront = (slice.startAngle < 180 || slice.endAngle > 0);
            if (!isFacingFront) return null;
            const darkColor = darkenColor(slice.color || '#3B82F6', 32);

            return (
              <path
                key={`rim-${slice.idx}`}
                d={slice.bottomRimPath}
                fill={darkColor}
                stroke={darkColor}
                strokeWidth="0.5"
                opacity={hoveredIdx !== null && hoveredIdx !== slice.idx ? 0.6 : 1}
                className="transition-opacity duration-200"
              />
            );
          })}

        {/* Top Pie Slices */}
        {slices.map((slice) => {
          const isHovered = hoveredIdx === slice.idx;
          const offsetDist = isHovered ? 6 : 0;
          const offsetAngleRad = ((slice.midAngle - 90) * Math.PI) / 180;
          const offsetX = offsetDist * Math.cos(offsetAngleRad);
          const offsetY = offsetDist * Math.sin(offsetAngleRad) * (show3D ? 0.65 : 1);

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
                strokeWidth="1.2"
                opacity={hoveredIdx !== null && !isHovered ? 0.65 : 1}
                className="transition-all duration-200"
              />
            </g>
          );
        })}

        {/* Leader Lines and Callout Labels */}
        {slices.map((slice) => {
          // If slice is very small and there are many, we still render cleanly
          const pctText = `${Number(slice.percentage || 0).toFixed(1)} %`;
          const isHovered = hoveredIdx === slice.idx;

          return (
            <g
              key={`label-${slice.idx}`}
              className="transition-all duration-200 pointer-events-none"
              opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}
            >
              {/* Leader Polyline */}
              <polyline
                points={`${slice.lineStart.x},${slice.lineStart.y} ${slice.lineMid.x},${slice.lineMid.y} ${slice.lineEnd.x},${slice.lineEnd.y}`}
                fill="none"
                stroke={slice.color || '#64748B'}
                strokeWidth={isHovered ? 1.8 : 1}
                strokeDasharray={isHovered ? 'none' : '2,2'}
                opacity={0.85}
              />

              {/* Little anchor dot */}
              <circle
                cx={slice.lineEnd.x}
                cy={slice.lineEnd.y}
                r={isHovered ? 3 : 2}
                fill={slice.color || '#3B82F6'}
              />

              {/* Label Text matching Screenshot style */}
              <text
                x={slice.isRightSide ? slice.lineEnd.x + 5 : slice.lineEnd.x - 5}
                y={slice.lineEnd.y + 3.5}
                textAnchor={slice.isRightSide ? 'start' : 'end'}
                className="text-[10px] md:text-[11px] font-semibold"
                fill="#1E293B"
                style={{ fontSize: '10.5px' }}
              >
                {slice.label}: <tspan className="font-bold">{pctText}</tspan>
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip if hovering a slice */}
      {hoveredIdx !== null && slices[hoveredIdx] && (
        <div className="absolute bottom-2 bg-slate-900/90 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 pointer-events-none z-10 border border-slate-700">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: slices[hoveredIdx].color }}
          />
          <span className="font-semibold">{slices[hoveredIdx].label}:</span>
          <span className="font-bold text-amber-300">
            {slices[hoveredIdx].percentage}%
          </span>
          {slices[hoveredIdx].count !== undefined && (
            <span className="text-slate-300">({slices[hoveredIdx].count} units)</span>
          )}
          {slices[hoveredIdx].amount !== undefined && (
            <span className="text-emerald-300">(₹{Number(slices[hoveredIdx].amount).toLocaleString('en-IN')})</span>
          )}
        </div>
      )}
    </div>
  );
}

