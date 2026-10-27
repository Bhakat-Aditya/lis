import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  Loader2,
  Send,
  TestTube,
  Trash2,
  Upload,
  MessageSquare,
  X,
} from 'lucide-react';

/**
 * Universal Confirmation Dialog for high-impact and side-effect operations:
 * - Upload Order (UPLOADORDER)
 * - Sample Receive (RECEIVESAMPLE)
 * - Release Report (RELEASEREPORT)
 * - WhatsApp Resend (SENDWHATSAPP)
 * - Delete Test Parameter
 */
export default function ConfirmationModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Please Confirm',
  message = 'Are you sure you want to proceed with this operation?',
  description = null,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning', // 'warning' | 'danger' | 'info' | 'success' | 'indigo' | 'teal'
  icon = null,
  loading = false,
}) {
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInternalLoading(false);
    }
  }, [isOpen]);

  // Handle ESC key to cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading && !internalLoading) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, internalLoading, onClose]);

  if (!isOpen) return null;

  const isProcessing = loading || internalLoading;

  const handleConfirmClick = async () => {
    if (isProcessing) return;
    try {
      setInternalLoading(true);
      if (onConfirm) {
        await onConfirm();
      }
    } finally {
      setInternalLoading(false);
    }
  };

  // Variant themes
  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-100 text-rose-600 border-rose-200',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-rose-200',
      defaultIcon: Trash2,
      ring: 'ring-rose-400/30',
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-amber-200',
      defaultIcon: AlertTriangle,
      ring: 'ring-amber-400/30',
    },
    success: {
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-200',
      defaultIcon: CheckCircle2,
      ring: 'ring-emerald-400/30',
    },
    info: {
      iconBg: 'bg-sky-100 text-sky-700 border-sky-200',
      confirmBtn: 'bg-sky-600 hover:bg-sky-700 active:scale-95 text-white shadow-sky-200',
      defaultIcon: Info,
      ring: 'ring-sky-400/30',
    },
    indigo: {
      iconBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-indigo-200',
      defaultIcon: HelpCircle,
      ring: 'ring-indigo-400/30',
    },
    teal: {
      iconBg: 'bg-teal-100 text-teal-700 border-teal-200',
      confirmBtn: 'bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-teal-200',
      defaultIcon: Send,
      ring: 'ring-teal-400/30',
    },
    whatsapp: {
      iconBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-300',
      defaultIcon: MessageSquare,
      ring: 'ring-emerald-400/30',
    },
  };

  const style = variantStyles[variant] || variantStyles.warning;
  const IconComponent = icon || style.defaultIcon;

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={() => {
        if (!isProcessing) onClose?.();
      }}
    >
      <div
        data-lenis-prevent="true"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md my-auto transform transition-all overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${style.iconBg}`}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Confirmation Required
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-3 text-xs text-slate-700 space-y-2">
          <div className="font-medium text-slate-800 leading-relaxed text-[13px]">
            {message}
          </div>

          {description && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-normal">
              {description}
            </div>
          )}
        </div>

        {/* Modal Footer (Cancel / Confirm) */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 ${style.confirmBtn}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
