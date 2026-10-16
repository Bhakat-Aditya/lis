import React, { useState } from 'react';
import {
  Save,
  Calculator,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../common/Badge.jsx';

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
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (reportId, field, val) => {
    setResultsState((prev) => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [field]: val,
      },
    }));
  };

  // Evaluate if result is Normal, High, or Low based on reference range
  const evaluateRange = (value, refRange = '') => {
    if (!value || !refRange || refRange === '-' || !refRange.includes('-')) return null;
    const parts = refRange.split('-').map((s) => parseFloat(s.trim()));
    const num = parseFloat(value);
    if (isNaN(num) || parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;

    const [low, high] = parts;
    if (num < low) return { status: 'LOW', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (num > high) return { status: 'HIGH', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    return { status: 'NORMAL', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
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

  const handleCalculate = async (reportId) => {
    try {
      await api.post('/reports/calculate-result', {
        patientId: patient.patientId,
        reportId,
      });
      setSuccessMsg('Result calculated by system formulas');
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg('Calculation failed');
    }
  };

  const handleSetDefault = async (reportId) => {
    try {
      await api.post('/reports/set-default-result', {
        patientId: patient.patientId,
        reportId,
        resultVersion: 1,
      });
      setSuccessMsg('Default result values populated');
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg('Could not set default');
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Banners */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 text-xs font-bold">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 text-xs font-bold">×</button>
        </div>
      )}

      {/* Routine Tests Result Entry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
              Diagnostic Test Results ({reports.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Patient: <strong className="text-slate-800">{patient.name}</strong> ({patient.patientId})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <th className="py-2.5 px-3">Test Name / Dept</th>
                <th className="py-2.5 px-3">Sample Type</th>
                <th className="py-2.5 px-3">Reference Range</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3 w-40">Result Value</th>
                <th className="py-2.5 px-3">Range Flag</th>
                <th className="py-2.5 px-3 w-44">Comments / Remarks</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => {
                const current = resultsState[r.reportId] || {};
                const flag = evaluateRange(current.resultData, r.refRange);

                return (
                  <tr key={r.reportId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{r.testName}</div>
                      <div className="text-[10px] text-slate-400">
                        Method: {r.method || 'Standard'} | Dept: {r.deptName || 'D1'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {r.sampleType || 'Serum'}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      {r.refRange || '-'}
                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      {r.unit || '-'}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="Enter value"
                        value={current.resultData || ''}
                        onChange={(e) => handleInputChange(r.reportId, 'resultData', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="py-3 px-3">
                      {flag ? (
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase ${flag.color}`}>
                          {flag.status}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="Optional comment"
                        value={current.comment || ''}
                        onChange={(e) => handleInputChange(r.reportId, 'comment', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                      />
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSetDefault(r.reportId)}
                          title="Set Default Value"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCalculate(r.reportId)}
                          title="Auto Calculate Result"
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => saveSingleReport(r)}
                          disabled={savingId === r.reportId}
                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingId === r.reportId ? 'Saving...' : 'Save'}</span>
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

      {/* Template Reports (Culture Sensitivity, Fluid Analysis) */}
      {templates.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span>Special Template Reports</span>
            <span className="text-indigo-600">({templates.length})</span>
          </h3>

          {templates.map((tpl, tIndex) => {
            const parsed = tpl.resultJsonParsed || {};
            const examList = parsed?.Exam?.Exam || [];

            return (
              <div key={tpl.reportId || tIndex} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">
                    {tpl.name || 'Culture & Sensitivity Report'} ({tpl.reportId})
                  </h4>
                  <StatusBadge status={tpl.status || 'SAVED'} />
                </div>

                {examList.length > 0 && (
                  <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <th className="py-2 px-3">Antibiotic Name</th>
                          <th className="py-2 px-3 w-28 text-center">Zone (mm)</th>
                          <th className="py-2 px-3 w-28 text-center">Value / Sensitivity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {examList.slice(0, 10).map((ex, exIdx) => (
                          <tr key={exIdx}>
                            <td className="py-1.5 px-3 font-medium text-slate-800">{ex.Name || `Antibiotic ${exIdx + 1}`}</td>
                            <td className="py-1.5 px-3 text-center font-mono">{ex.Zone || '-'}</td>
                            <td className="py-1.5 px-3 text-center font-semibold text-indigo-700">{ex.Value || 'Sensitive'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
