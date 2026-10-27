import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Phone,
  Printer,
  ChevronRight,
  TestTube,
  FileEdit,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';
import { StatusBadge, PaymentBadge } from '../common/Badge.jsx';
import ClinicalGuideModal from '../common/ClinicalGuideModal.jsx';
import BillPreviewModal from '../billing/BillPreviewModal.jsx';

const formatGender = (raw) => {
  const s = String(raw || '').trim().toLowerCase();
  if (s.startsWith('m')) return 'Male';
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('t') || s.startsWith('o')) return 'Transgender';
  return raw || '-';
};

export default function RecentWorklistTable({
  patients = [],
  loading = false,
  onRefresh,
  activeFilter = '',
  onFilterChange,
  onOpenNewPatient,
}) {
  const navigate = useNavigate();
  const [previewPatient, setPreviewPatient] = useState(null);
  const [tableSearch, setTableSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [copiedPid, setCopiedPid] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Filter patients based on search, status filter, and payment filter
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Status filter
      if (activeFilter === 'SAMPLE_PENDING') {
        const s = String(p.status || '').toUpperCase();
        if (s !== 'REGISTERED') return false;
      } else if (activeFilter === 'TESTING') {
        const s = String(p.status || '').toUpperCase();
        if (s !== 'SAMPLE' && s !== 'SAMPLE RECEIVED' && s !== 'SAVED' && s !== 'TESTING') return false;
      } else if (activeFilter === 'READY') {
        const s = String(p.status || '').toUpperCase();
        if (s !== 'PRINTING' && s !== 'VERIFIED' && s !== 'APPROVED' && s !== 'RELEASED') return false;
      } else if (activeFilter === 'BILLING') {
        const bal = Number(p.balance || p.dueAmount || 0);
        if (bal <= 0) return false;
      } else if (activeFilter && activeFilter !== 'ALL') {
        const s = String(p.status || '').toUpperCase();
        if (!s.includes(activeFilter.toUpperCase())) return false;
      }

      // Payment filter
      if (paymentFilter === 'DUE') {
        const bal = Number(p.balance || p.dueAmount || 0);
        if (bal <= 0) return false;
      } else if (paymentFilter === 'PAID') {
        const bal = Number(p.balance || p.dueAmount || 0);
        if (bal > 0) return false;
      }

      // Search term
      if (!tableSearch) return true;
      const term = tableSearch.toLowerCase().trim();
      const pid = String(p.patientId || '').toLowerCase();
      const slNo = String(p.slNo || '').toLowerCase();
      const name = String(p.name || '').toLowerCase();
      const phone = String(p.mobile || p.phone || '').toLowerCase();
      const doctor = String(p.referedDr || '').toLowerCase();

      return pid.includes(term) || slNo.includes(term) || name.includes(term) || phone.includes(term) || doctor.includes(term);
    });
  }, [patients, activeFilter, paymentFilter, tableSearch]);

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleCopyPid = (pid, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(String(pid));
    setCopiedPid(pid);
    setTimeout(() => setCopiedPid(null), 2000);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 tracking-tight">
                Live Clinical Worklist Queue
              </h2>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                {filteredPatients.length} Active Records
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Synchronized patient diagnostic status, analyzer queue, and billing ledgers
            </p>
          </div>

          {/* Search, Payment Filters & Guide button */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Barcode, Patient Name, Doctor, Mobile..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Payment filter pills */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-[11px] font-semibold">
              <button
                onClick={() => setPaymentFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  paymentFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPaymentFilter('PAID')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  paymentFilter === 'PAID' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setPaymentFilter('DUE')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  paymentFilter === 'DUE' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Due
              </button>
            </div>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Open Clinical Test Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
              >
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-3 px-4 min-w-[120px]">Barcode / SL No</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Consultant / Referral</th>
                <th className="py-3 px-4">Clinical Stage</th>
                <th className="py-3 px-4 text-right">Billing & Dues</th>
                <th className="py-3 px-4 text-center w-36">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 font-medium">
                      <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Synchronizing live clinical records from AWS server...
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.slice(0, 15).map((p) => {
                  const totalBill = Number(p.totalBill || 0);
                  const balance = Number(p.balance || p.dueAmount || 0);
                  const pid = p.patientId || p.slNo;

                  return (
                    <tr
                      key={pid}
                      className="hover:bg-indigo-50/40 transition-colors group"
                    >
                      {/* Barcode / SL No with copy */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/patients/${pid}`)}
                            className="bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded text-[11px] hover:underline cursor-pointer"
                          >
                            {p.slNo || p.barcode || '-'}
                          </button>
                          {(p.slNo || p.barcode) && (
                            <button
                              onClick={(e) => handleCopyPid(p.slNo || p.barcode, e)}
                              title="Copy Barcode"
                              className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded cursor-pointer"
                            >
                              {copiedPid === (p.slNo || p.barcode) ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Patient Name + Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {getInitials(p.name)}
                          </div>
                          <div>
                            <div
                              onClick={() => navigate(`/patients/${pid}`)}
                              className="font-bold text-slate-900 group-hover:text-indigo-900 cursor-pointer hover:underline"
                            >
                              {p.title ? `${p.title} ` : ''}{p.name || 'Unnamed Patient'}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-300" />
                              <span>{p.mobile || 'No contact'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Age / Gender */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {p.age || '-'} Y / {formatGender(p.gender)}
                        </span>
                      </td>

                      {/* Doctor Referral */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {p.referedDr || 'Self Referral'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Consultant Physician
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={p.status || 'REGISTERED'} />
                      </td>

                      {/* Financials */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-extrabold text-slate-900">
                          ₹{totalBill.toLocaleString('en-IN')}
                        </div>
                        <div className="mt-0.5">
                          <PaymentBadge balance={balance} total={totalBill} billPayStatus={p.billPayStatus} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => navigate(`/patients/${pid}?tab=results`)}
                            title="Enter Test Values"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPreviewPatient(p)}
                            title="Preview Bill"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/patients/${pid}`)}
                            title="Open Patient Profile"
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                        <TestTube className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-700 text-sm">No Patients in this View</div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {tableSearch
                            ? `No records matching "${tableSearch}". Try clearing the search.`
                            : 'No patients found under this filter criteria.'}
                        </p>
                      </div>
                      {onOpenNewPatient && (
                        <button
                          onClick={onOpenNewPatient}
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-xs cursor-pointer"
                        >
                          + Register First Patient
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClinicalGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Bill Preview Modal Popup */}
      <BillPreviewModal
        isOpen={!!previewPatient}
        onClose={() => setPreviewPatient(null)}
        patientId={previewPatient?.patientId || previewPatient?.slNo}
        patientName={previewPatient?.name}
      />
    </>
  );
}
