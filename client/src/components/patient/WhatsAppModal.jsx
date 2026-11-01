import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import api from '../../services/api.js';
import {
  MessageSquare,
  UserCheck,
  FileText,
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Phone,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

/**
 * 4 WhatsApp Message Types according to Task - 11:
 * 1. Onboarding Message (sendType=onboardingMsg)
 * 2. Report to Patient (sendType=patientReportMsg)
 * 3. Report to Doctor (sendType=doctorReportMsg)
 * 4. Report to Referring Agent (sendType=agentReportMsg)
 */
export const WHATSAPP_TYPES = [
  {
    id: 'onboardingMsg',
    title: '1. Onboarding Message',
    shortLabel: 'Onboarding Msg',
    badge: 'Welcome & Reg',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: UserCheck,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 border-indigo-200',
    description:
      'Dispatches welcome greetings, Patient ID, Barcode, registration confirmation, and requisition summary.',
    recipientLabel: 'Patient Mobile',
    getRecipient: (p) => p?.mobile || 'No mobile registered',
    accentColor: 'indigo',
  },
  {
    id: 'patientReportMsg',
    title: '2. Report to Patient',
    shortLabel: 'Report to Patient',
    badge: 'Primary / Default',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: FileText,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200',
    description:
      'Dispatches official diagnostic PDF report link, verification QR code, and clinical summary directly to patient.',
    recipientLabel: 'Patient Mobile',
    getRecipient: (p) => p?.mobile || 'No mobile registered',
    accentColor: 'emerald',
  },
  {
    id: 'doctorReportMsg',
    title: '3. Report to Doctor',
    shortLabel: 'Report to Doctor',
    badge: 'Doctor Copy',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Stethoscope,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 border-blue-200',
    description:
      'Dispatches clinical diagnostics copy and critical panic values directly to the referring physician.',
    recipientLabel: 'Referring Doctor',
    getRecipient: (p) => p?.referedDr || 'Self / Registered Physician',
    accentColor: 'blue',
  },
  {
    id: 'agentReportMsg',
    title: '4. Report to Referring Agent',
    shortLabel: 'Report to Agent',
    badge: 'Partner / Center',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Building2,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 border-purple-200',
    description:
      'Dispatches diagnostic test completion notification, patient token, and collection copy to partner agent/center.',
    recipientLabel: 'Collection Center / Agent',
    getRecipient: (p) => p?.center || 'Main Collection Center',
    accentColor: 'purple',
  },
];

export default function WhatsAppModal({
  isOpen,
  onClose,
  patient,
  onSuccess,
  defaultType = 'patientReportMsg',
}) {
  const [selectedType, setSelectedType] = useState(defaultType);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  if (!patient) return null;

  const rawPid = patient.patientId || patient.slNo || '';
  const cleanPid = rawPid
    ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
    : '';

  const handleSend = async (targetSendType) => {
    const typeToSend = targetSendType || selectedType;
    if (!cleanPid) return;

    setLoading(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const res = await api.post('/reports/send-whatsapp', {
        patientId: cleanPid,
        sendType: typeToSend,
      });

      if (
        res.data?.STATUS === 'FAILED' ||
        res.data?.StatusCode === '1211' ||
        (res.data?.StatusCode && res.data?.StatusCode !== '0000')
      ) {
        throw new Error(res.data?.Message || 'Failed to dispatch WhatsApp message');
      }

      const activeMeta = WHATSAPP_TYPES.find((t) => t.id === typeToSend);
      const msg = res.data?.Message || `${activeMeta?.title || 'Notification'} dispatched via WhatsApp successfully!`;
      setSuccessNotice(msg);

      if (onSuccess) {
        onSuccess(typeToSend, msg);
      }
    } catch (err) {
      const msg = err.response?.data?.Message || err.message || 'Error dispatching WhatsApp message';
      setErrorNotice(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedMeta = WHATSAPP_TYPES.find((t) => t.id === selectedType) || WHATSAPP_TYPES[1];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title="WhatsApp Notification Hub"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs text-slate-800">
        {/* Patient & Recipient Summary Header */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">{patient.name}</span>
                <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                  #{patient.slNo || patient.barcode || cleanPid}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <strong className="text-slate-700">{patient.mobile || 'No mobile'}</strong>
                </span>
                <span>•</span>
                <span className="truncate max-w-[200px]">
                  Ref: <strong className="text-slate-700">{patient.referedDr || 'Self'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 shadow-2xs">
            Status: <span className="text-emerald-700 font-mono">{patient.status || 'REGISTERED'}</span>
          </div>
        </div>

        {/* Success Alert */}
        {successNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-emerald-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorNotice && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-rose-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 Message Type Selection Cards */}
        <div className="space-y-2">
          <label className="font-extrabold text-slate-700 flex items-center justify-between text-xs">
            <span>Select WhatsApp Message Type (4 Supported Channels):</span>
            <span className="text-[10px] font-mono text-slate-400">
              API Parameter: <code className="text-indigo-600 font-bold">sendType</code>
            </span>
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {WHATSAPP_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              const Icon = type.icon;
              const recipientVal = type.getRecipient(patient);

              return (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Radio dot */}
                      <div className="pt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${type.iconBg}`}
                      >
                        <Icon className={`w-4 h-4 ${type.iconColor}`} />
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{type.title}</span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full border ${type.badgeColor}`}
                          >
                            {type.badge}
                          </span>
                          <code className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded">
                            sendType={type.id}
                          </code>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                          {type.description}
                        </p>

                        <div className="text-[11px] text-slate-600 pt-0.5 flex items-center gap-1 font-medium">
                          <span className="text-slate-400">{type.recipientLabel}:</span>
                          <strong className="text-slate-800">{recipientVal}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Instant Direct Send Button for this card */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedType(type.id);
                        handleSend(type.id);
                      }}
                      className="self-center shrink-0 flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      title={`Directly send ${type.shortLabel} now`}
                    >
                      {loading && selectedType === type.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Send Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Selected Channel:{' '}
            <strong className="text-emerald-700 font-semibold">{selectedMeta.title}</strong> (
            <code className="text-indigo-600 font-mono font-bold">sendType={selectedType}</code>)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSend(selectedType)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching WhatsApp...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Dispatch {selectedMeta.shortLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

