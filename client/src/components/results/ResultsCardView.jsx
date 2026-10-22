import React from 'react';
import {
  Save,
  Calculator,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Clock,
  FlaskConical,
  Sparkles,
  Award,
  ShieldCheck,
  Check,
  Loader2,
} from 'lucide-react';
import {
  getSpecimenTubeInfo,
  getTestPhaseInfo,
  evaluateResultValue,
  getDefaultHealthyValue,
} from '../../utils/labTestUtils.js';

export default function ResultsCardView({
  reports = [],
  resultsState = {},
  patient = {},
  savingId = null,
  onInputChange,
  onSaveSingle,
  onCalculate,
  onOpenGuide,
  onReceiveSample,
}) {
  return (
    <div
      data-lenis-prevent="true"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 w-full"
    >
      {reports.map((report, idx) => {
        const current = resultsState[report.reportId] || {};
        const enteredVal = current.resultData;
        const evalRes = evaluateResultValue(enteredVal, report.refRange, report.unit);
        const tube = getSpecimenTubeInfo(report.sampleType, report.testName);
        const phase = getTestPhaseInfo(report, patient);
        const isSaving = savingId === report.reportId;
        const hasUnsavedVal = current.resultData !== (report.resultData || '');

        let cardHighlightClass = 'bg-white border-slate-200/90 shadow-2xs hover:shadow-xs';
        let inputHighlightClass = 'border-slate-300 bg-slate-50/70 focus:bg-white focus:border-indigo-500 text-slate-800';

        if (evalRes.status.includes('PANIC')) {
          cardHighlightClass = 'bg-rose-100/80 border-rose-400 border-l-[6px] border-l-rose-600 ring-2 ring-rose-500/30';
          inputHighlightClass = 'border-rose-600 ring-2 ring-rose-500/70 bg-rose-50 text-rose-950 font-black shadow-xs';
        } else if (evalRes.status === 'REACTIVE') {
          cardHighlightClass = 'bg-rose-50/90 border-rose-300 border-l-[6px] border-l-rose-600 ring-1 ring-rose-400/20';
          inputHighlightClass = 'border-rose-600 ring-2 ring-rose-500/70 bg-rose-50 text-rose-950 font-bold shadow-xs';
        } else if (evalRes.status === 'HIGH') {
          cardHighlightClass = 'bg-amber-50/90 border-amber-300 border-l-[6px] border-l-amber-500 ring-1 ring-amber-400/20';
          inputHighlightClass = 'border-amber-500 ring-2 ring-amber-400/60 bg-amber-50 text-amber-950 font-bold shadow-xs';
        } else if (evalRes.status === 'LOW') {
          cardHighlightClass = 'bg-sky-50/90 border-sky-300 border-l-[6px] border-l-sky-500 ring-1 ring-sky-400/20';
          inputHighlightClass = 'border-sky-500 ring-2 ring-sky-400/60 bg-sky-50 text-sky-950 font-bold shadow-xs';
        } else if (hasUnsavedVal) {
          cardHighlightClass = 'bg-amber-50/50 border-amber-300 border-l-[6px] border-l-amber-400 ring-1 ring-amber-400/40';
          inputHighlightClass = 'border-amber-400 ring-2 ring-amber-300/60 bg-amber-50/60 text-amber-900 font-bold';
        } else if (evalRes.status === 'NORMAL') {
          cardHighlightClass = 'bg-white border-slate-200 border-l-[4px] border-l-emerald-500';
          inputHighlightClass = 'border-emerald-400 bg-emerald-50/40 text-emerald-950 font-bold';
        }

        return (
          <div
            key={report.reportId || idx}
            className={`rounded-xl border p-2.5 flex flex-col justify-between gap-2 transition-all ${cardHighlightClass}`}
          >
            {/* Top row: Test Name, Tube dot, and Phase Badge */}
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 shadow-2xs ${tube.dotClass || 'bg-amber-500'}`}
                    title={`${tube.tubeName} (${tube.capColor})`}
                  />
                  <h4 className="font-bold text-xs text-slate-900 tracking-tight truncate">
                    {report.testName}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onOpenGuide(report.testName)}
                    title="View clinical guidance"
                    className="text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer shrink-0"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border shadow-2xs shrink-0 ${phase.theme.badgeBg}`}
                >
                  <span className={`w-1 h-1 rounded-full ${phase.theme.dot}`} />
                  <span>{phase.shortLabel}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                <span className="truncate">{report.deptName || tube.department}</span>
                <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                  Ref: {report.refRange || 'Standard'}
                </span>
              </div>

              {/* Observed Reading Input & Set Normal */}
              <div className="relative">
                <input
                  type="text"
                  value={current.resultData || ''}
                  onChange={(e) => onInputChange(report.reportId, 'resultData', e.target.value)}
                  placeholder={getDefaultHealthyValue(report.refRange, report.testName) || 'Enter reading'}
                  className={`w-full pl-2 pr-18 py-1 rounded-lg text-xs font-mono font-bold transition-all border outline-none ${inputHighlightClass}`}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {current.resultData === '' && (
                    <button
                      type="button"
                      onClick={() => {
                        const defVal = getDefaultHealthyValue(report.refRange, report.testName);
                        if (defVal) onInputChange(report.reportId, 'resultData', defVal);
                      }}
                      className="text-[9px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 transition-colors cursor-pointer"
                    >
                      Auto
                    </button>
                  )}
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    {report.unit || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Evaluation Status & Actions */}
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
              <div className="min-w-0">
                {evalRes.status !== 'EMPTY' ? (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded border shadow-2xs truncate ${
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
                    {evalRes.status === 'NORMAL' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                    {evalRes.status === 'HIGH' && <TrendingUp className="w-2.5 h-2.5 text-white shrink-0" />}
                    {evalRes.status === 'LOW' && <TrendingDown className="w-2.5 h-2.5 text-white shrink-0" />}
                    {evalRes.status.includes('PANIC') && <AlertTriangle className="w-2.5 h-2.5 text-white animate-bounce shrink-0" />}
                    <span className="truncate">{evalRes.label}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Awaiting Reading</span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onCalculate(report.reportId)}
                  title="Calculate formula"
                  className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                >
                  <Calculator className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => onSaveSingle(report)}
                  disabled={isSaving}
                  className={`p-1 px-1.5 font-bold text-xs rounded-md shadow-2xs transition-all cursor-pointer ${
                    hasUnsavedVal
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  } disabled:opacity-50`}
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
