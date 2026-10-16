import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Search,
  Calendar,
  Filter,
  UserPlus,
  FileEdit,
  Printer,
  ChevronRight,
  RefreshCw,
  Building,
} from 'lucide-react';
import { StatusBadge } from '../components/common/Badge.jsx';

export default function PatientsPage({ onOpenNewPatient }) {
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState('2026-10-12');
  const [toDate, setToDate] = useState(todayStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/list', {
        params: {
          fromDate,
          toDate,
          search: searchTerm,
          status: statusFilter,
          branch: branchFilter,
        },
      });
      setPatients(res.data?.patients || []);
    } catch (err) {
      console.warn('Error fetching patients:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [fromDate, toDate, statusFilter, branchFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients();
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Date Range Picker */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Date:</span>
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
            />
            <button
              onClick={fetchPatients}
              disabled={loading}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Right Action: Register Button */}
          {onOpenNewPatient && (
            <button
              onClick={onOpenNewPatient}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
          )}
        </div>

        {/* Search & Quick Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <form onSubmit={handleSearchSubmit}>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient by Name, ID, Mobile, Serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white text-xs"
              />
            </form>
          </div>

          {/* Status Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="SAMPLE">Sample Received</option>
              <option value="SAVED">Saved</option>
              <option value="PRINTING">Ready to Print</option>
              <option value="VERIFIED">Verified</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>

          {/* Branch Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="">All Branches</option>
              <option value="1">Branch 1 - Midnapore</option>
              <option value="2">Branch 2 - Kolkata</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Patient Directory ({patients.length})
          </span>
          <span className="text-slate-400 text-[11px]">
            Range: {fromDate} ~ {toDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-2.5 px-3 w-16">PID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Mobile</th>
                <th className="py-2.5 px-3">Age / Gender</th>
                <th className="py-2.5 px-3">Referred Doctor</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Bill</th>
                <th className="py-2.5 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-indigo-600" />
                    <span>Loading patient records...</span>
                  </td>
                </tr>
              ) : patients.length > 0 ? (
                patients.map((p) => (
                  <tr
                    key={p.patientId || p.slNo}
                    onClick={() => navigate(`/patients/${p.patientId}`)}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      {p.patientId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {p.regDate ? p.regDate.substring(0, 10) : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {p.title ? `${p.title} ` : ''}{p.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {p.mobile || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {p.age || '-'} / {p.gender || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {p.referedDr || 'Self'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {p.branch === '2' ? 'Kolkata' : 'Midnapore'}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={p.status || 'REGISTERED'} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{p.totalBill || 0}
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/patients/${p.patientId}?tab=results`)}
                          title="Fill Results"
                          className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/invoice/${p.patientId}`)}
                          title="Print Invoice"
                          className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/patients/${p.patientId}`)}
                          title="Open Profile"
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400 italic">
                    No patients match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
