import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import api from '../../services/api';
import { useMaster } from '../../context/context.master.jsx';
import { Search, Plus, Check, Trash2, Layers } from 'lucide-react';

export default function AddTestsModal({ isOpen, onClose, patient, onTestsAdded }) {
  const { tests, profiles, packages } = useMaster();
  const [activeTab, setActiveTab] = useState('tests'); // tests, profiles, packages
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // { type: 'TEST'|'PROF'|'PKG', id, name, rate }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!patient) return null;

  const toggleItem = (type, id, name, rate) => {
    const key = `${type}|${id}`;
    if (selectedItems.some((item) => `${item.type}|${item.id}` === key)) {
      setSelectedItems(selectedItems.filter((item) => `${item.type}|${item.id}` !== key));
    } else {
      setSelectedItems([...selectedItems, { type, id, name, rate: Number(rate) || 0 }]);
    }
  };

  const isSelected = (type, id) => {
    return selectedItems.some((item) => item.type === type && item.id === id);
  };

  const totalAmount = selectedItems.reduce((acc, curr) => acc + curr.rate, 0);

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one test or profile');
      return;
    }

    setLoading(true);
    setError('');

    // Format string according to upstream API:
    // e.g. TEST|T1,TEST|T75,PROF|11,PKG|3
    const formattedIds = selectedItems.map((item) => `${item.type}|${item.id}`).join(',');

    try {
      await api.post('/patients/add-tests', {
        patientId: patient.patientId,
        selectedTestIds: formattedIds,
      });

      if (onTestsAdded) onTestsAdded();
      onClose();
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
    const id = String(t['Test Id'] || '').toLowerCase();
    const shortName = String(t['Short Name'] || '').toLowerCase();
    return name.includes(q) || id.includes(q) || shortName.includes(q);
  });

  const filteredProfiles = profiles.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    const name = String(p.Name || p.name || '').toLowerCase();
    const id = String(p['Profile Id'] || '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  const filteredPackages = packages.filter((pkg) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    const name = String(pkg.Name || pkg.name || '').toLowerCase();
    const id = String(pkg['Package Id'] || '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Tests - ${patient.name} (${patient.patientId})`} maxWidth="max-w-3xl">
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
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
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tests or profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>
        </div>

        {/* Items Grid */}
        <div className="border border-slate-200 rounded-lg h-64 overflow-y-auto divide-y divide-slate-100 bg-white">
          {activeTab === 'tests' && (
            filteredTests.map((t) => {
              const selected = isSelected('TEST', t['Test Id']);
              return (
                <div
                  key={t['Test Id']}
                  onClick={() => toggleItem('TEST', t['Test Id'], t.Name, t.Rate || 100)}
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
                      <span className="font-semibold text-slate-800">{t.Name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({t['Test Id']}) | {t['Sample Type'] || 'Serum'}</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700">₹{t.Rate || '100'}</span>
                </div>
              );
            })
          )}

          {activeTab === 'profiles' && (
            filteredProfiles.map((p) => {
              const selected = isSelected('PROF', p['Profile Id']);
              return (
                <div
                  key={p['Profile Id']}
                  onClick={() => toggleItem('PROF', p['Profile Id'], p.Name, p.Rate || 500)}
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
                      <span className="font-semibold text-slate-800">{p.Name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">Profile ({p['Profile Id']})</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700">₹{p.Rate || '500'}</span>
                </div>
              );
            })
          )}

          {activeTab === 'packages' && (
            filteredPackages.map((pkg) => {
              const selected = isSelected('PKG', pkg['Package Id']);
              return (
                <div
                  key={pkg['Package Id']}
                  onClick={() => toggleItem('PKG', pkg['Package Id'], pkg.Name, pkg.Rate || 1000)}
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
                      <span className="font-semibold text-slate-800">{pkg.Name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">Package ({pkg['Package Id']})</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700">₹{pkg.Rate || '1000'}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Items Tray */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="font-medium text-slate-700">
              Selected ({selectedItems.length} items)
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[11px] mr-1">Estimated Total:</span>
            <span className="font-bold text-indigo-700 text-sm">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg font-medium text-slate-700"
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
