import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Calculator,
  AlertCircle,
  CheckCircle,
  Info,
  BookOpen,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Sparkles,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Clock,
  FlaskConical,
  RotateCcw,
  AlertTriangle,
  X,
} from 'lucide-react';
import api from '../../services/api';
import ResultsPhaseTracker from './ResultsPhaseTracker.jsx';
import ResultsTableView from './ResultsTableView.jsx';
import ResultsCardView from './ResultsCardView.jsx';
import ClinicalGuideModal from '../common/ClinicalGuideModal.jsx';
import DoctorApprovalModal from './DoctorApprovalModal.jsx';
import {
  getTestPhaseInfo,
  evaluateResultValue,
  getDefaultHealthyValue,
} from '../../utils/labTestUtils.js';

export default function ResultsEntry({
  patient = {},
  reports = [],
  templates = [],
  onRefresh,
}) {
  // Initialize internal state for editable test values
  const [resultsState, setResultsState] = useState(() => {
    const initial = {};
    reports.forEach((r) => {
      initial[r.reportId] = {
        resultData: r.resultData || '',
        comment: r.comment || '',
        status: r.status || 'SAVED',
      };
    });
    return initial;
  });

  // Synchronize when reports prop updates
  useEffect(() => {
    setResultsState((prev) => {
      const updated = { ...prev };
      reports.forEach((r) => {
        if (!updated[r.reportId]) {
          updated[r.reportId] = {
            resultData: r.resultData || '',
            comment: r.comment || '',
            status: r.status || 'SAVED',
          };
        } else {
          // If server result changed and user hasn't edited, update
          if (updated[r.reportId].resultData === '' && r.resultData) {
            updated[r.reportId].resultData = r.resultData;
          }
        }
      });
      return updated;
    });
  }, [reports]);

  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [receivingAll, setReceivingAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // UI Filters and Modals - DEFAULT TO 'table' for maximum compactness
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('ALL'); // ALL, PHASE_1, PHASE_2, PHASE_3, PHASE_4, PHASE_5, ABNORMAL
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [guideSearchTerm, setGuideSearchTerm] = useState('');
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  // Compute Unsaved Modifications
  const dirtyReportIds = useMemo(() => {
    return reports
      .filter((r) => {
        const cur = resultsState[r.reportId];
        if (!cur) return false;
        const origVal = r.resultData || '';
        const curVal = cur.resultData || '';
        const origComment = r.comment || '';
        const curComment = cur.comment || '';
        return curVal !== origVal || curComment !== origComment;
      })
      .map((r) => r.reportId);
  }, [reports, resultsState]);

  // Compute Phase Statistics & Abnormal Counts
  const phaseStats = useMemo(() => {
    let phase1 = 0;
    let phase2 = 0;
    let phase3 = 0;
    let phase4 = 0;
    let phase5 = 0;
    let abnormal = 0;

    reports.forEach((r) => {
      const cur = resultsState[r.reportId] || {};
      const val = cur.resultData !== undefined ? cur.resultData : r.resultData;
      const phase = getTestPhaseInfo({ ...r, resultData: val }, patient);

      if (phase.phase === 1) phase1++;
      else if (phase.phase === 2) phase2++;
      else if (phase.phase === 3) phase3++;
      else if (phase.phase === 4) phase4++;
      else if (phase.phase === 5) phase5++;

      const evalRes = evaluateResultValue(val, r.refRange, r.unit);
      if (evalRes.isAbnormal) abnormal++;
    });

    return {
      total: reports.length,
      phase1,
      phase2,
      phase3,
      phase4,
      phase5,
      abnormal,
    };
  }, [reports, resultsState, patient]);

  // Filtered Reports list
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // 1. Search term match
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const testName = String(r.testName || '').toLowerCase();
        const dept = String(r.deptName || '').toLowerCase();
        const samp = String(r.sampleType || '').toLowerCase();
        if (!testName.includes(term) && !dept.includes(term) && !samp.includes(term)) {
          return false;
        }
      }

      // 2. Phase Filter match
      if (phaseFilter === 'ALL') return true;

      const cur = resultsState[r.reportId] || {};
      const val = cur.resultData !== undefined ? cur.resultData : r.resultData;
      const phase = getTestPhaseInfo({ ...r, resultData: val }, patient);

      if (phaseFilter === 'PHASE_1') return phase.phase === 1;
      if (phaseFilter === 'PHASE_2') return phase.phase === 2;
      if (phaseFilter === 'PHASE_3') return phase.phase === 3;
      if (phaseFilter === 'PHASE_4') return phase.phase === 4;
      if (phaseFilter === 'PHASE_5') return phase.phase === 5;
      if (phaseFilter === 'ABNORMAL') {
        const evalRes = evaluateResultValue(val, r.refRange, r.unit);
        return evalRes.isAbnormal;
      }

      return true;
    });
  }, [reports, resultsState, searchTerm, phaseFilter, patient]);

  const handleInputChange = (reportId, field, val) => {
    setResultsState((prev) => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [field]: val,
      },
    }));
  };

  // Keyboard shortcut Ctrl+S or Cmd+S to save all
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resultsState, reports]);

  const saveSingleReport = async (report) => {
    setSavingId(report.reportId);
    setSuccessMsg('');
    setErrorMsg('');

    const current = resultsState[report.reportId] || {};

    try {
      await api.post('/reports/update', {
        reportId: report.reportId,
        patientId: patient.patientId,
        sampleId: report.sampleId || patient.slNo,
        testName: report.testName,
        rate: report.rate,
        sampletype: report.sampleType || 'Serum',
        method: report.method || '',
        refRange: report.refRange,
        unitref: report.unit,
        resultData: current.resultData,
        unit: report.unit,
        comment: current.comment || '',
        profileName: report.profileName || '',
        deptName: report.deptName || 'D1',
      });

      setSuccessMsg(`Test "${report.testName}" saved successfully.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to update test result');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      for (const report of reports) {
        const current = resultsState[report.reportId] || {};
        await api.post('/reports/update', {
          reportId: report.reportId,
          patientId: patient.patientId,
          sampleId: report.sampleId || patient.slNo,
          testName: report.testName,
          rate: report.rate,
          sampletype: report.sampleType || 'Serum',
          method: report.method || '',
          refRange: report.refRange,
          unitref: report.unit,
          resultData: current.resultData,
          unit: report.unit,
          comment: current.comment || '',
          profileName: report.profileName || '',
          deptName: report.deptName || 'D1',
        });
      }
      setSuccessMsg(`All ${reports.length} laboratory test results saved successfully!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to save test results');
    } finally {
      setSavingAll(false);
    }
  };

  const handleAutoFillHealthyDefaults = () => {
    let count = 0;
    setResultsState((prev) => {
      const updated = { ...prev };
      reports.forEach((r) => {
        const curVal = updated[r.reportId]?.resultData;
        if (!curVal || curVal.trim() === '' || curVal === '-') {
          const defaultVal = getDefaultHealthyValue(r.refRange, r.testName);
          if (defaultVal) {
            updated[r.reportId] = {
              ...updated[r.reportId],
              resultData: defaultVal,
            };
            count++;
          }
        }
      });
      return updated;
    });

    if (count > 0) {
      setSuccessMsg(`Auto-populated ${count} empty parameters with safe healthy baseline values.`);
    } else {
      setSuccessMsg('All test parameters already have values entered.');
    }
  };

  const handleDiscardChanges = () => {
    setResultsState(() => {
      const reset = {};
      reports.forEach((r) => {
        reset[r.reportId] = {
          resultData: r.resultData || '',
          comment: r.comment || '',
          status: r.status || 'SAVED',
        };
      });
      return reset;
    });
    setSuccessMsg('Unsaved modifications discarded.');
  };

  const handleCalculate = async (reportId) => {
    try {
      await api.post('/reports/calculate-result', {
        patientId: patient.patientId,
        reportId,
      });
      setSuccessMsg('Automated diagnostic calculation evaluated successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg('Failed to run automated formula calculation');
    }
  };

  const handleReceiveSample = async (report) => {
    try {
      await api.post('/reports/receive-sample', {
        patientId: patient.patientId,
      });
      setSuccessMsg(`Sample accessioned successfully!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg('Failed to receive sample');
    }
  };

  const handleReceiveAllSamples = async () => {
    setReceivingAll(true);
    try {
      await api.post('/reports/receive-sample', {
        patientId: patient.patientId,
      });
      setSuccessMsg('All pending samples marked received in accession desk!');
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg('Failed to receive all samples');
    } finally {
      setReceivingAll(false);
    }
  };

  const openClinicalGuide = (name) => {
    setGuideSearchTerm(name);
    setGuideModalOpen(true);
  };

  return (
    <div className="space-y-2.5 w-full">
      {/* 1. Streamlined Clinical Workstation Header & Command Bar */}
      <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Patient Demographics & Test Count */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <FlaskConical className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-sm font-extrabold tracking-tight">Results Bench</span>
          </div>

          <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.2 rounded-md">
            PID #{patient.patientId || patient.slNo}
          </span>

          <span className="text-xs font-semibold text-slate-800">
            {patient.name} ({patient.gender || '-'} / {patient.age || '-'}Y)
          </span>

          <span className="text-slate-400 hidden sm:inline">•</span>

          <span className="text-slate-500 text-[11px] hidden md:inline">
            Ref: <strong className="text-slate-700">{patient.referedDr || 'Self'}</strong>
          </span>

          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.2 rounded-full">
            {reports.length} Tests
          </span>

          {dirtyReportIds.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {dirtyReportIds.length} Unsaved
            </span>
          )}
        </div>

        {/* Center / Right: Quick Search & Clinical Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Quick Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-6 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* Clinical Reference Guide */}
          <button
            type="button"
            onClick={() => setGuideModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            title="Open Clinical Interpretations Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden xl:inline">Guide</span>
          </button>

          {/* Auto-Fill Healthy Defaults */}
          <button
            type="button"
            onClick={handleAutoFillHealthyDefaults}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Auto-fill empty fields with safe normal baseline values"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fill Baseline</span>
          </button>

          {/* Doctor Sign-off / Verification Modal Trigger */}
          <button
            type="button"
            onClick={() => setApprovalModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Doctor verification & digital sign-off"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Sign-Off</span>
          </button>

          {/* Save All Results Button */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingAll}
            className="flex items-center gap-1.5 px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Save all changes (Ctrl+S)"
          >
            <Save className={`w-3.5 h-3.5 ${savingAll ? 'animate-spin' : ''}`} />
            <span>{savingAll ? 'Saving...' : 'Save All (Ctrl+S)'}</span>
          </button>

          {/* View Mode Toggle (Table / Cards) */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Compact Tabular Grid (Recommended)"
              className={`p-1 px-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Diagnostic Card Grid"
              className={`p-1 px-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Diagnostic Phase Stepper & Specimen Pipeline (Single-line compact) */}
      <ResultsPhaseTracker
        phaseStats={phaseStats}
        activePhaseFilter={phaseFilter}
        onSelectPhaseFilter={setPhaseFilter}
        onReceiveAllSamples={handleReceiveAllSamples}
        receivingAll={receivingAll}
      />

      {/* 3. High-Impact Abnormal Alert Strip (if flagged tests exist and not already filtering) */}
      {phaseStats.abnormal > 0 && phaseFilter !== 'ABNORMAL' && (
        <div className="bg-rose-50 border border-rose-300 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-rose-900 animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
            <span>
              <strong>{phaseStats.abnormal} test parameter{phaseStats.abnormal > 1 ? 's' : ''}</strong> flagged with abnormal or critical readings in this panel.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPhaseFilter('ABNORMAL')}
            className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
          >
            Show Only Flagged ({phaseStats.abnormal})
          </button>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:opacity-75 font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="py-1.5 px-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-rose-700 hover:opacity-75 font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* 4. Active View Rendering: High-Density Table (default) or Responsive Card Matrix */}
      {filteredReports.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 space-y-1.5">
          <FlaskConical className="w-7 h-7 mx-auto text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">
            No diagnostic tests match current filter "{phaseFilter}" or search "{searchTerm}".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setPhaseFilter('ALL');
            }}
            className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <ResultsTableView
          reports={filteredReports}
          resultsState={resultsState}
          patient={patient}
          savingId={savingId}
          onInputChange={handleInputChange}
          onSaveSingle={saveSingleReport}
          onCalculate={handleCalculate}
          onOpenGuide={openClinicalGuide}
          onReceiveSample={handleReceiveSample}
        />
      ) : (
        <ResultsCardView
          reports={filteredReports}
          resultsState={resultsState}
          patient={patient}
          savingId={savingId}
          onInputChange={handleInputChange}
          onSaveSingle={saveSingleReport}
          onCalculate={handleCalculate}
          onOpenGuide={openClinicalGuide}
          onReceiveSample={handleReceiveSample}
        />
      )}

      {/* 5. Floating Sticky Unsaved Changes Action Bar */}
      {dirtyReportIds.length > 0 && (
        <div className="sticky bottom-3 z-30 p-2.5 px-4 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold text-amber-200">
              {dirtyReportIds.length} {dirtyReportIds.length === 1 ? 'test parameter has' : 'test parameters have'} unsaved modifications
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Discard</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll}
              className="flex items-center gap-1.5 px-4 py-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${savingAll ? 'animate-spin' : ''}`} />
              <span>{savingAll ? 'Saving...' : `Save ${dirtyReportIds.length} Changes (Ctrl+S)`}</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Modals */}
      <ClinicalGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        initialSearch={guideSearchTerm}
      />

      <DoctorApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        patient={patient}
        reports={reports}
        onApproved={() => {
          if (onRefresh) onRefresh();
          setSuccessMsg('Diagnostic report clinically verified and approved by doctor!');
        }}
      />
    </div>
  );
}
