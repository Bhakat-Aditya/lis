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
  Clock,
  Loader2,
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
  const [activeAction, setActiveAction] = useState(null);
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

  // Check for parameters without entered results
  const unenteredReports = reports.filter((r) => !r.resultData || String(r.resultData).trim() === '');

  // Determine stage progression
  const statusStr = String(patient.status || '').toUpperCase();
  const isVerified = ['VERIFIED', 'APPROVED', 'PRINTING', 'RELEASED'].includes(statusStr);
  const isApproved = ['APPROVED', 'PRINTING', 'RELEASED'].includes(statusStr);
  const isReleased = ['RELEASED', 'PRINTING'].includes(statusStr);

  const handleAction = async (actionType) => {
    setActiveAction(actionType);
    setError('');

    try {
      const rawPid = patient.patientId || patient.slNo || patient.id;
      if (!rawPid) {
        throw new Error('Patient ID is missing.');
      }
      const cleanPatientId = String(rawPid).trim().toUpperCase().startsWith('P')
        ? `P${String(rawPid).trim().replace(/^P+/i, '')}`
        : `P${String(rawPid).trim()}`;

      if (actionType === 'verify') {
        await api.post('/reports/verify', { patientId: cleanPatientId });
      } else if (actionType === 'approve') {
        await api.post('/reports/approve', { patientId: cleanPatientId });
      } else if (actionType === 'release') {
        await api.post('/reports/release', { patientId: cleanPatientId });
      } else if (actionType === 'reject') {
        await api.post('/reports/reject', {
          patientId: cleanPatientId,
          reason: rejectReason || 'Flagged for recollection / re-test',
        });
      }

      if (onApproved) onApproved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.Message || `Action ${actionType} failed`);
    } finally {
      setActiveAction(null);
    }
  };

  const loading = activeAction !== null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Doctor Verification & Pathologist Sign-Off — ${patient.name}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-3 text-xs">
          {error && (
            <div className="p-2.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold text-xs">
              {error}
            </div>
          )}

          {/* Compact Clinical Command Strip: Patient Info & 4-Stage Lifecycle */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-2.5 sm:px-3 flex flex-wrap items-center justify-between gap-2.5">
            {/* Left: Patient Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                #{patient.patientId || patient.slNo}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                    {patient.name}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                    {patient.gender || '-'} • {patient.age || '-'} Y
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded shrink-0">
                    {patient.status || 'SAVED'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Ref: <strong className="text-slate-600 font-medium">{patient.referedDr || 'Self Referral'}</strong> • Reg: {formatDisplayDate(patient.regDate)}
                </div>
              </div>
            </div>

            {/* Right: Inline 4-Step Pipeline */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] shrink-0">
              <span className="text-emerald-700 font-bold">1. Entry ✓</span>
              <span className="text-slate-300">→</span>
              <span className={`font-semibold ${isVerified ? 'text-teal-700 font-bold' : 'text-slate-400'}`}>
                2. Verified {isVerified && '✓'}
              </span>
              <span className="text-slate-300">→</span>
              <span className={`font-semibold ${isApproved ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                3. Approved {isApproved && '✓'}
              </span>
              <span className="text-slate-300">→</span>
              <span className={`font-semibold ${isReleased ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>
                4. Released {isReleased && '✓'}
              </span>
            </div>
          </div>

          {/* Compact Clinical Abnormalities / Panic Alert Banner */}
          {abnormalTests.length > 0 ? (
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 text-amber-900 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-bold text-xs shrink-0">{abnormalTests.length} Abnormal Flag(s):</span>
                <span className="truncate text-[11px] text-amber-800">
                  {abnormalTests.map((t) => `${t.testName} (${t.resultData} ${t.unit || ''})`).join(' • ')}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded shrink-0">
                Carefully Review
              </span>
            </div>
          ) : unenteredReports.length === 0 ? (
            <div className="px-3 py-1 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-medium">All recorded parameters are within standard reference ranges.</span>
            </div>
          ) : null}

          {/* Missing Results Advisory */}
          {unenteredReports.length > 0 && (
            <div className="px-3 py-1 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-2 text-[11px] text-blue-800">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span><strong>{unenteredReports.length} parameter(s)</strong> have no value recorded yet. Ensure findings are filled before sign-off.</span>
            </div>
          )}

          {/* Diagnostic Results Table with Gauges */}
          <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">
                Review Laboratory Findings ({reports.length} Tests)
              </span>
              <button
                type="button"
                onClick={() => setGuideModalOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Clinical Handbook</span>
              </button>
            </div>

            <div
              data-lenis-prevent="true"
              className="divide-y divide-slate-100 max-h-[min(38vh,250px)] overflow-y-auto"
            >
              {reports.length > 0 ? (
                reports.map((r, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2.5"
                  >
                    <div className="md:w-1/3 min-w-0">
                      <span className="font-bold text-slate-900 text-xs block truncate">{r.testName}</span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {r.method || 'Standard Analyzer'} • {r.sampleType || 'Serum'}
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

                    <div className="md:w-1/6 text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 block">Report ID</span>
                      <span className="font-mono font-bold text-slate-700 text-xs">#{r.reportId}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">
                  No lab test parameters found for this order.
                </div>
              )}
            </div>
          </div>

          {/* Rejection Input */}
          {showRejectInput && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <label className="font-bold text-rose-900 block text-xs">
                Reason for Rejection / Sample Recollection:
              </label>
              <input
                type="text"
                placeholder="e.g. Lipemic serum interfering with optical readings, request fresh redraw..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  disabled={loading}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('reject')}
                  disabled={loading}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {activeAction === 'reject' ? 'Flagging...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}

          {/* Compact Bottom Bar: Doctor Digital Seal + Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
            {/* Left: Doctor Seal Badge */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300 shrink-0">
                <Award className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-xs text-slate-900">Dr. S. K. Roy, MD (Path)</div>
                <div className="text-[10px] text-slate-400">Reg #WBMC-48291 • Lab Director (Digital Seal)</div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Flag Re-Test</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleAction('verify')}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title="Mark report verified after technical check"
              >
                {activeAction === 'verify' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Verify (Stage 1)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white rounded-lg font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                title="Affix doctor digital signature and approve report"
              >
                {activeAction === 'approve' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Approve & Sign-Off</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('release')}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title="Release report for final printing and WhatsApp dispatch"
              >
                {activeAction === 'release' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Release (Stage 3)</span>
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
