import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { openBillingPdf, getBillingPdfUrl } from '../../services/api';

export default function AwsBillViewer({ patientId, onBack, title, refreshKey }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);

  const cleanPid = patientId
    ? String(patientId).trim().toUpperCase().startsWith('P')
      ? `P${String(patientId).trim().replace(/^P+/i, '')}`
      : `P${String(patientId).trim()}`
    : '';

  const billPdfUrl = cleanPid ? getBillingPdfUrl(cleanPid, { preview: true }) : '';

  useEffect(() => {
    setLoading(true);
    setError('');
  }, [cleanPid, refreshKey]);

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
        return;
      } catch {
        // Fallback
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
    <div className="flex flex-col h-[calc(100vh-130px)] min-h-[680px] w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              {title || 'AWS Official Bill'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (iframeRef.current && billPdfUrl) {
                setLoading(true);
                iframeRef.current.src = billPdfUrl;
              }
            }}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Reload authentic bill from AWS server"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenExternal}
            className="p-2 text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs"
            title="Open official AWS Bill in a new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs"
            title={`Download official PDF as Bill_${cleanPid}.pdf`}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="p-2 text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs"
            title="Print official AWS Bill"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bill Viewport - Direct Authentic AWS PDF */}
      <div className="flex-1 w-full bg-slate-200/80 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-semibold text-slate-800">
              Loading authentic bill directly from AWS server...
            </span>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Unable to Load AWS Bill
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">{error}</p>
            <button
              onClick={handleOpenExternal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Open in New Tab Directly
            </button>
          </div>
        ) : billPdfUrl ? (
          <iframe
            key={billPdfUrl}
            ref={iframeRef}
            src={billPdfUrl}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Unable to embed bill preview inline. Click below to open in a new tab.');
            }}
            title={`AWS Bill - ${cleanPid}`}
            className="w-full h-full border-0 bg-white"
          />
        ) : null}
      </div>
    </div>
  );
}
