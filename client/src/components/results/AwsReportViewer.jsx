import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  FileText,
  FileCheck,
} from 'lucide-react';
import { openReportPdf, getReportPdfUrl } from '../../services/api';

export default function AwsReportViewer({
  patientId,
  _patient,
  initialHeader = true,
  onHeaderChange,
  onBack,
  title,
  refreshKey,
}) {
  const [withHeader, setWithHeader] = useState(() => initialHeader !== false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);

  const cleanPid = patientId
    ? String(patientId).trim().toUpperCase().startsWith('P')
      ? `P${String(patientId).trim().replace(/^P+/i, '')}`
      : `P${String(patientId).trim()}`
    : '';

  useEffect(() => {
    setWithHeader(initialHeader !== false);
  }, [initialHeader]);

  const reportPdfUrl = cleanPid
    ? getReportPdfUrl(cleanPid, { addHeader: withHeader, preview: true })
    : '';

  useEffect(() => {
    setLoading(true);
    setError('');
  }, [cleanPid, withHeader, refreshKey]);

  const handleHeaderToggle = (wantsHeader) => {
    if (wantsHeader === withHeader) return;
    setWithHeader(wantsHeader);
    if (onHeaderChange) {
      onHeaderChange(wantsHeader);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
        return;
      } catch (e) {
        console.warn('Iframe print error:', e);
      }
    }
    openReportPdf(cleanPid, { addHeader: withHeader, preview: true });
  };

  const handleDownload = () => {
    if (!cleanPid) return;
    window.open(getReportPdfUrl(cleanPid, { addHeader: withHeader, download: true }), '_blank');
  };

  const handleOpenExternal = () => {
    openReportPdf(cleanPid, { addHeader: withHeader, preview: true });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] min-h-[680px] w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-xs font-bold text-white tracking-wide truncate">
              {title || 'AWS Official Diagnostic Report'}
            </span>
          </div>
        </div>

        {/* Header Toggle Options: With Header vs Without Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => handleHeaderToggle(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                withHeader
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Report with official letterhead header (header: true)"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>With Header</span>
            </button>
            <button
              type="button"
              onClick={() => handleHeaderToggle(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                !withHeader
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Report without header (header: false, for pre-printed stationery)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Without Header</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <button
            onClick={() => {
              if (iframeRef.current && reportPdfUrl) {
                setLoading(true);
                iframeRef.current.src = reportPdfUrl;
              }
            }}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Reload authentic report from AWS server"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenExternal}
            className="p-2 text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs"
            title="Open official AWS Report in a new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs"
            title={`Download official PDF as Report_${cleanPid}${withHeader ? '_WithHeader' : '_WithoutHeader'}.pdf`}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="p-2 text-white bg-teal-500 hover:bg-teal-600 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs"
            title="Print official AWS Diagnostic Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Viewport - Direct Authentic AWS PDF */}
      <div className="flex-1 w-full bg-slate-200/80 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mb-3" />
            <span className="text-sm font-semibold text-slate-800">
              Loading authentic diagnostic report directly from AWS server...
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Header mode: {withHeader ? 'With Header (header: true)' : 'Without Header (header: false)'}
            </span>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Unable to Load AWS Report
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">{error}</p>
            <button
              onClick={handleOpenExternal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Open in New Tab Directly
            </button>
          </div>
        ) : reportPdfUrl ? (
          <iframe
            key={reportPdfUrl}
            ref={iframeRef}
            src={reportPdfUrl}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Unable to embed report preview inline. Click below to open in a new tab.');
            }}
            className="w-full h-full border-0"
            title="AWS Diagnostic Report PDF"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No report available for this patient yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
