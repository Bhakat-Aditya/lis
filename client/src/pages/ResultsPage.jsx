import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import ResultsEntry from '../components/results/ResultsEntry.jsx';
import { FlaskConical, Search, RefreshCw, UserCheck, CheckCircle, BookOpen, Clock } from 'lucide-react';
import { StatusBadge } from '../components/common/Badge.jsx';
import ClinicalGuideModal from '../components/common/ClinicalGuideModal.jsx';
import { formatDisplayDate, sortPatientsByRecent } from '../utils/dateUtils.js';

export default function ResultsPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const fetchLabWorklist = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/list', { params: { allDates: 'true' } });
      const allPatients = sortPatientsByRecent(res.data?.patients || []);
      setPatients(allPatients);
      if (allPatients.length > 0 && !selectedPatient) {
        loadPatientReport(allPatients[0]);
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
      const res = await api.get('/reports/patient-report', {
        params: { patientId: patient.patientId },
      });
      setReports(res.data?.reports || []);
      setTemplates(res.data?.templates || []);
    } catch (err) {
      console.warn('Error loading tests for patient:', err.message);
    }
  };

  useEffect(() => {
    fetchLabWorklist();
  }, []);

  const filteredPatients = sortPatientsByRecent(
    patients.filter((p) => {
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
    <section className="space-y-5">
      <Helmet>
        <title>Laboratory Results Entry Workstation | Lab Expert LIS</title>
        <meta
          name="description"
          content="Technician workstation for recording, calculating, and analyzing diagnostic hematology, biochemistry, and serology parameters."
        />
      </Helmet>

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold shadow-2xs">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Laboratory Results Entry Workstation
              </h1>
              <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                Auto-Analyzer Bench
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Input and correlate biochemical, hematological & microbiological values with live reference meters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Clinical Reference Guide</span>
          </button>

          <button
            onClick={fetchLabWorklist}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Patient Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient queue..."
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
          </div>

          <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
            {filteredPatients.map((p) => {
              const isSelected = selectedPatient?.patientId === p.patientId;
              return (
                <div
                  key={p.patientId}
                  onClick={() => loadPatientReport(p)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/90 border-l-4 border-indigo-600 shadow-2xs'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-indigo-700 font-mono">#{p.patientId || p.slNo}</span>
                    <StatusBadge status={p.status || 'SAMPLE'} />
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                  <div className="text-[11px] text-slate-500 flex justify-between mt-1">
                    <span>{p.gender} • {p.age}</span>
                    <span className="font-mono text-slate-500 font-medium text-[10px]">{formatDisplayDate(p.regDate)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Results Entry Table (8 cols) */}
        <div className="lg:col-span-8">
          {selectedPatient ? (
            <ResultsEntry
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
