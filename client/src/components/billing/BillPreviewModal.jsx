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
import api from '../../services/api';

export default function BillPreviewModal({
  isOpen,
  onClose,
  patientId,
  patientName = '',
  onOpenEditBill,
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);

  const cleanPid = patientId
    ? String(patientId).trim().toUpperCase().startsWith('P')
      ? `P${String(patientId).trim().replace(/^P+/i, '')}`
      : `P${String(patientId).trim()}`
    : '';

  const loadBillPdf = async () => {
    if (!cleanPid) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/billing/pdf', {
        params: { patientId: cleanPid },
        responseType: 'blob',
      });

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setBlobUrl(url);
    } catch (err) {
      console.error('Failed to load bill preview:', err);
      setError(
        err.response?.data?.Message ||
          'Unable to load bill preview from AWS server. Please check if this patient has billed investigations.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && cleanPid) {
      loadBillPdf();
    } else {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setError('');
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
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
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `Bill_${cleanPid}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenExternal = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    } else {
      const token = localStorage.getItem('token');
      window.open(`/api/billing/pdf?patientId=${cleanPid}${token ? `&token=${token}` : ''}`, '_blank');
    }
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
                <span className="font-mono text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  {cleanPid}
                </span>
                {patientName && (
                  <span className="text-xs text-slate-300 font-medium truncate max-w-[200px]">
                    • {patientName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Direct official invoice from AWS server • Preview before download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenEditBill && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditBill(cleanPid);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                title="Edit invoice particulars and pricing (BILLUPDATE)"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Bill</span>
              </button>
            )}

            <button
              onClick={loadBillPdf}
              disabled={loading}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              title="Reload Bill"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              onClick={handleOpenExternal}
              disabled={!blobUrl}
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              title="Open full page in browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </button>

            {/* DOWNLOAD BUTTON - user can download if they want */}
            <button
              onClick={handleDownload}
              disabled={!blobUrl}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              title="Download PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* PRINT BUTTON */}
            <button
              onClick={handlePrint}
              disabled={!blobUrl}
              className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              title="Print Bill"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Preview (Esc)"
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
              <span className="text-xs text-slate-500 mt-1 font-mono">
                Patient ID: {cleanPid}
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
                onClick={loadBillPdf}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : blobUrl ? (
            <iframe
              ref={iframeRef}
              src={blobUrl}
              title={`AWS Bill Preview - ${cleanPid}`}
              className="w-full h-full border-0 bg-white"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
