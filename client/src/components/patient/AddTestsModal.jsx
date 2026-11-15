import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal.jsx';
import api from '../../services/api';
import { useMaster } from '../../context/context.master.jsx';
import { Search, Plus, Check, Trash2, Layers, X, FileText } from 'lucide-react';

export default function AddTestsModal({ isOpen, onClose, patient, reports = [], onTestsAdded }) {
  const navigate = useNavigate();
  const { tests = [], profiles = [], packages = [], templates = [] } = useMaster();
  const [activeTab, setActiveTab] = useState('tests'); // tests, profiles, packages, templates
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // { type: 'TEST'|'PROF'|'PKG'|'TEMP', id, name, rate }
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form whenever modal opens or patient changes
  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]);
      setSearchTerm('');
      setError('');
      setAllowRepeat(false);
    }
  }, [isOpen, patient?.patientId, patient?.slNo]);

  const bookedKeys = useMemo(() => {
    const set = new Set();
    const list = [
      ...(Array.isArray(reports) ? reports : []),
      ...(Array.isArray(patient?.testList) ? patient.testList : []),
      ...(Array.isArray(patient?.tests) ? patient.tests : []),
    ];

    list.forEach((r) => {
      const tid = String(r.testId || r['Test Id'] || r.id || '').trim().toLowerCase();
      if (tid) {
        set.add(tid);
        set.add(tid.replace(/^t+/i, ''));
        set.add(`t${tid.replace(/^t+/i, '')}`);
      }
      const pid = String(r.profileId || r['Profile Id'] || r.profileName || '').trim().toLowerCase();
      if (pid) {
        set.add(pid);
        set.add(pid.replace(/^p+/i, ''));
        set.add(`p${pid.replace(/^p+/i, '')}`);
      }
      const pkg = String(r.packageId || r['Package Id'] || r.packageName || '').trim().toLowerCase();
      if (pkg) {
        set.add(pkg);
        set.add(pkg.replace(/^k+/i, ''));
        set.add(`k${pkg.replace(/^k+/i, '')}`);
      }
      const tmpl = String(r.templatesId || r.reportId || '').trim().toLowerCase();
      if (tmpl) {
        set.add(tmpl);
        set.add(tmpl.replace(/^t+/i, ''));
        set.add(`t${tmpl.replace(/^t+/i, '')}`);
      }
      const name = String(r.testName || r.name || r['Bill Particulars'] || r.TEMPLATE_NAME || '').trim().toLowerCase();
      if (name) set.add(name);
    });

    return set;
  }, [reports, patient]);

  if (!patient) return null;

  const toggleItem = (type, id, name, rate) => {
    const cleanId = String(id ?? '').trim();
    if (!cleanId) return;

    const key = `${type}|${cleanId}`;
    if (selectedItems.some((item) => `${item.type}|${item.id}` === key)) {
      setSelectedItems(selectedItems.filter((item) => `${item.type}|${item.id}` !== key));
    } else {
      setSelectedItems([...selectedItems, { type, id: cleanId, name, rate: Number(rate) || 0 }]);
    }
  };

  const removeItem = (type, id) => {
    const key = `${type}|${String(id).trim()}`;
    setSelectedItems(selectedItems.filter((item) => `${item.type}|${item.id}` !== key));
  };

  const isSelected = (type, id) => {
    return selectedItems.some((item) => item.type === type && String(item.id) === String(id));
  };

  const totalAmount = selectedItems.reduce((acc, curr) => acc + curr.rate, 0);

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one test, profile, package, or template');
      return;
    }

    setLoading(true);
    setError('');

    const rawPid = patient?.patientId || patient?.slNo || '';
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';

    if (!cleanPid) {
      setError('Patient ID is missing. Please close and re-open.');
      setLoading(false);
      return;
    }

    // Format string according to upstream ADDTESTMULTIPLE API:
    // e.g. PKG|4,PROF|21,TEST|101,TEMP|T1
    const formattedIds = selectedItems
      .map((item) => {
        let prefix = item.type || 'TEST';
        if (prefix === 'TEMPLATE') prefix = 'TEMP';
        let tid = String(item.id).trim();
        if (prefix === 'TEMP' && !tid.toUpperCase().startsWith('T')) {
          tid = `T${tid}`;
        }
        return `${prefix}|${tid}`;
      })
      .join(',');

    try {
      const res = await api.post('/patients/add-tests', {
        patientId: cleanPid,
        selectedTestIds: formattedIds,
        allowRepeat,
      });

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        if (onTestsAdded) onTestsAdded();
        onClose();
        navigate(`/patients/${cleanPid}?tab=billing`);
      } else {
        setError(res.data?.Message || 'Failed to add tests');
      }
    } catch (err) {
      setError(err.response?.data?.Message || 'Failed to add tests');
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter((t) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    const name = String(t.Name || t.name || '').toLowerCase();
    const id = String(t['Test Id'] || t.id || '').toLowerCase();
    const shortName = String(t['Short Name'] || t.shortName || '').toLowerCase();
    return name.includes(q) || id.includes(q) || shortName.includes(q);
  });

  const filteredProfiles = profiles.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    const name = String(p.Name || p.name || '').toLowerCase();
    const id = String(p['Profile Id'] || p.id || '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  const filteredPackages = packages.filter((pkg) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    const name = String(pkg.Name || pkg.name || '').toLowerCase();
    const id = String(pkg['Package Id'] || pkg.id || '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  const filteredTemplates = templates.filter((tmpl) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    const name = String(tmpl.TEMPLATE_NAME || tmpl.name || '').toLowerCase();
    const id = String(tmpl.templatesId || tmpl.id || tmpl.reportId || '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Tests - ${patient.name}${patient.slNo || patient.barcode ? ` (${patient.slNo || patient.barcode})` : ''}`} maxWidth="max-w-3xl">
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-semibold">
            {error}
          </div>
        )}

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('tests')}
              className={`py-1.5 px-3 font-semibold transition-colors cursor-pointer ${
                activeTab === 'tests' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Tests ({tests.length})
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`py-1.5 px-3 font-semibold transition-colors cursor-pointer ${
                activeTab === 'profiles' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profiles ({profiles.length})
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`py-1.5 px-3 font-semibold transition-colors cursor-pointer ${
                activeTab === 'packages' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Packages ({packages.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-1.5 px-3 font-semibold transition-colors cursor-pointer ${
                activeTab === 'templates' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Templates ({templates.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tests, profiles or templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-xs"
            />
          </div>
        </div>

        {/* Items Grid */}
        <div
          data-lenis-prevent="true"
          className="border border-slate-200 rounded-lg h-64 overflow-y-auto divide-y divide-slate-100 bg-white"
        >
          {activeTab === 'tests' && (
            filteredTests.length > 0 ? (
              filteredTests.map((t) => {
                const tId = t['Test Id'] || t.id || t.testId;
                const name = t.Name || t.name;
                const rate = t.Rate || t.rate || t.price || 100;
                const selected = isSelected('TEST', tId);
                const isBooked = bookedKeys.has(String(tId || '').toLowerCase()) || bookedKeys.has(String(name || '').toLowerCase());
                return (
                  <div
                    key={tId}
                    onClick={() => toggleItem('TEST', tId, name, rate)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      selected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {selected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{name}</span>
                          {isBooked && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                              Booked
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">({tId}) | {t['Sample Type'] || t.sampleType || 'Serum'}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">₹{rate}</span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 italic">No matching single tests found</div>
            )
          )}

          {activeTab === 'profiles' && (
            filteredProfiles.length > 0 ? (
              filteredProfiles.map((p) => {
                const pId = p['Profile Id'] || p.id || p.profileId;
                const name = p.Name || p.name;
                const rate = p.Rate || p.rate || p.price || 500;
                const selected = isSelected('PROF', pId);
                const isBooked = bookedKeys.has(String(pId || '').toLowerCase()) || bookedKeys.has(String(name || '').toLowerCase());
                return (
                  <div
                    key={pId}
                    onClick={() => toggleItem('PROF', pId, name, rate)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      selected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {selected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{name}</span>
                          {isBooked && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                              Booked
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Profile ({pId})</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">₹{rate}</span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 italic">No matching profiles found</div>
            )
          )}

          {activeTab === 'packages' && (
            filteredPackages.length > 0 ? (
              filteredPackages.map((pkg) => {
                const kId = pkg['Package Id'] || pkg.id || pkg.packageId;
                const name = pkg.Name || pkg.name;
                const rate = pkg.Rate || pkg.rate || pkg.price || 1000;
                const selected = isSelected('PKG', kId);
                const isBooked = bookedKeys.has(String(kId || '').toLowerCase()) || bookedKeys.has(String(name || '').toLowerCase());
                return (
                  <div
                    key={kId}
                    onClick={() => toggleItem('PKG', kId, name, rate)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      selected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {selected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{name}</span>
                          {isBooked && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                              Booked
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Package ({kId})</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">₹{rate}</span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 italic">No matching packages found</div>
            )
          )}

          {activeTab === 'templates' && (
            filteredTemplates.length > 0 ? (
              filteredTemplates.map((tmpl) => {
                const tmplId = tmpl.templatesId || tmpl.id || tmpl.reportId;
                const name = tmpl.TEMPLATE_NAME || tmpl.name || 'Template Report';
                const rate = tmpl.price || tmpl.Rate || tmpl['Special Rate 1'] || 0;
                const selected = isSelected('TEMP', tmplId);
                const isBooked = bookedKeys.has(String(tmplId || '').toLowerCase()) || bookedKeys.has(String(name || '').toLowerCase());
                return (
                  <div
                    key={tmplId}
                    onClick={() => toggleItem('TEMP', tmplId, name, rate)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      selected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {selected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{name}</span>
                          {isBooked && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                              Booked
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Template ({tmplId})</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">₹{rate}</span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 italic">No matching template reports found</div>
            )
          )}
        </div>

        {/* Selected Items Tray */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700">
                Selected ({selectedItems.length} items)
              </span>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none text-[11px]">
                <input
                  type="checkbox"
                  checked={allowRepeat}
                  onChange={(e) => setAllowRepeat(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Allow repeat order (re-check)</span>
              </label>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] mr-1">Estimated Total:</span>
                <span className="font-bold text-indigo-700 text-sm">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedItems.map((it) => (
                <span
                  key={`${it.type}|${it.id}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-indigo-200 text-indigo-800 rounded-md text-[11px] font-medium shadow-2xs"
                >
                  <span className="font-mono text-[9px] font-bold text-indigo-500 uppercase">{it.type}</span>
                  <span>{it.name}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(it.type, it.id)}
                    className="hover:text-rose-600 cursor-pointer p-0.5"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg font-medium text-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || selectedItems.length === 0}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Adding...' : `Add Tests (${selectedItems.length})`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
