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
  Printer,
  Download,
  ExternalLink,
  Trash2,
  Cpu,
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
  // Helper to normalize status into one of 10 official upstream LIS statuses
  const resolveStatus = (report = {}, current = {}) => {
    const raw = String(current.status || report.status || '').toUpperCase().trim();
    if (raw === 'DELETED') return 'DELETED';
    if (raw === 'VERIFIED' || raw === 'APPROVED' || raw === 'RELEASED' || raw === 'PRINTING') return 'VERIFIED';
    if (raw === 'SUBMITTED') return 'SUBMITTED';
    if (raw === 'SAVED' || raw === 'RECORDED') return 'SAVED';
    if (raw === 'CALCULATED_EDITED') return 'CALCULATED_EDITED';
    if (raw === 'CALCULATED') return 'CALCULATED';
    if (raw === 'RECEIVED_EDITED') return 'RECEIVED_EDITED';
    if (raw === 'RECEIVED') return 'RECEIVED';
    if (raw === 'SAMPLE') return 'SAMPLE';
    if (raw === 'ENTRY' || raw === 'TESTING' || raw === 'IN TESTING') return 'ENTRY';

    const val = current.resultData !== undefined ? current.resultData : report.resultData;
    if (val && String(val).trim() !== '' && String(val).trim() !== '-') {
      return 'SAVED';
    }
    return 'ENTRY';
  };

  // Initialize internal state for editable test values
  const [resultsState, setResultsState] = useState(() => {
    const initial = {};
    reports.forEach((r) => {
      initial[r.reportId] = {
        resultData: r.resultData || '',
        comment: r.comment || '',
        status: resolveStatus(r, {}),
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
            status: resolveStatus(r, {}),
          };
        } else {
          // If server status changed and user hasn't edited, update
          if (r.status && updated[r.reportId].status !== r.status) {
            updated[r.reportId].status = r.status;
          }
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

  // Automated / Manual Analyzer Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // UI Filters and Modals - DEFAULT TO 'table' for maximum compactness
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('ALL'); // ALL, ENTRY, SAMPLE, RECEIVED, RECEIVED_EDITED, CALCULATED, CALCULATED_EDITED, SAVED, SUBMITTED, VERIFIED, DELETED, ABNORMAL
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

  // Compute Live Numbers for All 10 Upstream LIS Statuses
  const phaseStats = useMemo(() => {
    const stats = {
      total: reports.length,
      ENTRY: 0,
      SAMPLE: 0,
      RECEIVED: 0,
      RECEIVED_EDITED: 0,
      CALCULATED: 0,
      CALCULATED_EDITED: 0,
      SAVED: 0,
      SUBMITTED: 0,
      VERIFIED: 0,
      DELETED: 0,
      abnormal: 0,
    };

    reports.forEach((r) => {
      const cur = resultsState[r.reportId] || {};
      const val = cur.resultData !== undefined ? cur.resultData : r.resultData;
      const status = resolveStatus(r, cur);

      if (stats[status] !== undefined) {
        stats[status]++;
      }

      const evalRes = evaluateResultValue(val, r.refRange, r.unit);
      if (evalRes.isAbnormal) stats.abnormal++;
    });

    return stats;
  }, [reports, resultsState]);

  // Filtered Reports list
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const cur = resultsState[r.reportId] || {};
      const val = cur.resultData !== undefined ? cur.resultData : r.resultData;
      const status = resolveStatus(r, cur);
      const isDeleted = status === 'DELETED';

      // 1. Search term match
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const testName = String(r.testName || '').toLowerCase();
        const dept = String(r.deptName || '').toLowerCase();
        const samp = String(r.sampleType || '').toLowerCase();
        if (!testName.includes(term) && !dept.includes(term) && !samp.includes(term)) {
          return false;
        }
        return true;
      }

      // 2. Status Filter match
      if (phaseFilter === 'ALL') return !isDeleted;
      if (phaseFilter === 'DELETED') return isDeleted;
      if (phaseFilter === 'ABNORMAL') {
        if (isDeleted) return false;
        const evalRes = evaluateResultValue(val, r.refRange, r.unit);
        return evalRes.isAbnormal;
      }

      // Legacy fallback support
      if (phaseFilter === 'PHASE_1') return status === 'SAMPLE';
      if (phaseFilter === 'PHASE_2') return status === 'SAMPLE';
      if (phaseFilter === 'PHASE_3') return status === 'ENTRY';
      if (phaseFilter === 'PHASE_4') return status === 'SAVED' || status === 'RECEIVED' || status === 'CALCULATED';
      if (phaseFilter === 'PHASE_5') return status === 'VERIFIED';

      // Exact match for all 10 statuses
      return status === phaseFilter;
    });
  }, [reports, resultsState, searchTerm, phaseFilter]);

  const handleInputChange = (reportId, field, val) => {
    setResultsState((prev) => {
      const cur = prev[reportId] || {};
      let nextStatus = cur.status;

      // Real-time status progression when technician edits analyzer or calculated reading
      if (field === 'resultData') {
        const rep = reports.find((r) => r.reportId === reportId);
        const origStatus = String(rep?.status || cur.status || '').toUpperCase().trim();
        if (origStatus === 'RECEIVED') {
          nextStatus = 'RECEIVED_EDITED';
        } else if (origStatus === 'CALCULATED') {
          nextStatus = 'CALCULATED_EDITED';
        }
      }

      return {
        ...prev,
        [reportId]: {
          ...cur,
          [field]: val,
          ...(nextStatus ? { status: nextStatus } : {}),
        },
      };
    });
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
        resultData: current.resultData !== undefined ? current.resultData : (report.resultData || ''),
        unit: report.unit,
        comment: current.comment !== undefined ? current.comment : (report.comment || ''),
        profileName: report.profileName || '',
        deptName: report.deptName || 'D1',
      });

      setSuccessMsg(`Test "${report.testName}" saved successfully.`);
      if (onRefresh) {
        const freshData = await onRefresh();
        if (freshData?.reports) {
          const fresh = {};
          freshData.reports.forEach((r) => {
            fresh[r.reportId] = {
              resultData: r.resultData || '',
              comment: r.comment || '',
              status: r.status || 'SAVED',
            };
          });
          setResultsState(fresh);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to update test result');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    // Only call for modified parameters, NOT all reports!
    const changedReports = reports.filter((r) => dirtyReportIds.includes(r.reportId));

    if (changedReports.length === 0) {
      setSuccessMsg('No unsaved parameter modifications.');
      return;
    }

    setSavingAll(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      for (const report of changedReports) {
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
          resultData: current.resultData !== undefined ? current.resultData : (report.resultData || ''),
          unit: report.unit,
          comment: current.comment !== undefined ? current.comment : (report.comment || ''),
          profileName: report.profileName || '',
          deptName: report.deptName || 'D1',
        });
      }

      setSuccessMsg(`Successfully saved ${changedReports.length} test ${changedReports.length === 1 ? 'parameter' : 'parameters'}! Synchronizing...`);

      // After saving, call GETPATIENTREPORT API for sync of data
      if (onRefresh) {
        const freshData = await onRefresh();
        if (freshData?.reports) {
          const fresh = {};
          freshData.reports.forEach((r) => {
            fresh[r.reportId] = {
              resultData: r.resultData || '',
              comment: r.comment || '',
              status: r.status || 'SAVED',
            };
          });
          setResultsState(fresh);
        }
      }
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
      const res = await api.post('/reports/calculate-result', {
        patientId: patient.patientId,
        reportId,
      });
      if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode === '1211') {
        setErrorMsg(res.data?.Message || 'This calculation is not available in the system');
      } else {
        setSuccessMsg(res.data?.Message || 'Result calculated successfully!');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to run automated formula calculation');
    }
  };

  const handleSetDefaultResult = async (reportId, resultVersion) => {
    try {
      // Optimistically update local input reading immediately
      const rep = reports.find((r) => r.reportId === reportId);
      const chosenVal = rep ? rep[`resultData${resultVersion}`] : null;
      if (chosenVal !== undefined && chosenVal !== null) {
        handleInputChange(reportId, 'resultData', chosenVal);
      }

      const res = await api.post('/reports/set-default-result', {
        patientId: patient.patientId,
        reportId,
        resultVersion,
      });
      if (res.data?.STATUS === 'FAILED') {
        setErrorMsg(res.data?.Message || 'Failed to set default result version');
      } else {
        setSuccessMsg(res.data?.Message || `Default result set to version ${resultVersion}`);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to set default result version');
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

  // Sync Analyzer implementation (Manual + Automated background polling)
  const handleSyncAnalyzer = async ({ silent = false } = {}) => {
    const targetPid = patient?.patientId || patient?.slNo;
    if (!targetPid) return;

    if (!silent) setIsSyncing(true);

    try {
      const res = await api.get('/reports/patient-report', {
        params: { patientId: targetPid, fresh: 'true' },
      });

      const serverReports = res.data?.reports || [];
      let newReadingsCount = 0;
      const updatedTestNames = [];

      setResultsState((prev) => {
        const next = { ...prev };

        serverReports.forEach((sr) => {
          const current = prev[sr.reportId];
          const isDirty = dirtyReportIds.includes(sr.reportId);

          if (!current) {
            next[sr.reportId] = {
              resultData: sr.resultData || '',
              comment: sr.comment || '',
              status: sr.status || 'SAVED',
            };
          } else if (!isDirty) {
            const hasNewValue = sr.resultData && sr.resultData !== current.resultData;
            const hasNewStatus = sr.status && sr.status !== current.status;

            if (hasNewValue || hasNewStatus) {
              if (hasNewValue) {
                newReadingsCount++;
                updatedTestNames.push(sr.testName);
              }
              next[sr.reportId] = {
                resultData: sr.resultData || '',
                comment: sr.comment || current.comment || '',
                status: sr.status || current.status || 'SAVED',
              };
            }
          }
        });

        return next;
      });

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(nowStr);

      if (onRefresh) {
        await onRefresh(true);
      }

      if (!silent) {
        if (newReadingsCount > 0) {
          setSuccessMsg(`Analyzer Sync Complete: Transmitted ${newReadingsCount} new test reading${newReadingsCount > 1 ? 's' : ''} (${updatedTestNames.slice(0, 3).join(', ')}${updatedTestNames.length > 3 ? '...' : ''}) at ${nowStr}`);
        } else {
          setSuccessMsg(`Analyzer Synchronized — All parameters up to date (${nowStr})`);
        }
      } else if (newReadingsCount > 0) {
        setSuccessMsg(`Analyzer machine transmitted reading${newReadingsCount > 1 ? 's' : ''} for: ${updatedTestNames.slice(0, 3).join(', ')}`);
      }
    } catch (err) {
      if (!silent) {
        setErrorMsg(err.response?.data?.Message || 'Failed to sync with analyzer machine');
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Automated background polling every 10 seconds (respects document visibility & pauses during active user typing saves)
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const intervalId = setInterval(() => {
      if (!document.hidden && !isSyncing && !savingAll) {
        handleSyncAnalyzer({ silent: true });
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [autoSyncEnabled, isSyncing, savingAll, patient?.patientId, dirtyReportIds.length]);

  // Individual Report Delete Handler
  const handleDeleteReport = async (report) => {
    if (!report?.reportId) return;
    const targetPid = patient?.patientId || patient?.slNo;
    setDeletingId(report.reportId);
    setErrorMsg('');

    try {
      await api.post('/reports/delete', {
        patientId: targetPid,
        reportId: report.reportId,
      });

      setResultsState((prev) => ({
        ...prev,
        [report.reportId]: {
          ...(prev[report.reportId] || {}),
          status: 'DELETED',
        },
      }));

      setSuccessMsg(`Test parameter "${report.testName}" marked as DELETED. You can restore it anytime.`);
      if (onRefresh) await onRefresh(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to delete test parameter');
    } finally {
      setDeletingId(null);
    }
  };

  // Individual Report Restore Handler
  const handleRestoreReport = async (report) => {
    if (!report?.reportId) return;
    const targetPid = patient?.patientId || patient?.slNo;
    setDeletingId(report.reportId);
    setErrorMsg('');

    try {
      await api.post('/reports/restore', {
        patientId: targetPid,
        reportId: report.reportId,
      });

      setResultsState((prev) => ({
        ...prev,
        [report.reportId]: {
          ...(prev[report.reportId] || {}),
          status: 'SAVED',
        },
      }));

      setSuccessMsg(`Test parameter "${report.testName}" restored successfully!`);
      if (onRefresh) await onRefresh(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to restore test parameter');
    } finally {
      setDeletingId(null);
    }
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

          {/* Manual Analyzer Sync */}
          <button
            type="button"
            onClick={() => handleSyncAnalyzer({ silent: false })}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title={lastSyncedTime ? `Manual sync with lab analyzer (Last synced: ${lastSyncedTime})` : 'Sync results from analyzer machine'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-700 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Analyzer'}</span>
          </button>

          {/* Automated Sync Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextState = !autoSyncEnabled;
              setAutoSyncEnabled(nextState);
              if (nextState) {
                setSuccessMsg('Automated analyzer sync activated (polling every 10s)');
                handleSyncAnalyzer({ silent: true });
              } else {
                setSuccessMsg('Automated analyzer sync paused');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              autoSyncEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                : 'bg-slate-100 text-slate-500 border-slate-300'
            }`}
            title={autoSyncEnabled ? `Auto-sync active (every 10s)${lastSyncedTime ? ` • Last: ${lastSyncedTime}` : ''} — click to pause` : 'Auto-sync paused — click to activate'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="hidden sm:inline">{autoSyncEnabled ? 'Auto-Sync (10s)' : 'Auto-Sync: Off'}</span>
          </button>

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

          {/* Official AWS Report PDF Button */}
          <button
            type="button"
            onClick={() => {
              const rawPid = patient?.patientId || patient?.slNo;
              const cleanPid = rawPid
                ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
                : '';
              const targetUrl = patient?.printPDFUrl || patient?.reportUrl;
              if (targetUrl) {
                window.open(targetUrl, '_blank');
              } else {
                window.open(`/api/reports/pdf?patientId=${cleanPid || rawPid}&addHeader=true`, '_blank');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Download / Print official AWS Diagnostic Report PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>AWS Report PDF</span>
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

      {/* 2. Official Upstream LIS Status Filters (Live Numbers) */}
      <ResultsPhaseTracker
        phaseStats={phaseStats}
        activePhaseFilter={phaseFilter}
        onSelectPhaseFilter={setPhaseFilter}
      />

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
          deletingId={deletingId}
          onInputChange={handleInputChange}
          onSaveSingle={saveSingleReport}
          onCalculate={handleCalculate}
          onSetDefaultResult={handleSetDefaultResult}
          onOpenGuide={openClinicalGuide}
          onReceiveSample={handleReceiveSample}
          onDeleteReport={handleDeleteReport}
          onRestoreReport={handleRestoreReport}
        />
      ) : (
        <ResultsCardView
          reports={filteredReports}
          resultsState={resultsState}
          patient={patient}
          savingId={savingId}
          deletingId={deletingId}
          onInputChange={handleInputChange}
          onSaveSingle={saveSingleReport}
          onCalculate={handleCalculate}
          onSetDefaultResult={handleSetDefaultResult}
          onOpenGuide={openClinicalGuide}
          onReceiveSample={handleReceiveSample}
          onDeleteReport={handleDeleteReport}
          onRestoreReport={handleRestoreReport}
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
