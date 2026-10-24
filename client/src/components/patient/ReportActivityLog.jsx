import React, { useState, useEffect, useMemo } from 'react';
import {
  Terminal,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Search,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api.js';
import { formatLogDateTime } from '../../utils/dateUtils.js';

export default function ReportActivityLog({ patientId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanPid = patientId
    ? String(patientId).toUpperCase().startsWith('P')
      ? `P${String(patientId).replace(/^P+/i, '')}`
      : `P${patientId}`
    : '';

  const fetchLogs = async () => {
    if (!cleanPid) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/patients/logs', {
        params: { patientId: cleanPid },
      });
      const list = res.data?.logs || [];
      setLogs(list);
    } catch (err) {
      console.warn('Failed to load patient activity logs:', err.message);
      setError('Unable to fetch activity logs for this patient.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cleanPid) {
      fetchLogs();
    }
  }, [cleanPid]);

  const filteredLogs = useMemo(() => {
    if (!filterText.trim()) return logs;
    const q = filterText.toLowerCase();
    return logs.filter((l) => {
      const text = String(l.logText || '').toLowerCase();
      const dt = String(l.date || '').toLowerCase();
      return text.includes(q) || dt.includes(q);
    });
  }, [logs, filterText]);

  const handleCopyLogs = () => {
    const lines = filteredLogs.map((l) => {
      const formattedDate = formatLogDateTime(l.date) || l.date;
      const text = l.logText || '';
      const act = text.startsWith('ACTIVITY ->') ? text : `ACTIVITY -> ${text}`;
      return `[${formattedDate}]  ${act}`;
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCollapsed) {
    return (
      <div className="w-full bg-white rounded-xl border border-emerald-200 shadow-xs overflow-hidden transition-all">
        <div
          onClick={() => setIsCollapsed(false)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 flex items-center justify-between text-white cursor-pointer hover:brightness-105 transition-all select-none"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse shadow-xs" />
            <span className="font-extrabold text-xs sm:text-sm tracking-wide">
              Report Activity Log
            </span>
            <span className="text-[11px] opacity-90 hidden sm:inline">
              ({logs.length} activity event{logs.length === 1 ? '' : 's'} recorded - Click to expand console)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-700/80 text-white font-mono font-extrabold text-[10px] px-2 py-0.5 rounded tracking-wider border border-emerald-400/30">
              CONSOLE STANDBY
            </span>
            <button
              type="button"
              className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              title="Expand console"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0c1322] rounded-2xl border border-emerald-600/30 shadow-md overflow-hidden transition-all">
      {/* Header Banner - Matching Screenshot 3 */}
      <div className="bg-[#00a86b] px-4 py-3 flex items-center justify-between text-white select-none">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white ring-2 ring-emerald-200/50 shrink-0 shadow-xs" />
          <h2 className="text-xs sm:text-sm font-extrabold tracking-wide">
            Report Activity Log
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="bg-emerald-800/60 text-white font-mono font-extrabold text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded shadow-2xs tracking-wider border border-emerald-400/30">
            CONSOLE ACTIVE
          </span>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white cursor-pointer"
            title="Collapse console"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Toolbar (Filter & Copy) */}
      <div className="bg-[#080d19] px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter logs by keyword or test..."
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-md placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="text-[10px] text-slate-400 hover:text-slate-200 font-bold px-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700/60 transition-all cursor-pointer"
            title="Copy logs to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Logs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Body - Matching Screenshot 3 */}
      <div className="p-4 bg-[#0c1322] font-mono text-[11px] sm:text-xs leading-relaxed max-h-72 overflow-y-auto overflow-x-auto divide-y divide-transparent select-text">
        {loading && logs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
            <span>Connecting to laboratory audit stream...</span>
          </div>
        ) : error ? (
          <div className="py-4 text-rose-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-6 text-center text-slate-500 italic">
            {filterText ? 'No log lines matched your search.' : 'No activity logs registered for this patient case.'}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredLogs.map((log, idx) => {
              const formattedDate = formatLogDateTime(log.date) || log.date;
              const rawText = log.logText || '';
              const activityClean = rawText.startsWith('ACTIVITY ->')
                ? rawText.replace(/^ACTIVITY ->\s*/, '')
                : rawText;

              return (
                <div
                  key={log.logId || idx}
                  className="flex items-baseline gap-2.5 hover:bg-slate-900/60 px-2 py-0.5 rounded transition-colors"
                >
                  {/* Timestamp */}
                  <span className="text-cyan-400/90 font-mono shrink-0 select-all">
                    [{formattedDate}]
                  </span>

                  {/* Activity Prefix */}
                  <span className="text-emerald-400 font-bold shrink-0">
                    ACTIVITY -&gt;
                  </span>

                  {/* Log Content */}
                  <span className="text-emerald-100/90 break-words flex-1">
                    {activityClean}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Bar - Matching Screenshot 3 bottom right "Collapse Console" */}
      <div className="bg-[#080d19] px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
        <span className="text-slate-400">
          Showing {filteredLogs.length} of {logs.length} logged event{logs.length === 1 ? '' : 's'}
        </span>

        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
        >
          Collapse Console
        </button>
      </div>
    </div>
  );
}
