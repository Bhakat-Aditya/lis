import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { useMaster } from '../../context/context.master.jsx';
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  FlaskConical,
  Layers,
  FileSpreadsheet,
  Stethoscope,
  Building,
  Ruler,
  MapPin,
  Users,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';

const SAMPLE_TYPE_OPTIONS = [
  'Serum',
  'EDTA Whole Blood',
  'Plasma (Fluoride)',
  'Plasma (Citrate)',
  'Whole Blood',
  'Urine',
  'Stool',
  'Sputum',
  'Swab',
  'CSF / Body Fluid',
  'Other',
];

const ACCESS_ROLE_OPTIONS = [
  'Super',
  'Settings',
  'Receptionist',
  'Doctor',
  'Technician',
  'Microbiology User',
  'Branch',
  'Office',
];

export default function MasterEditModal({
  isOpen,
  onClose,
  category, // 'tests' | 'profiles' | 'packages' | 'doctors' | 'departments' | 'units' | 'branches' | 'users'
  item, // item data to edit or null for add
  onSaved,
}) {
  const {
    departments = [],
    units = [],
    methods = [],
    profiles = [],
    packages = [],
    tests = [],
    branches = [],
    updateMasterItem,
  } = useMaster();

  const isEditing = Boolean(item);

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [profileSearch, setProfileSearch] = useState('');

  // Initialize form state when item or category changes
  useEffect(() => {
    if (!isOpen) {
      setFormData({});
      setError('');
      setSuccessMsg('');
      setTestSearch('');
      setProfileSearch('');
      return;
    }

    setError('');
    setSuccessMsg('');

    if (category === 'tests') {
      setFormData({
        TEST_ID: item?.['Test Id'] || item?.id || '',
        TEST_NAME: item?.Name || item?.name || '',
        TEST_SHORT_NAME: item?.['Short Name'] || item?.shortName || '',
        TEST_DEPTID: item?.['Dept Id'] || item?.deptId || departments[0]?.['Dept Id'] || 'D1',
        TEST_SAMPLE: item?.['Sample Type'] || item?.sampleType || 'Serum',
        TEST_METHOD_ID: item?.['Method Id'] || item?.methodId || methods[0]?.['Method Id'] || 'M1',
        TEST_UNIT_ID: item?.['Unit Id'] || item?.unitId || units[0]?.['Unit Id'] || 'U1',
        TEST_STATUS: item?.Status || item?.status || 'Active',
        TEST_RATE: item?.Rate || item?.rate || '',
        TEST_RATE1: item?.Rate1 || item?.rate1 || '',
        TEST_RATE2: item?.Rate2 || item?.rate2 || '',
        TEST_COMMENT: item?.Comment || item?.comment || '',
        rg0l: item?.rg0l || '',
        rg0h: item?.rg0h || item?.RF0 || item?.['Ref Range'] || '',
        rg1l: item?.rg1l || '',
        rg1h: item?.rg1h || item?.RF1 || '',
      });
    } else if (category === 'profiles') {
      setFormData({
        PROFILE_ID: item?.['Profile Id'] || item?.id || '',
        PROFILE_NAME: item?.Name || item?.name || '',
        PROFILE_DEPTID: item?.['Dept Id'] || item?.deptId || departments[0]?.['Dept Id'] || 'D1',
        PROFILE_STATUS: item?.Status || item?.status || 'Active',
        PROFILE_RATE: item?.Rate || item?.rate || '',
        PROFILE_RATE1: item?.Rate1 || item?.rate1 || '',
        PROFILE_RATE2: item?.Rate2 || item?.rate2 || '',
        PROFILE_TEST_ID_LIST: item?.['Test Id List'] || item?.testIdList || '',
      });
    } else if (category === 'packages') {
      setFormData({
        PKG_ID: item?.['Package Id'] || item?.id || '',
        PKG_NAME: item?.Name || item?.name || '',
        PKG_DEPTID: item?.['Dept Id'] || item?.deptId || departments[0]?.['Dept Id'] || 'D1',
        PKG_STATUS: item?.Status || item?.status || 'Active',
        PKG_RATE: item?.Rate || item?.rate || '',
        PKG_RATE1: item?.Rate1 || item?.rate1 || '',
        PKG_RATE2: item?.Rate2 || item?.rate2 || '',
        PKG_TEST_ID_LIST: item?.['Test Id List'] || item?.testIdList || '',
        PKG_PROFILE_ID_LIST: item?.['Profile Id List'] || item?.profileIdList || '',
      });
    } else if (category === 'doctors') {
      setFormData({
        id: item?.['Doct Id'] || item?.id || '',
        name: item?.Name || item?.name || '',
        deg: item?.Deg || item?.deg || '',
        contact: item?.Contact || item?.contact || '',
        rate: item?.Rate || item?.rate || '',
        type: item?.Type || item?.type || 'P',
        status: item?.Status || item?.status || 'Active',
        sampleId: item?.sampleId || '101.3',
      });
    } else if (category === 'departments') {
      setFormData({
        id: item?.['Dept Id'] || item?.id || '',
        name: item?.Name || item?.name || '',
        shortname: item?.['Short Name'] || item?.shortname || '',
        status: item?.Status || item?.status || 'Active',
        sampleId: item?.sampleId || '101.3',
      });
    } else if (category === 'units') {
      setFormData({
        id: item?.['Unit Id'] || item?.id || '',
        name: item?.Name || item?.name || '',
        status: item?.Status || item?.status || 'Active',
      });
    } else if (category === 'branches') {
      setFormData({
        id: item?.branchId || item?.id || '',
        name: item?.name || item?.Name || '',
        location: item?.location || item?.Location || '',
        contact: item?.contact || item?.Contact || '',
        status: item?.status || item?.Status || 'Active',
        sampleId: item?.sampleId || '101.3',
      });
    } else if (category === 'users') {
      let currentAccess = 'Settings';
      if (item?.accessPermissionJson) {
        try {
          const parsed = typeof item.accessPermissionJson === 'string' ? JSON.parse(item.accessPermissionJson) : item.accessPermissionJson;
          currentAccess = parsed?.accessType || item.accessPermissionJson;
        } catch (e) {
          currentAccess = item.accessPermissionJson;
        }
      }
      setFormData({
        id: item?.userId || item?.id || '',
        login: item?.loginId || item?.login || '',
        name: item?.name || item?.Name || '',
        mobile: item?.mobile || '',
        email: item?.email || '',
        password: '',
        access: currentAccess,
        accessbranch: item?.accessBranch || item?.accessbranch || '',
        status: item?.status || item?.Status || 'Active',
      });
    }
  }, [isOpen, category, item, departments, units, methods]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper for toggle inclusion of a test ID in a comma-separated list
  const toggleTestId = (targetField, testId) => {
    const currentList = String(formData[targetField] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    let updated;
    if (currentList.includes(testId)) {
      updated = currentList.filter((id) => id !== testId);
    } else {
      updated = [...currentList, testId];
    }
    handleChange(targetField, updated.join(','));
  };

  // Helper for toggle inclusion of a profile ID in a comma-separated list
  const toggleProfileId = (targetField, profId) => {
    const currentList = String(formData[targetField] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    let updated;
    if (currentList.includes(profId)) {
      updated = currentList.filter((id) => id !== profId);
    } else {
      updated = [...currentList, profId];
    }
    handleChange(targetField, updated.join(','));
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'tests':
        return isEditing ? `Edit Diagnostic Test (${formData.TEST_ID || ''})` : 'Add New Diagnostic Test';
      case 'profiles':
        return isEditing ? `Edit Test Profile (${formData.PROFILE_ID || ''})` : 'Add New Test Profile';
      case 'packages':
        return isEditing ? `Edit Investigation Package (${formData.PKG_ID || ''})` : 'Add New Package';
      case 'doctors':
        return isEditing ? `Edit Referral Doctor (${formData.id || ''})` : 'Add New Referral Doctor';
      case 'departments':
        return isEditing ? `Edit Lab Department (${formData.id || ''})` : 'Add New Department';
      case 'units':
        return isEditing ? `Edit Measurement Unit (${formData.id || ''})` : 'Add New Unit';
      case 'branches':
        return isEditing ? `Edit Lab Branch (#${formData.id || ''})` : 'Add New Branch';
      case 'users':
        return isEditing ? `Edit Staff User (${formData.login || ''})` : 'Add New Staff User';
      default:
        return 'Edit Master Catalog Item';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // Map category to API route slug: /master/:type
      const routeTypeMap = {
        tests: 'test',
        profiles: 'profile',
        packages: 'package',
        doctors: 'doctor',
        departments: 'department',
        units: 'unit',
        branches: 'branch',
        users: 'user',
      };

      const apiType = routeTypeMap[category];
      if (!apiType) {
        throw new Error(`Unsupported master category: ${category}`);
      }

      const res = await updateMasterItem(apiType, formData);

      if (!res.success) {
        throw new Error(res.error || 'Failed to save changes');
      }

      setSuccessMsg(res.message || 'Updated successfully in Master Catalog!');
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getCategoryTitle()}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. TESTS FORM */}
        {category === 'tests' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Test ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.TEST_ID || ''}
                  onChange={(e) => handleChange('TEST_ID', e.target.value)}
                  placeholder="e.g. T125 or 125"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Test Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.TEST_NAME || ''}
                  onChange={(e) => handleChange('TEST_NAME', e.target.value)}
                  placeholder="e.g. Hemoglobin (Hb)"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Short Code / Abbreviation
                </label>
                <input
                  type="text"
                  value={formData.TEST_SHORT_NAME || ''}
                  onChange={(e) => handleChange('TEST_SHORT_NAME', e.target.value)}
                  placeholder="e.g. HB"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Department *
                </label>
                <select
                  value={formData.TEST_DEPTID || ''}
                  onChange={(e) => handleChange('TEST_DEPTID', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  {departments.map((d) => (
                    <option key={d['Dept Id'] || d.id} value={d['Dept Id'] || d.id}>
                      {d.Name || d.name} ({d['Dept Id'] || d.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sample Type
                </label>
                <select
                  value={formData.TEST_SAMPLE || 'Serum'}
                  onChange={(e) => handleChange('TEST_SAMPLE', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  {SAMPLE_TYPE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Measurement Unit
                </label>
                <select
                  value={formData.TEST_UNIT_ID || ''}
                  onChange={(e) => handleChange('TEST_UNIT_ID', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  {units.map((u) => (
                    <option key={u['Unit Id'] || u.id} value={u['Unit Id'] || u.id}>
                      {u.Name || u.name} ({u['Unit Id'] || u.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Methodology
                </label>
                <select
                  value={formData.TEST_METHOD_ID || ''}
                  onChange={(e) => handleChange('TEST_METHOD_ID', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  {methods.map((m) => (
                    <option key={m['Method Id'] || m.id} value={m['Method Id'] || m.id}>
                      {m.Name || m.name} ({m['Method Id'] || m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.TEST_STATUS || 'Active'}
                  onChange={(e) => handleChange('TEST_STATUS', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Deactive">Deactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Standard Rate (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.TEST_RATE || ''}
                  onChange={(e) => handleChange('TEST_RATE', e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Ref Range Low (rg0l)
                </label>
                <input
                  type="text"
                  value={formData.rg0l || ''}
                  onChange={(e) => handleChange('rg0l', e.target.value)}
                  placeholder="e.g. 12.0"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Ref Range High / Text (rg0h)
                </label>
                <input
                  type="text"
                  value={formData.rg0h || ''}
                  onChange={(e) => handleChange('rg0h', e.target.value)}
                  placeholder="e.g. 16.0 or 12.0 - 16.0"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Clinical Interpretation / Comment Template
              </label>
              <textarea
                rows={2}
                value={formData.TEST_COMMENT || ''}
                onChange={(e) => handleChange('TEST_COMMENT', e.target.value)}
                placeholder="Optional clinical notes or standard comments..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* 2. PROFILES FORM */}
        {category === 'profiles' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Profile ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.PROFILE_ID || ''}
                  onChange={(e) => handleChange('PROFILE_ID', e.target.value)}
                  placeholder="e.g. P18 or 18"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.PROFILE_NAME || ''}
                  onChange={(e) => handleChange('PROFILE_NAME', e.target.value)}
                  placeholder="e.g. COMPLETE BLOOD COUNT (CBC)"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Department *
                </label>
                <select
                  value={formData.PROFILE_DEPTID || ''}
                  onChange={(e) => handleChange('PROFILE_DEPTID', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  {departments.map((d) => (
                    <option key={d['Dept Id'] || d.id} value={d['Dept Id'] || d.id}>
                      {d.Name || d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Profile Rate (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.PROFILE_RATE || ''}
                  onChange={(e) => handleChange('PROFILE_RATE', e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.PROFILE_STATUS || 'Active'}
                  onChange={(e) => handleChange('PROFILE_STATUS', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Deactive">Deactive</option>
                </select>
              </div>
            </div>

            {/* Test Selection for Profile */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Included Sub-Tests ({String(formData.PROFILE_TEST_ID_LIST || '').split(',').filter(Boolean).length} Selected)
                </label>
                <input
                  type="text"
                  placeholder="Filter tests..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="w-44 px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              {/* Selected Tags */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-lg">
                {String(formData.PROFILE_TEST_ID_LIST || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean).length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No tests selected yet. Select from below.</span>
                ) : (
                  String(formData.PROFILE_TEST_ID_LIST || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((tId) => {
                      const matched = tests.find((t) => String(t['Test Id']) === tId || String(t.id) === tId);
                      return (
                        <span
                          key={tId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                        >
                          <span>{matched?.Name || tId}</span>
                          <button
                            type="button"
                            onClick={() => toggleTestId('PROFILE_TEST_ID_LIST', tId)}
                            className="hover:text-red-600 font-bold ml-0.5 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })
                )}
              </div>

              {/* Test Picker List */}
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 text-xs">
                {tests
                  .filter((t) => {
                    if (!testSearch) return true;
                    const q = testSearch.toLowerCase();
                    return (
                      String(t.Name || '').toLowerCase().includes(q) ||
                      String(t['Test Id'] || '').toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 50)
                  .map((t) => {
                    const tId = String(t['Test Id'] || t.id);
                    const selected = String(formData.PROFILE_TEST_ID_LIST || '')
                      .split(',')
                      .map((s) => s.trim())
                      .includes(tId);
                    return (
                      <div
                        key={tId}
                        onClick={() => toggleTestId('PROFILE_TEST_ID_LIST', tId)}
                        className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                          selected ? 'bg-indigo-50/60 font-semibold text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {}}
                            className="rounded text-indigo-600"
                          />
                          <span>{t.Name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">ID: {tId}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* 3. PACKAGES FORM */}
        {category === 'packages' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Package ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.PKG_ID || ''}
                  onChange={(e) => handleChange('PKG_ID', e.target.value)}
                  placeholder="e.g. K1 or 5"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.PKG_NAME || ''}
                  onChange={(e) => handleChange('PKG_NAME', e.target.value)}
                  placeholder="e.g. Comprehensive Executive Health Checkup"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Department
                </label>
                <select
                  value={formData.PKG_DEPTID || ''}
                  onChange={(e) => handleChange('PKG_DEPTID', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  {departments.map((d) => (
                    <option key={d['Dept Id'] || d.id} value={d['Dept Id'] || d.id}>
                      {d.Name || d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Package Rate (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.PKG_RATE || ''}
                  onChange={(e) => handleChange('PKG_RATE', e.target.value)}
                  placeholder="e.g. 1200"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Special Rate 1 (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.PKG_RATE1 || ''}
                  onChange={(e) => handleChange('PKG_RATE1', e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.PKG_STATUS || 'Active'}
                  onChange={(e) => handleChange('PKG_STATUS', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Deactive">Deactive</option>
                </select>
              </div>
            </div>

            {/* Test and Profile Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Included Profiles */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Profiles ({String(formData.PKG_PROFILE_ID_LIST || '').split(',').filter(Boolean).length})
                  </label>
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={profileSearch}
                    onChange={(e) => setProfileSearch(e.target.value)}
                    className="w-32 px-2 py-0.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 text-xs">
                  {profiles
                    .filter((p) => !profileSearch || String(p.Name || '').toLowerCase().includes(profileSearch.toLowerCase()))
                    .map((p) => {
                      const pId = String(p['Profile Id'] || p.id);
                      const selected = String(formData.PKG_PROFILE_ID_LIST || '').split(',').map((s) => s.trim()).includes(pId);
                      return (
                        <div
                          key={pId}
                          onClick={() => toggleProfileId('PKG_PROFILE_ID_LIST', pId)}
                          className={`px-2.5 py-1.5 flex items-center justify-between cursor-pointer ${
                            selected ? 'bg-indigo-50 font-semibold text-indigo-900' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <input type="checkbox" checked={selected} onChange={() => {}} className="rounded" />
                            <span className="truncate max-w-[180px]">{p.Name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">ID: {pId}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Included Standalone Tests */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Tests ({String(formData.PKG_TEST_ID_LIST || '').split(',').filter(Boolean).length})
                  </label>
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="w-32 px-2 py-0.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 text-xs">
                  {tests
                    .filter((t) => !testSearch || String(t.Name || '').toLowerCase().includes(testSearch.toLowerCase()))
                    .slice(0, 40)
                    .map((t) => {
                      const tId = String(t['Test Id'] || t.id);
                      const selected = String(formData.PKG_TEST_ID_LIST || '').split(',').map((s) => s.trim()).includes(tId);
                      return (
                        <div
                          key={tId}
                          onClick={() => toggleTestId('PKG_TEST_ID_LIST', tId)}
                          className={`px-2.5 py-1.5 flex items-center justify-between cursor-pointer ${
                            selected ? 'bg-indigo-50 font-semibold text-indigo-900' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <input type="checkbox" checked={selected} onChange={() => {}} className="rounded" />
                            <span className="truncate max-w-[180px]">{t.Name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">ID: {tId}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. DOCTORS FORM */}
        {category === 'doctors' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Doctor ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.id || ''}
                  onChange={(e) => handleChange('id', e.target.value)}
                  placeholder="e.g. D1 or 12"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Dr. Sushobhon Maiti"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Degrees / Specialization
                </label>
                <input
                  type="text"
                  value={formData.deg || ''}
                  onChange={(e) => handleChange('deg', e.target.value)}
                  placeholder="e.g. MBBS, MD, MS GASTRO"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.contact || ''}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Commission / Rate
                </label>
                <input
                  type="text"
                  value={formData.rate || ''}
                  onChange={(e) => handleChange('rate', e.target.value)}
                  placeholder="e.g. 10 or 0"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Commission Type
                </label>
                <select
                  value={formData.type || 'P'}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="P">Percentage (%)</option>
                  <option value="F">Fixed (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'Active'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Deactive">Deactive</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 5. DEPARTMENTS FORM */}
        {category === 'departments' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Dept ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.id || ''}
                  onChange={(e) => handleChange('id', e.target.value)}
                  placeholder="e.g. D1 or 16"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. HAEMATOLOGY TESTS"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Short Name / Acronym *
                </label>
                <input
                  type="text"
                  required
                  value={formData.shortname || ''}
                  onChange={(e) => handleChange('shortname', e.target.value)}
                  placeholder="e.g. HEMA"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'Active'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Deactive">Deactive</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 6. UNITS FORM */}
        {category === 'units' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Unit ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.id || ''}
                  onChange={(e) => handleChange('id', e.target.value)}
                  placeholder="e.g. U1 or 49"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Unit Symbol / Label *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. mg%, g/dL, cells/cu.mm, %"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Status
              </label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="Active">Active</option>
                <option value="Deactive">Deactive</option>
              </select>
            </div>
          </div>
        )}

        {/* 7. BRANCHES FORM */}
        {category === 'branches' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Branch ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.id || ''}
                  onChange={(e) => handleChange('id', e.target.value)}
                  placeholder="e.g. 1, 2"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Midnapore Central Lab"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Rabindra Nagar, 721101"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.contact || ''}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  placeholder="e.g. 8670207475"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Status
              </label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="Active">Active</option>
                <option value="Deactive">Deactive</option>
              </select>
            </div>
          </div>
        )}

        {/* 8. USERS FORM */}
        {category === 'users' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  User ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.id || ''}
                  onChange={(e) => handleChange('id', e.target.value)}
                  placeholder="e.g. 2, 7"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Login ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.login || ''}
                  onChange={(e) => handleChange('login', e.target.value)}
                  placeholder="e.g. entry, sandip"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Staff Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Entry User"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={formData.mobile || ''}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  placeholder="e.g. 7001356588"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="e.g. user@lab.com"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Access Level / Role *
                </label>
                <select
                  value={formData.access || 'Settings'}
                  onChange={(e) => handleChange('access', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-indigo-700"
                >
                  {ACCESS_ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Access Branch
                </label>
                <select
                  value={formData.accessbranch || ''}
                  onChange={(e) => handleChange('accessbranch', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.branchId || b.id} value={b.branchId || b.id}>
                      {b.name || b.Name} (#{b.branchId || b.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'Active'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Deactive">Deactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Password {isEditing ? '(Leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                required={!isEditing}
                value={formData.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={isEditing ? '••••••••' : 'Enter login password'}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{loading ? 'Saving to AWS...' : isEditing ? 'Save Changes' : 'Create in Catalog'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

