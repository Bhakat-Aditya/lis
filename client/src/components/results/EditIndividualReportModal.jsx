import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import api from '../../services/api.js';
import { useMaster } from '../../context/context.master.jsx';
import { Save, X, Loader2, FlaskConical, AlertCircle, CheckCircle } from 'lucide-react';

// Standard specimen types common in clinical diagnostics
const DEFAULT_SAMPLE_TYPES = [
  'Serum',
  'EDTA Whole Blood',
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

// Standard lab methodology options
const DEFAULT_METHODS = [
  'Arsenazo',
  'ECLIA',
  'CLIA',
  'ELISA',
  'Colorimetric',
  'Kinetic',
  'End Point',
  'Immunoturbidimetry',
  'Flow Cytometry',
  'Nephelometry',
  'HPLC',
  'Ion Selective Electrode (ISE)',
  'Calculated',
  'Microscopy',
  'Manual',
];

// Standard clinical units
const DEFAULT_UNITS = [
  'mg%',
  'mg/dL',
  'g/dL',
  'µg/dL',
  'ng/dL',
  'ng/mL',
  'pg/mL',
  'µIU/mL',
  'mIU/mL',
  'U/L',
  'IU/L',
  'mmol/L',
  'µmol/L',
  'mEq/L',
  '%',
  'cells/cumm',
  '/hpf',
  'sec',
  'Ratio',
  'Index',
];

export default function EditIndividualReportModal({
  isOpen,
  onClose,
  report,
  patient,
  onSaveSuccess,
}) {
  const { methods: masterMethods = [], units: masterUnits = [] } = useMaster();

  const [formData, setFormData] = useState({
    testName: '',
    rate: '',
    sampleType: 'Serum',
    method: '',
    refRange: '',
    resultData: '',
    unit: 'mg%',
    comment: '',
  });

  const [isCustomSampleType, setIsCustomSampleType] = useState(false);
  const [isCustomMethod, setIsCustomMethod] = useState(false);
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Build combined method list from master data + standard fallbacks
  const availableMethods = React.useMemo(() => {
    const set = new Set(DEFAULT_METHODS);
    (masterMethods || []).forEach((m) => {
      const name = m.Name || m.name || m['Method Name'] || m['Method Id'];
      if (name && typeof name === 'string') set.add(name.trim());
    });
    if (report?.method && report.method.trim()) {
      set.add(report.method.trim());
    }
    return Array.from(set).filter(Boolean);
  }, [masterMethods, report]);

  // Build combined units list from master data + standard fallbacks
  const availableUnits = React.useMemo(() => {
    const set = new Set(DEFAULT_UNITS);
    (masterUnits || []).forEach((u) => {
      const name = u.Name || u.name || u['Unit Name'] || u['Unit Id'];
      if (name && typeof name === 'string') set.add(name.trim());
    });
    if (report?.unit && report.unit.trim()) {
      set.add(report.unit.trim());
    }
    return Array.from(set).filter(Boolean);
  }, [masterUnits, report]);

  // Extract available analyzer runs (resultData1 through resultData5)
  const availableRuns = React.useMemo(() => {
    if (!report) return [];
    return [
      { num: 1, val: report.resultData1 },
      { num: 2, val: report.resultData2 },
      { num: 3, val: report.resultData3 },
      { num: 4, val: report.resultData4 },
      { num: 5, val: report.resultData5 },
    ].filter((v) => v.val !== undefined && v.val !== null && String(v.val).trim() !== '');
  }, [report]);

  // Initialize form state when report changes or modal opens
  useEffect(() => {
    if (isOpen && report) {
      const initialSampleType = report.sampleType || report.sampletype || 'Serum';
      const initialMethod = report.method || '';
      const initialUnit = report.unit || report.unitref || 'mg%';

      setFormData({
        testName: report.testName || '',
        rate: report.rate !== undefined && report.rate !== null ? String(report.rate) : '',
        sampleType: initialSampleType,
        method: initialMethod,
        refRange: report.refRange || '',
        resultData: report.resultData || '',
        unit: initialUnit,
        comment: report.comment || '',
      });

      setIsCustomSampleType(
        !DEFAULT_SAMPLE_TYPES.includes(initialSampleType) && Boolean(initialSampleType)
      );
      setIsCustomMethod(
        !availableMethods.includes(initialMethod) && Boolean(initialMethod)
      );
      setIsCustomUnit(
        !availableUnits.includes(initialUnit) && Boolean(initialUnit)
      );

      setError('');
      setSuccess('');
    }
  }, [isOpen, report, availableMethods, availableUnits]);

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

      const payload = {
        reportId: report.reportId,
        patientId: cleanPid || patientId,
        sampleId: report.sampleId || patient?.slNo || '',
        testName: formData.testName.trim(),
        rate: formData.rate.trim(),
        sampletype: formData.sampleType.trim() || 'Serum',
        sampleType: formData.sampleType.trim() || 'Serum',
        method: formData.method.trim(),
        refRange: formData.refRange.trim(),
        unitref: formData.unit.trim(),
        resultData: formData.resultData.trim(),
        unit: formData.unit.trim(),
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
                    <span className="font-semibold text-indigo-600">{report.deptName}</span>
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

        {/* Edit Form Matching Screenshot Exactly */}
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
              placeholder="e.g. FREE T4"
              className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          {/* Row 2: TEST RATE / SAMPLE TYPE / METHOD (3 Columns) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              TEST RATE & SPECIMEN
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Rate input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  value={formData.rate}
                  onChange={(e) => handleInputChange('rate', e.target.value)}
                  placeholder="Enter rate"
                  className="w-full pl-7 pr-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Sample Type dropdown */}
              <div>
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
                    className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
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
                      className="w-full pl-2.5 pr-6 py-2 text-xs font-semibold text-slate-800 bg-white border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSampleType(false);
                        handleInputChange('sampleType', 'Serum');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      title="Back to list"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Method dropdown */}
              <div>
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
                    className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select Method</option>
                    {availableMethods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Custom Method...</option>
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.method}
                      onChange={(e) => handleInputChange('method', e.target.value)}
                      placeholder="Enter method name"
                      className="w-full pl-2.5 pr-6 py-2 text-xs font-semibold text-slate-800 bg-white border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomMethod(false);
                        handleInputChange('method', '');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      title="Back to list"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: REFERENCE RANGE & UNIT (2 Columns) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              REFERANCE RANGE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={formData.refRange}
                  onChange={(e) => handleInputChange('refRange', e.target.value)}
                  placeholder="e.g. 0.8 - 1.8 or Negative"
                  className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
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
                    className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer font-mono"
                  >
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Custom Unit...</option>
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      placeholder="Unit (e.g. mg%)"
                      className="w-full pl-2.5 pr-6 py-2 text-xs font-semibold text-slate-800 bg-white border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomUnit(false);
                        handleInputChange('unit', 'mg%');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      title="Back to list"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: TEST RESULT & UNIT (2 Columns) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              TEST RESULT
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={formData.resultData}
                  onChange={(e) => handleInputChange('resultData', e.target.value)}
                  placeholder="Enter result"
                  className="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 bg-white border-2 border-amber-400/90 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <div className="w-full px-2.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono">
                  <span>{formData.unit || '-'}</span>
                  <span className="text-[10px] text-slate-400 font-sans">Unit</span>
                </div>
              </div>
            </div>

            {/* Multiple Analyzer Run Versions (resultData1 - 5) */}
            {availableRuns.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-[#fbf6ff] border border-purple-200 rounded-xl">
                <div className="text-[10px] font-bold text-purple-900 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🔬</span>
                    <span>Analyzer Multi-Run Options (resultData 1–5):</span>
                  </span>
                  <span className="text-[9px] text-purple-600 font-medium">Click to select reading</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableRuns.map((r) => {
                    const isSelected = String(formData.resultData).trim() === String(r.val).trim();
                    return (
                      <button
                        key={r.num}
                        type="button"
                        onClick={() => handleInputChange('resultData', r.val)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-700 text-white shadow-2xs ring-2 ring-purple-400/50'
                            : 'bg-white border border-purple-200 text-purple-950 hover:bg-purple-100/70'
                        }`}
                      >
                        <span className="text-purple-300 font-sans text-[10px]">v{r.num}:</span>
                        <span>{r.val}</span>
                        {isSelected && <span className="text-[10px] text-emerald-300 ml-1">✓ Chosen</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row 5: COMMENT */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              COMMENT
            </label>
            <textarea
              rows={2}
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              placeholder="Comment"
              className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
            />
          </div>

          {/* Row 6: SAVE & CANCEL BUTTONS */}
          <div className="pt-2 flex items-center justify-start gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
