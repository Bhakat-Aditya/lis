import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import api from '../../services/api.js';
import {
  FileText,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';

export default function TemplateReportModal({
  isOpen,
  onClose,
  template,
  patient,
  onSaveSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resultJson, setResultJson] = useState(null);

  const reportId = template?.reportId || template?.templatesId || '';
  const templateName = template?.TEMPLATE_NAME || template?.name || 'TEMPLATE REPORT';

  // Load Template JSON on open
  useEffect(() => {
    if (!isOpen || !reportId) return;

    const fetchJson = async () => {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const res = await api.get('/reports/template-json', {
          params: {
            reportId,
            templateName,
          },
        });
        const rep = res.data?.templateReport || res.data?.payLoadJSON?.TemplateReport;
        if (rep?.resultJSON) {
          setResultJson(rep.resultJSON);
        } else {
          setResultJson({
            TEMPLATE_NAME: templateName,
            Exam: {
              'General Observations': [
                { Name: 'Parameter 1', Value: '' },
                { Name: 'Parameter 2', Value: '' },
              ],
            },
          });
        }
      } catch (err) {
        console.warn('[TemplateReportModal] Fetch error:', err);
        setErrorMsg('Failed to fetch template schema from server. Loaded offline default template.');
      } finally {
        setLoading(false);
      }
    };

    fetchJson();
  }, [isOpen, reportId, templateName]);

  if (!isOpen) return null;

  // Handle value change for an item in Exam[section][index]
  const handleValueChange = (sectionName, index, newValue) => {
    setResultJson((prev) => {
      if (!prev || !prev.Exam || !Array.isArray(prev.Exam[sectionName])) return prev;
      const updatedSection = [...prev.Exam[sectionName]];
      updatedSection[index] = {
        ...updatedSection[index],
        Value: newValue,
      };
      return {
        ...prev,
        Exam: {
          ...prev.Exam,
          [sectionName]: updatedSection,
        },
      };
    });
  };

  // Handle dynamic addition of a new item into Exam[section] (dynamic size array)
  const handleAddItem = (sectionName) => {
    setResultJson((prev) => {
      if (!prev || !prev.Exam) return prev;
      const currentList = Array.isArray(prev.Exam[sectionName]) ? prev.Exam[sectionName] : [];
      const updatedSection = [
        ...currentList,
        { Name: `Parameter ${currentList.length + 1}`, Value: '' },
      ];
      return {
        ...prev,
        Exam: {
          ...prev.Exam,
          [sectionName]: updatedSection,
        },
      };
    });
  };

  // Handle dynamic removal of an item from Exam[section]
  const handleRemoveItem = (sectionName, index) => {
    setResultJson((prev) => {
      if (!prev || !prev.Exam || !Array.isArray(prev.Exam[sectionName])) return prev;
      const updatedSection = prev.Exam[sectionName].filter((_, i) => i !== index);
      return {
        ...prev,
        Exam: {
          ...prev.Exam,
          [sectionName]: updatedSection,
        },
      };
    });
  };

  // Submit updated resultJSON
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!resultJson || !reportId) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // POST API_UPDATE_TEMPLATE_DATA="UPDATETEMPLATEDATA"; SEND resultJSON as body
      const res = await api.post(
        `/reports/template-data?reportId=${encodeURIComponent(reportId)}`,
        resultJson
      );

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        setSuccessMsg(res.data?.Message || 'Template report updated successfully!');
        if (onSaveSuccess) {
          onSaveSuccess(resultJson);
        }
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.data?.Message || 'Failed to update template report');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || err.message || 'Server error updating template report');
    } finally {
      setSaving(false);
    }
  };

  const examSections = resultJson?.Exam ? Object.keys(resultJson.Exam) : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      title={`Edit Template Report — ${templateName}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-xs text-slate-800">
        {/* Top Header Card */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">{templateName}</span>
                <span className="font-mono text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                  ID: #{reportId}
                </span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                  Full-Page Report Structure
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Patient: <strong className="text-slate-800">{patient?.name || 'Patient'}</strong> (#{patient?.slNo || patient?.barcode || '-'})
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">API Engine</span>
            <code className="text-xs font-mono font-bold text-indigo-700">UPDATETEMPLATEDATA</code>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="font-semibold">Loading full-page template structure from GETTEMPLATEJSON...</p>
          </div>
        )}

        {/* Dynamic Full-Page Structure Form */}
        {!loading && resultJson && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {examSections.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                  No examination sections found in template structure.
                </div>
              ) : (
                examSections.map((sectionName) => {
                  const items = Array.isArray(resultJson.Exam[sectionName])
                    ? resultJson.Exam[sectionName]
                    : [];

                  return (
                    <div
                      key={sectionName}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
                    >
                      {/* Section Header */}
                      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-purple-600" />
                          <h4 className="font-extrabold text-xs text-slate-800 tracking-wide uppercase">
                            {sectionName}
                          </h4>
                          <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded font-bold border border-purple-200">
                            {items.length} Parameter{items.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddItem(sectionName)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                          title="Add parameter item to this array (dynamic size)"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Item</span>
                        </button>
                      </div>

                      {/* Items Grid */}
                      <div className="p-3 divide-y divide-slate-100">
                        {items.length === 0 ? (
                          <div className="py-3 text-center text-slate-400 italic text-[11px]">
                            No parameters in this examination group. Click "+ Add Item" above.
                          </div>
                        ) : (
                          items.map((item, idx) => (
                            <div
                              key={idx}
                              className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                            >
                              <div className="w-1/3 min-w-[140px] flex items-center gap-1.5">
                                <span className="text-slate-400 font-mono text-[10px] w-5">
                                  {idx + 1}.
                                </span>
                                <span className="font-bold text-slate-700 text-xs truncate">
                                  {item.Name || `Item ${idx + 1}`}
                                </span>
                              </div>

                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={item.Value ?? ''}
                                  onChange={(e) =>
                                    handleValueChange(sectionName, idx, e.target.value)
                                  }
                                  placeholder="Enter result value..."
                                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(sectionName, idx)}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                                  title="Delete parameter row from array"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 font-medium">
                Note: Modifying values updates <code className="text-purple-600 font-mono font-bold">resultjson</code> body while preserving all keys and structure.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving ResultJSON...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Template Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

