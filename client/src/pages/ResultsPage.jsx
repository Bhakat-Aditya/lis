import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import ResultsEntry from '../components/results/ResultsEntry.jsx';
import { FlaskConical, Search, RefreshCw, UserCheck, CheckCircle, BookOpen, Clock, Calendar } from 'lucide-react';
import { StatusBadge } from '../components/common/Badge.jsx';
import ClinicalGuideModal from '../components/common/ClinicalGuideModal.jsx';
import { formatDisplayDate, sortPatientsByRecent, getLocalDateString, shiftDateDays } from '../utils/dateUtils.js';

const formatGender = (raw) => {
  const s = String(raw || '').trim().toLowerCase();
  if (s.startsWith('m')) return 'Male';
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('t') || s.startsWith('o')) return 'Transgender';
  return raw || '-';
};

export default function ResultsPage() {
  const todayStr = getLocalDateString();
  const yesterdayStr = shiftDateDays(todayStr, -1);
  const past7DaysStr = shiftDateDays(todayStr, -7);

  const [dateFilterPreset, setDateFilterPreset] = useState('today');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [queuePhaseFilter, setQueuePhaseFilter] = useState('ALL');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleDatePreset = (preset) => {
    setDateFilterPreset(preset);
    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'yesterday') {
      setFromDate(yesterdayStr);
      setToDate(yesterdayStr);
    } else if (preset === 'last7days') {
      setFromDate(past7DaysStr);
      setToDate(todayStr);
    }
  };

  const fetchLabWorklist = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/list', { params: { fromDate, toDate } });
      const allPatients = sortPatientsByRecent(res.data?.patients || []);
      setPatients(allPatients);
      if (allPatients.length > 0) {
        // If current selection is still in list keep it, otherwise select first
        const found = selectedPatient ? allPatients.find(p => (p.patientId || p.slNo) === (selectedPatient.patientId || selectedPatient.slNo)) : null;
        if (found) {
          loadPatientReport(found);
        } else {
          loadPatientReport(allPatients[0]);
        }
      } else {
        setSelectedPatient(null);
        setReports([]);
      }
    } catch (err) {
      console.warn('Error loading lab worklist:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientReport = async (patient) => {
    setSelectedPatient(patient);
    try {
      const pid = patient.patientId || patient.slNo;
      const res = await api.get('/reports/patient-report', {
        params: { patientId: pid },
      });
      const repList = res.data?.reports || [];
      const isRateLimited =
        res.data?.StatusCode === '8887' ||
        res.data?.rateLimited ||
        String(res.data?.Message || '').includes('8887');

      if (repList.length > 0 || !isRateLimited) {
        setReports(repList);
      }
      if (res.data?.templates?.length > 0) {
        setTemplates(res.data.templates);
      }
      return res.data;
    } catch (err) {
      console.warn('Error loading tests for patient:', err.message);
      return null;
    }
  };

  useEffect(() => {
    fetchLabWorklist();
  }, [fromDate, toDate]);

  const filteredPatients = sortPatientsByRecent(
    patients.filter((p) => {
      // 1. Phase Filter
      if (queuePhaseFilter !== 'ALL') {
        const s = String(p.status || '').toUpperCase();
        if (queuePhaseFilter === 'SAMPLE' && s !== 'SAMPLE' && s !== 'PENDING') return false;
        if (queuePhaseFilter === 'ENTRY' && s !== 'ENTRY' && s !== 'TESTING') return false;
        if (queuePhaseFilter === 'READY' && s !== 'PRINTING' && s !== 'APPROVED' && s !== 'SAVED' && s !== 'VERIFIED') return false;
      }

      // 2. Search match
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase().trim();
      const name = String(p.name || '').toLowerCase();
      const pid = String(p.patientId || '').toLowerCase();
      const slNo = String(p.slNo || '').toLowerCase();
      const mobile = String(p.mobile || p.phone || '').toLowerCase();
      const doctor = String(p.referedDr || '').toLowerCase();

      return (
        name.includes(term) ||
        pid.includes(term) ||
        slNo.includes(term) ||
        mobile.includes(term) ||
        doctor.includes(term)
      );
    })
  );

  return (
    <section className="space-y-3">
      <Helmet>
        <title>Laboratory Results Entry Workstation | Lab Expert LIS</title>
        <meta
          name="description"
          content="Technician workstation for recording, calculating, and analyzing diagnostic hematology, biochemistry, and serology parameters."
        />
      </Helmet>

      {/* Header */}
      <div className="bg-white p-3 px-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold shadow-2xs">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Laboratory Results Entry Workstation
              </h1>
              <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.2 rounded-full">
                Analyzer Bench
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Input and correlate diagnostic parameters with real-time reference range evaluations
            </p>
          </div>
        </div>

        {/* Date Filter Presets & Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs font-semibold">
            <button
              type="button"
              onClick={() => handleDatePreset('today')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                dateFilterPreset === 'today'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('yesterday')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                dateFilterPreset === 'yesterday'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('last7days')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                dateFilterPreset === 'last7days'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
          </div>

          <div className="flex items-center gap-1 text-slate-600 text-[11px]">
            <Calendar className="w-3 h-3 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDateFilterPreset('custom');
              }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDateFilterPreset('custom');
              }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium"
            />
          </div>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 active:scale-95 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>

          <button
            onClick={fetchLabWorklist}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh worklist"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Side: Patient Queue (3 cols on xl) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Barcode, Patient Name, Doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  title="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Queue Phase Quick Filters */}
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setQueuePhaseFilter('ALL')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  queuePhaseFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({patients.length})
              </button>
              <button
                type="button"
                onClick={() => setQueuePhaseFilter('SAMPLE')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  queuePhaseFilter === 'SAMPLE'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setQueuePhaseFilter('ENTRY')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  queuePhaseFilter === 'ENTRY'
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'bg-violet-50 text-violet-800 hover:bg-violet-100 border border-violet-200'
                }`}
              >
                Testing
              </button>
              <button
                type="button"
                onClick={() => setQueuePhaseFilter('READY')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  queuePhaseFilter === 'READY'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Ready
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
            {filteredPatients.map((p, idx) => {
              const isSelected = selectedPatient?.patientId === p.patientId;
              const statusStr = String(p.status || '').toUpperCase();

              return (
                <div
                  key={p.patientId || idx}
                  onClick={() => loadPatientReport(p)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/90 border-l-4 border-indigo-600 shadow-2xs'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-500 font-mono text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-blue-700 font-mono text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/70">
                        {p.slNo || p.barcode || '-'}
                      </span>
                    </div>
                    <StatusBadge status={p.status || 'SAMPLE'} />
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                  <div className="text-[11px] text-slate-500 flex justify-between mt-1">
                    <span>{formatGender(p.gender)} • {p.age || '-'}</span>
                    <span className="font-mono text-slate-500 font-medium text-[10px]">{formatDisplayDate(p.regDate)}</span>
                  </div>
                  {p.referedDr && (
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Ref: {p.referedDr}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Results Entry Table (8 cols / 9 cols on xl) */}
        <div className="lg:col-span-8 xl:col-span-9">
          {selectedPatient ? (
            <ResultsEntry
              key={selectedPatient.patientId}
              patient={selectedPatient}
              reports={reports}
              templates={templates}
              onRefresh={() => loadPatientReport(selectedPatient)}
            />
          ) : (
            <div className="bg-white p-16 text-center text-slate-400 rounded-2xl border border-slate-200">
              <FlaskConical className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <span className="font-semibold text-xs">Select a patient order from the left queue to enter test values.</span>
            </div>
          )}
        </div>
      </div>

      <ClinicalGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </section>
  );
}
