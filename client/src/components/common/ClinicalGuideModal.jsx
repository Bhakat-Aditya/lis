import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  X,
  AlertTriangle,
  TestTube2,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  HeartPulse,
} from 'lucide-react';
import { CLINICAL_TEST_GUIDE, PHLEBOTOMY_TUBE_GUIDE, CRITICAL_PANIC_VALUES } from '../../data/clinicalKnowledge.js';

export default function ClinicalGuideModal({ isOpen, onClose, initialSearch = '' }) {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'tubes', 'panic'
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTest, setSelectedTest] = useState(CLINICAL_TEST_GUIDE[0]);

  if (!isOpen) return null;

  const categories = ['ALL', 'Hematology', 'Biochemistry', 'Immunology', 'Serology', 'Clinical Pathology'];

  const filteredTests = CLINICAL_TEST_GUIDE.filter((test) => {
    const matchesCategory = selectedCategory === 'ALL' || test.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchTerm ||
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.parameters.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner">
              <BookOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Clinical Diagnostic Knowledge Center</h2>
                <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  NABL & Pathologist Reference
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Medical indications, normal reference ranges, critical panic thresholds, and phlebotomy collection protocols
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Search Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'tests' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Diagnostic Tests ({CLINICAL_TEST_GUIDE.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tubes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'tubes' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TestTube2 className="w-3.5 h-3.5" />
              <span>Tube Colors ({PHLEBOTOMY_TUBE_GUIDE.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('panic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'panic' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Panic Values ({CRITICAL_PANIC_VALUES.length})</span>
            </button>
          </div>

          {activeTab === 'tests' && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search test name, code, parameter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          )}
        </div>

        {/* Tab Content 1: Diagnostic Tests Directory */}
        {activeTab === 'tests' && (
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Left Column: Test List (5 cols) */}
            <div className="md:col-span-5 flex flex-col overflow-hidden bg-slate-50/50">
              {/* Category Pills */}
              <div className="p-3 flex items-center gap-1 overflow-x-auto border-b border-slate-200 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer text-[11px] ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* List of Tests */}
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2 space-y-1">
                {filteredTests.map((test) => {
                  const isSelected = selectedTest?.id === test.id;
                  return (
                    <div
                      key={test.id}
                      onClick={() => setSelectedTest(test)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border border-indigo-200 shadow-2xs'
                          : 'hover:bg-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 text-xs leading-tight">{test.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${test.tube.bgColor}`}>
                          {test.tube.name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono text-indigo-700 font-semibold">{test.code}</span>
                        <span className="text-slate-400">{test.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Test Intelligence (7 cols) */}
            <div className="md:col-span-7 p-5 overflow-y-auto space-y-4">
              {selectedTest ? (
                <>
                  {/* Test Header */}
                  <div className="space-y-1 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        {selectedTest.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        Code: {selectedTest.code}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" /> TAT: {selectedTest.tatHours}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedTest.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{selectedTest.clinicalSignificance}</p>
                  </div>

                  {/* Phlebotomy & Tube Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Sample Tube</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: selectedTest.tube.hex }}
                        />
                        {selectedTest.tube.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Specimen</span>
                      <span className="font-semibold text-slate-800 block mt-0.5">{selectedTest.sampleType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Fasting Prep</span>
                      <span className="font-semibold text-slate-800 block mt-0.5">{selectedTest.fastingRequired}</span>
                    </div>
                  </div>

                  {/* Reference Parameters Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-2.5 bg-slate-100 font-bold text-xs text-slate-700">
                      Standard Reference Intervals & Panic Thresholds
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Parameter</th>
                          <th className="py-2 px-3">Standard Reference</th>
                          <th className="py-2 px-3">Panic Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedTest.parameters.map((param, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{param.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {param.maleRef || param.femaleRef}
                            </td>
                            <td className="py-2 px-3 font-mono text-rose-600 font-bold">
                              {param.panicLow ? `Low: ${param.panicLow}` : ''}
                              {param.panicLow && param.panicHigh ? ' | ' : ''}
                              {param.panicHigh ? `High: ${param.panicHigh}` : ''}
                              {!param.panicLow && !param.panicHigh ? '-' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Clinical Interpretation Guidelines */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800">
                        <TrendingUp className="w-4 h-4 text-rose-600" />
                        <span>Clinical Meaning When Elevated / High:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-rose-900">{selectedTest.highInterpretation}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-800">
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                        <span>Clinical Meaning When Decreased / Low:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-blue-900">{selectedTest.lowInterpretation}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs">Select a diagnostic test to view clinical guidelines.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: Vacutainer Tube Color Guide */}
        {activeTab === 'tubes' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Standard Phlebotomy Order of Draw: Blood Culture &rarr; Light Blue (Citrate) &rarr; Gold/Yellow (SST) &rarr; Green (Heparin) &rarr; Lavender (EDTA) &rarr; Grey (Fluoride).
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PHLEBOTOMY_TUBE_GUIDE.map((tube) => (
                <div
                  key={tube.code}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-8 rounded-md shadow-xs border border-black/20"
                        style={{ backgroundColor: tube.hex }}
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{tube.capColor}</h4>
                        <span className="text-[10px] font-semibold text-slate-500">{tube.additive}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                      {tube.code}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800">Department:</span> {tube.department}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Inversions:</span> {tube.inversionCount}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Typical Tests:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tube.commonTests.map((t, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 3: Critical Panic Values Reference */}
        {activeTab === 'panic' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs text-rose-950 space-y-1">
                <h4 className="font-bold text-sm text-rose-900">Hospital Critical Panic Value Policy</h4>
                <p>
                  Any result breaching the thresholds below constitutes a medical emergency. Lab technician must immediately verify
                  sample integrity, run a rapid duplicate check, notify the consulting Pathologist, and telephonically inform the
                  referring doctor within <strong>15 minutes</strong> with read-back confirmation.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Investigation Test</th>
                    <th className="py-3 px-4 text-amber-700">Panic Low Threshold</th>
                    <th className="py-3 px-4 text-rose-700">Panic High Threshold</th>
                    <th className="py-3 px-4">Emergency Clinical Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {CRITICAL_PANIC_VALUES.map((panic, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{panic.test}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-700">{panic.low}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">{panic.high}</td>
                      <td className="py-3 px-4 text-slate-600">{panic.alert}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>NABL Reference Standard Edition 2026 • New Life Care Diagnostic</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
