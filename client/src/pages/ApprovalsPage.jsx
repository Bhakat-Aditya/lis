import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DoctorApprovalModal from '../components/results/DoctorApprovalModal.jsx';
import { CheckCircle, ShieldCheck, RefreshCw, FileText, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../components/common/Badge.jsx';

export default function ApprovalsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchPendingApproval = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/list');
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
      const res = await api.get('/reports/patient-report', {
        params: { patientId: patient.patientId },
      });
      setReports(res.data?.reports || []);
      setShowModal(true);
    } catch (err) {
      alert('Failed to load patient report');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Doctor Verification & Approvals</h1>
            <p className="text-xs text-slate-500">Pathologist sign-off, clinical correlation & dispatch authorization</p>
          </div>
        </div>

        <button
          onClick={fetchPendingApproval}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
          Worklist Queue ({patients.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-4 w-20">PID</th>
                <th className="py-2.5 px-4">Patient Name</th>
                <th className="py-2.5 px-4">Age / Gender</th>
                <th className="py-2.5 px-4">Referred By</th>
                <th className="py-2.5 px-4">Collection Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => (
                <tr key={p.patientId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{p.patientId}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{p.age} / {p.gender}</td>
                  <td className="py-2.5 px-4 text-slate-700">{p.referedDr || 'Self'}</td>
                  <td className="py-2.5 px-4 text-slate-500">{p.regDate?.substring(0, 10)}</td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={p.status || 'SAVED'} />
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => openApprovalModal(p)}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Review & Sign</span>
                    </button>
                  </td>
                </tr>
              ))}
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
