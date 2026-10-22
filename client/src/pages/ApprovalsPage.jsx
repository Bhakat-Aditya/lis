import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import DoctorApprovalModal from '../components/results/DoctorApprovalModal.jsx';
import {
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  FileText,
  ChevronRight,
  Search,
  Filter,
  UserCheck,
  AlertTriangle,
  Stethoscope,
} from 'lucide-react';
import { StatusBadge } from '../components/common/Badge.jsx';
import { formatDisplayDate, sortPatientsByRecent } from '../utils/dateUtils.js';

export default function ApprovalsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchPendingApproval = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/list', { params: { allDates: 'true' } });
      setPatients(res.data?.patients || []);
    } catch (err) {
      console.warn('Error loading approval worklist:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApproval();
  }, []);

  const openApprovalModal = async (patient) => {
    setSelectedPatient(patient);
    try {
      const pid = patient.patientId || patient.slNo || patient.id;
      const res = await api.get('/reports/patient-report', {
        params: { patientId: pid },
      });
      setReports(res.data?.reports || []);
      setShowModal(true);
    } catch (err) {
      console.warn('Failed to load patient report:', err.message);
      setReports([]);
      setShowModal(true);
    }
  };

  const filteredPatients = sortPatientsByRecent(
    patients.filter((p) => {
      const s = String(p.status || '').toUpperCase();
      if (statusFilter === 'VERIFIED' && s !== 'VERIFIED') return false;
      if (statusFilter === 'SAVED' && s !== 'SAVED' && s !== 'TESTING') return false;
      if (statusFilter === 'APPROVED' && s !== 'APPROVED' && s !== 'PRINTING' && s !== 'RELEASED') return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase().trim();
      const name = String(p.name || '').toLowerCase();
      const pid = String(p.patientId || '').toLowerCase();
      const slNo = String(p.slNo || '').toLowerCase();
      const phone = String(p.mobile || p.phone || '').toLowerCase();
      const doctor = String(p.referedDr || '').toLowerCase();

      return (
        name.includes(term) ||
        pid.includes(term) ||
        slNo.includes(term) ||
        phone.includes(term) ||
        doctor.includes(term)
      );
    })
  );

  const verifiedCount = patients.filter((p) => String(p.status).toUpperCase() === 'VERIFIED').length;
  const testingCount = patients.filter((p) => ['SAVED', 'TESTING', 'SAMPLE'].includes(String(p.status).toUpperCase())).length;
  const approvedCount = patients.filter((p) => ['APPROVED', 'PRINTING', 'RELEASED'].includes(String(p.status).toUpperCase())).length;

  return (
    <div className="space-y-4">
      <Helmet>
        <title>Doctor Verifications & Pathologist Sign-Off | Lab Expert LIS</title>
        <meta
          name="description"
          content="Authorized pathologist review, clinical correlation, and digital verification sign-off workstation."
        />
      </Helmet>

      {/* Header Banner */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shadow-2xs shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Pathologist Sign-Off & Verification Workstation
              </h1>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                Clinical Review Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pathology validation, critical panic alerts confirmation, and digital signature authorization
            </p>
          </div>
        </div>

        <button
          onClick={fetchPendingApproval}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setStatusFilter(statusFilter === 'SAVED' ? 'ALL' : 'SAVED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all select-none ${
            statusFilter === 'SAVED' ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Testing / Tech Entry Queue
          </span>
          <div className="text-2xl font-extrabold text-slate-900">{testingCount}</div>
          <span className="text-[11px] text-purple-700 font-semibold mt-1 inline-block">Values being recorded</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all select-none ${
            statusFilter === 'VERIFIED' ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Pending Doctor Final Sign-Off
          </span>
          <div className="text-2xl font-extrabold text-teal-700">{verifiedCount}</div>
          <span className="text-[11px] text-teal-700 font-semibold mt-1 inline-block">Ready for pathologist seal</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all select-none ${
            statusFilter === 'APPROVED' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Approved & Released Reports
          </span>
          <div className="text-2xl font-extrabold text-emerald-700">{approvedCount}</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">Printed or sent via WhatsApp</span>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient Name, PID, Doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
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

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing: <strong>{filteredPatients.length}</strong> orders</span>
            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-3 px-4 w-24">PID</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Referring Consultant</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Stage Status</th>
                <th className="py-3 px-4 text-right">Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                    Loading clinical approval queue...
                  </td>
                </tr>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <tr key={p.patientId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      #{p.patientId || p.slNo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.mobile || 'No contact'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {p.age || '-'} Y / {p.gender || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.referedDr || 'Self'}</div>
                      <div className="text-[10px] text-slate-400">Consultant</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                      {formatDisplayDate(p.regDate)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status || 'SAVED'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openApprovalModal(p)}
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white font-bold text-xs py-1.5 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Review & Sign</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                    No patient records currently waiting in this verification filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      <DoctorApprovalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        patient={selectedPatient}
        reports={reports}
        onApproved={fetchPendingApproval}
      />
    </div>
  );
}
