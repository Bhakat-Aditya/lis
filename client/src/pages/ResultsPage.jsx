import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ResultsEntry from '../components/results/ResultsEntry.jsx';
import { FlaskConical, Search, RefreshCw, UserCheck, CheckCircle } from 'lucide-react';
import { StatusBadge } from '../components/common/Badge.jsx';

export default function ResultsPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLabWorklist = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/list');
      const allPatients = res.data?.patients || [];
      // Technicians work primarily on SAMPLE, SAVED, or REGISTERED
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

  const filteredPatients = patients.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Laboratory Results Entry Workstation</h1>
            <p className="text-xs text-slate-500">Enter and compute biochemical, hematological & microbiological values</p>
          </div>
        </div>

        <button
          onClick={fetchLabWorklist}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Worklist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Patient Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter patient queue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredPatients.map((p) => {
              const isSelected = selectedPatient?.patientId === p.patientId;
              return (
                <div
                  key={p.patientId}
                  onClick={() => loadPatientReport(p)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-indigo-700 font-mono">{p.patientId}</span>
                    <StatusBadge status={p.status || 'SAMPLE'} />
                  </div>
                  <div className="font-semibold text-slate-900 text-xs">{p.name}</div>
                  <div className="text-[11px] text-slate-500 flex justify-between mt-0.5">
                    <span>{p.gender} / {p.age}</span>
                    <span>SL: {p.slNo}</span>
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
            <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
              Select a patient from the queue to start entering test results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
