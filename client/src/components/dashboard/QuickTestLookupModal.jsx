import React, { useState, useMemo } from 'react';
import { useMaster } from '../../context/context.master.jsx';
import {
  Search,
  X,
  FlaskConical,
  Clock,
  Layers,
  IndianRupee,
  Check,
  Copy,
  Tag,
  AlertCircle,
} from 'lucide-react';

export default function QuickTestLookupModal({ isOpen, onClose }) {
  const { tests, departments } = useMaster();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState(null);

  // Filter tests based on search and department
  const filteredTests = useMemo(() => {
    if (!tests || !Array.isArray(tests)) return [];

    return tests.filter((t) => {
      const name = String(t?.Name || t?.testName || t?.name || t?.testdesc || '').toLowerCase();
      const code = String(t?.['Test Id'] || t?.['Short Name'] || t?.testCode || t?.code || t?.testid || '').toLowerCase();
      const rawDept = t?.['Dept Id'] || t?.dept || t?.department || t?.depertmentName || '';
      const dept = typeof rawDept === 'string' ? rawDept.toLowerCase() : String(rawDept?.name || rawDept?.depertmentName || '').toLowerCase();
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch = !search || name.includes(search) || code.includes(search);
      const matchesDept = selectedDept === 'ALL' || dept.includes(selectedDept.toLowerCase());

      return matchesSearch && matchesDept;
    });
  }, [tests, searchTerm, selectedDept]);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">Test Directory & Rate Calculator</h3>
                <span className="text-[10px] uppercase font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  {tests.length} Master Tests
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Instant pricing, sample specimen requirements, and reporting turnaround times
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search by test name (e.g. 'Thyroid', 'CBC', 'Lipid', 'Urine')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Dept:
            </span>
            <button
              onClick={() => setSelectedDept('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedDept === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Tests ({tests.length})
            </button>
            {departments && departments.slice(0, 8).map((d, i) => {
              const name = d?.deptName || d?.depertmentName || d?.departmentName || d?.name || (typeof d === 'string' ? d : '') || '';
              if (!name || typeof name !== 'string') return null;
              return (
                <button
                  key={d.deptId || d.depertmentId || name + i}
                  onClick={() => setSelectedDept(name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDept.toLowerCase() === name.toLowerCase()
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Test List Table */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredTests.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-600 sticky top-0 z-10 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-28">Code</th>
                  <th className="py-2.5 px-4">Test Name & Specimen</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4 text-center">Avg. TAT</th>
                  <th className="py-2.5 px-4 text-right">Standard Rate</th>
                  <th className="py-2.5 px-4 text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.slice(0, 50).map((t, idx) => {
                  const testCode = String(t?.['Test Id'] || t?.['Short Name'] || t?.testCode || t?.code || t?.testid || `T-${idx + 101}`);
                  const testName = String(t?.Name || t?.testName || t?.name || t?.testdesc || 'Diagnostic Investigation');
                  const dept = typeof t?.dept === 'string' ? t.dept : (t?.['Dept Id'] || t?.department || t?.depertmentName || 'Clinical Pathology');
                  const rate = Number(t?.Rate || t?.rate || t?.price || t?.amount || 250);
                  const sampleType = typeof t?.['Sample Type'] === 'string' ? t['Sample Type'] : (t?.sampleType || t?.specimen || 'Serum / EDTA Whole Blood');
                  const tat = String(t?.tat || '3 - 6 Hours');

                  return (
                    <tr
                      key={testCode + idx}
                      className="hover:bg-indigo-50/40 transition-colors group"
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">
                        {testCode}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-900">
                          {testName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>Specimen: {sampleType}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {dept}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {tat}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{rate.toFixed(0)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => handleCopy(testCode)}
                          title="Copy test code"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                        >
                          {copiedCode === testCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
              <div className="font-medium text-xs">No matching tests found for "{searchTerm}"</div>
              <p className="text-[11px] text-slate-400">Try searching for generic terms like CBC, Sugar, or Liver</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {Math.min(50, filteredTests.length)} of {filteredTests.length} tests</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
}
