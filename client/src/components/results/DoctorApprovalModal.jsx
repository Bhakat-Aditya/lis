import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Award,
  BookOpen,
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../common/Modal.jsx';
import ReferenceRangeGauge from '../common/ReferenceRangeGauge.jsx';
import ClinicalGuideModal from '../common/ClinicalGuideModal.jsx';
import { formatDisplayDate } from '../../utils/dateUtils.js';

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
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [guideSearchTerm, setGuideSearchTerm] = useState('');

  if (!patient) return null;

  // Scan reports for abnormal or high/low results
  const abnormalTests = reports.filter((r) => {
    if (!r.resultData || !r.refRange || !r.refRange.includes('-')) return false;
    const parts = r.refRange.split('-').map((s) => parseFloat(s.replace(/[^0-9.]/g, '').trim()));
    const num = parseFloat(String(r.resultData).replace(/[^0-9.]/g, '').trim());
    if (isNaN(num) || parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return false;
    return num < parts[0] || num > parts[1];
  });

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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Doctor Verification & Pathologist Sign-Off — ${patient.name}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Patient Demographic Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Patient Name</span>
              <span className="font-extrabold text-slate-900 text-sm">{patient.name}</span>
              <span className="text-slate-500 block text-[11px]">{patient.gender} • {patient.age} Y</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Patient ID / SL</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">#{patient.patientId || patient.slNo}</span>
              <span className="text-slate-500 block text-[11px]">{formatDisplayDate(patient.regDate)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Referring Doctor</span>
              <span className="font-bold text-slate-900">{patient.referedDr || 'Self Referral'}</span>
              <span className="text-slate-400 block text-[11px]">Consultant</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Status</span>
              <span className="font-extrabold text-indigo-700 uppercase tracking-wide bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md inline-block mt-0.5">
                {patient.status}
              </span>
            </div>
          </div>

          {/* Clinical Abnormalities / Panic Alert Banner */}
          {abnormalTests.length > 0 ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="font-bold text-xs text-amber-900">
                  {abnormalTests.length} Parameter(s) Outside Standard Reference Range
                </h5>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Carefully review abnormal results before releasing. Tests flagged:{' '}
                  <strong>{abnormalTests.map((t) => `${t.testName} (${t.resultData} ${t.unit || ''})`).join(', ')}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-xs">All recorded test parameters are within normal clinical reference ranges.</span>
            </div>
          )}

          {/* Diagnostic Results Table with Gauges */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">Review Laboratory Findings ({reports.length})</span>
              <button
                onClick={() => setGuideModalOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Clinical Handbook</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto p-2 space-y-2">
              {reports.map((r, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="md:w-1/3">
                    <span className="font-bold text-slate-900 text-xs block">{r.testName}</span>
                    <span className="text-[11px] text-slate-400">
                      Method: {r.method || 'Standard Analyzer'} • Specimen: {r.sampleType || 'Serum'}
                    </span>
                  </div>

                  <div className="md:w-1/2">
                    <ReferenceRangeGauge
                      value={r.resultData}
                      refRange={r.refRange}
                      unit={r.unit}
                      testName={r.testName}
                    />
                  </div>

                  <div className="md:w-1/6 text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">Report ID</span>
                    <span className="font-mono font-bold text-slate-700 text-xs">#{r.reportId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Digital Signature & Verification Seal */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
                <Award className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Dr. S. K. Roy, MD (Pathology)</div>
                <div className="text-[11px] text-slate-500">
                  Reg #WBMC-48291 • Consultant Pathologist & Lab Director
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-right">
              Digital signature stamp will be affixed upon approval.
            </div>
          </div>

          {/* Rejection Input */}
          {showRejectInput && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <label className="font-bold text-rose-900 block text-xs">
                Reason for Rejection / Sample Recollection:
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Lipemic serum interfering with optical readings, please request fresh fasting redraw..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {/* Modal Action Buttons Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Flag Re-Test / Reject</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => handleAction('verify')}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify (Stage 1)</span>
              </button>

              <button
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white rounded-xl font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Sign-Off</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ClinicalGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        initialSearch={guideSearchTerm}
      />
    </>
  );
}
