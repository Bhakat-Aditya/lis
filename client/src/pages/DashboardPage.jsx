import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/context.auth.jsx';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Users,
  FlaskConical,
  Clock,
  CheckCircle2,
  Printer,
  DollarSign,
  UserPlus,
  FileEdit,
  Receipt,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { StatusBadge } from '../components/common/Badge.jsx';

export default function DashboardPage({ onOpenNewPatient }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayPatients = async () => {
    setLoading(true);
    try {
      // Fetch latest patients from middleman server
      const res = await api.get('/patients/list');
      setPatients(res.data?.patients || []);
    } catch (err) {
      console.warn('Dashboard patient load failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayPatients();
  }, []);

  // Compute live stats
  const totalCount = patients.length;
  const samplePending = patients.filter((p) => p.status?.toUpperCase() === 'REGISTERED').length;
  const inTesting = patients.filter((p) => p.status?.toUpperCase() === 'SAMPLE' || p.status?.toUpperCase() === 'SAVED').length;
  const readyPrint = patients.filter((p) => p.status?.toUpperCase() === 'PRINTING' || p.status?.toUpperCase() === 'VERIFIED' || p.status?.toUpperCase() === 'APPROVED').length;
  const totalRevenue = patients.reduce((acc, p) => acc + (Number(p.totalBill) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Welcome, {user?.name || user?.loginId}
          </h1>
          <p className="text-xs text-slate-500">
            New Life Care Diagnostic Center • Role: <strong className="text-indigo-600">{user?.role}</strong> • Center: Midnapore
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNewPatient && (
            <button
              onClick={onOpenNewPatient}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
          )}

          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2 px-3.5 rounded-lg transition-colors cursor-pointer"
          >
            <span>Full Worklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Patients
            </span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Live Today's List</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Sample Pending
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{samplePending}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Awaiting Collection</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
              In Testing
            </span>
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{inTesting}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Laboratory Entry</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Ready to Print
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{readyPrint}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Verified & Approved</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Today's Billing
            </span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">₹{totalRevenue.toFixed(0)}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Invoiced Amount</span>
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800">
            Recent Patients ({patients.length})
          </h2>
          <button
            onClick={() => fetchTodayPatients()}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-2.5 px-3 w-16">PID</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Age / Gender</th>
                <th className="py-2.5 px-3">Referred Doctor</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Bill Amount</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    Loading live patients from AWS...
                  </td>
                </tr>
              ) : patients.length > 0 ? (
                patients.slice(0, 10).map((p) => (
                  <tr
                    key={p.patientId || p.slNo}
                    onClick={() => navigate(`/patients/${p.patientId}`)}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      {p.patientId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {p.title ? `${p.title} ` : ''}{p.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {p.age || '-'} / {p.gender || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {p.referedDr || 'Self'}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={p.status || 'REGISTERED'} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{p.totalBill || 0}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-xs font-semibold text-indigo-600 hover:underline">
                        Open &rarr;
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400 italic">
                    No patients registered yet. Click "Register Patient" to add one.
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
