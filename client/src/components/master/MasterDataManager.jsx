import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMaster } from '../../context/context.master.jsx';
import MasterEditModal from './MasterEditModal.jsx';
import TemplateReportModal from '../results/TemplateReportModal.jsx';
import { formatUnitName } from '../../utils/labTestUtils.js';
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
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { openUpstreamTemplateEditor } from '../../utils/templateSequence.js';

const MASTER_GROUPS = [
  {
    id: 'test_catalog',
    label: 'Test Catalog',
    description: 'Tests, Profiles, Packages, Templates',
    icon: FlaskConical,
    tabs: [
      { id: 'tests', label: 'Tests', icon: FlaskConical, singular: 'Test' },
      { id: 'profiles', label: 'Profiles', icon: Layers, singular: 'Profile' },
      { id: 'packages', label: 'Packages', icon: FileSpreadsheet, singular: 'Package' },
      { id: 'templates', label: 'Templates', icon: FileText, singular: 'Template' },
    ],
  },
  {
    id: 'report_setup',
    label: 'Report Setup',
    description: 'Departments, Method, Sample Types, Units, Interpretations',
    icon: SlidersHorizontal,
    tabs: [
      { id: 'departments', label: 'Departments', icon: Building, singular: 'Department' },
      { id: 'methods', label: 'Method', icon: Ruler, singular: 'Method' },
      { id: 'samples', label: 'Sample Types', icon: TestTube, singular: 'Sample Type' },
      { id: 'units', label: 'Units', icon: Ruler, singular: 'Unit' },
      { id: 'interpretations', label: 'Interpretations', icon: BookOpen, singular: 'Interpretation' },
    ],
  },
  {
    id: 'partnership',
    label: 'Partnership',
    description: 'Doctors, Referring Agents',
    icon: Stethoscope,
    tabs: [
      { id: 'doctors', label: 'Doctors', icon: Stethoscope, singular: 'Doctor' },
      { id: 'references', label: 'Referring Agents', icon: Users, singular: 'Referring Agent' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    description: 'Branches, Users & Roles',
    icon: ShieldCheck,
    tabs: [
      { id: 'branches', label: 'Branches', icon: MapPin, singular: 'Branch' },
      { id: 'users', label: 'Users & Roles', icon: Users, singular: 'User & Role' },
    ],
  },
];

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
    setSearchTerm('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tabId);
        return next;
      },
      { replace: true }
    );
  };

  // Sync activeTab state if URL query param changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const activeGroup = useMemo(() => {
    return (
      MASTER_GROUPS.find((group) => group.tabs.some((t) => t.id === activeTab)) ||
      MASTER_GROUPS[0]
    );
  }, [activeTab]);

  const activeTabMeta = useMemo(() => {
    for (const g of MASTER_GROUPS) {
      const found = g.tabs.find((t) => t.id === activeTab);
      if (found) return found;
    }
    return { id: activeTab, label: activeTab, singular: 'Item' };
  }, [activeTab]);

  const handleGroupSelect = (groupId) => {
    const targetGroup = MASTER_GROUPS.find((g) => g.id === groupId);
    if (!targetGroup) return;
    const isCurrentTabInGroup = targetGroup.tabs.some((t) => t.id === activeTab);
    if (!isCurrentTabInGroup) {
      const defaultTab = targetGroup.tabs[0].id;
      handleTabSelect(defaultTab);
    }
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
    let autoId = '';
    if (activeTab === 'users' || cacheKey === 'USER_LIST') {
      autoId =
        nextIds['USER_LIST'] !== undefined && nextIds['USER_LIST'] !== null
          ? String(nextIds['USER_LIST'])
          : '0';
    } else {
      autoId = (cacheKey && nextIds[cacheKey]) || nextIds[activeTab] || '';
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
      const name = u.Name || u.name || formatUnitName(id);
      if (id) {
        map.set(id, name);
        map.set(id.toUpperCase(), name);
        map.set(id.toLowerCase(), name);
        map.set(id.replace(/^u/i, ''), name);
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
      return <span className="text-slate-300 font-mono text-xs">—</span>;
    }
    const ids = String(signStr)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return <span className="text-slate-300 font-mono text-xs">—</span>;

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

  const tabCountMap = useMemo(
    () => ({
      tests: (tests || []).length,
      profiles: (profiles || []).length,
      packages: (packages || []).length,
      templates: (templates || []).length,
      departments: (departments || []).length,
      methods: (methods || []).length,
      samples: (samples || []).length,
      units: (units || []).length,
      interpretations: (interpretations || []).length,
      doctors: (doctors || []).length,
      references: (references || []).length,
      branches: (branches || []).length,
      users: (users || []).length,
    }),
    [
      tests,
      profiles,
      packages,
      templates,
      departments,
      methods,
      samples,
      units,
      interpretations,
      doctors,
      references,
      branches,
      users,
    ]
  );

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

      {/* 1. Executive 4-Group Structure Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {MASTER_GROUPS.map((group) => {
          const isGroupActive = activeGroup.id === group.id;
          const groupTotal = group.tabs.reduce((sum, t) => sum + (tabCountMap[t.id] || 0), 0);
          const GroupIcon = group.icon;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => handleGroupSelect(group.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isGroupActive
                  ? 'bg-indigo-50/70 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isGroupActive ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <GroupIcon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 ${
                    isGroupActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {groupTotal}
                </span>
              </div>
              <div className="min-w-0">
                <h3
                  className={`text-xs font-bold truncate ${
                    isGroupActive ? 'text-indigo-950 font-black' : 'text-slate-800'
                  }`}
                >
                  {group.label}
                </h3>
                <p className="text-[10px] text-slate-500 truncate mt-0.5" title={group.description}>
                  {group.tabs.map((t) => t.label).join(' • ')}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Active Group Tabs & Content Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Level 2 Sub-Tabs & Action Bar */}
        <div className="border-b border-slate-200 bg-slate-50 p-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5">
          {/* Active Group's Sub-tabs */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap min-w-0">
            {activeGroup.tabs.map((t) => {
              const TabIcon = t.icon;
              const isTabActive = activeTab === t.id;
              const count = tabCountMap[t.id] ?? 0;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    handleTabSelect(t.id);
                    setSearchTerm('');
                  }}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isTabActive
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-300 ring-1 ring-indigo-500/20 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isTabActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isTabActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search box & Add New Button */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <div className="relative w-full sm:w-60 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${activeTabMeta.label.toLowerCase()}...`}
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
                title={`Add new ${activeTabMeta.singular} to Master Catalog`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {activeTabMeta.singular}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Tables: Strictly Fixed Horizontal Layout (Zero Horizontal Scrollbar) */}
        <div className="w-full overflow-hidden">
          {/* 1. TESTS TAB */}
          {activeTab === 'tests' && (
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[7%]" />
                <col className="w-[28%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[9%]" />
                <col className="w-[11%]" />
                <col className="w-[8%]" />
                <col className="w-[6%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">ID</th>
                  <th className="py-2.5 px-3 truncate">Test Name</th>
                  <th className="py-2.5 px-3 truncate">Short Name</th>
                  <th className="py-2.5 px-3 truncate">Department</th>
                  <th className="py-2.5 px-3 truncate">Unit</th>
                  <th className="py-2.5 px-3 truncate">Sample Type</th>
                  <th className="py-2.5 px-3 truncate">Rate (₹)</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
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
                    const sampleType = String(t['Sample Type'] || t.sampleType || '').toLowerCase();
                    return name.includes(q) || id.includes(q) || shortName.includes(q) || dept.includes(q) || deptName.includes(q) || sampleType.includes(q);
                  })
                  .map((t) => {
                    const resolvedDept = deptMap.get(String(t['Dept Id'])) || t['Dept Id'] || '-';
                    const resolvedUnit = unitMap.get(String(t['Unit Id'])) || formatUnitName(t['Unit Id']) || '-';
                    return (
                      <tr key={t['Test Id']} className="hover:bg-blue-100/70 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600 truncate" title={t['Test Id']}>
                          {t['Test Id']}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-800 text-[11px] leading-tight truncate block" title={t.Name}>
                            {t.Name}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-slate-500 font-medium text-[11px] truncate block" title={t['Short Name'] || '-'}>
                            {t['Short Name'] || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700 font-medium truncate block" title={resolvedDept}>
                            {resolvedDept}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-medium text-slate-600 text-[11px] truncate block" title={resolvedUnit}>
                            {resolvedUnit}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-slate-600 text-[11px] truncate block" title={t['Sample Type'] || 'Serum'}>
                            {t['Sample Type'] || 'Serum'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900 text-xs font-mono truncate">
                            ₹{t.Rate || t.rate || '100'}
                          </div>
                          {(t.Rate1 || t.rate1 || t.Rate2 || t.rate2) ? (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1 truncate">
                              {Boolean(t.Rate1 || t.rate1) && <span>R1:₹{t.Rate1 || t.rate1}</span>}
                              {Boolean(t.Rate2 || t.rate2) && <span>R2:₹{t.Rate2 || t.rate2}</span>}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                            {t.Status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(t)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[30%]" />
                <col className="w-[10%]" />
                <col className="w-[16%]" />
                <col className="w-[9%]" />
                <col className="w-[7%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 truncate">Report ID</th>
                  <th className="py-3 px-3 truncate">Template Report Name</th>
                  <th className="py-3 px-3 truncate">Rate (₹)</th>
                  <th className="py-3 px-3 truncate">Signatures Assigned</th>
                  <th className="py-3 px-3 truncate">Sync Date</th>
                  <th className="py-3 px-3 text-center truncate">Status</th>
                  <th className="py-3 px-3 text-right truncate">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
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
                      <tr key={tmpl.templatesId || tmpl.reportId || idx} className="hover:bg-blue-100/70 transition-colors">
                        {/* 1. Report ID */}
                        <td className="py-3 px-3 font-mono font-bold text-purple-700 truncate" title={tmpl.reportId || (tmpl.templatesId ? `P14R${String(tmpl.templatesId).replace(/^T/i, '')}` : `P14R${idx + 1}`)}>
                          <span className="bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded text-[11px] truncate block">
                            {tmpl.reportId || (tmpl.templatesId ? `P14R${String(tmpl.templatesId).replace(/^T/i, '')}` : `P14R${idx + 1}`)}
                          </span>
                        </td>

                        {/* 2. Template Name */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 text-xs truncate" title={tmpl.TEMPLATE_NAME || tmpl.name}>
                            {tmpl.TEMPLATE_NAME || tmpl.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                            Full-page clinical template report
                          </div>
                        </td>

                        {/* 3. Rates: Standard Rate + Special Rate 1 & 2 */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 text-xs font-mono truncate">
                            ₹{tmpl.price ?? tmpl.Rate ?? tmpl.rate ?? '0'}
                          </div>
                          {(tmpl.price1 || tmpl.Rate1 || tmpl.price2 || tmpl.Rate2) ? (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1 truncate">
                              {Boolean(tmpl.price1 || tmpl.Rate1) && <span>R1:₹{tmpl.price1 || tmpl.Rate1}</span>}
                              {Boolean(tmpl.price2 || tmpl.Rate2) && <span>R2:₹{tmpl.price2 || tmpl.Rate2}</span>}
                            </div>
                          ) : null}
                        </td>

                        {/* 4. Signatures Assigned */}
                        <td className="py-3 px-3 truncate">
                          {renderSignatureBadges(tmpl.sign)}
                        </td>

                        {/* 5. Sync Date */}
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px] truncate">
                          {tmpl.templatesDate || '2026-11-01'}
                        </td>

                        {/* 6. Status */}
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border truncate inline-block ${
                            String(tmpl.status || '').toUpperCase() === 'SAVED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {tmpl.status || 'Active'}
                          </span>
                        </td>

                        {/* 7. Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 shrink-0">
                            {/* Primary: Modern Rich Template Editor */}
                            <button
                              type="button"
                              onClick={() => handleEditPrefillData(tmpl)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                              title="Open rich clinical template editor to edit report findings and format"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {/* Secondary: Basic Information & Signatures */}
                            <button
                              type="button"
                              onClick={() => handleEditBasic(tmpl)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                              title="Edit basic info (name, department, price, signatures)"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>Info</span>
                            </button>

                            {/* Tertiary: Official AWS Template Editor */}
                            <button
                              type="button"
                              onClick={() => handleOpenAwsEditor(tmpl)}
                              className="p-1 text-slate-400 hover:text-amber-700 bg-white hover:bg-amber-50 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Open official AWS template editor (editTemplateV2.jsp)"
                            >
                              <ExternalLink className="w-3 h-3" />
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

              <table className="w-full table-fixed text-left text-xs border-collapse">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[24%]" />
                  <col className="w-[8%]" />
                  <col className="w-[38%]" />
                  <col className="w-[8%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 truncate">Target ID</th>
                    <th className="py-2.5 px-3 truncate">Target Name</th>
                    <th className="py-2.5 px-3 truncate">Type</th>
                    <th className="py-2.5 px-3 truncate">Clinical Interpretation Preview</th>
                    <th className="py-2.5 px-3 truncate">Status</th>
                    <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                          <tr key={item.ID || item.id} className="hover:bg-blue-100/70 transition-colors">
                            {/* ID */}
                            <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 truncate" title={item.ID || item.id}>
                              {item.ID || item.id}
                            </td>

                            {/* Name */}
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800 text-[11px] leading-tight truncate block" title={item.Name || item.name}>
                                {item.Name || item.name}
                              </span>
                            </td>

                            {/* Type badge */}
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border truncate inline-block ${
                                  isProfile
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {item.Type || item.type || 'Test'}
                              </span>
                            </td>

                            {/* Interpretation Styled Preview */}
                            <td className="py-2.5 px-3">
                              {rawHtml ? (
                                <div className="space-y-1">
                                  <div
                                    className="text-[11px] line-clamp-2 text-slate-700 bg-slate-50/80 p-1.5 rounded border border-slate-200/70"
                                    dangerouslySetInnerHTML={{ __html: rawHtml }}
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px] truncate block">
                                  No clinical interpretation recorded yet.
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full truncate inline-block ${
                                  String(item.Status || item.status || '').toLowerCase() === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {item.Status || item.status || 'Active'}
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleEditItem(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                                title="Open styled writing panel (API_UPDATE_INTERPRETATION)"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Write</span>
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
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[38%]" />
                <col className="w-[30%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">Sample ID</th>
                  <th className="py-2.5 px-3 truncate">Sample / Specimen Name</th>
                  <th className="py-2.5 px-3 truncate">Target Application</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                      <tr key={s['Sample Id'] || s.id || idx} className="hover:bg-blue-100/70 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-amber-700 truncate" title={s['Sample Id'] || s.id || idx + 1}>
                          #{s['Sample Id'] || s.id || idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 text-xs truncate block" title={s.Name || s.name}>
                            {s.Name || s.name}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-slate-500 text-[11px] truncate block">
                            Master Test & Specimen Accessioning
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                            {s.Status || s.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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

          {activeTab === 'profiles' && (
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[9%]" />
                <col className="w-[21%]" />
                <col className="w-[14%]" />
                <col className="w-[36%]" />
                <col className="w-[8%]" />
                <col className="w-[5%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">Profile ID</th>
                  <th className="py-2.5 px-3 truncate">Profile Name</th>
                  <th className="py-2.5 px-3 truncate">Department</th>
                  <th className="py-2.5 px-3 truncate">Included Tests</th>
                  <th className="py-2.5 px-3 truncate">Rate (₹)</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                      <tr key={p['Profile Id']} className="hover:bg-blue-100/70 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600 truncate" title={p['Profile Id']}>
                          {p['Profile Id']}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-800 text-[11px] leading-tight truncate block" title={p.Name}>
                            {p.Name}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-medium truncate block" title={resolvedDept}>
                            {resolvedDept}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {subTestNames.length === 0 ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                              {subTestNames.map((tName, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 truncate max-w-[140px]"
                                  title={tName}
                                >
                                  {tName}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        {/* Rates */}
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900 text-xs font-mono truncate">
                            ₹{p.Rate || p.rate || p.price || '0'}
                          </div>
                          {(p.Rate1 || p.rate1 || p.price1 || p.Rate2 || p.rate2 || p.price2 || p.Rate3 || p.rate3) ? (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1 truncate">
                              {Boolean(p.Rate1 || p.rate1 || p.price1) && (
                                <span>R1:₹{p.Rate1 || p.rate1 || p.price1}</span>
                              )}
                              {Boolean(p.Rate2 || p.rate2 || p.price2) && (
                                <span>R2:₹{p.Rate2 || p.rate2 || p.price2}</span>
                              )}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                            {p.Status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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

          {activeTab === 'packages' && (
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[24%]" />
                <col className="w-[20%]" />
                <col className="w-[6%]" />
                <col className="w-[5%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">Pkg ID</th>
                  <th className="py-2.5 px-3 truncate">Package Name</th>
                  <th className="py-2.5 px-3 truncate">Department</th>
                  <th className="py-2.5 px-3 truncate">Included Tests</th>
                  <th className="py-2.5 px-3 truncate">Included Profiles</th>
                  <th className="py-2.5 px-3 truncate">Rate (₹)</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                        <tr key={pkg['Package Id'] || pkg.id} className="hover:bg-blue-100/70 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-indigo-600 truncate" title={pkg['Package Id'] || pkg.id}>
                            {pkg['Package Id'] || pkg.id}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900 text-[11px] leading-tight truncate block" title={pkg.Name || pkg.name}>
                              {pkg.Name || pkg.name}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-medium truncate block" title={resolvedDept}>
                              {resolvedDept}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {subTestNames.length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                                {subTestNames.map((tName, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 truncate max-w-[120px]"
                                    title={tName}
                                  >
                                    {tName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {subProfNames.length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                                {subProfNames.map((pName, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/70 truncate max-w-[120px]"
                                    title={pName}
                                  >
                                    {pName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900 text-xs font-mono truncate">
                              ₹{pkg.Rate || pkg.rate || '0'}
                            </div>
                            {(pkg.Rate1 || pkg.rate1 || pkg.Rate2 || pkg.rate2) ? (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1 truncate">
                                {Boolean(pkg.Rate1 || pkg.rate1) && <span>R1:₹{pkg.Rate1 || pkg.rate1}</span>}
                                {Boolean(pkg.Rate2 || pkg.rate2) && <span>R2:₹{pkg.Rate2 || pkg.rate2}</span>}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                              {pkg.Status || 'Active'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleEditItem(pkg)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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
          {/* DOCTORS TAB */}
          {activeTab === 'doctors' && (
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[9%]" />
                <col className="w-[27%]" />
                <col className="w-[27%]" />
                <col className="w-[18%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">Doc ID</th>
                  <th className="py-2.5 px-3 truncate">Doctor Name</th>
                  <th className="py-2.5 px-3 truncate">Degrees / Specialization</th>
                  <th className="py-2.5 px-3 truncate">Contact</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                    <tr key={d['Doct Id']} className="hover:bg-blue-100/70 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-indigo-600 truncate" title={d['Doct Id']}>
                        {d['Doct Id']}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-800 text-[11px] leading-tight truncate block" title={d.Name}>
                          {d.Name}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-slate-600 text-[11px] truncate block" title={d.Deg || '-'}>
                          {d.Deg || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-slate-600 text-[11px] truncate block" title={d.Contact || '-'}>
                          {d.Contact || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                          {d.Status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditItem(d)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[21%]" />
                <col className="w-[21%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-[9%]" />
                <col className="w-[6%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">Refer ID</th>
                  <th className="py-2.5 px-3 truncate">Referring Agent / Source</th>
                  <th className="py-2.5 px-3 truncate">Address / Location</th>
                  <th className="py-2.5 px-3 truncate">Contact</th>
                  <th className="py-2.5 px-3 truncate">Commission Rate</th>
                  <th className="py-2.5 px-3 truncate">Type</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                        <tr key={referId} className="hover:bg-blue-100/70 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-indigo-600 truncate" title={`#${referId}`}>
                            #{referId}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900 text-[11px] leading-tight truncate block" title={name}>
                              {name}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-slate-600 text-[11px] truncate block" title={address}>
                              {address}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 text-[11px] truncate" title={contact}>
                            {contact}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-mono font-bold text-slate-800 text-xs truncate block">
                              {rate}{type === 'P' ? '%' : ' Fixed'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded-full truncate inline-block ' + (
                              type === 'P' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            )}>
                              {type === 'P' ? 'Percentage' : 'Fixed'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                              {status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleEditItem(r)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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

          {/* DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[30%]" />
                <col className="w-[15%]" />
                <col className="w-[25%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">Dept ID</th>
                  <th className="py-2.5 px-3 truncate">Department Name</th>
                  <th className="py-2.5 px-3 truncate">Short Name</th>
                  <th className="py-2.5 px-3 truncate">Signatures</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                    <tr key={dept['Dept Id']} className="hover:bg-blue-100/70 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-indigo-600 truncate" title={dept['Dept Id']}>
                        {dept['Dept Id']}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-800 text-[11px] leading-tight truncate block" title={dept.Name}>
                          {dept.Name}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-slate-500 font-medium text-[11px] truncate block" title={dept['Short Name'] || '-'}>
                          {dept['Short Name'] || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3 truncate">{renderSignatureBadges(dept.sign)}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                          {dept.Status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditItem(dept)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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

          {/* UNITS TAB */}
          {activeTab === 'units' && (
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[55%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">Unit ID</th>
                  <th className="py-2.5 px-3 truncate">Unit Name / Symbol</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                      <tr key={u['Unit Id'] || u.id} className="hover:bg-blue-100/70 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600 truncate" title={u['Unit Id'] || u.id}>
                          {u['Unit Id'] || u.id}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 text-xs truncate block" title={u.Name || u.name}>
                            {u.Name || u.name}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                            {u.Status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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

          {/* METHODS TAB */}
          {activeTab === 'methods' && (
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[55%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">Method ID</th>
                  <th className="py-2.5 px-3 truncate">Methodology / Technique</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(methods || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No methodologies found in catalog.
                    </td>
                  </tr>
                ) : (
                  (methods || [])
                    .filter((m) => {
                      if (!searchTerm) return true;
                      const q = searchTerm.toLowerCase().trim();
                      const name = String(m.Name || m.name || '').toLowerCase();
                      const id = String(m['Method Id'] || m.id || '').toLowerCase();
                      return name.includes(q) || id.includes(q);
                    })
                    .map((m) => (
                      <tr key={m['Method Id'] || m.id} className="hover:bg-blue-100/70 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600 truncate" title={m['Method Id'] || m.id}>
                          {m['Method Id'] || m.id}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 text-xs truncate block" title={m.Name || m.name}>
                            {m.Name || m.name}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                            {m.Status || m.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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

          {/* BRANCHES TAB */}
          {activeTab === 'branches' && (
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[28%]" />
                <col className="w-[30%]" />
                <col className="w-[16%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">Branch ID</th>
                  <th className="py-2.5 px-3 truncate">Branch Name</th>
                  <th className="py-2.5 px-3 truncate">Location / Address</th>
                  <th className="py-2.5 px-3 truncate">Contact Phone</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                      <tr key={b.branchId || b.id} className="hover:bg-blue-100/70 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600 truncate" title={`#${b.branchId || b.id}`}>
                          #{b.branchId || b.id}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 text-xs truncate block" title={b.name || b.Name}>
                            {b.name || b.Name}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-slate-600 font-medium text-[11px] truncate block" title={b.location || '-'}>
                            {b.location || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700 text-[11px] truncate" title={b.contact || '-'}>
                          {b.contact || '-'}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                            {b.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[14%]" />
                <col className="w-[20%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 truncate">User ID</th>
                  <th className="py-2.5 px-3 truncate">Login ID</th>
                  <th className="py-2.5 px-3 truncate">Staff Name</th>
                  <th className="py-2.5 px-3 truncate">Access Type / Role</th>
                  <th className="py-2.5 px-3 truncate">Mobile</th>
                  <th className="py-2.5 px-3 truncate">2FA Status</th>
                  <th className="py-2.5 px-3 truncate">Status</th>
                  <th className="py-2.5 px-3 text-right truncate">Action</th>
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
                      <tr key={u.userId} className="hover:bg-blue-100/70 transition-colors">
                        <td className="py-2 px-3 font-mono text-[11px] truncate" title={u.userId}>{u.userId}</td>
                        <td className="py-2 px-3 font-bold text-indigo-700 text-xs truncate" title={u.loginId}>{u.loginId}</td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-800 text-[11px] leading-tight truncate block" title={u.name}>
                            {u.name}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded truncate inline-block">
                            {access || 'Staff'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px] truncate" title={u.mobile}>{u.mobile}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate inline-block ${
                              u.status2FA === 'Enabled' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {u.status2FA || 'DISABLED'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block">
                            {u.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditItem(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer shrink-0"
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
