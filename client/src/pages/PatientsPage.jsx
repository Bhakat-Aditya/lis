import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { usePatientContext } from '../context/context.patient.jsx';
import {
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Check,
  RefreshCw,
  Plus,
  Printer,
  Download,
  ExternalLink,
  FlaskConical,
  Filter,
  Edit,
  Package,
  Layers,
  ListTree,
} from 'lucide-react';

import { useMaster } from '../context/context.master.jsx';
import { groupInvestigationsIntoLots } from '../utils/labTestUtils.js';

import {
  getLocalDateString,
  getYesterdayDateString,
  shiftDateDays,
  formatDisplayDate,
  formatPatientDateTime,
  getPatientTime,
  getSampleTimeDisplay,
  sortPatientsByRecent,
} from '../utils/dateUtils.js';
import BillPreviewModal from '../components/billing/BillPreviewModal.jsx';
import PatientEditModal from '../components/patient/PatientEditModal.jsx';

// Upstream LIS Payment Constants
export const PAYMENT_STATUS_CODE_NOBILL = 1;
export const PAYMENT_STATUS_CODE_PAID = 2;
export const PAYMENT_STATUS_CODE_UNPAID = 3;

// Official Upstream Patient Directory Status Constants (Strictly these 6 only)
export const STATUS_ENTRY = 'ENTRY';
export const STATUS_SAMPLE = 'SAMPLE';
export const STATUS_DATA_PART = 'RESULT PARTLY';
export const STATUS_DATA_FULL = 'RESULT FULLY';
export const STATUS_REPORT_PRINT = 'PRINTING';
export const STATUS_REPORT_RELEASED = 'RELEASED';

/**
 * Strictly normalizes any raw patient status string into one of the 6 official statuses.
 */
export const normalizePatientStatus = (rawStatus) => {
  const s = String(rawStatus || '').toUpperCase().trim();
  if (s === 'SAMPLE' || s.includes('SAMPLE')) return STATUS_SAMPLE;
  if (s === 'RESULT PARTLY' || s === 'DATA_PART' || s.includes('PART')) return STATUS_DATA_PART;
  if (s === 'RESULT FULLY' || s === 'DATA_FULL' || s.includes('FULL')) return STATUS_DATA_FULL;
  if (s === 'PRINTING' || s === 'PRINT' || s.includes('PRINT')) return STATUS_REPORT_PRINT;
  if (s === 'RELEASED' || s === 'RELEASE' || s === 'READY' || s.includes('RELEASE')) return STATUS_REPORT_RELEASED;
  return STATUS_ENTRY;
};

export const PATIENT_STATUS_CONFIGS = [
  { key: 'ALL', label: 'ALL', color: 'slate' },
  { key: STATUS_ENTRY, label: 'ENTRY', color: 'rose' },
  { key: STATUS_SAMPLE, label: 'SAMPLE', color: 'amber' },
  { key: STATUS_DATA_PART, label: 'RESULT PARTLY', color: 'sky' },
  { key: STATUS_DATA_FULL, label: 'RESULT FULLY', color: 'purple' },
  { key: STATUS_REPORT_PRINT, label: 'PRINTING', color: 'teal' },
  { key: STATUS_REPORT_RELEASED, label: 'RELEASED', color: 'emerald' },
];

/**
 * Render Status pill badge matching upstream LIS statuses & aesthetic strictly using official labels
 */
const renderPatientStatus = (status) => {
  const s = normalizePatientStatus(status);
  switch (s) {
    case STATUS_ENTRY:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f43f5e] text-white whitespace-nowrap shadow-2xs">
          <User className="w-3 h-3" />
          <span>ENTRY</span>
        </span>
      );
    case STATUS_SAMPLE:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white whitespace-nowrap shadow-2xs">
          <FlaskConical className="w-3 h-3" />
          <span>SAMPLE</span>
        </span>
      );
    case STATUS_DATA_PART:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white whitespace-nowrap shadow-2xs">
          <FileText className="w-3 h-3" />
          <span>RESULT PARTLY</span>
        </span>
      );
    case STATUS_DATA_FULL:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white whitespace-nowrap shadow-2xs">
          <FileCheck className="w-3 h-3" />
          <span>RESULT FULLY</span>
        </span>
      );
    case STATUS_REPORT_PRINT:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white whitespace-nowrap shadow-2xs">
          <Printer className="w-3 h-3" />
          <span>PRINTING</span>
        </span>
      );
    case STATUS_REPORT_RELEASED:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981] text-white whitespace-nowrap shadow-2xs">
          <Check className="w-3 h-3" />
          <span>RELEASED</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f43f5e] text-white whitespace-nowrap shadow-2xs">
          <User className="w-3 h-3" />
          <span>ENTRY</span>
        </span>
      );
  }
};

