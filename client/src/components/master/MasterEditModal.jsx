import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { useMaster } from '../../context/context.master.jsx';
import InterpretationRichEditor from './InterpretationRichEditor.jsx';
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

function SignatureSelector({ signList = [], value = '', onChange }) {
  const selectedIds = String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const getSignDetails = (id) => {
    const found = signList.find((s) => String(s.id) === String(id));
    return {
      name: found?.name || `Signature #${id}`,
      designation: found?.designation || '',
    };
  };

  const handleToggle = (id) => {
    const sId = String(id).trim();
    if (selectedIds.includes(sId)) {
      const updated = selectedIds.filter((x) => x !== sId);
      onChange(updated.join(','));
    } else {
      const updated = [...selectedIds, sId];
      onChange(updated.join(','));
    }
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const updated = [...selectedIds];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onChange(updated.join(','));
  };

  const handleMoveDown = (index) => {
    if (index >= selectedIds.length - 1) return;
    const updated = [...selectedIds];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onChange(updated.join(','));
  };

  return (
    <div className="space-y-2.5 pt-3 border-t border-slate-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
            Select Signatures & Print Sequence
          </label>
          <p className="text-[11px] text-slate-500">
            Select signatures and order sequence as required. (API sends <code className="font-mono text-indigo-600 font-bold">sign={selectedIds.join(',') || '...'}</code>)
          </p>
        </div>
        {selectedIds.length > 0 && (
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
            sign={selectedIds.join(',')}
          </span>
        )}
      </div>

      {/* Selected Sequence List */}
      {selectedIds.length > 0 ? (
        <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
            Selected Sign-Off Sequence ({selectedIds.length})
          </span>
          <div className="space-y-1">
            {selectedIds.map((id, idx) => {
              const details = getSignDetails(id);
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{details.name}</span>
                    {details.designation && (
                      <span className="text-[10px] text-slate-500 font-normal truncate">
                        ({details.designation})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move up in sequence"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === selectedIds.length - 1}
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move down in sequence"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(id)}
                      className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer ml-1"
                      title="Remove signature"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-dashed border-slate-200 text-center">
          No signatures selected yet. Click from the list below to assign.
        </div>
      )}

      {/* Available Signatures */}
      <div>
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
          Available System Signatures
        </span>
        <div className="flex flex-wrap gap-1.5">
          {signList.map((s) => {
            const sId = String(s.id);
            const isSelected = selectedIds.includes(sId);
            return (
              <button
                key={sId}
                type="button"
                onClick={() => handleToggle(sId)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs ring-1 ring-emerald-200'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{isSelected ? '✓' : '+'}</span>
                <span>{s.name || `Sign #${sId}`}</span>
                {s.designation && (
                  <span className="text-[10px] opacity-75 font-normal">({s.designation})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Safely parse a reference range string (e.g. "12-18", "4000-11000", "<6", "-")
 * into min and max components for the demographic brackets.
 */
function parseRangeString(rfStr, fallbackL = '', fallbackH = '') {
  if (
    (fallbackL !== undefined && fallbackL !== null && String(fallbackL).trim() !== '') ||
    (fallbackH !== undefined && fallbackH !== null && String(fallbackH).trim() !== '')
  ) {
    return { min: String(fallbackL || '').trim(), max: String(fallbackH || '').trim() };
  }
  const raw = String(rfStr || '').trim();
  if (!raw || raw === '-') return { min: '', max: '' };
  if (raw.includes('-')) {
    const parts = raw.split('-');
    if (parts.length === 2) {
      return { min: parts[0].trim(), max: parts[1].trim() };
    }
    if (raw.startsWith('-') && parts.length === 3) {
      return { min: `-${parts[1].trim()}`, max: parts[2].trim() };
    }
  }
  return { min: '', max: raw };
}

export default function MasterEditModal({
  isOpen,
  onClose,
  category, // 'tests' | 'profiles' | 'packages' | 'doctors' | 'departments' | 'units' | 'branches' | 'users' | 'templates' | 'samples'
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
    samples = [],
    signList = [],
    updateMasterItem,
  } = useMaster();

  const isEditing = Boolean(item && !item.isNew);

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
      const rf0 = parseRangeString(item?.RF0 || item?.['Ref Range'], item?.rg0l, item?.rg0h);
      const rf1 = parseRangeString(item?.RF1, item?.rg1l, item?.rg1h);
      const rf2 = parseRangeString(item?.RF2, item?.rg2l, item?.rg2h);
      const rf3 = parseRangeString(item?.RF3, item?.rg3l, item?.rg3h);
      const rf4 = parseRangeString(item?.RF4, item?.rg4l, item?.rg4h);
      const rf5 = parseRangeString(item?.RF5, item?.rg5l, item?.rg5h);
      const rf6 = parseRangeString(item?.RF6, item?.rg6l, item?.rg6h);

      setFormData({
        TEST_ID: item?.['Test Id'] || item?.id || item?.nextId || '',
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
        rg0l: rf0.min,
        rg0h: rf0.max,
        rg1l: rf1.min,
        rg1h: rf1.max,
        rg2l: rf2.min,
        rg2h: rf2.max,
        rg3l: rf3.min,
        rg3h: rf3.max,
        rg4l: rf4.min,
        rg4h: rf4.max,
        rg5l: rf5.min,
        rg5h: rf5.max,
        rg6l: rf6.min,
        rg6h: rf6.max,
      });
    } else if (category === 'profiles') {
      setFormData({
        PROFILE_ID: item?.['Profile Id'] || item?.id || item?.nextId || '',
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
        PKG_ID: item?.['Package Id'] || item?.id || item?.nextId || '',
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
        id: item?.['Doct Id'] || item?.id || item?.nextId || '',
        name: item?.Name || item?.name || '',
        deg: item?.Deg || item?.deg || '',
        contact: item?.Contact || item?.contact || '',
        rate: item?.Rate || item?.rate || '',
        type: item?.Type || item?.type || 'P',
        status: item?.Status || item?.status || 'Active',
        sampleId: item?.sampleId || '101.3',
      });
    } else if (category === 'references') {
      setFormData({
        id: item?.['Refer Id'] || item?.id || item?.nextId || '',
        name: item?.Name || item?.name || '',
        address: item?.Address || item?.address || '',
        contact: item?.Contact || item?.contact || '',
        rate: item?.Rate || item?.rate || '0',
        type: item?.Type || item?.type || 'P',
        status: item?.Status || item?.status || 'Active',
        sampleId: item?.sampleId || '101.3',
      });
    } else if (category === 'departments') {
      setFormData({
        id: item?.['Dept Id'] || item?.id || item?.nextId || '',
        name: item?.Name || item?.name || '',
        shortname: item?.['Short Name'] || item?.shortname || '',
        status: item?.Status || item?.status || 'Active',
        sampleId: item?.sampleId || '101.3',
        sign: item?.sign || '',
      });
    } else if (category === 'units') {
      setFormData({
        id: item?.['Unit Id'] || item?.id || item?.nextId || '',
        name: item?.Name || item?.name || '',
        status: item?.Status || item?.status || 'Active',
      });
    } else if (category === 'branches') {
      setFormData({
        id: item?.branchId || item?.id || item?.nextId || '',
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
        id: item?.userId || item?.id || item?.nextId || '',
        login: item?.loginId || item?.login || '',
        name: item?.name || item?.Name || '',
        mobile: item?.mobile || '',
        email: item?.email || '',
        password: '',
        access: currentAccess,
        accessbranch: item?.accessBranch || item?.accessbranch || '',
        status: item?.status || item?.Status || 'Active',
      });
    } else if (category === 'samples') {
      setFormData({
        id: item?.['Sample Id'] || item?.id || item?.nextId || '',
        name: item?.Name || item?.name || '',
        status: item?.Status || item?.status || 'Active',
      });
    } else if (category === 'templates') {
      setFormData({
        reportId: item?.templatesId || item?.reportId || item?.id || item?.nextId || '',
        TEMPLATE_NAME: item?.TEMPLATE_NAME || item?.['Template Name'] || item?.name || '',
        deptId: item?.deptId || item?.department || departments[0]?.['Dept Id'] || '1',
        price: item?.price || item?.Rate || item?.rate || '0',
        status: item?.status || item?.Status || 'Active',
        sign: item?.sign || '',
      });
    } else if (category === 'interpretations') {
      setFormData({
        id: item?.ID || item?.id || '',
        name: item?.Name || item?.name || '',
        type: item?.Type || item?.type || 'Test',
        text: item?.Text || item?.text || '',
        status: item?.Status || item?.status || 'Active',
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
      case 'references':
        return isEditing ? `Edit Referring Agent (${formData.name || formData.id || ''})` : 'Add New Referring Agent';
      case 'departments':
        return isEditing ? `Edit Lab Department (${formData.id || ''})` : 'Add New Department';
      case 'units':
        return isEditing ? `Edit Measurement Unit (${formData.id || ''})` : 'Add New Unit';
      case 'branches':
        return isEditing ? `Edit Lab Branch (#${formData.id || ''})` : 'Add New Branch';
      case 'users':
        return isEditing ? `Edit Staff User (${formData.login || ''})` : 'Add New Staff User';
      case 'samples':
        return isEditing ? `Edit Sample Type (${formData.name || formData.id || ''})` : 'Add New Sample Type';
      case 'templates':
        return isEditing ? `Edit Master Template Report (${formData.reportId || ''})` : 'Add New Template Report';
      case 'interpretations':
        return isEditing ? `Edit Clinical Interpretation (${formData.name || formData.id || ''})` : 'Add Clinical Interpretation';
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
        references: 'reference',
        departments: 'department',
        units: 'unit',
        branches: 'branch',
        users: 'user',
        samples: 'sample',
        templates: 'template',
        interpretations: 'interpretation',
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
      maxWidth={category === 'interpretations' ? 'max-w-4xl' : 'max-w-3xl'}
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
                  {(samples && samples.length > 0
                    ? Array.from(new Set([...samples.map((s) => s.Name || s.name).filter(Boolean), ...SAMPLE_TYPE_OPTIONS]))
                    : SAMPLE_TYPE_OPTIONS
                  ).map((s) => (
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
                  Special Rate 1 (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.TEST_RATE1 || ''}
                  onChange={(e) => handleChange('TEST_RATE1', e.target.value)}
                  placeholder="Optional rate 1"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Special Rate 2 (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.TEST_RATE2 || ''}
                  onChange={(e) => handleChange('TEST_RATE2', e.target.value)}
                  placeholder="Optional rate 2"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            {/* REFERENCE RANGES (MIN - MAX) - Exact UI matching specification */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                Reference Ranges (Min - Max)
              </label>

              {/* Default Card */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                <span className="font-bold text-slate-800 text-sm">Default</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.rg0l || ''}
                    onChange={(e) => handleChange('rg0l', e.target.value)}
                    placeholder="Min"
                    className="w-20 sm:w-24 text-center px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-2xs"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="text"
                    value={formData.rg0h || ''}
                    onChange={(e) => handleChange('rg0h', e.target.value)}
                    placeholder="Max"
                    className="w-20 sm:w-24 text-center px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Demographics Grid (2 Columns: Newborn/Child, Adult Male/Adult Female, Senior/Super Senior) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* Newborn */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="font-semibold text-slate-700 text-xs">Newborn</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={formData.rg1l || ''}
                      onChange={(e) => handleChange('rg1l', e.target.value)}
                      placeholder="Min"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <span className="text-slate-400 text-xs font-bold">-</span>
                    <input
                      type="text"
                      value={formData.rg1h || ''}
                      onChange={(e) => handleChange('rg1h', e.target.value)}
                      placeholder="Max"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Child */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="font-semibold text-slate-700 text-xs">Child</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={formData.rg2l || ''}
                      onChange={(e) => handleChange('rg2l', e.target.value)}
                      placeholder="Min"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <span className="text-slate-400 text-xs font-bold">-</span>
                    <input
                      type="text"
                      value={formData.rg2h || ''}
                      onChange={(e) => handleChange('rg2h', e.target.value)}
                      placeholder="Max"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Adult Male */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="font-semibold text-slate-700 text-xs">Adult Male</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={formData.rg3l || ''}
                      onChange={(e) => handleChange('rg3l', e.target.value)}
                      placeholder="Min"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <span className="text-slate-400 text-xs font-bold">-</span>
                    <input
                      type="text"
                      value={formData.rg3h || ''}
                      onChange={(e) => handleChange('rg3h', e.target.value)}
                      placeholder="Max"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Adult Female */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="font-semibold text-slate-700 text-xs">Adult Female</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={formData.rg4l || ''}
                      onChange={(e) => handleChange('rg4l', e.target.value)}
                      placeholder="Min"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <span className="text-slate-400 text-xs font-bold">-</span>
                    <input
                      type="text"
                      value={formData.rg4h || ''}
                      onChange={(e) => handleChange('rg4h', e.target.value)}
                      placeholder="Max"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Senior */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="font-semibold text-slate-700 text-xs">Senior</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={formData.rg5l || ''}
                      onChange={(e) => handleChange('rg5l', e.target.value)}
                      placeholder="Min"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <span className="text-slate-400 text-xs font-bold">-</span>
                    <input
                      type="text"
                      value={formData.rg5h || ''}
                      onChange={(e) => handleChange('rg5h', e.target.value)}
                      placeholder="Max"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Super Senior */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <span className="font-semibold text-slate-700 text-xs">Super Senior</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={formData.rg6l || ''}
                      onChange={(e) => handleChange('rg6l', e.target.value)}
                      placeholder="Min"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <span className="text-slate-400 text-xs font-bold">-</span>
                    <input
                      type="text"
                      value={formData.rg6h || ''}
                      onChange={(e) => handleChange('rg6h', e.target.value)}
                      placeholder="Max"
                      className="w-16 sm:w-20 text-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
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

        {/* 4b. REFERRING AGENTS FORM (REFERANCE_LIST) */}
        {category === 'references' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Refer ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.id || ''}
                  onChange={(e) => handleChange('id', e.target.value)}
                  placeholder="e.g. 1, 2, or R10"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Referring Agent / Source Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Health Camp / Dr. Referrer / Direct Walk-in"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Address / Location
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g. Midnapore Rural / Station Road"
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

            {/* Signature Selection for Department (API_ADD_UPDATE_DEPARTMENT with sign=5,2) */}
            <SignatureSelector
              signList={signList}
              value={formData.sign || ''}
              onChange={(val) => handleChange('sign', val)}
            />
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

        {/* 9. SAMPLES FORM */}
        {category === 'samples' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sample ID {isEditing ? '(Locked)' : ''}
                </label>
                <input
                  type="text"
                  disabled={isEditing}
                  value={formData.id || ''}
                  onChange={(e) => handleChange('id', e.target.value)}
                  placeholder="e.g. 1 (auto-assigned if blank)"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sample / Specimen Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Serum, EDTA Whole Blood, Urine, Stool"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-semibold"
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
                className="w-full sm:w-1/3 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <p className="font-semibold mb-1">Specimen Master Integration</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                This Sample type will be automatically made available in the "Sample Type" dropdown when editing tests in Master Catalog, as well as in the "Sample Type / Specimen" dropdown when filling patient test results.
              </p>
            </div>
          </div>
        )}

        {/* 10. TEMPLATES FORM */}
        {category === 'templates' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Template ID {isEditing ? '(Locked)' : '*'}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.reportId || ''}
                  onChange={(e) => handleChange('reportId', e.target.value)}
                  placeholder="e.g. T1, T2, ... T15"
                  className={`w-full px-3 py-1.5 text-xs border rounded-lg font-mono ${
                    isEditing ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Template Report Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.TEMPLATE_NAME || ''}
                  onChange={(e) => handleChange('TEMPLATE_NAME', e.target.value)}
                  placeholder="e.g. URINE EXAMINATION, STOOL EXAMINATION, SEMEN ANALYSIS"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Department
                </label>
                <select
                  value={formData.deptId || ''}
                  onChange={(e) => handleChange('deptId', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
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
                  Price / Standard Rate (₹)
                </label>
                <input
                  type="number"
                  value={formData.price || '0'}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
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
                  <option value="Inactive">Inactive</option>
                  <option value="SAVED">SAVED</option>
                </select>
              </div>
            </div>

            {/* Signature Selection for Template (API_UPDATE_TEMPLATE with sign=5,2) */}
            <SignatureSelector
              signList={signList}
              value={formData.sign || ''}
              onChange={(val) => handleChange('sign', val)}
            />

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900">
              <p className="font-semibold mb-1">Full-Page Report Structure (15 Templates)</p>
              <p className="text-[11px] text-purple-700 leading-relaxed">
                Template reports are full-page reports selectable during Patient Test Ordering. Results are edited through the dedicated full-page template dialog with dynamic section rows in Patient Result Entry.
              </p>
            </div>
          </div>
        )}

        {/* 11. INTERPRETATIONS FORM WITH STYLED WRITING PANEL */}
        {category === 'interpretations' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Target ID (Locked)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.id || ''}
                  className="w-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-indigo-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Target Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Test - HEMOGLOBIN; HB"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
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

            {/* Rich Writing Panel */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                  Clinical Interpretation Writing Panel
                </label>
                <span className="text-[11px] text-slate-500">
                  Styles, fonts, colors, and formatting are saved directly into the diagnostic engine.
                </span>
              </div>
              <InterpretationRichEditor
                value={formData.text || ''}
                onChange={(html) => handleChange('text', html)}
                placeholder="Write the clinical significance, methodology, diagnostic interpretations, and normal guidance here with rich colors, font styles, and sizes..."
                minHeight="280px"
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

