import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  RefreshCw,
  FileText,
  AlertCircle,
  Edit,
} from 'lucide-react';
import api, { openBillingPdf, getBillingPdfUrl } from '../../services/api';

export default function BillPreviewModal({
  isOpen,
  onClose,
  patientId,
  patientName = '',
  onOpenEditBill,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);

  const cleanPid = patientId
    ? String(patientId).trim().toUpperCase().startsWith('P')
      ? `P${String(patientId).trim().replace(/^P+/i, '')}`
      : `P${String(patientId).trim()}`
    : '';

  const pdfUrl = cleanPid ? getBillingPdfUrl(cleanPid, { preview: true }) : '';

  useEffect(() => {
    if (isOpen && cleanPid) {
      setLoading(true);
      setError('');
    }
  }, [isOpen, cleanPid]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
        return;
      } catch (e) {
        console.warn('Iframe print fallback:', e);
      }
    }
    openBillingPdf(cleanPid, { preview: true });
  };

  const handleDownload = () => {
    if (!cleanPid) return;
    window.open(getBillingPdfUrl(cleanPid, { download: true }), '_blank');
  };

  const handleOpenExternal = () => {
    openBillingPdf(cleanPid, { preview: true });
  };

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        data-lenis-prevent="true"
        className="bg-white rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-5xl h-[min(92vh,900px)] flex flex-col my-auto overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white truncate">
                  Bill Preview
                </h3>
                {patientName && (
                  <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 truncate max-w-[220px]">
                    {patientName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Direct official invoice from AWS server • Preview before download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenEditBill && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditBill(cleanPid);
                }}
                className="p-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs flex items-center justify-center"
                title="Edit invoice particulars and pricing (BILLUPDATE)"
                aria-label="Edit Bill"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                if (iframeRef.current && pdfUrl) {
                  setLoading(true);
                  iframeRef.current.src = pdfUrl;
                }
              }}
              className="p-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center justify-center"
              title="Reload Bill"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleOpenExternal}
              className="p-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs flex items-center justify-center"
              title="Open full page in new browser tab"
              aria-label="Open in Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* DOWNLOAD BUTTON */}
            <button
              onClick={handleDownload}
              className="p-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs flex items-center justify-center"
              title="Download PDF file"
              aria-label="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* PRINT BUTTON */}
            <button
              onClick={handlePrint}
              className="p-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs flex items-center justify-center"
              title="Print Bill"
              aria-label="Print"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Preview (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - PDF Document Preview */}
        <div className="flex-1 w-full bg-slate-100 relative min-h-0">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-xs">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
              <span className="text-sm font-semibold text-slate-800">
                Fetching authentic bill preview from AWS server...
              </span>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Unable to Load Bill Preview
              </h3>
              <p className="text-xs text-slate-500 max-w-md mb-4">{error}</p>
              <button
                onClick={handleOpenExternal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Open in New Tab Directly
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe
              key={pdfUrl}
              ref={iframeRef}
              src={pdfUrl}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError('Unable to embed bill preview inline. Click below to open in a new tab.');
              }}
              title={`AWS Bill Preview - ${cleanPid}`}
              className="w-full h-full border-0 bg-white"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
