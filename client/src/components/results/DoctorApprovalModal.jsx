import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../common/Modal.jsx';

export default function DoctorApprovalModal({
  isOpen,
  onClose,
  patient,
  reports = [],
  onApproved,
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!patient) return null;

  const handleAction = async (actionType) => {
    setLoading(true);
    setError('');

    try {
      if (actionType === 'verify') {
        await api.post('/reports/verify', { patientId: patient.patientId });
      } else if (actionType === 'approve') {
        await api.post('/reports/approve', { patientId: patient.patientId });
      } else if (actionType === 'release') {
        await api.post('/reports/release', { patientId: patient.patientId });
      } else if (actionType === 'reject') {
        await api.post('/reports/reject', {
          patientId: patient.patientId,
          reason: rejectReason,
        });
      }

      if (onApproved) onApproved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.Message || `Action ${actionType} failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Doctor Verification & Approval - ${patient.name} (${patient.patientId})`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Patient Summary Header */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient</span>
            <span className="font-bold text-slate-900">{patient.name}</span> ({patient.gender}/{patient.age})
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Ref By</span>
            <span className="font-medium text-slate-800">{patient.referedDr || 'Self'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Status</span>
            <span className="font-semibold text-indigo-700">{patient.status}</span>
          </div>
        </div>

        {/* Results Review Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Test</th>
                <th className="py-2 px-3">Ref Range</th>
                <th className="py-2 px-3">Result Value</th>
                <th className="py-2 px-3">Unit</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-800">{r.testName}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{r.refRange || '-'}</td>
                  <td className="py-2 px-3 font-bold text-slate-900 text-sm">{r.resultData || '-'}</td>
                  <td className="py-2 px-3 text-slate-500">{r.unit || '-'}</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {r.status || 'SAVED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rejection Reason Input */}
        {showRejectInput && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
            <label className="font-bold text-rose-800 block">Reason for Rejection / Retest</label>
            <textarea
              rows="2"
              placeholder="e.g. Hemolysed sample, out of biological limits, please repeat"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2 bg-white border border-rose-300 rounded text-xs focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectInput(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* Doctor Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={() => setShowRejectInput(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-medium transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject / Retest</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('verify')}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4 text-slate-600" />
              <span>Verify</span>
            </button>

            <button
              onClick={() => handleAction('approve')}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve Report</span>
            </button>

            <button
              onClick={() => handleAction('release')}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Release & Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
