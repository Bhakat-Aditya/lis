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
  Trash2,
  RotateCcw,
  Cpu,
  Edit,
  Upload,
  Download,
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
  calculatingId = null,
  deletingId = null,
  uploadingId = null,
  downloadingId = null,
  onInputChange,
  onSaveSingle,
  onCalculate,
  onSetDefaultResult,
  onOpenGuide,
  onReceiveSample,
  onDeleteReport,
  onRestoreReport,
  onUploadOrder,
  onDownloadResult,
  onOpenEditReport,
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
        const phase = getTestPhaseInfo({ ...report, status: current.status || report.status, resultData: enteredVal }, patient);
        const isSaving = savingId === report.reportId;
        const isDeleting = deletingId === report.reportId;
        const isDeleted = report.status === 'DELETED' || current.status === 'DELETED' || phase.phaseId === 'DELETED';
        const hasUnsavedVal = current.resultData !== (report.resultData || '');

        let cardHighlightClass = 'bg-white border-slate-200/90 shadow-2xs hover:shadow-xs';
        let inputHighlightClass = 'border-slate-300 bg-slate-50/70 focus:bg-white focus:border-indigo-500 text-slate-800';

        if (isDeleted) {
          cardHighlightClass = 'bg-rose-50/60 border-rose-300 border-l-[6px] border-l-rose-500 opacity-80';
          inputHighlightClass = 'border-rose-300 bg-rose-50/40 text-slate-500 line-through';
        } else if (evalRes.status.includes('PANIC')) {
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

        const availableVersions = [
          { num: 1, val: report.resultData1 },
          { num: 2, val: report.resultData2 },
          { num: 3, val: report.resultData3 },
          { num: 4, val: report.resultData4 },
          { num: 5, val: report.resultData5 },
        ].filter(
          (v) => v.val !== undefined && v.val !== null && String(v.val).trim() !== ''
        );

        return (
          <div
            key={report.reportId || idx}
            className={`rounded-2xl border-2 border-teal-500/80 bg-white flex overflow-hidden shadow-xs transition-all relative ${cardHighlightClass}`}
          >
            {/* Left Vertical Ribbon (e.g. IMMUPA / BIOCH) */}
            <div className="w-7 sm:w-8 bg-[#1a388a] text-white flex flex-col items-center justify-center shrink-0 select-none py-2 px-1">
              <span className="text-[10px] font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                {report.deptName || tube.department || 'LAB'}
              </span>
            </div>

            {/* Main Card Body */}
            <div className="flex-1 p-3 flex flex-col justify-between gap-2 min-w-0">
              <div>
                {/* Top row: Brown profile pill and Red circular tube button */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span
                    className="inline-flex items-center text-[11px] font-bold text-white bg-[#823a1a] px-2.5 py-0.5 rounded-md shadow-2xs truncate max-w-[190px]"
                    title={report.profileName || report.packageName || tube.department}
                  >
                    {report.profileName || report.packageName || tube.department || 'LAB'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onDeleteReport && onDeleteReport(report)}
                    disabled={isDeleting}
                    className="w-7 h-7 rounded-full bg-[#ef4444] hover:bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform active:scale-90 cursor-pointer"
                    title={isDeleted ? 'Test parameter deleted' : `Sample Tube: ${tube.tubeName} (${tube.capColor})`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Test Name & Method Subtitle */}
                <div className="mb-2.5">
                  <h4
                    className={`font-black text-base tracking-tight text-[#162d59] leading-snug ${
                      isDeleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {report.testName}
                  </h4>
                  <div className="text-xs font-bold text-slate-600 uppercase mt-0.5 tracking-wider">
                    {report.method || report.sampleType || tube.department || 'Standard'}
                  </div>
                </div>

                {/* Observed Reading Green Badge & Arrow Trend Controls */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#156e3b] text-white font-mono font-bold text-xs shadow-xs min-w-[125px]">
                    <span className="text-sm">
                      {current.resultData !== undefined && current.resultData !== ''
                        ? current.resultData
                        : getDefaultHealthyValue(report.refRange, report.testName) || '0'}
                    </span>
                    <span className="text-[11px] text-emerald-200 font-sans font-medium">
                      {report.unit || ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenGuide(report.testName)}
                      title="View clinical guidance"
                      className="text-emerald-300 hover:text-white transition-colors cursor-pointer ml-auto"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const lowVal = report.refRange?.split('-')[0]?.trim();
                        if (lowVal && !isNaN(Number(lowVal))) {
                          onInputChange(report.reportId, 'resultData', lowVal);
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-[#10b981] hover:bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Set lower reference limit or downward trend"
                    >
                      <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px]">
                        ↓
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const parts = report.refRange?.split('-');
                        const highVal = parts && parts.length > 1 ? parts[1]?.trim() : '';
                        if (highVal && !isNaN(Number(highVal))) {
                          onInputChange(report.reportId, 'resultData', highVal);
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-[#10b981] hover:bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Set upper reference limit or upward trend"
                    >
                      <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px]">
                        ↑
                      </span>
                    </button>
                  </div>
                </div>

                {/* Analyzer Multi-Run Versions (resultData1 through resultData5) */}
                {availableVersions.length > 0 ? (
                  <div className="space-y-1.5 select-none my-2">
                    {availableVersions.map((v) => {
                      const isDefault =
                        String(current.resultData || '').trim() === String(v.val).trim();
                      return (
                        <div
                          key={v.num}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={`flex-1 flex items-center justify-start gap-3 px-3 py-1.5 rounded-xl border transition-all ${
                              isDefault
                                ? 'bg-[#ecd6f7] border-purple-400 ring-1 ring-purple-400/50 shadow-2xs'
                                : 'bg-[#f4e8fb] border-purple-200'
                            }`}
                          >
                            <span className="font-mono font-bold text-xs text-purple-950">
                              v{v.num}
                            </span>
                            <span className="font-extrabold text-xs text-slate-900 font-mono truncate">
                              {v.val} {report.unit || ''}
                            </span>
                          </div>

                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => {
                                onInputChange(report.reportId, 'resultData', v.val);
                                if (onSetDefaultResult) onSetDefaultResult(report.reportId, v.num);
                              }}
                              className="shrink-0 inline-flex items-center gap-1 bg-[#e11d2b] hover:bg-red-700 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                              title={`Set v${v.num} (${v.val}) as Default Result`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Set</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {/* Inline Manual Input with Auto Default */}
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={current.resultData || ''}
                    onChange={(e) => onInputChange(report.reportId, 'resultData', e.target.value)}
                    placeholder={getDefaultHealthyValue(report.refRange, report.testName) || 'Enter reading'}
                    className={`w-full pl-2.5 pr-18 py-1 rounded-xl text-xs font-mono font-bold transition-all border outline-none ${inputHighlightClass}`}
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

              {/* Bottom Section: Edit Report Button & Action Footer */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {/* Full-width "Edit Report" button matching screenshot */}
                <button
                  type="button"
                  onClick={() => onOpenEditReport && onOpenEditReport(report)}
                  className="w-full py-2 bg-[#3b5ae8] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Report</span>
                </button>

                {/* Diagnostics Status and Actions */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
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
                      <span className="text-[10px] text-slate-400 italic">Ref: {report.refRange || 'Standard'}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isDeleted ? (
                      <button
                        type="button"
                        onClick={() => onRestoreReport && onRestoreReport(report)}
                        disabled={isDeleting}
                        title="Restore test parameter"
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        <span>Restore</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onCalculate(report.reportId)}
                          disabled={calculatingId === report.reportId || isSaving}
                          title="Calculate formula"
                          className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {calculatingId === report.reportId ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Calculator className="w-3 h-3" />
                          )}
                        </button>

                        {/* Upload Order to Analyzer (UPLOADORDER) */}
                        <button
                          type="button"
                          onClick={() => onUploadOrder && onUploadOrder(report)}
                          disabled={uploadingId === report.reportId || isSaving || isDeleting}
                          title="Upload Order to Analyzer Equipment (UPLOADORDER)"
                          className="p-1 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-sky-600 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {uploadingId === report.reportId ? (
                            <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                        </button>

                        {/* Download Result from Analyzer (DOWNLOADRESULT) */}
                        <button
                          type="button"
                          onClick={() => onDownloadResult && onDownloadResult(report)}
                          disabled={downloadingId === report.reportId || isSaving || isDeleting}
                          title="Download Result from Analyzer Equipment (DOWNLOADRESULT)"
                          className="p-1 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-violet-600 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {downloadingId === report.reportId ? (
                            <Loader2 className="w-3 h-3 animate-spin text-violet-600" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteReport && onDeleteReport(report)}
                          disabled={isDeleting}
                          title="Delete test parameter"
                          className="p-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onSaveSingle(report)}
                          disabled={isSaving}
                          title="Save result"
                          className={`p-1 px-1.5 font-bold text-xs rounded-md shadow-2xs transition-all cursor-pointer ${
                            hasUnsavedVal
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          } disabled:opacity-50`}
                        >
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Vertical Ribbon (e.g. RECEIVED / ENTERED / VERIFIED / APPROVED) */}
            <div
              className={`w-7 sm:w-8 flex flex-col items-center justify-center shrink-0 select-none py-2 px-1 text-white ${
                phase.phaseId === 'APPROVED'
                  ? 'bg-emerald-700'
                  : phase.phaseId === 'VERIFIED'
                  ? 'bg-indigo-700'
                  : phase.phaseId === 'ENTERED'
                  ? 'bg-amber-600'
                  : 'bg-[#15803d]'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                {phase.shortLabel || 'RECEIVED'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
