import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

import {
  getLocalDateString,
  getYesterdayDateString,
  shiftDateDays,
  formatDisplayDate,
  formatPatientDateTime,
  sortPatientsByRecent,
} from '../utils/dateUtils.js';
import BillPreviewModal from '../components/billing/BillPreviewModal.jsx';

export default function PatientsPage({ onOpenNewPatient }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActivePatient } = usePatientContext();

  const urlSearch = searchParams.get('search') || '';
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  // Mode: 'recent' (default: loads all recent active records), 'today', 'yesterday', 'custom'
  const [dateMode, setDateMode] = useState('recent');
  const [previewBillPatient, setPreviewBillPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [latestFoundDate, setLatestFoundDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [rowDetails, setRowDetails] = useState({});

  // Sync state if URL query param changes
  useEffect(() => {
    setSearchTerm(urlSearch);
    if (urlSearch) {
      setDateMode('recent');
    }
  }, [urlSearch]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateMode === 'recent') {
        params.allDates = 'true';
      } else {
        params.fromDate = selectedDate;
        params.toDate = selectedDate;
      }
      if (searchTerm) {
        params.search = searchTerm.trim();
      }

      const res = await api.get('/patients/list', { params });
      const list = res.data?.patients || [];
      if (res.data?.latestDate) {
        setLatestFoundDate(res.data.latestDate);
      }

      if (res.data && Array.isArray(res.data.patients)) {
        setPatients(sortPatientsByRecent(res.data.patients));
      } else {
        setPatients([]);
      }

      if (expandedRowId) {
        fetchRowDetails(expandedRowId);
      }
    } catch (err) {
      console.warn('Error fetching patients:', err.message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    if (mode === 'today') {
      setSelectedDate(todayStr);
    } else if (mode === 'yesterday') {
      setSelectedDate(yesterdayStr);
    }
  };

  const handleShiftDay = (delta) => {
    const newDate = shiftDateDays(selectedDate, delta);
    setSelectedDate(newDate);
    setDateMode('custom');
  };

  const fetchRowDetails = async (pid) => {
    if (rowDetails[pid]) return;
    try {
      const res = await api.get('/reports/patient-report', {
        params: { patientId: pid },
      });
      setRowDetails((prev) => ({
        ...prev,
        [pid]: {
          patient: res.data?.patient,
          reports: res.data?.reports || [],
        },
      }));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [selectedDate, dateMode]);

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

  // Filter based on due query param and search term safely, maintaining newest-first order
  const filterType = searchParams.get('filter');
  const displayPatients = sortPatientsByRecent(
    patients.filter((p) => {
      if (filterType === 'due') {
        const billTotal = Number(p.totalBill || 0);
        const billPaid = Number(p.paidBill || 0);
        const due = Number(p.balance ?? Math.max(0, billTotal - billPaid));
        if (due <= 0) return false;
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
            placeholder="Search PID, Name, Doctor, Mobile..."
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

        {/* Date Filter Bar: Presets & Shift Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Segmented Control */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleDateModeChange('recent')}
              className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                dateMode === 'recent'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              All Recent
            </button>
            <button
              type="button"
              onClick={() => handleDateModeChange('today')}
              className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                dateMode === 'today'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDateModeChange('yesterday')}
              className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                dateMode === 'yesterday'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Yesterday
            </button>
          </div>

          {/* Date Picker with Prev / Next day arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleShiftDay(-1)}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateMode('custom');
                }}
                className="pl-2.5 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={() => handleShiftDay(1)}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search / Refresh Button (Vibrant Blue) */}
          <button
            onClick={fetchPatients}
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Apply</span>
          </button>
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
                <th className="py-2.5 px-3 w-16 text-slate-500">ID</th>
                <th className="py-2.5 px-3 min-w-[160px]">Patient Name</th>
                <th className="py-2.5 px-2 w-8 text-center text-slate-500">G</th>
                <th className="py-2.5 px-3 min-w-[180px]">Doctor</th>
                <th className="py-2.5 px-3 w-16 text-slate-500">Center</th>
                <th className="py-2.5 px-3 min-w-[125px]">Date / Time</th>
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
                  const isMale = (p.gender || '').toLowerCase().startsWith('m');
                  const billTotal = Number(p.totalBill || 0);
                  const billPaid = Number(p.paidBill || 0);
                  const billBalance = Number(p.balance ?? Math.max(0, billTotal - billPaid));
                  const isBilled = billTotal > 0;
                  const isPaid = isBilled && billBalance <= 0 && (p.billPayStatus === 2 || p.billPayStatus === '2' || (billPaid >= billTotal && billTotal > 0));
                  const isReady = ['APPROVED', 'PRINTING', 'RELEASED', 'READY', 'REPORT READY'].includes(
                    String(p.status || '').toUpperCase()
                  );
                  const isExpanded = expandedRowId === pid;
                  const details = rowDetails[pid];

                  // Formatted time or fallback
                  const timeStr = p.sampleTime || p.regTime || '03:15 PM';

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

                        {/* ID */}
                        <td
                          onDoubleClick={(e) => handleOpenPatient(p, e)}
                          className="py-2.5 px-3 font-semibold text-slate-800 text-xs hover:text-blue-600 transition-colors"
                          title="Double-click to open patient profile"
                        >
                          {pid}
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

                        {/* G (Gender) */}
                        <td className="py-2.5 px-2 text-center">
                          {isMale ? (
                            <span className="text-blue-600 font-bold text-sm" title="Male">
                              ♂
                            </span>
                          ) : (
                            <span className="text-rose-500 font-bold text-sm" title="Female">
                              ♀
                            </span>
                          )}
                        </td>

                        {/* Doctor */}
                        <td className="py-2.5 px-3 text-xs font-semibold text-slate-700 uppercase truncate max-w-[200px]" title={p.referedDr || 'Self'}>
                          {p.referedDr || 'Self'}
                        </td>

                        {/* Center */}
                        <td className="py-2.5 px-3 text-xs text-slate-600 font-medium">
                          {p.center || 'Main'}
                        </td>

                        {/* Date / Time */}
                        <td className="py-2.5 px-3 text-[11px] font-medium text-slate-700 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{formatPatientDateTime(p)}</div>
                          {p.regDate && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {formatDisplayDate(p.regDate)}
                            </div>
                          )}
                        </td>

                        {/* M */}
                        <td className="py-2.5 px-2 text-center text-xs text-slate-600 font-medium">
                          {p.mCount ?? 0}
                        </td>

                        {/* P */}
                        <td className="py-2.5 px-2 text-center text-xs text-slate-600 font-medium">
                          {p.pCount ?? 0}
                        </td>

                        {/* ₹ Payment status badge */}
                        <td className="py-2.5 px-2 text-center">
                          {isPaid ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700"
                              title="Payment Complete"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : isBilled ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600"
                              title={`Payment Pending - Due: ₹${billBalance || billTotal}`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 font-mono text-[10px]"
                              title="Unbilled - No tests ordered"
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* Status badge matching screenshot */}
                        <td className="py-2.5 px-3 text-center">
                          {isReady ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981] text-white whitespace-nowrap shadow-2xs">
                              <Check className="w-3 h-3" />
                              <span>Report Ready</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f43f5e] text-white whitespace-nowrap shadow-2xs">
                              <User className="w-3 h-3" />
                              <span>Registered</span>
                            </span>
                          )}
                        </td>

                        {/* Open Button (Vibrant Blue) */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={(e) => handleOpenPatient(p, e)}
                            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
                          >
                            Open
                          </button>
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
                                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                                  <User className="w-3.5 h-3.5" />
                                  <span>Patient Details</span>
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
                                      {p.age || '3'}{!String(p.age || '').toLowerCase().includes('year') && !String(p.age || '').toLowerCase().includes('day') ? ` ${p.age_unit || 'Days'}` : ''} / {p.gender || 'Male'}
                                    </strong>
                                  </div>
                                </div>
                              </div>

                              {/* Card 2: Tests List */}
                              <div className="space-y-2 border-r border-slate-100 pr-3">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Tests ({details?.reports?.length || 0})</span>
                                </div>
                                <div className="text-xs space-y-1.5 max-h-28 overflow-y-auto pr-1">
                                  {details?.reports && details.reports.length > 0 ? (
                                    details.reports.map((rep, rIdx) => (
                                      <div
                                        key={rIdx}
                                        className="flex items-center justify-between text-[11px] text-slate-700 gap-2"
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
                                  )}
                                </div>
                              </div>

                              {/* Card 3: Financial Summary */}
                              <div className="space-y-2 border-r border-slate-100 pr-3">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                                  <span>💳</span>
                                  <span>Financial Summary</span>
                                </div>
                                <div className="text-xs space-y-1 text-slate-700">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Total Amount:</span>
                                    <span className="font-bold text-slate-900">
                                      ₹{billTotal.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Total Deposit:</span>
                                    <span className="font-bold text-slate-900">
                                      ₹{billPaid.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Balance Due:</span>
                                    <span className={`font-bold ${!isBilled ? 'text-slate-500' : isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      ₹{billBalance.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Card 4: Quick Actions */}
                              <div className="space-y-2 flex flex-col justify-center">
                                <div className="text-xs font-bold text-indigo-700">
                                  Quick Actions
                                </div>
                                <div className="space-y-1.5">
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
                                    <span>View Report</span>
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
                        : `No diagnostic records found on ${formatDisplayDate(selectedDate)}`}
                    </p>
                    <p className="text-xs text-slate-400 mb-3">
                      {searchTerm
                        ? 'Check your spelling or switch to "All Recent" to search across all diagnostic records.'
                        : 'Switch to "All Recent" or jump to the latest date to view active patient records.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDateModeChange('recent')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Show All Recent Worklist
                      </button>
                      {latestFoundDate && latestFoundDate !== selectedDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(latestFoundDate);
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
    </section>
  );
}