export default function PatientsPage({ onOpenNewPatient, onPatientsLoaded, refreshTrigger }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActivePatient } = usePatientContext();

  const urlSearch = searchParams.get('search') || '';
  const todayStr = getLocalDateString();
  const yesterdayStr = shiftDateDays(todayStr, -1);
  const past7DaysStr = shiftDateDays(todayStr, -7);

  // Task - 9: Default fetching is TODAY, with presets: Yesterday, Last 7 Days, and Custom (From-To)
  const [dateMode, setDateMode] = useState('today');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [previewBillPatient, setPreviewBillPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [latestFoundDate, setLatestFoundDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [loadingRowPid, setLoadingRowPid] = useState(null);
  const [rowDetails, setRowDetails] = useState({});
  const rowDetailsRef = useRef({});
  const fetchAbortRef = useRef(null);

  // Master catalog investigations for grouping into packages & groups
  const { profiles = [], packages = [], tests = [] } = useMaster();
  const [expandedLotsMap, setExpandedLotsMap] = useState({});
  const [lotsViewMode, setLotsViewMode] = useState({}); // pid -> 'grouped' | 'flat'

  // Sync state if URL query param changes
  useEffect(() => {
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

  const fetchPatients = async () => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setLoading(true);
    try {
      const params = {
        fromDate,
        toDate,
      };
      if (searchTerm) {
        params.search = searchTerm.trim();
      }

      const res = await api.get('/patients/list', {
        params,
        signal: controller.signal,
      });
      const list = res.data?.patients || [];
      if (res.data?.latestDate) {
        setLatestFoundDate(res.data.latestDate);
      }

      if (res.data && Array.isArray(res.data.patients)) {
        const sorted = sortPatientsByRecent(res.data.patients);
        setPatients(sorted);
        if (onPatientsLoaded) onPatientsLoaded(sorted);
      } else {
        setPatients([]);
        if (onPatientsLoaded) onPatientsLoaded([]);
      }

      // Only fetch details for expanded row if not already cached
      if (expandedRowId && !rowDetailsRef.current[expandedRowId]) {
        fetchRowDetails(expandedRowId);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || err.name === 'AbortError') {
        return;
      }
      console.warn('Error fetching patients:', err.message);
      setPatients([]);
      if (onPatientsLoaded) onPatientsLoaded([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    if (mode === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (mode === 'yesterday') {
      setFromDate(yesterdayStr);
      setToDate(yesterdayStr);
    } else if (mode === 'last7days') {
      setFromDate(past7DaysStr);
      setToDate(todayStr);
    }
  };

  const fetchRowDetails = async (pid, force = false) => {
    if (!pid || (rowDetailsRef.current[pid] && !force)) return;
    setLoadingRowPid(pid);
    try {
      const res = await api.get('/reports/patient-report', {
        params: { patientId: pid },
      });
      const data = {
        patient: res.data?.patient,
        reports: res.data?.reports || [],
      };
      rowDetailsRef.current[pid] = data;
      setRowDetails((prev) => ({
        ...prev,
        [pid]: data,
      }));

      // Synchronize real-time financial & payment details into patient list
      if (res.data?.patient) {
        const pt = res.data.patient;
        setPatients((prev) =>
          prev.map((item) => {
            const itemPid = String(item.patientId || item.slNo || '');
            if (itemPid === String(pid)) {
              return {
                ...item,
                totalBill: pt.totalBill ?? item.totalBill,
                paidBill: pt.paidBill ?? item.paidBill,
                balance: pt.balance ?? item.balance,
                dueAmount: pt.dueAmount ?? item.dueAmount,
                billPayStatus: pt.billPayStatus ?? item.billPayStatus,
              };
            }
            return item;
          })
        );
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingRowPid(null);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [fromDate, toDate, dateMode, refreshTrigger]);

  const handleToggleRow = (pid, e) => {
    e?.stopPropagation();
    if (expandedRowId === pid) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(pid);
      fetchRowDetails(pid);
    }
  };

  const handleOpenPatient = (p, e) => {
    e?.stopPropagation();
    const pid = p.patientId || p.slNo;
    setActivePatient(p);
    navigate(`/patients/${pid}`);
  };

  // Live counts for the exact 6 official patient directory statuses
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: patients.length,
      [STATUS_ENTRY]: 0,
      [STATUS_SAMPLE]: 0,
      [STATUS_DATA_PART]: 0,
      [STATUS_DATA_FULL]: 0,
      [STATUS_REPORT_PRINT]: 0,
      [STATUS_REPORT_RELEASED]: 0,
    };
    patients.forEach((p) => {
      const norm = normalizePatientStatus(p.status);
      if (counts[norm] !== undefined) {
        counts[norm]++;
      } else {
        counts[STATUS_ENTRY]++;
      }
    });
    return counts;
  }, [patients]);

  // Filter based on status filter, due query param, and search term safely, maintaining newest-first order
  const filterType = searchParams.get('filter');
  const displayPatients = sortPatientsByRecent(
    patients.filter((p) => {
      if (selectedStatusFilter !== 'ALL') {
        const norm = normalizePatientStatus(p.status);
        if (norm !== selectedStatusFilter) return false;
      }
      if (filterType === 'due') {
        const statusNum = Number(p.billPayStatus);
        if (statusNum === PAYMENT_STATUS_CODE_PAID) return false;
        const billTotal = Number(p.totalBill || 0);
        const billPaid = Number(p.paidBill || 0);
        const due = Number(p.balance ?? Math.max(0, billTotal - billPaid));
        if (due <= 0 && statusNum !== PAYMENT_STATUS_CODE_UNPAID) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const name = String(p.name || '').toLowerCase();
        const pid = String(p.patientId || '').toLowerCase();
        const slNo = String(p.slNo || '').toLowerCase();
        const mobile = String(p.mobile || p.phone || '').toLowerCase();
        const dr = String(p.referedDr || '').toLowerCase();
        return (
          name.includes(term) ||
          pid.includes(term) ||
          slNo.includes(term) ||
          mobile.includes(term) ||
          dr.includes(term)
        );
      }
      return true;
    })
  );

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchPatients();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchParams.get('search')) {
      navigate('/patients');
    }
  };

  return (
    <section className="space-y-3 pb-8">
      <Helmet>
        <title>Patient Directory | Lab Expert</title>
        <meta
          name="description"
          content="Diagnostic worklist and patient records management in Lab Expert."
        />
      </Helmet>

      {/* Top Search & Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-2xs">
        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={handleSearchSubmit} />
          <input
            type="text"
            placeholder="Search by Barcode, Patient Name, Doctor, Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
              title="Clear search"
            >
              &times;
            </button>
          )}
        </form>

        {/* Date Filter Bar: Today (default), Yesterday, Last 7 Days, and From Date to To Date */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Segmented Control */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleDateModeChange('today')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                dateMode === 'today'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDateModeChange('yesterday')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                dateMode === 'yesterday'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleDateModeChange('last7days')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                dateMode === 'last7days'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Last 7 Days
            </button>
          </div>

          {/* Custom Date Pickers (From Date to To Date) */}
          <div className="flex items-center gap-1.5 text-slate-600 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDateMode('custom');
              }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium cursor-pointer"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDateMode('custom');
              }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium cursor-pointer"
            />
          </div>

          {/* Search / Refresh Button (Vibrant Blue) */}
          <button
            onClick={fetchPatients}
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Apply</span>
          </button>
        </div>
      </div>

      {/* Patient Directory Status Filter Bar (Official 6 Statuses strictly) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Status Filter:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PATIENT_STATUS_CONFIGS.map((cfg) => {
            const isActive = selectedStatusFilter === cfg.key;
            const count = statusCounts[cfg.key] ?? 0;
            return (
              <button
                key={cfg.key}
                type="button"
                onClick={() => setSelectedStatusFilter(isActive && cfg.key !== 'ALL' ? 'ALL' : cfg.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  isActive
                    ? cfg.key === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : cfg.key === STATUS_ENTRY
                      ? 'bg-[#f43f5e] text-white shadow-xs'
                      : cfg.key === STATUS_SAMPLE
                      ? 'bg-amber-500 text-white shadow-xs'
                      : cfg.key === STATUS_DATA_PART
                      ? 'bg-sky-500 text-white shadow-xs'
                      : cfg.key === STATUS_DATA_FULL
                      ? 'bg-purple-600 text-white shadow-xs'
                      : cfg.key === STATUS_REPORT_PRINT
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-[#10b981] text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{cfg.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Patient Table (Matching Screenshot 1 exactly) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Professional Light Clean Table Header */}
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 w-12 text-center text-slate-500">SN</th>
                <th className="py-2.5 px-3 min-w-[120px] text-slate-500">Barcode / SL No</th>
                <th className="py-2.5 px-3 min-w-[160px]">Patient Name</th>
                <th className="py-2.5 px-3 min-w-[75px] text-center text-slate-500">Gender</th>
                <th className="py-2.5 px-3 min-w-[180px]">Doctor</th>
                <th className="py-2.5 px-3 w-16 text-slate-500">Center</th>
                <th className="py-2.5 px-3 min-w-[140px]">
                  <div className="text-[11px] font-bold text-slate-700 leading-tight">Reg / Sample Time</div>
                  <div className="text-[9px] font-medium text-slate-400">Date & Collection</div>
                </th>
                <th className="py-2.5 px-2 w-8 text-center text-slate-500">M</th>
                <th className="py-2.5 px-2 w-8 text-center text-slate-500">P</th>
                <th className="py-2.5 px-2 w-8 text-center text-slate-500">₹</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-2 w-16 text-center">Action</th>
                <th className="py-2.5 px-2 w-12 text-center text-slate-500">More</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span className="font-semibold text-xs">Loading patient worklist...</span>
                  </td>
                </tr>
              ) : displayPatients.length > 0 ? (
                displayPatients.map((p, idx) => {
                  const pid = String(p.patientId || p.slNo || '');
                  const snNumber = p.serialNumber || (displayPatients.length - idx);
                  const rawGender = String(p.gender || '').trim();
                  const isMale = rawGender.toLowerCase().startsWith('m');
                  const isFemale = rawGender.toLowerCase().startsWith('f');
                  const isTrans = rawGender.toLowerCase().startsWith('t') || rawGender.toLowerCase().startsWith('o');
                  const displayGender = isMale ? 'Male' : isFemale ? 'Female' : isTrans ? 'Transgender' : 'Male';
                  const billTotal = Number(p.totalBill || 0);
                  const billPaid = Number(p.paidBill || 0);
                  const billBalance = Number(p.balance ?? Math.max(0, billTotal - billPaid));
                  const billPayStatusNum = Number(p.billPayStatus);
                  const isPaid = billPayStatusNum === PAYMENT_STATUS_CODE_PAID;
                  const isUnpaid = billPayStatusNum === PAYMENT_STATUS_CODE_UNPAID || (!isPaid && billPayStatusNum !== PAYMENT_STATUS_CODE_NOBILL && billTotal > 0);
                  const isNoBill = billPayStatusNum === PAYMENT_STATUS_CODE_NOBILL || (!isPaid && !isUnpaid && billTotal === 0);
                  const isBilled = !isNoBill && billTotal > 0;
                  const isExpanded = expandedRowId === pid;
                  const details = rowDetails[pid];

                  return (
                    <React.Fragment key={pid}>
                      <tr
                        onClick={() => handleToggleRow(pid)}
                        onDoubleClick={(e) => handleOpenPatient(p, e)}
                        className={`transition-colors cursor-pointer select-none ${
                          isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/80'
                        }`}
                        title="Click to expand details • Double-click to open patient profile"
                      >
                        {/* SN */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 text-xs">
                          {snNumber}
                        </td>

                        {/* Barcode / SL No (NO PATIENT ID) */}
                        <td
                          onDoubleClick={(e) => handleOpenPatient(p, e)}
                          className="py-2.5 px-3 font-mono font-bold text-blue-700 text-xs hover:text-blue-900 transition-colors whitespace-nowrap"
                          title="Double-click to open patient profile"
                        >
                          <span className="bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded text-[11px]">
                            {p.slNo || p.barcode || '-'}
                          </span>
                        </td>

                        {/* Patient Name */}
                        <td
                          onDoubleClick={(e) => handleOpenPatient(p, e)}
                          className="py-2.5 px-3 font-bold text-slate-900 text-xs hover:text-blue-600 hover:underline transition-colors"
                          title="Double-click to open patient profile"
                        >
                          {p.title ? `${p.title} ` : ''}
                          {p.name}
                        </td>

                        {/* Gender: Mentioned clearly without unicode */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              isMale
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                : isFemale
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                            }`}
                          >
                            {displayGender}
                          </span>
                        </td>

                        {/* Doctor */}
                        <td className="py-2.5 px-3 text-xs font-semibold text-slate-700 uppercase truncate max-w-[200px]" title={p.referedDr || 'Self'}>
                          {p.referedDr || 'Self'}
                        </td>

                        {/* Center */}
                        <td className="py-2.5 px-3 text-xs text-slate-600 font-medium">
                          {p.center || 'Main'}
                        </td>

                        {/* Reg Date & Sample Time: Clearly separated without confusion */}
                        <td className="py-2.5 px-3 text-[11px] font-medium whitespace-nowrap">
                          <div className="flex items-center gap-1.5 leading-snug">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/70 rounded px-1 py-0.5">
                              REG
                            </span>
                            <span className="font-semibold text-slate-900 text-xs">
                              {formatDisplayDate(p.regDate || p.collectionDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 leading-snug mt-1">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider rounded px-1 py-0.5 ${
                                p.sampleTime
                                  ? 'text-amber-700 bg-amber-50 border border-amber-200/70'
                                  : 'text-slate-400 bg-slate-50 border border-slate-200'
                              }`}
                            >
                              SMPL
                            </span>
                            {p.sampleTime ? (
                              <span
                                className="font-mono text-[11px] font-semibold text-slate-700"
                                title={`Sample collected: ${p.sampleTime}`}
                              >
                                {getSampleTimeDisplay(p.sampleTime, p.regDate)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Pending
                              </span>
                            )}
                          </div>
                        </td>

                        {/* M */}
                        <td className="py-2.5 px-2 text-center text-xs text-slate-600 font-medium">
                          {p.mCount ?? 0}
                        </td>

                        {/* P */}
                        <td className="py-2.5 px-2 text-center text-xs text-slate-600 font-medium">
                          {p.pCount ?? 0}
                        </td>

                        {/* ₹ Payment status badge matching screenshot */}
                        <td className="py-2.5 px-2 text-center">
                          {isPaid ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700"
                              title={`Payment Paid • Total: ₹${billTotal}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : isUnpaid ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600"
                              title={`Payment Unpaid • Total: ₹${billTotal}`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 font-mono text-[10px]"
                              title="No Bill"
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* Status badge matching upstream status definitions and screenshot */}
                        <td className="py-2.5 px-3 text-center">
                          {renderPatientStatus(p.status)}
                        </td>

                        {/* Action Buttons: Open & Edit */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => handleOpenPatient(p, e)}
                              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPatient(p);
                              }}
                              title="Edit Patient Details"
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* More Accordion Button matching screenshot */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={(e) => handleToggleRow(pid, e)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                            title="Expand Details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Accordion Drawer (Screenshot 1 Row 18) */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="13" className="p-3 bg-slate-50 border-y border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                              {/* Card 1: Patient Details */}
                              <div className="space-y-2 border-r border-slate-100 pr-3">
                                <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    <span>Patient Details</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPatient(p)}
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                                    title="Edit Patient Details"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                </div>
                                <div className="text-xs space-y-1 text-slate-700">
                                  <div>
                                    <span className="text-slate-400">Doctor:</span>{' '}
                                    <strong className="text-slate-800">
                                      {p.referedDr || 'AYAN GHOSH'}
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Age/Gender:</span>{' '}
                                    <strong className="text-slate-800">
                                      {p.age || '3'}{!String(p.age || '').toLowerCase().includes('year') && !String(p.age || '').toLowerCase().includes('day') ? ` ${p.age_unit || 'Days'}` : ''} / {displayGender}
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Reg Date:</span>{' '}
                                    <strong className="text-slate-800">
                                      {formatDisplayDate(p.regDate || p.collectionDate)}
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Sample Time:</span>{' '}
                                    <strong className={p.sampleTime ? 'text-slate-800' : 'text-slate-400 font-normal italic'}>
                                      {p.sampleTime || 'Pending Collection'}
                                    </strong>
                                  </div>
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    <span className="text-slate-400">Status:</span>{' '}
                                    {renderPatientStatus(p.status)}
                                  </div>
                                </div>
                              </div>

                              {/* Card 2: Tests & Investigation Lots (Packages, Groups & Tests) */}
                              {(() => {
                                const currentPatient = details?.patient || p;
                                const patientLots = groupInvestigationsIntoLots(
                                  details?.reports || [],
                                  currentPatient,
                                  profiles,
                                  packages,
                                  tests
                                );
                                const isFlatMode = lotsViewMode[pid] === 'flat';
                                const reportsCount = details?.reports?.length || 0;

                                return (
                                  <div className="space-y-2 border-r border-slate-100 pr-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                                      <div className="flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>
                                          Investigations ({isFlatMode ? `${reportsCount} Tests` : `${patientLots.length} Lots`})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {loadingRowPid === pid && (
                                          <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                                        )}
                                        {patientLots.length > 0 && reportsCount > 0 && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setLotsViewMode((prev) => ({
                                                ...prev,
                                                [pid]: isFlatMode ? 'grouped' : 'flat',
                                              }));
                                            }}
                                            className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                            title="Toggle Grouped Lots (Packages & Groups) vs All Flat Tests"
                                          >
                                            {isFlatMode ? 'Show Grouped' : 'Show All'}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <div
                                      data-lenis-prevent="true"
                                      className="text-xs space-y-1.5 max-h-36 overflow-y-auto pr-1"
                                    >
                                      {loadingRowPid === pid ? (
                                        <div className="text-[11px] text-indigo-500 italic py-2 flex items-center gap-1.5">
                                          <RefreshCw className="w-3 h-3 animate-spin" />
                                          <span>Loading investigations...</span>
                                        </div>
                                      ) : isFlatMode ? (
                                        // Flat View of all individual test parameters
                                        details?.reports && details.reports.length > 0 ? (
                                          details.reports.map((rep, rIdx) => (
                                            <div
                                              key={rIdx}
                                              className="flex items-center justify-between text-[11px] text-slate-700 gap-2 p-1 rounded hover:bg-slate-50 transition-colors"
                                            >
                                              <span className="truncate">
                                                {rIdx + 1}. {rep.testName || rep.profileName}
                                              </span>
                                              <span className="bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded font-mono font-bold text-[10px] shrink-0">
                                                ₹{Number(rep.rate || 0)}
                                              </span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="text-[11px] text-slate-400 italic py-2">
                                            No tests ordered yet
                                          </div>
                                        )
                                      ) : (
                                        // Grouped Lots View: All Packages, Groups & Standalone Tests shown at once
                                        patientLots.length > 0 ? (
                                          patientLots.map((lot, lIdx) => {
                                            const isLotExpanded = Boolean(expandedLotsMap[`${pid}_${lot.id}`]);
                                            const hasSubTests = Array.isArray(lot.subTests) && lot.subTests.length > 0;

                                            let badgeColor = 'bg-sky-50 text-sky-800 border-sky-300';
                                            let icon = <FlaskConical className="w-3 h-3 text-sky-600 shrink-0" />;
                                            let label = 'Test';
                                            if (lot.category === 'Package') {
                                              badgeColor = 'bg-amber-50 text-amber-900 border-amber-300';
                                              icon = <Package className="w-3 h-3 text-amber-600 shrink-0" />;
                                              label = 'Package';
                                            } else if (lot.category === 'Profile') {
                                              badgeColor = 'bg-purple-50 text-purple-900 border-purple-300';
                                              icon = <Layers className="w-3 h-3 text-purple-600 shrink-0" />;
                                              label = 'Group';
                                            }

                                            return (
                                              <div
                                                key={lIdx}
                                                className="border border-slate-100 rounded-lg p-1.5 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-1"
                                              >
                                                <div className="flex items-center justify-between text-[11px] text-slate-800 gap-1.5">
                                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <span
                                                      className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${badgeColor} shrink-0`}
                                                    >
                                                      {icon}
                                                      <span>{label}</span>
                                                    </span>
                                                    <span className="font-semibold text-slate-900 truncate" title={lot.name}>
                                                      {lot.name}
                                                    </span>
                                                  </div>

                                                  <div className="flex items-center gap-1.5 shrink-0">
                                                    {hasSubTests && (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setExpandedLotsMap((prev) => ({
                                                            ...prev,
                                                            [`${pid}_${lot.id}`]: !prev[`${pid}_${lot.id}`],
                                                          }));
                                                        }}
                                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border transition-colors flex items-center gap-0.5 cursor-pointer ${
                                                          isLotExpanded
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                                        }`}
                                                        title="Toggle included investigations"
                                                      >
                                                        <span>{lot.subTestCount} Tests</span>
                                                        {isLotExpanded ? (
                                                          <ChevronUp className="w-2.5 h-2.5" />
                                                        ) : (
                                                          <ChevronDown className="w-2.5 h-2.5" />
                                                        )}
                                                      </button>
                                                    )}
                                                    <span className="bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                                                      ₹{Number(lot.amount || 0)}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Expanded sub-test chips */}
                                                {isLotExpanded && hasSubTests && (
                                                  <div className="pt-1 border-t border-slate-200/60 mt-1 pl-1 flex flex-wrap gap-1 animate-in fade-in duration-100">
                                                    {lot.subTests.map((sub, sIdx) => (
                                                      <span
                                                        key={sIdx}
                                                        className="text-[9px] bg-white text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded font-medium truncate max-w-[140px]"
                                                        title={sub}
                                                      >
                                                        • {sub}
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="text-[11px] text-slate-400 italic py-2">
                                            No tests ordered yet
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Card 3: Financial Summary */}
                              {(() => {
                                const effectivePatient = details?.patient || p;
                                const patientLots = groupInvestigationsIntoLots(
                                  details?.reports || [],
                                  effectivePatient,
                                  profiles,
                                  packages,
                                  tests
                                );
                                const lotsRateTotal = patientLots && patientLots.length > 0
                                  ? patientLots.reduce((acc, lot) => acc + Number(lot.amount || 0), 0)
                                  : (details?.reports && details.reports.length > 0 ? details.reports.reduce((acc, rep) => acc + Number(rep.rate || 0), 0) : 0);

                                const effectiveTotal = lotsRateTotal > 0
                                  ? lotsRateTotal
                                  : (Number(effectivePatient.totalBill) > 0 ? Number(effectivePatient.totalBill) : billTotal);

                                const effectivePaid = effectivePatient.paidBill !== undefined && effectivePatient.paidBill !== null
                                  ? Number(effectivePatient.paidBill)
                                  : (effectivePatient.billPayStatus === PAYMENT_STATUS_CODE_PAID ? effectiveTotal : billPaid);

                                const syncedBal = effectivePatient.balance !== undefined && effectivePatient.balance !== null
                                  ? Number(effectivePatient.balance)
                                  : (effectivePatient.dueAmount !== undefined ? Number(effectivePatient.dueAmount) : null);

                                const effectiveBalance = effectivePatient.billPayStatus === PAYMENT_STATUS_CODE_PAID
                                  ? 0
                                  : (syncedBal !== null && !isNaN(syncedBal) ? Math.max(0, syncedBal) : Math.max(0, effectiveTotal - effectivePaid));

                                const effectiveIsPaid = effectivePatient.billPayStatus === PAYMENT_STATUS_CODE_PAID || (effectiveTotal > 0 && effectiveBalance <= 0 && effectivePaid >= effectiveTotal);
                                const effectiveIsBilled = effectiveTotal > 0;

                                return (
                                  <div className="space-y-2 border-r border-slate-100 pr-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                                      <div className="flex items-center gap-1.5">
                                        <span>💳</span>
                                        <span>Financial Summary</span>
                                      </div>
                                      {loadingRowPid === pid && (
                                        <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                                      )}
                                    </div>
                                    <div className="text-xs space-y-1 text-slate-700">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Total Amount:</span>
                                        <span className="font-bold text-slate-900">
                                          ₹{effectiveTotal.toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Total Deposit:</span>
                                        <span className="font-bold text-slate-900">
                                          ₹{effectivePaid.toLocaleString('en-IN')}
                                          {effectivePatient.paymentLines && effectivePatient.paymentLines.length > 0 && (
                                            <span className="text-[10px] text-emerald-600 font-normal ml-1">
                                              ({effectivePatient.paymentLines.length} receipt{effectivePatient.paymentLines.length > 1 ? 's' : ''})
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Balance Due:</span>
                                        <span className={`font-bold ${!effectiveIsBilled ? 'text-slate-500' : effectiveIsPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          ₹{effectiveBalance.toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Card 4: Quick Actions */}
                              <div className="space-y-2 flex flex-col justify-center">
                                <div className="text-xs font-bold text-indigo-700">
                                  Quick Actions
                                </div>
                                <div className="space-y-1.5">
                                  <button
                                    onClick={() => setEditingPatient(p)}
                                    className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs cursor-pointer transition-all"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Edit Patient Details</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActivePatient(p);
                                      navigate(`/patients/${pid}?tab=tests`);
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs cursor-pointer transition-all"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Order Tests</span>
                                  </button>

                                  <button
                                    onClick={() => setPreviewBillPatient(p)}
                                    className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs cursor-pointer transition-all"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Preview Bill</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActivePatient(p);
                                      navigate(`/patients/${pid}?tab=results`);
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs cursor-pointer transition-all"
                                  >
                                    <FileCheck className="w-3.5 h-3.5" />
                                    <span>Enter Results</span>
                                  </button>

                                  {/* AWS Report PDF */}
                                  {/* AWS Report PDF */}
                                  <button
                                    onClick={() => {
                                      const rawPid = p.patientId || pid;
                                      const cleanPid = rawPid
                                        ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
                                        : '';
                                      const token = localStorage.getItem('token');
                                      window.open(`/api/reports/pdf?patientId=${cleanPid || rawPid}&addHeader=true${token ? `&token=${token}` : ''}`, '_blank');
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs cursor-pointer transition-all"
                                    title="Open official AWS Diagnostic Report PDF"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>AWS Report PDF</span>
                                  </button>

                                  {/* AWS Bill Preview Popup */}
                                  <button
                                    onClick={() => setPreviewBillPatient(p)}
                                    className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs cursor-pointer transition-all"
                                    title="Open official AWS Invoice Preview Popup"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>AWS Bill Preview</span>
                                  </button>
                                </div>

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700 mb-1">
                      {searchTerm
                        ? `No patient records found matching "${searchTerm}"`
                        : `No diagnostic records found on ${fromDate === toDate ? formatDisplayDate(fromDate) : `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`}`}
                    </p>
                    <p className="text-xs text-slate-400 mb-3">
                      {searchTerm
                        ? 'Check your spelling or switch date filters to search across diagnostic records.'
                        : 'Switch to "Last 7 Days" or jump to the latest date to view active patient records.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDateModeChange('today')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Today's Worklist
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateModeChange('last7days')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Last 7 Days Worklist
                      </button>
                      {latestFoundDate && latestFoundDate !== fromDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setFromDate(latestFoundDate);
                            setToDate(latestFoundDate);
                            setDateMode('custom');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer border border-slate-300"
                        >
                          Jump to Latest Records ({formatDisplayDate(latestFoundDate)})
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Preview Modal Popup */}
      <BillPreviewModal
        isOpen={!!previewBillPatient}
        onClose={() => setPreviewBillPatient(null)}
        patientId={previewBillPatient?.patientId || previewBillPatient?.slNo}
        patientName={previewBillPatient?.name}
      />

      {/* Patient Demographic Details Edit Modal */}
      {editingPatient && (
        <PatientEditModal
          isOpen={!!editingPatient}
          onClose={() => setEditingPatient(null)}
          patient={editingPatient}
          onPatientUpdated={() => {
            fetchPatients();
            setEditingPatient(null);
          }}
        />
      )}
    </section>
  );
}
