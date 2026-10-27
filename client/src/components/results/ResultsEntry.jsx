import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown,
  ChevronUp,
  Loader2,
  Upload,
  Send,
  MessageSquare,
  TestTube,
} from 'lucide-react';

import api from '../../services/api';
import ResultsPhaseTracker from './ResultsPhaseTracker.jsx';
import ResultsTableView from './ResultsTableView.jsx';
import ResultsCardView from './ResultsCardView.jsx';
import ClinicalGuideModal from '../common/ClinicalGuideModal.jsx';
import DoctorApprovalModal from './DoctorApprovalModal.jsx';
import EditIndividualReportModal from './EditIndividualReportModal.jsx';
import ConfirmationModal from '../common/ConfirmationModal.jsx';
import {
  getTestPhaseInfo,
  evaluateResultValue,
  getDefaultHealthyValue,
  getSpecimenTubeInfo,
  getTestOperationPermissions,
} from '../../utils/labTestUtils.js';
import { useMaster } from '../../context/context.master.jsx';

const formatGender = (raw) => {
  const s = String(raw || '').trim().toLowerCase();
  if (s.startsWith('m')) return 'Male';
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('t') || s.startsWith('o')) return 'Transgender';
  return raw || '-';
};

export default function ResultsEntry({
  patient = {},
  reports = [],
  templates = [],
  onRefresh,
}) {
  const { tests: masterTests = [] } = useMaster();
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

  // Retain previously loaded reports so rate-limit / network hiccups NEVER wipe the UI!
  const persistedReportsRef = useRef(reports);
  useEffect(() => {
    if (reports && reports.length > 0) {
      persistedReportsRef.current = reports;
    }
  }, [reports]);

  const activeReports = useMemo(() => {
    if (reports && reports.length > 0) return reports;
    if (persistedReportsRef.current && persistedReportsRef.current.length > 0) return persistedReportsRef.current;
    return reports || [];
  }, [reports]);

  // Rate-limiting (8887) and sync cooldown state
  const [rateLimitWarning, setRateLimitWarning] = useState(null);
  const [rateLimitCooldownSec, setRateLimitCooldownSec] = useState(0);
  const cooldownTimerRef = useRef(null);
  const cooldownUntilRef = useRef(0);

  const triggerRateLimitCooldown = (msg = 'Exceeded per minute limit for this operation - 8887') => {
    setRateLimitWarning(msg);
    setSuccessMsg(''); // NEVER show green synced banner on rate limit!
    const cooldownDuration = 45; // 45s backoff
    cooldownUntilRef.current = Date.now() + cooldownDuration * 1000;
    setRateLimitCooldownSec(cooldownDuration);

    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntilRef.current - Date.now()) / 1000));
      setRateLimitCooldownSec(remaining);
      if (remaining <= 0) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // Initialize internal state for editable test values
  const [resultsState, setResultsState] = useState(() => {
    const initial = {};
    activeReports.forEach((r) => {
      initial[r.reportId] = {
        resultData: r.resultData || '',
        comment: r.comment || '',
        status: resolveStatus(r, {}),
      };
    });
    return initial;
  });

  // Synchronize when reports update
  useEffect(() => {
    setResultsState((prev) => {
      const updated = { ...prev };
      activeReports.forEach((r) => {
        if (!updated[r.reportId]) {
          updated[r.reportId] = {
            resultData: r.resultData || '',
            comment: r.comment || '',
            status: resolveStatus(r, {}),
          };
        } else {
          // If server status changed and user hasn't edited, update
          if (r.status && updated[r.reportId].status !== r.status) {
            if (updated[r.reportId].status === 'DELETED' && r.status !== 'DELETED') {
              // Retain local soft-delete until server or restore update
            } else {
              updated[r.reportId].status = r.status;
            }
          }
          if (updated[r.reportId].resultData === '' && r.resultData) {
            updated[r.reportId].resultData = r.resultData;
          }
        }
      });
      return updated;
    });
  }, [activeReports]);

  const [savingId, setSavingId] = useState(null);
  const [calculatingId, setCalculatingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [receivingAll, setReceivingAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Automated / Manual Analyzer Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // UI Filters and Modals - DEFAULT TO 'table' for maximum compactness
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('ALL'); // ALL, ENTRY, SAMPLE, RECEIVED, RECEIVED_EDITED, CALCULATED, CALCULATED_EDITED, SAVED, SUBMITTED, VERIFIED, DELETED, ABNORMAL
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [guideSearchTerm, setGuideSearchTerm] = useState('');
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [showDeletedSection, setShowDeletedSection] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    description: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
    icon: null,
    onConfirm: null,
  });

  // List of all deleted reports
  const deletedReports = useMemo(() => {
    return activeReports.filter((r) => {
      const cur = resultsState[r.reportId] || {};
      const status = resolveStatus(r, cur);
      return status === 'DELETED';
    });
  }, [activeReports, resultsState]);

  // Compute Unsaved Modifications
  const dirtyReportIds = useMemo(() => {
    return activeReports
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
  }, [activeReports, resultsState]);

  // Compute Live Numbers for All 10 Upstream LIS Statuses
  const phaseStats = useMemo(() => {
    const stats = {
      total: activeReports.length,
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

    activeReports.forEach((r) => {
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
  }, [activeReports, resultsState]);

  // Filtered Reports list
  const filteredReports = useMemo(() => {
    return activeReports.filter((r) => {
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
        const perms = getTestOperationPermissions(r, masterTests);
        if (!perms.possibleEntry) return; // Skip tests where result entry is disabled
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
    if (calculatingId) return; // Prevent double click
    setCalculatingId(reportId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. If any component test inputs have been modified, save them first
      // so upstream CALCULATERESULT has the latest parameters in database
      const dirtyToSave = reports.filter(
        (r) => dirtyReportIds.includes(r.reportId) && r.reportId !== reportId
      );
      if (dirtyToSave.length > 0) {
        for (const report of dirtyToSave) {
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
      }

      // 2. Execute calculation
      const res = await api.post('/reports/calculate-result', {
        patientId: patient.patientId,
        reportId,
      });

      if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode === '1211') {
        setErrorMsg(res.data?.Message || 'This calculation is not available in the system');
      } else {
        setSuccessMsg(res.data?.Message || 'Result calculated successfully!');
        // 3. Immediately refresh and update React state so the newly calculated result appears on the first click
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
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to run automated formula calculation');
    } finally {
      setCalculatingId(null);
    }
  };

  const handleSetDefaultResult = async (reportId, resultVersion) => {
    try {
      // Optimistically update local input reading immediately
      const rep = (reports || []).find((r) => r.reportId === reportId);
      const chosenVal = rep ? rep[`resultData${resultVersion}`] : null;
      if (chosenVal !== undefined && chosenVal !== null) {
        handleInputChange(reportId, 'resultData', chosenVal);
      }

      const res = await api.post('/reports/set-default-result', {
        patientId: patient?.patientId || rep?.patientId,
        reportId,
        resultVersion,
        resultData: chosenVal,
      });

      if (res.data?.STATUS === 'FAILED') {
        setErrorMsg(res.data?.Message || 'Failed to set default result version');
      } else {
        setSuccessMsg(res.data?.Message || `Default result set to version v${resultVersion} (${chosenVal})`);
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
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || 'Failed to set default result version');
    }
  };


  const handleReceiveSample = (report) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Receive Sample Specimen',
      message: `Confirm accession of sample specimen for "${report?.testName || 'diagnostic test'}"?`,
      description: 'This operation will mark the test specimen as received at the accession bench and update upstream tracking (RECEIVESAMPLE).',
      confirmText: 'Receive Sample',
      variant: 'indigo',
      icon: TestTube,
      onConfirm: async () => {
        try {
          await api.post('/reports/receive-sample', {
            patientId: patient.patientId,
          });
          setSuccessMsg(`Sample accessioned successfully!`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (onRefresh) onRefresh();
        } catch (err) {
          setErrorMsg('Failed to receive sample');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleReceiveAllSamples = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Receive All Pending Samples',
      message: `Confirm receipt of all ordered sample specimens for ${patient.name || 'Patient'}?`,
      description: 'All pending specimen tubes will be accessioned and verified in the lab intake queue (RECEIVESAMPLE).',
      confirmText: 'Receive All Samples',
      variant: 'indigo',
      icon: TestTube,
      onConfirm: async () => {
        setReceivingAll(true);
        try {
          await api.post('/reports/receive-sample', {
            patientId: patient.patientId,
          });
          setSuccessMsg('All pending samples marked received in accession desk!');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (onRefresh) onRefresh();
        } catch (err) {
          setErrorMsg('Failed to receive all samples');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setReceivingAll(false);
        }
      },
    });
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

      // Check if upstream returned rate-limit error 8887 or failed operation
      const isRateLimited =
        res.data?.StatusCode === '8887' ||
        res.data?.rateLimited ||
        String(res.data?.Message || '').includes('8887') ||
        String(res.data?.Message || '').toLowerCase().includes('exceeded per minute limit') ||
        String(res.data?.warningMessage || '').includes('8887');

      if (isRateLimited) {
        const errorMsgText =
          res.data?.Message ||
          res.data?.warningMessage ||
          'Exceeded per minute limit for this operation - 8887';
        triggerRateLimitCooldown(errorMsgText);
        if (!silent) {
          setErrorMsg(`Rate Limit (8887): ${errorMsgText}. Existing test readings and parameters are preserved intact.`);
        }
        return;
      }

      // Sync succeeded! Clear any previous rate-limit warning
      setRateLimitWarning(null);

      const serverReports = res.data?.reports || [];
      let newReadingsCount = 0;
      const updatedTestNames = [];

      if (serverReports.length > 0) {
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

        if (onRefresh) {
          await onRefresh(true);
        }
      }

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(nowStr);

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
      const errData = err.response?.data;
      const isRateLimited =
        errData?.StatusCode === '8887' ||
        errData?.rateLimited ||
        String(errData?.Message || '').includes('8887') ||
        String(errData?.Message || '').toLowerCase().includes('exceeded per minute limit');

      if (isRateLimited) {
        const msg = errData?.Message || 'Exceeded per minute limit for this operation - 8887';
        triggerRateLimitCooldown(msg);
        if (!silent) {
          setErrorMsg(`Rate Limit (8887): ${msg}. Existing test readings and parameters are preserved intact.`);
        }
      } else if (!silent) {
        setErrorMsg(err.response?.data?.Message || 'Failed to sync with analyzer machine');
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Automated background polling every 25 seconds (respects cooldown, visibility & pauses during active typing)
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const intervalId = setInterval(() => {
      if (!document.hidden && !isSyncing && !savingAll) {
        if (Date.now() < cooldownUntilRef.current) {
          return; // Skip poll while in rate-limit cooldown
        }
        handleSyncAnalyzer({ silent: true });
      }
    }, 25000);

    return () => clearInterval(intervalId);
  }, [autoSyncEnabled, isSyncing, savingAll, patient?.patientId, dirtyReportIds.length]);

  // Individual Report Delete Handler
  const handleDeleteReport = (report) => {
    if (!report?.reportId) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Test Parameter',
      message: `Are you sure you want to delete test "${report.testName}"?`,
      description: 'The parameter will be removed from this patient\'s active worklist. You can restore it anytime from the Deleted Tests section below.',
      confirmText: 'Delete Parameter',
      variant: 'danger',
      icon: Trash2,
      onConfirm: async () => {
        const targetPid = patient?.patientId || patient?.slNo;
        setDeletingId(report.reportId);
        setErrorMsg('');

        try {
          const res = await api.post('/reports/delete', {
            patientId: targetPid,
            reportId: report.reportId,
            testName: report.testName,
            profileName: report.profileName || '',
            deptName: report.deptName || '',
            sampleId: report.sampleId || '',
            rate: report.rate || '',
            sampletype: report.sampleType || '',
            reportType: 1,
          });

          if (res.data?.STATUS === 'FAILED') {
            throw new Error(res.data?.Message || 'Failed to delete test parameter');
          }

          setResultsState((prev) => ({
            ...prev,
            [report.reportId]: {
              ...(prev[report.reportId] || {}),
              status: 'DELETED',
            },
          }));

          setShowDeletedSection(true);
          setSuccessMsg(`Test parameter "${report.testName}" marked as DELETED. You can restore it anytime from the Deleted Tests section below.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (onRefresh) await onRefresh(true);
        } catch (err) {
          setErrorMsg(err.response?.data?.Message || err.message || 'Failed to delete test parameter');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // Individual Report Restore Handler
  const handleRestoreReport = async (report) => {
    if (!report?.reportId) return;
    const targetPid = patient?.patientId || patient?.slNo;
    setDeletingId(report.reportId);
    setErrorMsg('');

    try {
      const res = await api.post('/reports/restore', {
        patientId: targetPid,
        reportId: report.reportId,
        testName: report.testName,
        profileName: report.profileName || '',
        deptName: report.deptName || '',
        sampleId: report.sampleId || '',
        rate: report.rate || '',
        sampletype: report.sampleType || '',
        reportType: 1,
      });

      if (res.data?.STATUS === 'FAILED') {
        throw new Error(res.data?.Message || 'Failed to restore test parameter');
      }

      setResultsState((prev) => ({
        ...prev,
        [report.reportId]: {
          ...(prev[report.reportId] || {}),
          status: 'ENTRY',
        },
      }));

      setSuccessMsg(`Test parameter "${report.testName}" restored successfully back to worklist!`);
      if (onRefresh) await onRefresh(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || err.message || 'Failed to restore test parameter');
    } finally {
      setDeletingId(null);
    }
  };

  // Individual Report Upload Order Handler (UPLOADORDER)
  const handleUploadOrder = (report) => {
    if (!report?.reportId) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Upload Order to Analyzer',
      message: `Upload test order for "${report.testName}" (Report #${report.reportId}) to analyzer equipment?`,
      description: 'This will transmit the test requisition and barcode ID directly to the interfacing clinical analyzer (UPLOADORDER).',
      confirmText: 'Upload Order',
      variant: 'indigo',
      icon: Upload,
      onConfirm: async () => {
        const targetPid = patient?.patientId || patient?.slNo;
        setUploadingId(report.reportId);
        setErrorMsg('');

        try {
          const res = await api.post('/reports/upload-order', {
            patientId: targetPid,
            reportId: report.reportId,
            reportType: 1,
          });

          if (res.data?.STATUS === 'FAILED') {
            throw new Error(res.data?.Message || 'Failed to upload order to analyzer equipment');
          }

          setSuccessMsg(`Work order for "${report.testName}" uploaded to analyzer equipment successfully!`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (onRefresh) await onRefresh(true);
        } catch (err) {
          setErrorMsg(err.response?.data?.Message || err.message || 'Failed to upload order to analyzer equipment');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setUploadingId(null);
        }
      },
    });
  };

  // Release Report Handler (RELEASEREPORT)
  const handleReleaseReport = () => {
    const rawPid = patient?.patientId || patient?.slNo;
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';

    setConfirmDialog({
      isOpen: true,
      title: 'Release Diagnostic Report',
      message: `Are you sure you want to release the diagnostic report for ${patient?.name || 'Patient'} (${cleanPid || rawPid})?`,
      description: 'Releasing will mark the report as finalized, making it ready for patient delivery, portal access, and official printing (RELEASEREPORT).',
      confirmText: 'Release Report',
      variant: 'teal',
      icon: Send,
      onConfirm: async () => {
        setErrorMsg('');
        setSuccessMsg('');
        try {
          const res = await api.post('/reports/release', { patientId: cleanPid || rawPid });
          if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode === '1211') {
            throw new Error(res.data?.Message || 'Failed to release report (1211)');
          }
          setSuccessMsg(res.data?.Message || 'Diagnostic report released successfully!');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (onRefresh) await onRefresh(true);
        } catch (err) {
          setErrorMsg(err.response?.data?.Message || err.message || 'Failed to release report');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // WhatsApp Send / Resend Handler (SENDWHATSAPP)
  const handleSendWhatsApp = () => {
    const rawPid = patient?.patientId || patient?.slNo;
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';
    const phone = patient?.mobile || patient?.phone || '';

    setConfirmDialog({
      isOpen: true,
      title: 'Send Report via WhatsApp',
      message: `Send diagnostic report PDF via WhatsApp to ${patient?.name || 'Patient'}${phone ? ` (${phone})` : ''}?`,
      description: 'An automated WhatsApp notification and PDF download link will be dispatched to the registered mobile number (SENDWHATSAPP).',
      confirmText: 'Send WhatsApp',
      variant: 'whatsapp',
      icon: MessageSquare,
      onConfirm: async () => {
        setErrorMsg('');
        setSuccessMsg('');
        try {
          const res = await api.post('/reports/send-whatsapp', { patientId: cleanPid || rawPid });
          if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode === '1211') {
            throw new Error(res.data?.Message || 'Failed to send report via WhatsApp (1211)');
          }
          setSuccessMsg(res.data?.Message || 'Diagnostic report dispatched to WhatsApp successfully!');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (onRefresh) await onRefresh(true);
        } catch (err) {
          setErrorMsg(err.response?.data?.Message || err.message || 'Failed to send report via WhatsApp');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Individual Report Download Result Handler (DOWNLOADRESULT)
  const handleDownloadResult = async (report) => {
    if (!report?.reportId) return;
    const targetPid = patient?.patientId || patient?.slNo;
    setDownloadingId(report.reportId);
    setErrorMsg('');

    try {
      const res = await api.post('/reports/download-result', {
        patientId: targetPid,
        reportId: report.reportId,
        reportType: 1,
      });

      if (res.data?.STATUS === 'FAILED') {
        throw new Error(res.data?.Message || 'Failed to download reading from analyzer');
      }

      setSuccessMsg(`Result for "${report.testName}" downloaded from analyzer equipment successfully!`);
      if (onRefresh) await onRefresh(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || err.message || 'Failed to download reading from analyzer');
    } finally {
      setDownloadingId(null);
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

          <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.2 rounded-md">
            Barcode: #{patient.slNo || patient.barcode || '-'}
          </span>

          <span className="text-xs font-semibold text-slate-800">
            {patient.name} ({formatGender(patient.gender)} / {patient.age || '-'}Y)
          </span>

          <span className="text-slate-400 hidden sm:inline">•</span>

          <span className="text-slate-500 text-[11px] hidden md:inline">
            Ref: <strong className="text-slate-700">{patient.referedDr || 'Self'}</strong>
          </span>

          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.2 rounded-full">
            {activeReports.length} Tests
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
                setSuccessMsg('Automated analyzer sync activated (polling every 25s)');
                handleSyncAnalyzer({ silent: true });
              } else {
                setSuccessMsg('Automated analyzer sync paused');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              rateLimitCooldownSec > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                : autoSyncEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                : 'bg-slate-100 text-slate-500 border-slate-300'
            }`}
            title={
              rateLimitCooldownSec > 0
                ? `Rate limit active: cooldown in progress (${rateLimitCooldownSec}s remaining)`
                : autoSyncEnabled
                ? `Auto-sync active (every 25s)${lastSyncedTime ? ` • Last: ${lastSyncedTime}` : ''} — click to pause`
                : 'Auto-sync paused — click to activate'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                rateLimitCooldownSec > 0
                  ? 'bg-amber-500 animate-pulse'
                  : autoSyncEnabled
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className="hidden sm:inline">
              {rateLimitCooldownSec > 0
                ? `Cooldown (${rateLimitCooldownSec}s)`
                : autoSyncEnabled
                ? 'Auto-Sync (25s)'
                : 'Auto-Sync: Off'}
            </span>
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

          {/* Receive Pending Samples Button with Confirmation */}
          <button
            type="button"
            onClick={handleReceiveAllSamples}
            disabled={receivingAll}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Receive and accession all pending specimen tubes for this patient (RECEIVESAMPLE)"
          >
            <TestTube className={`w-3.5 h-3.5 ${receivingAll ? 'animate-spin' : ''}`} />
            <span>{receivingAll ? 'Receiving...' : 'Receive Samples'}</span>
          </button>

          {/* Release Report Button with Confirmation */}
          <button
            type="button"
            onClick={handleReleaseReport}
            className="flex items-center gap-1.5 px-3 py-1 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Release finalized diagnostic report for collection & printing (RELEASEREPORT)"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Release Report</span>
          </button>

          {/* WhatsApp Resend Button with Confirmation */}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Dispatch report directly to patient WhatsApp (SENDWHATSAPP)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Resend</span>
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
      {/* Rate-Limit Alert Banner when Upstream returns 8887 */}
      {rateLimitWarning && (
        <div className="py-2.5 px-3.5 bg-amber-50/95 border border-amber-300 text-amber-900 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold flex items-center gap-1.5 text-slate-900">
                <span>Operation Rate Limit (Code 8887)</span>
                {rateLimitCooldownSec > 0 && (
                  <span className="bg-amber-200/90 text-amber-900 px-1.5 py-0.2 rounded font-mono text-[10px] font-bold">
                    Cooldown: {rateLimitCooldownSec}s
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800">
                {rateLimitWarning}. All existing patient test parameters, entered readings, and statuses remain preserved intact.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={rateLimitCooldownSec > 0 || isSyncing}
              onClick={() => handleSyncAnalyzer({ silent: false })}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              {isSyncing ? 'Syncing...' : 'Retry Now'}
            </button>
            <button
              type="button"
              onClick={() => setRateLimitWarning(null)}
              className="text-amber-700 hover:text-amber-900 font-bold p-1 cursor-pointer text-sm"
              title="Dismiss warning"
            >
              &times;
            </button>
          </div>
        </div>
      )}

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
          masterTests={masterTests}
          savingId={savingId}
          calculatingId={calculatingId}
          deletingId={deletingId}
          uploadingId={uploadingId}
          downloadingId={downloadingId}
          onInputChange={handleInputChange}
          onSaveSingle={saveSingleReport}
          onCalculate={handleCalculate}
          onSetDefaultResult={handleSetDefaultResult}
          onOpenGuide={openClinicalGuide}
          onReceiveSample={handleReceiveSample}
          onDeleteReport={handleDeleteReport}
          onRestoreReport={handleRestoreReport}
          onUploadOrder={handleUploadOrder}
          onDownloadResult={handleDownloadResult}
          onOpenEditReport={(rep) => setEditingReport(rep)}
        />
      ) : (
        <ResultsCardView
          reports={filteredReports}
          resultsState={resultsState}
          patient={patient}
          masterTests={masterTests}
          savingId={savingId}
          calculatingId={calculatingId}
          deletingId={deletingId}
          uploadingId={uploadingId}
          downloadingId={downloadingId}
          onInputChange={handleInputChange}
          onSaveSingle={saveSingleReport}
          onCalculate={handleCalculate}
          onSetDefaultResult={handleSetDefaultResult}
          onOpenGuide={openClinicalGuide}
          onReceiveSample={handleReceiveSample}
          onDeleteReport={handleDeleteReport}
          onRestoreReport={handleRestoreReport}
          onUploadOrder={handleUploadOrder}
          onDownloadResult={handleDownloadResult}
          onOpenEditReport={(rep) => setEditingReport(rep)}
        />
      )}

      {/* 4b. Dedicated Deleted Tests Section */}
      {phaseFilter !== 'DELETED' && deletedReports.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-2xs overflow-hidden mt-4">
          <div
            onClick={() => setShowDeletedSection((prev) => !prev)}
            className="px-4 py-3 bg-rose-50/70 border-b border-rose-200/70 flex items-center justify-between cursor-pointer hover:bg-rose-100/60 transition-colors select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-rose-950">
                    Deleted Tests ({deletedReports.length})
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800">
                    Excluded from Final Report
                  </span>
                </div>
                <p className="text-[11px] text-rose-700/80">
                  These test parameters were removed from reporting. You can restore any test back to the active list anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-rose-700">
                {showDeletedSection ? 'Hide' : 'Show & Restore'}
              </span>
              {showDeletedSection ? (
                <ChevronUp className="w-4 h-4 text-rose-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-rose-600" />
              )}
            </div>
          </div>

          {showDeletedSection && (
            <div className="p-2 sm:p-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                    <th className="py-2 px-3 w-12">#</th>
                    <th className="py-2 px-3">Test Parameter Name</th>
                    <th className="py-2 px-3 hidden sm:table-cell">Specimen Tube</th>
                    <th className="py-2 px-3 hidden md:table-cell">Reference Range</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedReports.map((report, idx) => {
                    const tube = getSpecimenTubeInfo(report.sampleType, report.testName);
                    const isDeleting = deletingId === report.reportId;

                    return (
                      <tr key={report.reportId} className="hover:bg-rose-50/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-700 line-through">
                            {report.testName}
                          </div>
                          {report.profileName && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              Panel: {report.profileName}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{tube.icon}</span>
                            <span className="text-slate-600 font-medium text-[11px]">{tube.tubeName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 hidden md:table-cell text-slate-500 font-mono text-[11px]">
                          {report.refRange || 'Standard'} {report.unit || ''}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRestoreReport(report)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                            title="Restore this test parameter back to active worklist"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>Restore</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

      {/* 7. Individual Report / Test Parameter Edit Modal */}
      {editingReport && (
        <EditIndividualReportModal
          isOpen={!!editingReport}
          onClose={() => setEditingReport(null)}
          report={{
            ...editingReport,
            resultData: resultsState[editingReport.reportId]?.resultData !== undefined
              ? resultsState[editingReport.reportId].resultData
              : editingReport.resultData,
            comment: resultsState[editingReport.reportId]?.comment !== undefined
              ? resultsState[editingReport.reportId].comment
              : editingReport.comment,
          }}
          patient={patient}
          onSaveSuccess={async (updatedReport) => {
            setSuccessMsg(`Test parameter "${updatedReport.testName || editingReport.testName}" updated successfully!`);
            setEditingReport(null);
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
          }}
        />
      )}

      {/* Universal Side-Effect Operations Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        icon={confirmDialog.icon}
      />
    </div>
  );
}
