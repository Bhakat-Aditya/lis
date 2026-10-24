import React, { useState, useRef } from 'react';
import {
  Save,
  Calculator,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react';
import {
  getSpecimenTubeInfo,
  getTestPhaseInfo,
  evaluateResultValue,
  getDefaultHealthyValue,
} from '../../utils/labTestUtils.js';

export default function ResultsTableView({
  reports = [],
  resultsState = {},
  patient = {},
  savingId = null,
  onInputChange,
  onSaveSingle,
  onCalculate,
  onSetDefaultResult,
  onOpenGuide,
  onReceiveSample,
}) {
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputRefs = useRef([]);


  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < reports.length - 1 && inputRefs.current[idx + 1]) {
        inputRefs.current[idx + 1].focus();
        inputRefs.current[idx + 1].select?.();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0 && inputRefs.current[idx - 1]) {
        inputRefs.current[idx - 1].focus();
        inputRefs.current[idx - 1].select?.();
      }
    }
  };

  // Helper to render inline mini gauge with high-contrast indicator
  const renderMiniGauge = (value, refRange) => {
    if (!value || !refRange || !refRange.includes('-')) return null;
    const parts = refRange.split('-').map((s) => parseFloat(s.replace(/[^0-9.]/g, '').trim()));
    const num = parseFloat(String(value).replace(/[^0-9.]/g, '').trim());
    if (isNaN(num) || parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;

    const [minRef, maxRef] = parts;
    const span = maxRef - minRef || 1;
    const lower = Math.max(0, minRef - span * 0.35);
    const upper = maxRef + span * 0.35;
    const total = upper - lower;
    let pct = ((num - lower) / total) * 100;
    pct = Math.max(2, Math.min(98, pct));

    const isHigh = num > maxRef;
    const isLow = num < minRef;
    const isPanic = num > maxRef * 1.5 || num < minRef * 0.6;

    return (
      <div className="w-18 h-2 bg-slate-200 rounded-full relative overflow-hidden shrink-0 mt-0.5 border border-slate-300/80">
        <div className="absolute inset-y-0 left-[22%] right-[22%] bg-emerald-400/90 rounded-full" />
        <div
          className={`absolute top-0 bottom-0 w-2 rounded-full shadow-xs ${
            isPanic
              ? 'bg-rose-600 ring-2 ring-rose-400 animate-pulse'
              : isHigh
              ? 'bg-amber-500 ring-1 ring-amber-300'
              : isLow
              ? 'bg-sky-500 ring-1 ring-sky-300'
              : 'bg-emerald-700 ring-1 ring-emerald-500'
          }`}
          style={{ left: `calc(${pct}% - 4px)` }}
        />
      </div>
    );
  };

  return (
    <div
      data-lenis-prevent="true"
      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden w-full"
    >
      <div className="overflow-x-auto max-h-[calc(100vh-250px)]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-20 border-b border-slate-200 select-none shadow-2xs">
            <tr className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              <th className="py-2 px-2.5 w-10 text-center">#</th>
              <th className="py-2 px-3 min-w-[210px]">Diagnostic Test Parameter</th>
              <th className="py-2 px-2 w-24 text-center">Phase</th>
              <th className="py-2 px-3 min-w-[170px]">Observed Reading</th>
              <th className="py-2 px-2 w-16">Unit</th>
              <th className="py-2 px-2.5 w-28">Ref Range</th>
              <th className="py-2 px-3 min-w-[180px]">Clinical Evaluation & Range Gauge</th>
              <th className="py-2 px-2.5 w-20 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report, idx) => {
              const current = resultsState[report.reportId] || {};
              const enteredVal = current.resultData;
              const evalRes = evaluateResultValue(enteredVal, report.refRange, report.unit);
              const tube = getSpecimenTubeInfo(report.sampleType, report.testName);
              const phase = getTestPhaseInfo(report, patient);
              const isSaving = savingId === report.reportId;
              const hasUnsavedVal = current.resultData !== (report.resultData || '');
              const isFocused = focusedIndex === idx;

              // High-impact dynamic highlighting
              let rowHighlightClass = 'hover:bg-slate-50/80 transition-colors';
              let inputHighlightClass = 'border-slate-300 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-slate-800';

              if (evalRes.status.includes('PANIC')) {
                rowHighlightClass = 'bg-rose-100/90 hover:bg-rose-100/95 border-l-[6px] border-l-rose-600 font-bold text-rose-950 shadow-xs';
                inputHighlightClass = 'border-rose-600 ring-2 ring-rose-500/70 bg-rose-50 text-rose-950 font-black shadow-xs';
              } else if (evalRes.status === 'REACTIVE') {
                rowHighlightClass = 'bg-rose-100/80 hover:bg-rose-100/90 border-l-[6px] border-l-rose-600 font-bold text-rose-950';
                inputHighlightClass = 'border-rose-600 ring-2 ring-rose-500/70 bg-rose-50 text-rose-950 font-bold shadow-xs';
              } else if (evalRes.status === 'HIGH') {
                rowHighlightClass = 'bg-amber-100/75 hover:bg-amber-100/90 border-l-[6px] border-l-amber-500 font-semibold text-amber-950 shadow-xs';
                inputHighlightClass = 'border-amber-500 ring-2 ring-amber-400/60 bg-amber-50 text-amber-950 font-bold shadow-xs';
              } else if (evalRes.status === 'LOW') {
                rowHighlightClass = 'bg-sky-100/75 hover:bg-sky-100/90 border-l-[6px] border-l-sky-500 font-semibold text-sky-950 shadow-xs';
                inputHighlightClass = 'border-sky-500 ring-2 ring-sky-400/60 bg-sky-50 text-sky-950 font-bold shadow-xs';
              } else if (hasUnsavedVal) {
                rowHighlightClass = 'bg-amber-50/80 hover:bg-amber-100/60 border-l-[6px] border-l-amber-400 font-medium';
                inputHighlightClass = 'border-amber-400 ring-2 ring-amber-300/60 bg-amber-50/60 text-amber-900 font-bold';
              } else if (evalRes.status === 'NORMAL') {
                rowHighlightClass = 'border-l-[4px] border-l-emerald-500/80 hover:bg-emerald-50/30';
                inputHighlightClass = 'border-emerald-400 bg-emerald-50/40 text-emerald-950 font-bold';
              }

              if (isFocused) {
                rowHighlightClass += ' ring-2 ring-indigo-500 bg-indigo-50/60 z-10 relative';
              }

              return (
                <tr
                  key={report.reportId || idx}
                  className={`transition-all duration-150 ${rowHighlightClass}`}
                >
                  {/* # Index & Status Indicator Dot */}
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {hasUnsavedVal && (
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"
                          title="Unsaved modifications"
                        />
                      )}
                      <span className="font-mono font-bold text-slate-500 text-[11px]">
                        {idx + 1}
                      </span>
                    </div>
                  </td>

                  {/* Diagnostic Test & Specimen Info */}
                  <td className="py-1.5 px-3 min-w-[210px]">
                    <div className="flex items-center gap-2">
                      {/* Specimen Tube Dot */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 shadow-2xs ${tube.dotClass || 'bg-amber-500'}`}
                        title={`${tube.tubeName} (${tube.capColor})`}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {report.testName}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenGuide(report.testName)}
                            title="View clinical guidance"
                            className="text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer shrink-0"
                          >
                            <Info className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                          <span>{report.deptName || tube.department}</span>
                          <span>•</span>
                          <span>{tube.tubeName}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Phase Status */}
                  <td className="py-1.5 px-2 text-center w-24">
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border shadow-2xs ${phase.theme.badgeBg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${phase.theme.dot} shrink-0`} />
                      <span>{phase.shortLabel}</span>
                    </span>
                  </td>

                  {/* Observed Reading Input */}
                  <td className="py-1.5 px-3 min-w-[170px]">
                    <div className="relative">
                      <input
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        value={current.resultData || ''}
                        onChange={(e) => onInputChange(report.reportId, 'resultData', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        onFocus={() => setFocusedIndex(idx)}
                        onBlur={() => setFocusedIndex(null)}
                        placeholder={getDefaultHealthyValue(report.refRange, report.testName) || 'Enter reading'}
                        className={`w-full px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border outline-none ${inputHighlightClass}`}
                      />
                      {current.resultData === '' && (
                        <button
                          type="button"
                          onClick={() => {
                            const defVal = getDefaultHealthyValue(report.refRange, report.testName);
                            if (defVal) onInputChange(report.reportId, 'resultData', defVal);
                          }}
                          title="Click to fill normal baseline value"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 transition-all cursor-pointer"
                        >
                          Auto
                        </button>
                      )}
                    </div>

                    {/* Multi-run version options (resultData1 through resultData5) */}
                    {(() => {
                      const vers = [
                        { num: 1, val: report.resultData1 },
                        { num: 2, val: report.resultData2 },
                        { num: 3, val: report.resultData3 },
                        { num: 4, val: report.resultData4 },
                        { num: 5, val: report.resultData5 },
                      ].filter((v) => v.val !== undefined && v.val !== null && String(v.val).trim() !== '');

                      if (vers.length === 0) return null;

                      return (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap select-none">
                          <span className="text-[9px] text-purple-800 font-bold uppercase tracking-wider">Runs:</span>
                          {vers.map((v) => {
                            const isDefault = String(current.resultData || '').trim() === String(v.val).trim();
                            return (
                              <div
                                key={v.num}
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                                  isDefault
                                    ? 'bg-purple-100 border-purple-400 font-bold text-purple-950 shadow-2xs'
                                    : 'bg-[#f6effe] border-purple-200 text-slate-800'
                                }`}
                              >
                                <span className="font-mono font-bold">v{v.num}: {v.val}</span>
                                {isDefault ? (
                                  <span className="text-[9px] font-extrabold text-emerald-700 ml-1">✓ Default</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onInputChange(report.reportId, 'resultData', v.val);
                                      if (onSetDefaultResult) onSetDefaultResult(report.reportId, v.num);
                                    }}
                                    className="ml-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-[9px] px-1.5 py-0.2 rounded cursor-pointer shadow-2xs transition-all"
                                    title={`Set Version v${v.num} (${v.val}) as Default Result`}
                                  >
                                    ✓ Set
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </td>


                  {/* Unit */}
                  <td className="py-1.5 px-2 font-mono text-[11px] font-semibold text-slate-600">
                    {report.unit || '-'}
                  </td>

                  {/* Reference Range */}
                  <td className="py-1.5 px-2.5 w-28">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                      {report.refRange || 'Standard'}
                    </span>
                  </td>

                  {/* Clinical Evaluation & Mini Gauge */}
                  <td className="py-1.5 px-3 min-w-[180px]">
                    {evalRes.status !== 'EMPTY' ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border shadow-2xs ${
                            evalRes.status.includes('PANIC')
                              ? 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-rose-300'
                              : evalRes.status === 'REACTIVE'
                              ? 'bg-rose-600 text-white border-rose-700 font-extrabold'
                              : evalRes.status === 'HIGH'
                              ? 'bg-amber-500 text-white border-amber-600 font-extrabold shadow-amber-200'
                              : evalRes.status === 'LOW'
                              ? 'bg-sky-600 text-white border-sky-700 font-extrabold shadow-sky-200'
                              : evalRes.status === 'NORMAL'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                              : 'bg-slate-100 text-slate-800 border-slate-200 font-medium'
                          }`}
                        >
                          {evalRes.status === 'NORMAL' && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                          {evalRes.status === 'HIGH' && <TrendingUp className="w-3 h-3 text-white shrink-0" />}
                          {evalRes.status === 'LOW' && <TrendingDown className="w-3 h-3 text-white shrink-0" />}
                          {evalRes.status.includes('PANIC') && (
                            <AlertTriangle className="w-3 h-3 text-white animate-bounce shrink-0" />
                          )}
                          <span>{evalRes.label}</span>
                        </span>
                        {renderMiniGauge(enteredVal, report.refRange)}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium italic">Awaiting Reading</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-1.5 px-2.5 text-right w-20">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onSaveSingle(report)}
                        disabled={isSaving}
                        title="Save result for this parameter"
                        className={`p-1 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                          hasUnsavedVal
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs active:scale-95'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        } disabled:opacity-50`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onCalculate(report.reportId)}
                        title="Evaluate automated formula calculation"
                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
