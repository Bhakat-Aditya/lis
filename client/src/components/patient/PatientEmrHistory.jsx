import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  User,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Archive,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api.js';
import { formatEmrDate } from '../../utils/dateUtils.js';

export default function PatientEmrHistory({
  patientId,
  currentPatient,
  onOpenReport,
}) {
  const navigate = useNavigate();
  const [emrList, setEmrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const cleanPid = patientId
    ? String(patientId).toUpperCase().startsWith('P')
      ? `P${String(patientId).replace(/^P+/i, '')}`
      : `P${patientId}`
    : '';

  const fetchEmrHistory = async () => {
    if (!cleanPid) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/patients/emr', {
        params: { patientId: cleanPid },
      });
      const list = res.data?.emrlist || [];
      setEmrList(list);
    } catch (err) {
      console.warn('Failed to fetch patient EMR history:', err.message);
      setError('Unable to load EMR archive for this patient.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cleanPid) {
      fetchEmrHistory();
    }
  }, [cleanPid]);

  const currentPidStr = String(currentPatient?.patientId || cleanPid || '').trim().toUpperCase();
  const currentSlNo = String(currentPatient?.slNo || '').trim();

  // If collapsed, display a sleek teaser bar
  if (isCollapsed) {
    return (
      <div className="w-full bg-white rounded-xl border border-cyan-200 shadow-xs overflow-hidden transition-all">
        <div
          onClick={() => setIsCollapsed(false)}
          className="bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 px-4 py-2.5 flex items-center justify-between text-white cursor-pointer hover:brightness-105 transition-all select-none"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse shadow-xs" />
            <span className="font-extrabold text-xs sm:text-sm tracking-wide">
              Patient* EMR History
            </span>
            <span className="text-[11px] opacity-90 hidden sm:inline">
              ({emrList.length} record{emrList.length === 1 ? '' : 's'} available - Click to view)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-pink-600 text-white font-mono font-extrabold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shadow-2xs">
              EMR_ARCHIVE
            </span>
            <button
              type="button"
              className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              title="Expand records"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-cyan-300/80 shadow-xs overflow-hidden transition-all">
      {/* Header Banner - Matching Screenshot 1 */}
      <div className="bg-[#00c5c8] px-4 py-3 flex items-center justify-between text-white select-none">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff007f] ring-2 ring-white/50 shrink-0" />
          <h2 className="text-xs sm:text-sm font-extrabold tracking-wide">
            Patient* EMR History <span className="font-normal text-white/90 text-xs hidden sm:inline">(Click to view records)</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-[#ff007f] text-white font-mono font-extrabold text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded shadow-2xs uppercase tracking-wider">
            EMR_ARCHIVE
          </span>

          <button
            type="button"
            onClick={fetchEmrHistory}
            disabled={loading}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white cursor-pointer"
            title="Refresh EMR history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white cursor-pointer"
            title="Collapse EMR section"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading && emrList.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-600 animate-spin" />
          <span className="font-semibold">Retrieving patient EMR archives...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchEmrHistory}
            className="text-xs font-bold underline hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : emrList.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs italic">
          No prior clinical EMR records found for this patient.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider bg-slate-50/70">
                <th className="py-2.5 px-4 min-w-[150px]">REGISTRATION DATE</th>
                <th className="py-2.5 px-4 min-w-[200px]">SL NO. / PATIENT</th>
                <th className="py-2.5 px-4 min-w-[130px]">AGE / GENDER</th>
                <th className="py-2.5 px-4 min-w-[120px]">MOBILE</th>
                <th className="py-2.5 px-4 text-center min-w-[120px]">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {emrList.map((item, idx) => {
                const itemPid = String(item.patientId || '').trim().toUpperCase();
                const itemSlNo = String(item.slNo || '').trim();
                const isCurrentCase =
                  itemPid === currentPidStr ||
                  (currentSlNo && itemSlNo === currentSlNo);

                const ageText = item.age || '—';
                const genderText = item.gender || '—';

                return (
                  <tr
                    key={item.patientId || item.slNo || idx}
                    className={`hover:bg-cyan-50/40 transition-colors ${
                      isCurrentCase ? 'bg-cyan-50/20' : ''
                    }`}
                  >
                    {/* Registration Date */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>{formatEmrDate(item.regDate)}</span>
                      </div>
                    </td>

                    {/* SL NO. / PATIENT */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-slate-700">
                          #{item.slNo || item.patientId}
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    {/* AGE / GENDER */}
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {ageText} / {genderText}
                    </td>

                    {/* MOBILE */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {item.mobile || '—'}
                    </td>

                    {/* ACTION */}
                    <td className="py-3 px-4 text-center">
                      {isCurrentCase ? (
                        <span className="text-slate-400 italic font-semibold text-xs select-none">
                          Current Case
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenReport) {
                              onOpenReport(item.patientId);
                            } else {
                              navigate(`/patients/${item.patientId}`);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 bg-[#00bdbe] hover:bg-cyan-600 active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                          title={`Open case record for ${item.name} (${item.patientId})`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Open Report</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Bar - Matching Screenshot 1 */}
      <div className="border-t border-slate-200/80 px-4 py-3 bg-white flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ff007f]">
          <User className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>* Results generated using name-based filtering only.</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="bg-[#ff007f] hover:bg-pink-700 active:scale-95 text-white font-bold text-xs px-5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
