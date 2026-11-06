import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  User,
  ChevronDown,
  RefreshCw,
  Archive,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api.js';
import { formatEmrDate } from '../../utils/dateUtils.js';

const formatGender = (raw) => {
  const s = String(raw || '').trim().toLowerCase();
  if (s.startsWith('m')) return 'Male';
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('t') || s.startsWith('o')) return 'Transgender';
  return raw || '—';
};

export default function PatientEmrHistory({
  patientId,
  currentPatient,
  onOpenReport,
}) {
  const navigate = useNavigate();
  const [emrList, setEmrList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Minimized by default as requested by user
  const [isCollapsed, setIsCollapsed] = useState(true);

  const lastFetchedPidRef = useRef(null);
  const inFlightRef = useRef(false);

  const cleanPid = patientId
    ? String(patientId).toUpperCase().startsWith('P')
      ? `P${String(patientId).replace(/^P+/i, '')}`
      : `P${patientId}`
    : '';

  const fetchEmrHistory = async (forceRefresh = false) => {
    if (!cleanPid) return;
    if (inFlightRef.current) return;
    if (!forceRefresh && lastFetchedPidRef.current === cleanPid && emrList.length > 0) return;

    inFlightRef.current = true;
    lastFetchedPidRef.current = cleanPid;
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/patients/emr', {
        params: { patientId: cleanPid, ...(forceRefresh ? { fresh: 'true' } : {}) },
      });
      const list = res.data?.emrlist || [];
      setEmrList(list);
    } catch (err) {
      console.warn('Failed to fetch patient EMR history:', err.message);
      setError('Unable to load EMR archive for this patient.');
      lastFetchedPidRef.current = null;
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cleanPid) return;

    // Guard against React StrictMode double invocation and redundant re-renders
    if (lastFetchedPidRef.current === cleanPid || inFlightRef.current) {
      return;
    }

    let isMounted = true;
    inFlightRef.current = true;
    lastFetchedPidRef.current = cleanPid;
    setLoading(true);
    setError('');

    api
      .get('/patients/emr', {
        params: { patientId: cleanPid },
      })
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.emrlist || [];
        setEmrList(list);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to fetch patient EMR history:', err.message);
        setError('Unable to load EMR archive for this patient.');
        lastFetchedPidRef.current = null;
      })
      .finally(() => {
        inFlightRef.current = false;
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanPid]);

  const currentPidStr = String(currentPatient?.patientId || cleanPid || '').trim().toUpperCase();
  const currentSlNo = String(currentPatient?.slNo || '').trim();

  return (
    <div className="w-full bg-white rounded-2xl border border-cyan-300/80 shadow-xs overflow-hidden transition-all duration-300">
      {/* Clickable Header Bar - Toggles Dropdown */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 px-4 py-3 flex items-center justify-between text-white cursor-pointer select-none hover:brightness-105 transition-all"
        title={isCollapsed ? 'Click to expand EMR records dropdown' : 'Click to minimize'}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold tracking-wide">
                Patient* EMR History
              </h3>
              <span className="bg-[#ff007f] text-white font-mono font-extrabold text-[10px] px-2 py-0.5 rounded shadow-2xs uppercase tracking-wider">
                EMR_ARCHIVE
              </span>
            </div>
            <p className="text-[11px] text-cyan-100 font-medium mt-0.5">
              {loading && emrList.length === 0
                ? 'Retrieving patient EMR archives...'
                : `${emrList.length} prior clinical record${emrList.length === 1 ? '' : 's'} available • ${
                    isCollapsed ? 'Click to show full dropdown' : 'Click to minimize'
                  }`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fetchEmrHistory(true)}
            disabled={loading}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white cursor-pointer"
            title="Refresh EMR history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-2xs"
          >
            <span className="hidden sm:inline">{isCollapsed ? 'Show Full Records' : 'Minimize'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${
                !isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Dropdown Content */}
      {!isCollapsed && (
        <div className="border-t border-cyan-100 animate-in fade-in slide-in-from-top-2 duration-300">
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
                    const genderText = formatGender(item.gender);

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
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-1.5 py-0.5 rounded text-[11px]">
                              {item.slNo || item.barcode || '-'}
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
                              title={`Open case record for ${item.name}`}
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

          {/* Footer Bar */}
          <div className="border-t border-slate-200/80 px-4 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ff007f]">
              <User className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>* Results generated using name-based filtering only.</span>
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="bg-[#ff007f] hover:bg-pink-700 active:scale-95 text-white font-bold text-xs px-5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              Minimize EMR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
