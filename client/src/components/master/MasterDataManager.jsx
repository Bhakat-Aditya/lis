import React, { useState } from 'react';
import { useMaster } from '../../context/context.master.jsx';
import {
  Database,
  RefreshCw,
  Search,
  Clock,
  CheckCircle,
  Users,
  Building,
  Stethoscope,
  FlaskConical,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export default function MasterDataManager() {
  const {
    departments,
    units,
    methods,
    profiles,
    packages,
    tests,
    doctors,
    references,
    branches,
    users,
    cacheStats,
    loadingMaster,
    refreshCache,
  } = useMaster();

  const [activeTab, setActiveTab] = useState('tests');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState('');

  const handleRefresh = async (key = null) => {
    setRefreshing(true);
    setMsg('');
    const res = await refreshCache(key);
    if (res.success) {
      setMsg('Cache successfully refreshed from AWS LIS server!');
    }
    setRefreshing(false);
  };

  const tabs = [
    { id: 'tests', label: 'Tests', count: tests.length, icon: FlaskConical },
    { id: 'profiles', label: 'Profiles', count: profiles.length, icon: Layers },
    { id: 'packages', label: 'Packages', count: packages.length, icon: FileSpreadsheet },
    { id: 'doctors', label: 'Doctors', count: doctors.length, icon: Stethoscope },
    { id: 'departments', label: 'Departments', count: departments.length, icon: Building },
    { id: 'units', label: 'Units', count: units.length, icon: Database },
    { id: 'branches', label: 'Branches', count: branches.length, icon: Building },
    { id: 'users', label: 'Users & Roles', count: users.length, icon: Users },
  ];

  return (
    <div className="space-y-4">
      {/* 24-Hour Cache Status & Refresh Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">Master Data Cache Control</h2>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                24-Hour TTL Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Master lists are stored in local static cache with 24 hours TTL. Refreshes only on cache miss or manual trigger.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleRefresh(null)}
          disabled={refreshing || loadingMaster}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loadingMaster ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Sync All From AWS'}</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 p-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.2 rounded font-mono">
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Tab Content Table */}
        <div className="overflow-x-auto">
          {activeTab === 'tests' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-16">ID</th>
                  <th className="py-2.5 px-4">Test Name</th>
                  <th className="py-2.5 px-4">Short Name</th>
                  <th className="py-2.5 px-4">Dept</th>
                  <th className="py-2.5 px-4">Sample Type</th>
                  <th className="py-2.5 px-4">Ref Range</th>
                  <th className="py-2.5 px-4">Rate (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests
                  .filter((t) => t.Name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((t) => (
                    <tr key={t['Test Id']} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-mono font-bold text-indigo-600">{t['Test Id']}</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">{t.Name}</td>
                      <td className="py-2 px-4 text-slate-500">{t['Short Name'] || '-'}</td>
                      <td className="py-2 px-4 text-slate-500">{t['Dept Id'] || '-'}</td>
                      <td className="py-2 px-4 text-slate-600">{t['Sample Type'] || 'Serum'}</td>
                      <td className="py-2 px-4 font-mono text-slate-700">{t.RF0 || t['Ref Range'] || '-'}</td>
                      <td className="py-2 px-4 font-bold text-slate-900">₹{t.Rate || '100'}</td>
                      <td className="py-2 px-4">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {t.Status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'profiles' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">Profile ID</th>
                  <th className="py-2.5 px-4">Profile Name</th>
                  <th className="py-2.5 px-4">Dept ID</th>
                  <th className="py-2.5 px-4">Linked Test IDs</th>
                  <th className="py-2.5 px-4">Rate (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles
                  .filter((p) => p.Name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((p) => (
                    <tr key={p['Profile Id']} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-mono font-bold text-indigo-600">{p['Profile Id']}</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">{p.Name}</td>
                      <td className="py-2 px-4 text-slate-500">{p['Dept Id'] || '-'}</td>
                      <td className="py-2 px-4 font-mono text-[11px] text-slate-600">{p['Test Id List'] || '-'}</td>
                      <td className="py-2 px-4 font-bold text-slate-900">₹{p.Rate || '0'}</td>
                      <td className="py-2 px-4">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {p.Status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'doctors' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">Doc ID</th>
                  <th className="py-2.5 px-4">Doctor Name</th>
                  <th className="py-2.5 px-4">Degrees / Specialization</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors
                  .filter((d) => d.Name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((d) => (
                    <tr key={d['Doct Id']} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-mono font-bold text-indigo-600">{d['Doct Id']}</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">{d.Name}</td>
                      <td className="py-2 px-4 text-slate-600">{d.Deg || '-'}</td>
                      <td className="py-2 px-4 text-slate-600">{d.Contact || '-'}</td>
                      <td className="py-2 px-4">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {d.Status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'departments' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">Dept ID</th>
                  <th className="py-2.5 px-4">Department Name</th>
                  <th className="py-2.5 px-4">Short Name</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments
                  .filter((dept) => dept.Name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((dept) => (
                    <tr key={dept['Dept Id']} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-mono font-bold text-indigo-600">{dept['Dept Id']}</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">{dept.Name}</td>
                      <td className="py-2 px-4 text-slate-500">{dept['Short Name'] || '-'}</td>
                      <td className="py-2 px-4">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {dept.Status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'users' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-16">User ID</th>
                  <th className="py-2.5 px-4">Login ID</th>
                  <th className="py-2.5 px-4">Staff Name</th>
                  <th className="py-2.5 px-4">Access Type / Role</th>
                  <th className="py-2.5 px-4">Mobile</th>
                  <th className="py-2.5 px-4">2FA Status</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  let access = u.accessPermissionJson;
                  try {
                    const parsed = typeof access === 'string' ? JSON.parse(access) : access;
                    access = parsed?.accessType || access;
                  } catch (e) {}

                  return (
                    <tr key={u.userId} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-mono">{u.userId}</td>
                      <td className="py-2 px-4 font-bold text-indigo-700">{u.loginId}</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">{u.name}</td>
                      <td className="py-2 px-4">
                        <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                          {access || 'Staff'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-600">{u.mobile}</td>
                      <td className="py-2 px-4">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          u.status2FA === 'Enabled' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {u.status2FA || 'DISABLED'}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {u.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
