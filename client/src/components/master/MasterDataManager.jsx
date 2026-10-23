import React, { useState, useMemo } from 'react';
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
  MapPin,
  Ruler,
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

  // Lookup maps to resolve IDs to human-readable names
  const deptMap = useMemo(() => {
    const map = new Map();
    (departments || []).forEach((d) => {
      const id = String(d['Dept Id'] || d.id || '').trim();
      const name = d.Name || d.name || d['Short Name'] || id;
      if (id) {
        map.set(id, name);
        map.set(id.toUpperCase(), name);
      }
    });
    return map;
  }, [departments]);

  const unitMap = useMemo(() => {
    const map = new Map();
    (units || []).forEach((u) => {
      const id = String(u['Unit Id'] || u.id || '').trim();
      const name = u.Name || u.name || id;
      if (id) {
        map.set(id, name);
        map.set(id.toUpperCase(), name);
      }
    });
    return map;
  }, [units]);

  // Lookup map for individual tests: ID -> Name
  const testMap = useMemo(() => {
    const map = new Map();
    (tests || []).forEach((t) => {
      const id = String(t['Test Id'] || t.id || '').trim();
      const name = t.Name || t.name || t['Short Name'] || id;
      if (id) {
        map.set(id, name);
        map.set(id.toUpperCase(), name);
        if (id.toUpperCase().startsWith('T')) {
          map.set(id.slice(1), name);
        } else {
          map.set(`T${id}`, name);
        }
      }
    });
    return map;
  }, [tests]);

  // Lookup map for profiles: ID -> Name
  const profileMap = useMemo(() => {
    const map = new Map();
    (profiles || []).forEach((p) => {
      const id = String(p['Profile Id'] || p.id || '').trim();
      const name = p.Name || p.name || id;
      if (id) {
        map.set(id, name);
        map.set(id.toUpperCase(), name);
        if (id.toUpperCase().startsWith('P')) {
          map.set(id.slice(1), name);
        } else {
          map.set(`P${id}`, name);
        }
      }
    });
    return map;
  }, [profiles]);

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
    { id: 'units', label: 'Units', count: units.length, icon: Ruler },
    { id: 'branches', label: 'Branches', count: branches.length, icon: MapPin },
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
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

      {/* Tabs & Search Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Header: Responsive Wrap without any horizontal scrollbars */}
        <div className="border-b border-slate-200 bg-slate-50 p-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Tab buttons: Clean flex-wrap so all 8 titles are always visible */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-white text-indigo-600 shadow-xs border border-slate-300 ring-1 ring-indigo-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <t.icon className={`w-3.5 h-3.5 ${activeTab === t.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{t.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeTab === t.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Tables */}
        <div className="overflow-x-auto">
          {/* 1. TESTS TAB */}
          {activeTab === 'tests' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-16">ID</th>
                  <th className="py-2.5 px-4">Test Name</th>
                  <th className="py-2.5 px-4">Short Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Unit</th>
                  <th className="py-2.5 px-4">Sample Type</th>
                  <th className="py-2.5 px-4">Ref Range</th>
                  <th className="py-2.5 px-4">Rate (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests
                  .filter((t) => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase().trim();
                    const name = String(t.Name || t.name || '').toLowerCase();
                    const id = String(t['Test Id'] || '').toLowerCase();
                    const shortName = String(t['Short Name'] || '').toLowerCase();
                    const dept = String(t['Dept Id'] || '').toLowerCase();
                    const deptName = String(deptMap.get(String(t['Dept Id'])) || '').toLowerCase();
                    return name.includes(q) || id.includes(q) || shortName.includes(q) || dept.includes(q) || deptName.includes(q);
                  })
                  .map((t) => {
                    const resolvedDept = deptMap.get(String(t['Dept Id'])) || t['Dept Id'] || '-';
                    const resolvedUnit = unitMap.get(String(t['Unit Id'])) || t['Unit Id'] || '-';
                    return (
                      <tr key={t['Test Id']} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-mono font-bold text-indigo-600">{t['Test Id']}</td>
                        <td className="py-2 px-4 font-semibold text-slate-800">{t.Name}</td>
                        <td className="py-2 px-4 text-slate-500 font-medium">{t['Short Name'] || '-'}</td>
                        <td className="py-2 px-4 text-slate-600">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700 font-medium">
                            {resolvedDept}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-medium text-slate-600">{resolvedUnit}</td>
                        <td className="py-2 px-4 text-slate-600">{t['Sample Type'] || 'Serum'}</td>
                        <td className="py-2 px-4 font-mono text-slate-700">{t.RF0 || t['Ref Range'] || '-'}</td>
                        <td className="py-2 px-4 font-bold text-slate-900">₹{t.Rate || '100'}</td>
                        <td className="py-2 px-4">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {t.Status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {/* 2. PROFILES TAB */}
          {activeTab === 'profiles' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">Profile ID</th>
                  <th className="py-2.5 px-4">Profile Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4 min-w-[260px]">Included Tests</th>
                  <th className="py-2.5 px-4">Rate (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles
                  .filter((p) => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase().trim();
                    const name = String(p.Name || p.name || '').toLowerCase();
                    const id = String(p['Profile Id'] || '').toLowerCase();
                    const dept = String(p['Dept Id'] || '').toLowerCase();
                    const deptName = String(deptMap.get(String(p['Dept Id'])) || '').toLowerCase();
                    const testIds = String(p['Test Id List'] || '').split(',').map((s) => s.trim()).filter(Boolean);
                    const testNamesStr = testIds.map((tId) => testMap.get(tId) || tId).join(' ').toLowerCase();
                    return name.includes(q) || id.includes(q) || dept.includes(q) || deptName.includes(q) || testNamesStr.includes(q);
                  })
                  .map((p) => {
                    const resolvedDept = deptMap.get(String(p['Dept Id'])) || p['Dept Id'] || '-';
                    const rawTestIds = String(p['Test Id List'] || '').split(',').map((s) => s.trim()).filter(Boolean);
                    const subTestNames = rawTestIds.map((tId) => testMap.get(tId) || tId);

                    return (
                      <tr key={p['Profile Id']} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-mono font-bold text-indigo-600">{p['Profile Id']}</td>
                        <td className="py-2 px-4 font-semibold text-slate-800">{p.Name}</td>
                        <td className="py-2 px-4 text-slate-600">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700 font-medium">
                            {resolvedDept}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {subTestNames.length === 0 ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xl">
                              {subTestNames.map((tName, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80"
                                >
                                  {tName}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4 font-bold text-slate-900">₹{p.Rate || '0'}</td>
                        <td className="py-2 px-4">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {p.Status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {/* 3. PACKAGES TAB */}
          {activeTab === 'packages' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">Pkg ID</th>
                  <th className="py-2.5 px-4">Package Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Included Tests</th>
                  <th className="py-2.5 px-4 min-w-[180px]">Included Profiles</th>
                  <th className="py-2.5 px-4">Rate (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No packages found in master catalog.
                    </td>
                  </tr>
                ) : (
                  packages
                    .filter((pkg) => {
                      if (!searchTerm) return true;
                      const q = searchTerm.toLowerCase().trim();
                      const name = String(pkg.Name || pkg.name || '').toLowerCase();
                      const id = String(pkg['Package Id'] || pkg.id || '').toLowerCase();
                      const dept = String(pkg['Dept Id'] || '').toLowerCase();
                      const deptName = String(deptMap.get(String(pkg['Dept Id'])) || '').toLowerCase();
                      const testIds = String(pkg['Test Id List'] || '').split(',').map((s) => s.trim()).filter(Boolean);
                      const profIds = String(pkg['Profile Id List'] || '').split(',').map((s) => s.trim()).filter(Boolean);
                      const testNamesStr = testIds.map((tId) => testMap.get(tId) || tId).join(' ').toLowerCase();
                      const profNamesStr = profIds.map((pId) => profileMap.get(pId) || pId).join(' ').toLowerCase();
                      return name.includes(q) || id.includes(q) || dept.includes(q) || deptName.includes(q) || testNamesStr.includes(q) || profNamesStr.includes(q);
                    })
                    .map((pkg) => {
                      const resolvedDept = deptMap.get(String(pkg['Dept Id'])) || pkg['Dept Id'] || '-';
                      const rawTestIds = String(pkg['Test Id List'] || '').split(',').map((s) => s.trim()).filter(Boolean);
                      const subTestNames = rawTestIds.map((tId) => testMap.get(tId) || tId);

                      const rawProfIds = String(pkg['Profile Id List'] || '').split(',').map((s) => s.trim()).filter(Boolean);
                      const subProfNames = rawProfIds.map((pId) => profileMap.get(pId) || pId);

                      return (
                        <tr key={pkg['Package Id'] || pkg.id} className="hover:bg-slate-50">
                          <td className="py-2 px-4 font-mono font-bold text-indigo-600">
                            {pkg['Package Id'] || pkg.id}
                          </td>
                          <td className="py-2 px-4 font-semibold text-slate-900">{pkg.Name || pkg.name}</td>
                          <td className="py-2 px-4 text-slate-600">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700 font-medium">
                              {resolvedDept}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            {subTestNames.length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-sm">
                                {subTestNames.map((tName, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80"
                                  >
                                    {tName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {subProfNames.length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-sm">
                                {subProfNames.map((pName, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                                  >
                                    {pName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-4 font-bold text-slate-900">₹{pkg.Rate || '0'}</td>
                          <td className="py-2 px-4">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {pkg.Status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          )}

          {/* 4. DOCTORS TAB */}
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
                  .filter((d) => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase().trim();
                    const name = String(d.Name || d.name || '').toLowerCase();
                    const id = String(d['Doct Id'] || '').toLowerCase();
                    const deg = String(d.Deg || '').toLowerCase();
                    const contact = String(d.Contact || '').toLowerCase();
                    return name.includes(q) || id.includes(q) || deg.includes(q) || contact.includes(q);
                  })
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

          {/* 5. DEPARTMENTS TAB */}
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
                  .filter((dept) => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase().trim();
                    const name = String(dept.Name || dept.name || '').toLowerCase();
                    const id = String(dept['Dept Id'] || '').toLowerCase();
                    const shortName = String(dept['Short Name'] || '').toLowerCase();
                    return name.includes(q) || id.includes(q) || shortName.includes(q);
                  })
                  .map((dept) => (
                    <tr key={dept['Dept Id']} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-mono font-bold text-indigo-600">{dept['Dept Id']}</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">{dept.Name}</td>
                      <td className="py-2 px-4 text-slate-500 font-medium">{dept['Short Name'] || '-'}</td>
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

          {/* 6. UNITS TAB */}
          {activeTab === 'units' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-24">Unit ID</th>
                  <th className="py-2.5 px-4">Unit Name / Symbol</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No measurement units found in catalog.
                    </td>
                  </tr>
                ) : (
                  units
                    .filter((u) => {
                      if (!searchTerm) return true;
                      const q = searchTerm.toLowerCase().trim();
                      const name = String(u.Name || u.name || '').toLowerCase();
                      const id = String(u['Unit Id'] || u.id || '').toLowerCase();
                      return name.includes(q) || id.includes(q);
                    })
                    .map((u) => (
                      <tr key={u['Unit Id'] || u.id} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-mono font-bold text-indigo-600">{u['Unit Id'] || u.id}</td>
                        <td className="py-2 px-4 font-bold text-slate-900">{u.Name || u.name}</td>
                        <td className="py-2 px-4">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {u.Status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {/* 7. BRANCHES TAB */}
          {activeTab === 'branches' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-24">Branch ID</th>
                  <th className="py-2.5 px-4">Branch Name</th>
                  <th className="py-2.5 px-4">Location / Address</th>
                  <th className="py-2.5 px-4">Contact Phone</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No branches found in catalog.
                    </td>
                  </tr>
                ) : (
                  branches
                    .filter((b) => {
                      if (!searchTerm) return true;
                      const q = searchTerm.toLowerCase().trim();
                      const name = String(b.name || b.Name || '').toLowerCase();
                      const id = String(b.branchId || b.id || '').toLowerCase();
                      const loc = String(b.location || '').toLowerCase();
                      const contact = String(b.contact || '').toLowerCase();
                      return name.includes(q) || id.includes(q) || loc.includes(q) || contact.includes(q);
                    })
                    .map((b) => (
                      <tr key={b.branchId || b.id} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-mono font-bold text-indigo-600">
                          #{b.branchId || b.id}
                        </td>
                        <td className="py-2 px-4 font-bold text-slate-900">{b.name || b.Name}</td>
                        <td className="py-2 px-4 text-slate-600 font-medium">{b.location || '-'}</td>
                        <td className="py-2 px-4 font-mono text-slate-700">{b.contact || '-'}</td>
                        <td className="py-2 px-4">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {b.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {/* 8. USERS & ROLES TAB */}
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
                {users
                  .filter((u) => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase().trim();
                    const name = String(u.name || '').toLowerCase();
                    const loginId = String(u.loginId || '').toLowerCase();
                    const mobile = String(u.mobile || '').toLowerCase();
                    const userId = String(u.userId || '').toLowerCase();
                    return name.includes(q) || loginId.includes(q) || mobile.includes(q) || userId.includes(q);
                  })
                  .map((u) => {
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
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              u.status2FA === 'Enabled' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
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
