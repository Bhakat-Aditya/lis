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
import api from '../../services/api';

export default function AwsBillViewer({ patientId, onBack, title }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);

  const cleanPid = patientId
    ? String(patientId).trim().toUpperCase().startsWith('P')
      ? `P${String(patientId).trim().replace(/^P+/i, '')}`
      : `P${String(patientId).trim()}`
    : '';

  const loadBill = async () => {
    if (!cleanPid) return;
    setLoading(true);
    setError('');
    try {
      // Stream authentic PDF directly from AWS via backend endpoint
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
      console.error('Failed to load authentic AWS bill:', err);
      setError(
        err.response?.data?.Message ||
          'Unable to load official bill directly from AWS server. Please ensure tests have been billed on upstream.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBill();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [cleanPid]);

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
      } catch {
        if (blobUrl) window.open(blobUrl, '_blank');
      }
    } else if (blobUrl) {
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
    <div className="flex flex-col h-[calc(100vh-130px)] min-h-[680px] w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              {title || 'AWS Official Bill'}
            </span>
            <span className="font-mono text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
              {cleanPid}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBill}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Reload authentic bill from AWS server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenExternal}
            disabled={!blobUrl}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Open official AWS Bill in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Tab</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!blobUrl}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Download official PDF as Bill_{cleanPid}.pdf"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!blobUrl}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Print official AWS Bill"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Bill</span>
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
              Unable to Load AWS Bill
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">{error}</p>
            <button
              onClick={loadBill}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : blobUrl ? (
          <iframe
            ref={iframeRef}
            src={blobUrl}
            title={`AWS Bill - ${cleanPid}`}
            className="w-full h-full border-0 bg-white"
          />
        ) : null}
      </div>
    </div>
  );
}
