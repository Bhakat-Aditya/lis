import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMaster } from '../../context/context.master.jsx';
import MasterEditModal from './MasterEditModal.jsx';
import TemplateReportModal from '../results/TemplateReportModal.jsx';
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
  Edit3,
  Plus,
  FileText,
  TestTube,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { openUpstreamTemplateEditor } from '../../utils/templateSequence.js';

export default function MasterDataManager() {
  const {
    departments,
    units,
    methods,
    profiles,
    packages,
    tests,
    templates = [],
    samples = [],
    doctors,
    references,
    branches,
    users,
    interpretations = [],
    nextIds = {},
    signList = [],
    cacheStats,
    loadingMaster,
    refreshCache,
  } = useMaster();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'tests');
  const [searchTerm, setSearchTerm] = useState('');
  const [interpTypeFilter, setInterpTypeFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState('');

  // Keep search params in sync when switching tabs
  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tabId);
        return next;
      },
      { replace: true }
    );
  };

  // Edit / Add modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Template prefill data modal state (API_UPDATE_TEMPLATE_DATA)
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplateForData, setSelectedTemplateForData] = useState(null);

  const tabCacheKeyMap = {
    tests: 'TEST_LIST',
    samples: 'SAMPLE_LIST',
    departments: 'DEPT_LIST',
    units: 'UNIT_LIST',
    methods: 'METHOD_LIST',
    doctors: 'DOCT_LIST',
    references: 'REFERANCE_LIST',
    branches: 'BRANCH_LIST',
    users: 'USER_LIST',
    profiles: 'PROFILE_LIST',
    packages: 'PKG_LIST',
    interpretations: 'INTERPRETATION_LIST',
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleEditBasic = (item) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleEditPrefillData = (tmpl) => {
    // Master data template blueprints are keyed under repository patient id P14
    const patientId = 'P14';
    let reportId = tmpl.reportId;
    if (!reportId && tmpl.templatesId) {
      const num = String(tmpl.templatesId).replace(/^T/i, '');
      reportId = `P14R${num}`;
    }
    if (!reportId) reportId = 'P14R1';
    const tmplName = tmpl.TEMPLATE_NAME || tmpl.name || 'Template Report';
    const tmplId = tmpl.templatesId || tmpl.id || '';
    navigate(
      `/patients/${patientId}/template/${reportId}?name=${encodeURIComponent(tmplName)}&templateId=${encodeURIComponent(tmplId)}&from=master`
    );
  };

  const handleOpenAwsEditor = (tmpl) => {
    const patientId = 'P14';
    let reportId = tmpl.reportId;
    if (!reportId && tmpl.templatesId) {
      const num = String(tmpl.templatesId).replace(/^T/i, '');
      reportId = `P14R${num}`;
    }
    if (!reportId) reportId = 'P14R1';
    const tmplName = tmpl.TEMPLATE_NAME || tmpl.name || 'Template Report';
    openUpstreamTemplateEditor({ patientId, reportId, name: tmplName });
  };

  const computeFallbackNextId = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return '1';
    let maxNum = 0;
    for (const it of items) {
      if (!it || typeof it !== 'object') continue;
      const raw =
        it['Test Id'] ||
        it['Dept Id'] ||
        it['Profile Id'] ||
        it['Package Id'] ||
        it['Doct Id'] ||
        it['Refer Id'] ||
        it['Unit Id'] ||
        it['Method Id'] ||
        it['Sample Id'] ||
        it.testId ||
        it.deptId ||
        it.profileId ||
        it.packageId ||
        it.branchId ||
        it.userId ||
        it.id;
      if (raw !== undefined && raw !== null) {
        const num = parseInt(String(raw).replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return maxNum > 0 ? String(maxNum + 1) : '1';
  };

  const handleAddItem = () => {
    const cacheKey = tabCacheKeyMap[activeTab];
    let autoId = (cacheKey && nextIds[cacheKey]) || nextIds[activeTab] || '';
    if (!autoId || autoId === '0') {
      const tabItems = {
        tests,
        samples,
        departments,
        units,
        methods,
        doctors,
        references,
        branches,
        users,
        profiles,
        packages,
      }[activeTab] || [];
      autoId = computeFallbackNextId(tabItems);
    }
    setSelectedItem({ isNew: true, nextId: autoId });
    setEditModalOpen(true);
  };

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

  const renderSignatureBadges = (signStr) => {
    if (!signStr || !String(signStr).trim()) {
      return <span className="text-slate-400 italic text-[11px]">-</span>;
    }
    const ids = String(signStr)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return <span className="text-slate-400 italic text-[11px]">-</span>;

    const normalize = (s) => ({
      id: String(s?.Id ?? s?.id ?? ''),
      name: s?.Name ?? s?.name ?? s?.Post ?? s?.designation ?? `Sign #${s?.Id || s?.id}`,
      role: s?.Post ?? s?.post ?? s?.designation ?? '',
      image: s?.['Sign Image Source'] ?? s?.image ?? '',
    });

    const normList = (Array.isArray(signList) ? signList : []).map(normalize);

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {ids.map((id, idx) => {
          const found = normList.find((s) => String(s.id) === String(id));
          const name = found?.name || `Sign #${id}`;
          return (
            <span
              key={`${id}-${idx}`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
              title={`Sequence #${idx + 1}: ${name} (ID: ${id})`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="truncate max-w-[90px]">{name}</span>
            </span>
          );
        })}
      </div>
    );
  };

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
    { id: 'departments', label: 'Departments', count: departments.length, icon: Building },
    { id: 'templates', label: 'Templates', count: templates.length, icon: FileText },
    { id: 'interpretations', label: 'Interpretations', count: interpretations.length, icon: BookOpen },
    { id: 'samples', label: 'Sample Types', count: samples.length, icon: TestTube },
    { id: 'profiles', label: 'Profiles', count: profiles.length, icon: Layers },
    { id: 'packages', label: 'Packages', count: packages.length, icon: FileSpreadsheet },
    { id: 'doctors', label: 'Doctors', count: doctors.length, icon: Stethoscope },
    { id: 'references', label: 'Referring Agents', count: references.length, icon: Users },
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
                  handleTabSelect(t.id);
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
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    activeTab === t.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search box & Add New Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="relative w-full sm:w-60 shrink-0">
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

            {activeTab !== 'templates' && activeTab !== 'interpretations' && (
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                title={`Add new ${activeTab.replace(/s$/, '')} to Master Catalog`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {tabs.find((t) => t.id === activeTab)?.label.replace(/s$/, '') || 'Item'}</span>
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
                  <th className="py-2.5 px-4">Rate (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
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
                        <td className="py-2 px-4 font-bold text-slate-900">₹{t.Rate || '100'}</td>
                        <td className="py-2 px-4">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {t.Status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}


          {activeTab === 'templates' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-24">Template ID</th>
                  <th className="py-2.5 px-4">Template Report Name</th>
                  <th className="py-2.5 px-4">Signatures</th>
                  <th className="py-2.5 px-4">Report Structure</th>
                  <th className="py-2.5 px-4">Sync Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No master template reports loaded.
                    </td>
                  </tr>
                ) : (
                  templates
                    .filter((tmpl) => {
                      if (!searchTerm) return true;
                      const q = searchTerm.toLowerCase().trim();
                      const name = String(tmpl.TEMPLATE_NAME || tmpl.name || '').toLowerCase();
                      const id = String(tmpl.templatesId || tmpl.id || tmpl.reportId || '').toLowerCase();
                      return name.includes(q) || id.includes(q);
                    })
                    .map((tmpl, idx) => (
                      <tr key={tmpl.templatesId || tmpl.reportId || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-mono font-bold text-purple-700">
                          {tmpl.templatesId || `T${idx + 1}`}
                        </td>
                        <td className="py-2 px-4">
                          <span className="font-bold text-slate-900">{tmpl.TEMPLATE_NAME || tmpl.name}</span>
                        </td>
                        <td className="py-2 px-4">{renderSignatureBadges(tmpl.sign)}</td>
                        <td className="py-2 px-4 text-slate-600">
                          <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Full-Page Report Structure
                          </span>
                        </td>
                        <td className="py-2 px-4 font-mono text-slate-500 text-[11px]">
                          {tmpl.templatesDate || '2026-11-01'}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            String(tmpl.status || '').toUpperCase() === 'SAVED'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {tmpl.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Option 1: API_UPDATE_TEMPLATE (basic info: name, dept, price, sign) */}
                            <button
                              type="button"
                              onClick={() => handleEditBasic(tmpl)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors cursor-pointer"
                              title="Edit basic info (name, department, price, signatures) - API_UPDATE_TEMPLATE"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Basic</span>
                            </button>

                            {/* Option 2: Custom Modern Editor (My Editor) */}
                            <button
                              type="button"
                              onClick={() => handleEditPrefillData(tmpl)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors cursor-pointer"
                              title="Edit prefill template findings data in custom modern editor"
                            >
                              <FileText className="w-3 h-3" />
                              <span>My Editor</span>
                            </button>

                            {/* Option 3: Upstream AWS Template Editor */}
                            <button
                              type="button"
                              onClick={() => handleOpenAwsEditor(tmpl)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-300 transition-colors cursor-pointer"
                              title="Open official AWS template editor (editTemplateV2.jsp) in new window"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>AWS Editor</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {/* INTERPRETATIONS SECTION WITH RICH WRITING PANEL TRIGGER */}
          {activeTab === 'interpretations' && (
            <div>
              {/* Type Filter Pills (All / Test / Profile) */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mr-1">
                    Target Filter:
                  </span>
                  {[
                    { id: 'ALL', label: 'All Items', count: interpretations.length },
                    { id: 'Test', label: 'Tests', count: interpretations.filter((i) => (i.Type || i.type || '').toLowerCase() === 'test').length },
                    { id: 'Profile', label: 'Profiles', count: interpretations.filter((i) => (i.Type || i.type || '').toLowerCase() === 'profile').length },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setInterpTypeFilter(f.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        interpTypeFilter === f.id
                          ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] px-1 rounded font-mono ${interpTypeFilter === f.id ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  Click <strong>"Write / Edit Interpretation"</strong> to compose styled interpretations with rich fonts, sizes, and colors.
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-20">Target ID</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Target Name</th>
                    <th className="py-2.5 px-4 w-24">Type</th>
                    <th className="py-2.5 px-4 min-w-[280px]">Clinical Interpretation Preview</th>
                    <th className="py-2.5 px-4 w-24">Status</th>
                    <th className="py-2.5 px-4 text-right w-36">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interpretations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        {loadingMaster ? 'Loading clinical interpretations from AWS...' : 'No interpretations found.'}
                      </td>
                    </tr>
                  ) : (
                    interpretations
                      .filter((item) => {
                        // Type filter
                        if (interpTypeFilter !== 'ALL') {
                          const itemType = String(item.Type || item.type || '').toLowerCase();
                          if (itemType !== interpTypeFilter.toLowerCase()) return false;
                        }
                        // Search filter
                        if (!searchTerm) return true;
                        const q = searchTerm.toLowerCase().trim();
                        const id = String(item.ID || item.id || '').toLowerCase();
                        const name = String(item.Name || item.name || '').toLowerCase();
                        const text = String(item.Text || item.text || '').toLowerCase();
                        return id.includes(q) || name.includes(q) || text.includes(q);
                      })
                      .map((item) => {
                        const rawHtml = item.Text || item.text || '';
                        const isProfile = String(item.Type || item.type || '').toLowerCase() === 'profile';

                        return (
                          <tr key={item.ID || item.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* ID */}
                            <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">
                              {item.ID || item.id}
                            </td>

                            {/* Name */}
                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                              {item.Name || item.name}
                            </td>

                            {/* Type badge */}
                            <td className="py-2.5 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  isProfile
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {item.Type || item.type || 'Test'}
                              </span>
                            </td>

                            {/* Interpretation Styled Preview */}
                            <td className="py-2.5 px-4 max-w-md">
                              {rawHtml ? (
                                <div className="space-y-1">
                                  <div
                                    className="text-xs line-clamp-2 text-slate-700 bg-slate-50/80 p-2 rounded-lg border border-slate-200/70"
                                    dangerouslySetInnerHTML={{ __html: rawHtml }}
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  No clinical interpretation recorded yet.
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  String(item.Status || item.status || '').toLowerCase() === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {item.Status || item.status || 'Active'}
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="py-2.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleEditItem(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer"
                                title="Open styled writing panel (API_UPDATE_INTERPRETATION)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Write / Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          )}


          {activeTab === 'samples' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-24">Sample ID</th>
                  <th className="py-2.5 px-4">Sample / Specimen Name</th>
                  <th className="py-2.5 px-4">Target Application</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {samples.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No sample types found in master catalog.
                    </td>
                  </tr>
                ) : (
                  samples
                    .filter((s) => {
                      if (!searchTerm) return true;
                      const q = searchTerm.toLowerCase().trim();
                      const name = String(s.Name || s.name || '').toLowerCase();
                      const id = String(s['Sample Id'] || s.id || '').toLowerCase();
                      return name.includes(q) || id.includes(q);
                    })
                    .map((s, idx) => (
                      <tr key={s['Sample Id'] || s.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-mono font-bold text-amber-700">
                          #{s['Sample Id'] || s.id || idx + 1}
                        </td>
                        <td className="py-2 px-4">
                          <span className="font-bold text-slate-900">{s.Name || s.name}</span>
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px]">
                          Master Test & Patient Specimen Accessioning
                        </td>
                        <td className="py-2 px-4">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {s.Status || s.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {/* 1b. TEMPLATES TAB (Total 15 types of master templates) */}

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
                  <th className="py-2.5 px-4 text-right">Action</th>
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
                        <td className="py-2 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {/* 1b. TEMPLATES TAB (Total 15 types of master templates) */}

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
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
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
                          <td className="py-2 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleEditItem(pkg)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          )}

          {/* 1b. TEMPLATES TAB (Total 15 types of master templates) */}

          {activeTab === 'doctors' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">Doc ID</th>
                  <th className="py-2.5 px-4">Doctor Name</th>
                  <th className="py-2.5 px-4">Degrees / Specialization</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
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
                      <td className="py-2 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditItem(d)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}


          {/* 7. REFERRING AGENTS TAB (REFERANCE_LIST) */}
          {activeTab === 'references' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">Refer ID</th>
                  <th className="py-2.5 px-4">Referring Agent / Source</th>
                  <th className="py-2.5 px-4">Address / Location</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4">Commission Rate</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {references.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      No referring agents found in master catalog.
                    </td>
                  </tr>
                ) : (
                  references
                    .filter((r) => {
                      if (!searchTerm) return true;
                      const q = searchTerm.toLowerCase().trim();
                      const name = String(r.Name || r.name || '').toLowerCase();
                      const id = String(r['Refer Id'] || r['Doct Id'] || r.referId || r.id || '').toLowerCase();
                      const addr = String(r.Address || r.address || '').toLowerCase();
                      const contact = String(r.Contact || r.contact || '').toLowerCase();
                      return name.includes(q) || id.includes(q) || addr.includes(q) || contact.includes(q);
                    })
                    .map((r, idx) => {
                      const referId = r['Refer Id'] || r['Doct Id'] || r.referId || r.id || (idx + 1);
                      const name = r.Name || r.name || '-';
                      const address = r.Address || r.address || '-';
                      const contact = r.Contact || r.contact || '-';
                      const rate = r.Rate || r.rate || '0';
                      const type = r.Type || r.type || 'P';
                      const status = r.Status || r.status || 'Active';
                      return (
                        <tr key={referId} className="hover:bg-slate-50">
                          <td className="py-2 px-4 font-mono font-bold text-indigo-600">#{referId}</td>
                          <td className="py-2 px-4 font-semibold text-slate-900">{name}</td>
                          <td className="py-2 px-4 text-slate-600">{address}</td>
                          <td className="py-2 px-4 text-slate-600 font-mono text-[11px]">{contact}</td>
                          <td className="py-2 px-4">
                            <span className="font-mono font-bold text-slate-800">
                              {rate}{type === 'P' ? '%' : ' Fixed'}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + (
                              type === 'P' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            )}>
                              {type === 'P' ? 'Percentage' : 'Fixed'}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleEditItem(r)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
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
                  <th className="py-2.5 px-4">Signatures</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
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
                      <td className="py-2 px-4">{renderSignatureBadges(dept.sign)}</td>
                      <td className="py-2 px-4">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {dept.Status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditItem(dept)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 1b. TEMPLATES TAB (Total 15 types of master templates) */}

          {activeTab === 'units' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-24">Unit ID</th>
                  <th className="py-2.5 px-4">Unit Name / Symbol</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
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
                        <td className="py-2 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {/* 1b. TEMPLATES TAB (Total 15 types of master templates) */}

          {activeTab === 'branches' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-24">Branch ID</th>
                  <th className="py-2.5 px-4">Branch Name</th>
                  <th className="py-2.5 px-4">Location / Address</th>
                  <th className="py-2.5 px-4">Contact Phone</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
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
                        <td className="py-2 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {/* 1b. TEMPLATES TAB (Total 15 types of master templates) */}

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
                  <th className="py-2.5 px-4 text-right">Action</th>
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
                        <td className="py-2 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {/* 1b. TEMPLATES TAB (Total 15 types of master templates) */}

        </div>
      </div>

      {/* Edit & Add Master Modal */}
      <MasterEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        category={activeTab}
        item={selectedItem}
        onSaved={() => {
          setMsg(`Successfully updated ${activeTab} in master catalog!`);
          setTimeout(() => setMsg(''), 4000);
        }}
      />

      {/* Edit Template Prefill Data Modal (Temporarily commented out - redirected to upstream editTemplateV2.jsp in new window) */}
      {/*
      <TemplateReportModal
        isOpen={templateModalOpen}
        onClose={() => {
          setTemplateModalOpen(false);
          setSelectedTemplateForData(null);
        }}
        template={selectedTemplateForData}
        patient={{ name: 'Master Template Prefill Catalog', barcode: selectedTemplateForData?.templatesId || selectedTemplateForData?.reportId || 'MASTER' }}
        onSaveSuccess={() => {
          setMsg(`Successfully saved prefill findings for ${selectedTemplateForData?.TEMPLATE_NAME || 'template'}!`);
          setTimeout(() => setMsg(''), 4000);
          refreshCache();
        }}
      />
      */}
    </div>
  );
}
