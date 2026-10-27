import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../common/Modal.jsx';
import api from '../../services/api.js';
import { useMaster } from '../../context/context.master.jsx';
import { Save, X, Loader2, FlaskConical, AlertCircle, CheckCircle } from 'lucide-react';

// Standard specimen types common in clinical diagnostics
const DEFAULT_SAMPLE_TYPES = [
  'Serum',
  'EDTA Whole Blood',
  'Whole Blood EDTA',
  'Plasma',
  'Whole Blood',
  'Urine',
  'Fluoride Plasma',
  'Citrate Plasma',
  'CSF',
  'Sputum',
  'Stool',
  'Swab',
  'Peritoneal Fluid',
  'Pleural Fluid',
  'Synovial Fluid',
  'Other',
];

export default function EditIndividualReportModal({
  isOpen,
  onClose,
  report,
  patient,
  onSaveSuccess,
}) {
  const { methods: masterMethods = [], units: masterUnits = [] } = useMaster();

  // Helper function to resolve master Method ID from ID or Name
  const resolveMethodId = useCallback(
    (val) => {
      if (!val) return '';
      const clean = String(val).trim();
      const byId = masterMethods.find(
        (m) =>
          String(m['Method Id'] || m.id || '').trim().toLowerCase() === clean.toLowerCase() ||
          String(m['Method Id'] || m.id || '').replace(/^M/i, '').toLowerCase() === clean.replace(/^M/i, '').toLowerCase()
      );
      if (byId) return String(byId['Method Id'] || byId.id || '').trim();
      const byName = masterMethods.find(
        (m) => String(m.Name || m.name || '').toLowerCase().trim() === clean.toLowerCase()
      );
      if (byName) return String(byName['Method Id'] || byName.id || '').trim();
      return clean;
    },
    [masterMethods]
  );

  // Helper function to resolve master Unit ID from ID or Name
  const resolveUnitId = useCallback(
    (val) => {
      if (!val) return '';
      const clean = String(val).trim();
      const byId = masterUnits.find(
        (u) =>
          String(u['Unit Id'] || u.id || '').trim().toLowerCase() === clean.toLowerCase() ||
          String(u['Unit Id'] || u.id || '').replace(/^U/i, '').toLowerCase() === clean.replace(/^U/i, '').toLowerCase()
      );
      if (byId) return String(byId['Unit Id'] || byId.id || '').trim();
      const byName = masterUnits.find(
        (u) => String(u.Name || u.name || '').toLowerCase().trim() === clean.toLowerCase()
      );
      if (byName) return String(byName['Unit Id'] || byName.id || '').trim();
      return clean;
    },
    [masterUnits]
  );

  // Form state without price and resultData as requested
  const [formData, setFormData] = useState({
    testName: '',
    sampleType: 'Serum',
    method: '',
    refRange: '',
    unit: '',
    comment: '',
  });

  const [isCustomSampleType, setIsCustomSampleType] = useState(false);
  const [isCustomMethod, setIsCustomMethod] = useState(false);
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form state when report changes or modal opens
  useEffect(() => {
    if (isOpen && report) {
      const initialSampleType = report.sampleType || report.sampletype || 'Serum';
      const initialMethodId = resolveMethodId(report.method);
      const initialUnitId = resolveUnitId(report.unit || report.unitref);

      setFormData({
        testName: report.testName || '',
        sampleType: initialSampleType,
        method: initialMethodId,
        refRange: report.refRange || '',
        unit: initialUnitId,
        comment: report.comment || '',
      });

      setIsCustomSampleType(
        !DEFAULT_SAMPLE_TYPES.includes(initialSampleType) && Boolean(initialSampleType)
      );

      const hasMatchingMethod = masterMethods.some(
        (m) =>
          String(m['Method Id'] || m.id || '').trim().toLowerCase() === String(initialMethodId).toLowerCase()
      );
      setIsCustomMethod(Boolean(initialMethodId) && !hasMatchingMethod);

      const hasMatchingUnit = masterUnits.some(
        (u) =>
          String(u['Unit Id'] || u.id || '').trim().toLowerCase() === String(initialUnitId).toLowerCase()
      );
      setIsCustomUnit(Boolean(initialUnitId) && !hasMatchingUnit);

      setError('');
      setSuccess('');
    }
  }, [isOpen, report, masterMethods, masterUnits, resolveMethodId, resolveUnitId]);

  if (!isOpen || !report) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.testName.trim()) {
      setError('Test name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const patientId = patient?.patientId || report.patientId;
      const cleanPid = patientId
        ? String(patientId).toUpperCase().startsWith('P')
          ? `P${String(patientId).replace(/^P+/i, '')}`
          : `P${patientId}`
        : '';

      const finalMethodId = resolveMethodId(formData.method);
      const finalUnitId = resolveUnitId(formData.unit);

      // Build UPDATEREPORT payload: pass Master IDs for method, unit, unitref
      // Preserve existing report rate & resultData without requiring edit in UI
      const existingRate =
        report.rate !== undefined && report.rate !== null && String(report.rate).trim() !== ''
          ? String(report.rate).trim()
          : report.Rate !== undefined && report.Rate !== null && String(report.Rate).trim() !== ''
          ? String(report.Rate).trim()
          : report.amount !== undefined && report.amount !== null && String(report.amount).trim() !== ''
          ? String(report.amount).trim()
          : report.Amount !== undefined && report.Amount !== null && String(report.Amount).trim() !== ''
          ? String(report.Amount).trim()
          : '';

      const existingResultData =
        report.resultData !== undefined && report.resultData !== null
          ? String(report.resultData)
          : report.ResultData !== undefined && report.ResultData !== null
          ? String(report.ResultData)
          : '';

      const payload = {
        api: 'UPDATEREPORT',
        reportId: report.reportId,
        patientId: cleanPid || patientId,
        sampleId: report.sampleId || patient?.slNo || '',
        testName: formData.testName.trim(),
        rate: existingRate,
        sampletype: formData.sampleType.trim() || 'Serum',
        sampleType: formData.sampleType.trim() || 'Serum',
        method: finalMethodId,
        refRange: formData.refRange.trim(),
        unitref: finalUnitId,
        resultData: existingResultData,
        unit: finalUnitId,
        comment: formData.comment.trim(),
        profileName: report.profileName || '',
        deptName: report.deptName || 'D1',
      };

      const res = await api.post('/reports/update', payload);

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        setSuccess('Test parameter updated successfully!');
        if (onSaveSuccess) {
          onSaveSuccess({ ...report, ...payload });
        }
        setTimeout(() => {
          onClose();
        }, 350);
      } else {
        setError(res.data?.Message || 'Failed to update test parameter');
      }
    } catch (err) {
      setError(err.response?.data?.Message || 'Server error while saving test details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl" overflow="overflow-visible">
      <div className="-mt-1">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Edit Test Parameter / Report
              </h3>
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                <span>ID: #{report.reportId}</span>
                {report.deptName && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-indigo-600">Dept: {report.deptName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Cancel / Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Edit Form without price and resultData */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: TEST NAME */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              TEST NAME
            </label>
            <input
              type="text"
              value={formData.testName}
              onChange={(e) => handleInputChange('testName', e.target.value)}
              placeholder="e.g. ESR (ERYTHROCYTE SEDIMENTATION RATE)"
              className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          {/* Row 2: SAMPLE TYPE & METHOD (Price removed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sample Type dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                SAMPLE TYPE / SPECIMEN
              </label>
              {!isCustomSampleType ? (
                <select
                  value={formData.sampleType}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomSampleType(true);
                      setFormData((prev) => ({ ...prev, sampleType: '' }));
                    } else {
                      handleInputChange('sampleType', e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  {DEFAULT_SAMPLE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Custom Sample Type...</option>
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.sampleType}
                    onChange={(e) => handleInputChange('sampleType', e.target.value)}
                    placeholder="Enter sample type"
                    className="w-full pl-3 pr-6 py-2 text-xs font-semibold text-slate-800 bg-white border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSampleType(false);
                      handleInputChange('sampleType', 'Serum');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    title="Back to list"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Method dropdown (passes Method Id) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                METHOD (MASTER ID)
              </label>
              {!isCustomMethod ? (
                <select
                  value={formData.method}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomMethod(true);
                      setFormData((prev) => ({ ...prev, method: '' }));
                    } else {
                      handleInputChange('method', e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">Select Method (None)</option>
                  {masterMethods.map((m) => {
                    const mId = String(m['Method Id'] || m.id || '').trim();
                    const mName = String(m.Name || m.name || '').trim();
                    if (!mId) return null;
                    return (
                      <option key={mId} value={mId}>
                        {mName && mName !== '-' ? `${mName} (ID: ${mId})` : `Method ${mId}`}
                      </option>
                    );
                  })}
                  <option value="__CUSTOM__">+ Custom Method ID...</option>
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.method}
                    onChange={(e) => handleInputChange('method', e.target.value)}
                    placeholder="Enter Method ID (e.g. 55)"
                    className="w-full pl-3 pr-6 py-2 text-xs font-semibold text-slate-800 bg-white border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMethod(false);
                      handleInputChange('method', '');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    title="Back to list"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: REFERENCE RANGE & UNIT (passes Unit Id) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                REFERENCE RANGE
              </label>
              <input
                type="text"
                value={formData.refRange}
                onChange={(e) => handleInputChange('refRange', e.target.value)}
                placeholder="e.g. 0 - 20 or Negative"
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                UNIT (MASTER ID)
              </label>
              {!isCustomUnit ? (
                <select
                  value={formData.unit}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomUnit(true);
                      setFormData((prev) => ({ ...prev, unit: '' }));
                    } else {
                      handleInputChange('unit', e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer font-mono"
                >
                  <option value="">Select Unit (None)</option>
                  {masterUnits.map((u) => {
                    const uId = String(u['Unit Id'] || u.id || '').trim();
                    const uName = String(u.Name || u.name || '').trim();
                    if (!uId) return null;
                    return (
                      <option key={uId} value={uId}>
                        {uName ? `${uName} (ID: ${uId})` : `Unit ${uId}`}
                      </option>
                    );
                  })}
                  <option value="__CUSTOM__">+ Custom Unit ID...</option>
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    placeholder="Enter Unit ID (e.g. 41)"
                    className="w-full pl-3 pr-6 py-2 text-xs font-semibold text-slate-800 bg-white border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomUnit(false);
                      handleInputChange('unit', '');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    title="Back to list"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: COMMENT / REMARKS */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              COMMENT / REMARKS
            </label>
            <textarea
              rows={2}
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              placeholder="Clinical comments or methodology notes"
              className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
            />
          </div>

          {/* Row 5: SAVE & CANCEL BUTTONS */}
          <div className="pt-2 flex items-center justify-start gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Test Details</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
