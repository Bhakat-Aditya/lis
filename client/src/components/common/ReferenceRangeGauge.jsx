import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Visual Medical Reference Range Gauge
 * Renders a tri-color gradient bar (Low, Normal, High) with an interactive position marker
 */
export default function ReferenceRangeGauge({
  value,
  refRange = '',
  unit = '',
  testName = '',
  compact = false,
}) {
  if (!value || value === '-' || !refRange || refRange === '-' || !refRange.includes('-')) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <span className="font-mono font-bold text-slate-900">{value || '-'}</span>
        {unit && <span className="text-[11px] text-slate-400 font-normal">{unit}</span>}
      </div>
    );
  }

  // Parse numerical limits from refRange string e.g. "13.0 - 17.0" or "70-100"
  const parts = refRange.split('-').map((s) => parseFloat(s.replace(/[^0-9.]/g, '').trim()));
  const numVal = parseFloat(String(value).replace(/[^0-9.]/g, '').trim());

  if (isNaN(numVal) || parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <span className="font-mono font-bold text-slate-900">{value}</span>
        {unit && <span className="text-[11px] text-slate-400 font-normal">{unit}</span>}
      </div>
    );
  }

  const [minRef, maxRef] = parts;
  const rangeSpan = maxRef - minRef || 1;

  // Calculate percentage on a scale spanning [minRef - 40% span, maxRef + 40% span]
  const lowerBound = Math.max(0, minRef - rangeSpan * 0.4);
  const upperBound = maxRef + rangeSpan * 0.4;
  const totalScale = upperBound - lowerBound;

  let pointerPercent = ((numVal - lowerBound) / totalScale) * 100;
  pointerPercent = Math.max(4, Math.min(96, pointerPercent));

  let status = 'NORMAL';
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
  let varianceText = '';

  if (numVal < minRef) {
    status = 'LOW';
    const pctBelow = Math.round(((minRef - numVal) / minRef) * 100);
    varianceText = `${pctBelow}% below`;
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
    icon = <TrendingDown className="w-3 h-3 text-amber-600" />;
  } else if (numVal > maxRef) {
    status = 'HIGH';
    const pctAbove = Math.round(((numVal - maxRef) / maxRef) * 100);
    varianceText = `${pctAbove}% above`;
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-300';
    icon = <TrendingUp className="w-3 h-3 text-rose-600" />;
  }

  // Check critical limits
  const isCritical =
    (status === 'HIGH' && numVal > maxRef * 1.5) ||
    (status === 'LOW' && numVal < minRef * 0.6);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`font-mono font-extrabold text-xs ${status === 'HIGH' ? 'text-rose-600' : status === 'LOW' ? 'text-amber-600' : 'text-slate-900'}`}>
          {value} {unit}
        </span>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeClass}`}>
          {icon}
          {status} {varianceText && `(${varianceText})`}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 w-full min-w-[200px]">
      {/* Top Value and Badge */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-mono font-extrabold text-sm ${status === 'HIGH' ? 'text-rose-600' : status === 'LOW' ? 'text-amber-600' : 'text-slate-900'}`}>
            {value}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">{unit}</span>
        </div>

        <div className="flex items-center gap-1">
          {isCritical && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" />
              PANIC
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-2xs ${badgeClass}`}>
            {icon}
            {status} {varianceText && `(${varianceText})`}
          </span>
        </div>
      </div>

      {/* Tri-Color Range Meter with Pin */}
      <div className="relative pt-2 pb-1">
        {/* Background track: Low (Amber) | Normal (Green) | High (Red) */}
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
          <div className="w-[28%] bg-amber-400" title="Low range" />
          <div className="w-[44%] bg-emerald-500" title="Normal therapeutic reference" />
          <div className="w-[28%] bg-rose-500" title="High range" />
        </div>

        {/* Pin Marker on the meter */}
        <div
          className="absolute top-0 -ml-1.5 transition-all duration-300 flex flex-col items-center"
          style={{ left: `${pointerPercent}%` }}
        >
          <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md ${
            status === 'HIGH' ? 'bg-rose-600 ring-2 ring-rose-400' : status === 'LOW' ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-emerald-600 ring-2 ring-emerald-300'
          }`} />
          <div className="w-0.5 h-1.5 bg-slate-700 mt-0.5" />
        </div>
      </div>

      {/* Bottom Reference Range Labels */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>&lt; {minRef}</span>
        <span className="text-emerald-700 font-semibold font-sans">Normal: {minRef} - {maxRef}</span>
        <span>&gt; {maxRef}</span>
      </div>
    </div>
  );
}
