import React, { useState } from 'react';
import {
  Save,
  Calculator,
  AlertCircle,
  CheckCircle,
  Info,
  BookOpen,
} from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../common/Badge.jsx';
import ReferenceRangeGauge from '../common/ReferenceRangeGauge.jsx';
import ClinicalGuideModal from '../common/ClinicalGuideModal.jsx';

export default function ResultsEntry({
  patient,
  reports = [],
  templates = [],
  onRefresh,
}) {
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

  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [guideSearchTerm, setGuideSearchTerm] = useState('');

  const handleInputChange = (reportId, field, val) => {
    setResultsState((prev) => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [field]: val,
      },
    }));
  };

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
        sampletype: report.sampleType,
        method: report.method,
        refRange: report.refRange,
        unitref: report.unit,
        resultData: current.resultData,
        unit: report.unit,
        comment: current.comment,
        profileName: report.profileName || '',
        deptName: report.deptName || 'D1',
      });

      setSuccessMsg(`Test "${report.testName}" updated successfully!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to update report');
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
          sampletype: report.sampleType,
          method: report.method,
          refRange: report.refRange,
          unitref: report.unit,
          resultData: current.resultData,
          unit: report.unit,
          comment: current.comment,
          profileName: report.profileName || '',
          deptName: report.deptName || 'D1',
        });
      }
      setSuccessMsg('All test parameters saved successfully to laboratory database!');
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to save all test results');
    } finally {
      setSavingAll(false);
    }
  };

  const handleCalculate = async (reportId) => {
    try {
      await api.post('/reports/calculate-result', {
        patientId: patient.patientId,
        reportId,
      });
      setSuccessMsg('Result automated calculation evaluated successfully');
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg('Failed to run automated calculation');
    }
  };

  const openClinicalGuide = (name) => {
    setGuideSearchTerm(name);
    setGuideModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Workstation Header */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Test Result Entry & Analyzer Correlation
            </h2>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
              PID #{patient.patientId || patient.slNo}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {patient.name} ({patient.gender || '-'} / {patient.age || '-'} Y) • Ref By: {patient.referedDr || 'Self'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setGuideModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Clinical Guide</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={savingAll}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingAll ? 'Saving All...' : 'Save All Results'}</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tests Entry List */}
      <div className="space-y-4">
        {reports.map((report, idx) => {
          const current = resultsState[report.reportId] || {};
          const isSaving = savingId === report.reportId;
          const enteredVal = current.resultData;

          return (
            <div
              key={report.reportId || idx}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3 transition-shadow hover:shadow-md"
            >
              {/* Header: Test Name, Department & Clinical Info Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-400 font-bold text-xs">#{idx + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{report.testName}</h4>
                      <button
                        onClick={() => openClinicalGuide(report.testName)}
                        title="View clinical significance, high/low interpretations, and indications"
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Clinical Meaning</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Dept: {report.deptName || 'Biochemistry / Hematology'} • Method: {report.method || 'Automated Spectrophotometry / Laser Flow'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    Ref: {report.refRange || 'Normal Range'} {report.unit || ''}
                  </span>
                  <StatusBadge status={report.status || 'SAVED'} />
                </div>
              </div>

              {/* Input Grid: Result Value, Visual Reference Range Gauge & Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Result Input (4 cols) */}
                <div className="lg:col-span-4 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Observed Patient Value
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 14.5"
                      value={current.resultData}
                      onChange={(e) => handleInputChange(report.reportId, 'resultData', e.target.value)}
                      className="w-full pl-3 pr-14 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      {report.unit || ''}
                    </span>
                  </div>
                </div>

                {/* Visual Medical Range Gauge (6 cols) */}
                <div className="lg:col-span-6 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                  <ReferenceRangeGauge
                    value={enteredVal}
                    refRange={report.refRange}
                    unit={report.unit}
                    testName={report.testName}
                  />
                </div>

                {/* Action Buttons (2 cols) */}
                <div className="lg:col-span-2 flex lg:flex-col items-center justify-end gap-1.5">
                  <button
                    onClick={() => saveSingleReport(report)}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Update'}</span>
                  </button>

                  <button
                    onClick={() => handleCalculate(report.reportId)}
                    title="Calculate index automatically"
                    className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-[11px] rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    <Calculator className="w-3 h-3 text-blue-600" />
                    <span>Calculate</span>
                  </button>
                </div>
              </div>

              {/* Technician Clinical Comment Field */}
              <div className="pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Optional pathologist / technician comment or specimen observation (e.g. Slightly hemolyzed, verified on dilution)..."
                  value={current.comment || ''}
                  onChange={(e) => handleInputChange(report.reportId, 'comment', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/60 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Clinical Reference Guide Modal */}
      <ClinicalGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        initialSearch={guideSearchTerm}
      />
    </div>
  );
}
