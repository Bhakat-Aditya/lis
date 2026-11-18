import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import ResultsEntry from '../components/results/ResultsEntry.jsx';
import {
  FlaskConical,
  Search,
  RefreshCw,
  UserCheck,
  CheckCircle,
  BookOpen,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
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

  const carouselRef = useRef(null);

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

  const currentPatientIndex = filteredPatients.findIndex(
    (p) => (p.patientId || p.slNo) === (selectedPatient?.patientId || selectedPatient?.slNo)
  );

  const scrollToPatientCard = (patientId) => {
    if (!patientId || !carouselRef.current) return;
    const cardEl = carouselRef.current.querySelector(`[data-patient-id="${patientId}"]`);
    if (cardEl) {
      cardEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  const handleSelectPatient = (patient) => {
    loadPatientReport(patient);
    scrollToPatientCard(patient.patientId || patient.slNo);
  };

  const handlePrevPatient = () => {
    if (currentPatientIndex > 0) {
      const prev = filteredPatients[currentPatientIndex - 1];
      handleSelectPatient(prev);
    }
  };

  const handleNextPatient = () => {
    if (currentPatientIndex >= 0 && currentPatientIndex < filteredPatients.length - 1) {
      const next = filteredPatients[currentPatientIndex + 1];
      handleSelectPatient(next);
    }
  };

  const handleScrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const offset = direction === 'left' ? -350 : 350;
    carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // If current patient is filtered out, select first matching patient
  useEffect(() => {
    if (filteredPatients.length > 0) {
      const isStillPresent = selectedPatient && filteredPatients.some(
        (p) => (p.patientId || p.slNo) === (selectedPatient.patientId || selectedPatient.slNo)
      );
      if (!isStillPresent) {
        handleSelectPatient(filteredPatients[0]);
      }
    } else {
      setSelectedPatient(null);
      setReports([]);
    }
  }, [queuePhaseFilter, searchTerm]);

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
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
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
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
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
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
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
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium outline-none focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDateFilterPreset('custom');
              }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium outline-none focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 active:scale-95 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>

          <button
            onClick={fetchLabWorklist}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent]"
            title="Refresh worklist"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. TOP NAME SELECTION: Horizontal Slide Bar & Quick Queue Navigator */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-2.5">
        {/* Navigation & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Barcode, Patient Name, Doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 font-medium select-none [-webkit-tap-highlight-color:transparent]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent]"
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Center: Phase Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setQueuePhaseFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
                queuePhaseFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All ({patients.length})
            </button>
            <button
              type="button"
              onClick={() => setQueuePhaseFilter('SAMPLE')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
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
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
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
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
                queuePhaseFilter === 'READY'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Ready
            </button>
          </div>

          {/* Right: Next / Prev Step Controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => handleScrollCarousel('left')}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent]"
              title="Scroll slide bar left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handlePrevPatient}
              disabled={currentPatientIndex <= 0}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent]"
              title="Switch to previous patient"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-extrabold text-indigo-900 font-mono shadow-2xs">
              {currentPatientIndex >= 0 ? `${currentPatientIndex + 1} / ${filteredPatients.length}` : '0 / 0'}
            </div>

            <button
              type="button"
              onClick={handleNextPatient}
              disabled={currentPatientIndex < 0 || currentPatientIndex >= filteredPatients.length - 1}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent]"
              title="Switch to next patient"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleScrollCarousel('right')}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent]"
              title="Scroll slide bar right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Horizontal Patient Carousel Track */}
        <div
          ref={carouselRef}
          data-lenis-prevent="true"
          className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scroll-smooth select-none"
        >
          {filteredPatients.length > 0 ? (
            filteredPatients.map((p, idx) => {
              const isSelected = (p.patientId || p.slNo) === (selectedPatient?.patientId || selectedPatient?.slNo);
              const pId = p.patientId || p.slNo;

              return (
                <div
                  key={pId || idx}
                  data-patient-id={pId}
                  onClick={() => handleSelectPatient(p)}
                  className={`min-w-[220px] max-w-[250px] shrink-0 rounded-xl p-2.5 cursor-pointer transition-all outline-none focus:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-700 text-white shadow-md ring-2 ring-indigo-400/60 border border-indigo-500 scale-[1.01]'
                      : 'bg-slate-50/90 hover:bg-slate-100/90 text-slate-800 border border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        #{idx + 1}
                      </span>
                      <span
                        className={`font-mono font-bold text-[11px] px-1.5 py-0.2 rounded border ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-blue-50 text-blue-700 border-blue-200/70'
                        }`}
                      >
                        {p.slNo || p.barcode || '-'}
                      </span>
                    </div>
                    <StatusBadge status={p.status || 'SAMPLE'} />
                  </div>

                  <div className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`} title={p.name}>
                    {p.name}
                  </div>

                  <div className={`text-[10px] flex items-center justify-between mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    <span>{formatGender(p.gender)} • {p.age || '-'}Y</span>
                    <span className="font-mono">{formatDisplayDate(p.regDate)}</span>
                  </div>

                  {p.referedDr && (
                    <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`} title={`Ref: ${p.referedDr}`}>
                      Ref: {p.referedDr}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="w-full py-6 text-center text-slate-400 text-xs font-semibold">
              No patients match current filters.
            </div>
          )}
        </div>
      </div>

      {/* 2. RESULTS ENTRY WORKSTATION: Full-width Results Bench, Filters & Test Evaluation Panel */}
      <div className="w-full">
        {selectedPatient ? (
          <ResultsEntry
            key={selectedPatient.patientId || selectedPatient.slNo}
            patient={selectedPatient}
            reports={reports}
            templates={templates}
            onRefresh={() => loadPatientReport(selectedPatient)}
          />
        ) : (
          <div className="bg-white p-16 text-center text-slate-400 rounded-2xl border border-slate-200">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <span className="font-semibold text-xs">Select a patient order from the top slide bar to enter test values.</span>
          </div>
        )}
      </div>

      <ClinicalGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </section>
  );
}
