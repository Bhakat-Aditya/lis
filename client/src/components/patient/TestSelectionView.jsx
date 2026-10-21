import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Search,
  CreditCard,
  Printer,
  FileEdit,
  DollarSign,
  Camera,
  Save,
  Check,
  CheckCircle,
} from 'lucide-react';
import { useMaster } from '../../context/context.master.jsx';
import api from '../../services/api';

export default function TestSelectionView({
  patient,
  reports = [],
  onRefresh,
  onPrintInvoice,
  onFillResults,
  onMakePayment,
}) {
  const { tests: catalogTests } = useMaster();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTests, setSelectedTests] = useState(() => {
    if (reports && reports.length > 0) {
      return reports.map((r, idx) => ({
        id: r.reportId || idx + 1,
        name: r.testName || r.profileName,
        amount: Number(r.rate) || 0,
      }));
    }
    return [];
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Financial calculations
  const existingTestsTotal = reports?.reduce((sum, r) => sum + (Number(r.rate) || 0), 0) || Number(patient?.totalBill) || 0;
  const subtotal = selectedTests.length > 0
    ? selectedTests.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    : existingTestsTotal;
  const discount = Number(patient?.discount || 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const totalDeposits = Number(patient?.paidBill || 0);
  const explicitDue = (patient?.balance !== undefined && patient?.balance !== null)
    ? Number(patient.balance)
    : (patient?.dueAmount !== undefined ? Number(patient.dueAmount) : null);
  const balanceDue = totalAmount > 0
    ? (explicitDue !== null && selectedTests.length === 0 ? explicitDue : Math.max(0, totalAmount - totalDeposits))
    : 0;
  const isPaid = totalAmount > 0 && balanceDue <= 0 && (totalDeposits > 0 || patient?.billPayStatus === 2 || patient?.billPayStatus === '2');

  const [showSuggestions, setShowSuggestions] = useState(false);

  const matchedSuggestions = searchTerm.trim().length >= 1
    ? catalogTests
        .filter((t) => {
          const name = String(t.Name || t.name || t.testName || '').toLowerCase();
          const code = String(t['Test Id'] || t['Short Name'] || '').toLowerCase();
          const q = searchTerm.toLowerCase();
          return name.includes(q) || code.includes(q);
        })
        .slice(0, 8)
    : [];

  const handleAddTest = (testToAdd = null) => {
    const query = testToAdd ? (testToAdd.Name || testToAdd.name || testToAdd.testName) : searchTerm.trim();
    if (!query) return;

    let matched = testToAdd;
    if (!matched) {
      matched = catalogTests.find((t) => {
        const n = String(t.Name || t.name || t.testName || '').toLowerCase();
        const code = String(t['Test Id'] || t['Short Name'] || '').toLowerCase();
        return n.includes(searchTerm.toLowerCase()) || code === searchTerm.toLowerCase();
      });
    }

    const testName = matched ? (matched.Name || matched.name || matched.testName) : query.toUpperCase();
    const testId = matched ? (matched['Test Id'] || matched.id || matched['Short Name'] || testName) : testName;
    const rate = matched ? Number(matched.Rate || matched.rate || 0) : 0;

    // Prevent duplicate additions
    if (selectedTests.some((t) => t.name.toLowerCase() === testName.toLowerCase())) {
      setSearchTerm('');
      setShowSuggestions(false);
      return;
    }

    const newTest = {
      id: testId || Date.now() + Math.random(),
      testId: testId,
      type: 'TEST',
      name: testName,
      amount: rate,
      isNew: true,
    };

    setSelectedTests((prev) => [...prev, newTest]);
    setSearchTerm('');
    setShowSuggestions(false);
    setSaveSuccess('');
  };

  const handleRemoveTest = (id) => {
    setSelectedTests((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClear = () => {
    setSelectedTests([]);
    setSearchTerm('');
    setSaveSuccess('');
    setSaveError('');
  };

  const handleSaveTests = async () => {
    if (selectedTests.length === 0) {
      setSaveError('Please add at least one test from the catalog.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const formattedIds = selectedTests
        .map((t) => {
          const tid = t.testId || t.id;
          const type = t.type || 'TEST';
          return `${type}|${tid}`;
        })
        .join(',');

      const res = await api.post('/patients/add-tests', {
        patientId: pid,
        selectedTestIds: formattedIds,
      });

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        setSaveSuccess('Tests ordered successfully! You can now record payment or print invoice.');
        if (onRefresh) onRefresh();
      } else {
        setSaveError(res.data?.Message || 'Failed to order tests');
      }
    } catch (err) {
      setSaveError(err.response?.data?.Message || 'Server error while ordering tests');
    } finally {
      setSaving(false);
    }
  };

  const pid = patient?.patientId || patient?.slNo || '37653';

  return (
    <div className="space-y-4">
      {/* 1. Top PID Strip (Clean Medical White Theme) */}
      <div className="bg-white border border-slate-200/90 shadow-xs px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between text-xs font-semibold gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-slate-700">
          <span className="font-bold text-blue-700 font-mono bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
            PID: #{pid}
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-slate-900">
            {patient?.title ? `${patient.title} ` : ''}
            {patient?.name || 'Patient'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            Age: {patient?.age || '-'} {patient?.age_unit || 'Years'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            Ref: <strong className="text-slate-800">{patient?.referedDr || 'Self'}</strong>
          </span>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-xl text-xs font-bold">
          Tests in Order: {selectedTests.length}
        </div>
      </div>

      {/* 2. Main Test Selection Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Clean Header */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-3 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2 text-slate-900">
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Diagnostic Test Catalog & Investigation Slip</span>
          </div>
          <button
            onClick={onMakePayment}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Record Payment (Deposit)</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Test Search & Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[240px] relative">
              <input
                type="text"
                placeholder="Search and select tests (e.g. CBC, Hemoglobin, Lipid)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTest()}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none focus:bg-white focus:border-indigo-600 font-medium"
              />
              {/* Autocomplete Dropdown */}
              {showSuggestions && matchedSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  {matchedSuggestions.map((t, idx) => {
                    const testName = t.Name || t.name || t.testName;
                    const testCode = t['Test Id'] || t['Short Name'] || '';
                    const rate = t.Rate || t.rate || '350';
                    return (
                      <div
                        key={testCode + idx}
                        onMouseDown={() => handleAddTest(t)}
                        className="p-2.5 hover:bg-indigo-50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{testName}</div>
                          {testCode && <div className="text-[10px] text-slate-400 font-mono">Code: {testCode}</div>}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-indigo-700 font-mono text-xs">₹{rate}</span>
                          <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                            + Add
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={handleAddTest}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>CLEAR</span>
            </button>
            <button
              onClick={handleSaveTests}
              disabled={saving || selectedTests.length === 0}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer shadow-xs ml-auto"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Order'}</span>
            </button>
          </div>

          {/* Feedback Banners */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onMakePayment}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Record Payment (Deposit)
                </button>
                <button
                  onClick={onPrintInvoice}
                  className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded font-bold text-xs cursor-pointer"
                >
                  Print Invoice
                </button>
              </div>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
              {saveError}
            </div>
          )}

          {/* Two-Column Grid: Selected Tests vs Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Selected Tests Table (8 cols) */}
            <div className="lg:col-span-8 bg-slate-50/70 border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-sky-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <span>≡</span> Selected Tests
                </span>
                <span className="bg-indigo-900 text-white px-2 py-0.5 rounded text-[10px]">
                  {selectedTests.length} tests
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-white text-[11px]">
                    <th className="py-2.5 px-3">Test Name</th>
                    <th className="py-2.5 px-3 text-right w-28">Amount</th>
                    <th className="py-2.5 px-3 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
                  {selectedTests.length > 0 ? (
                    selectedTests.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold uppercase">{t.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          ₹{t.amount}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleRemoveTest(t.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Remove Test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-6 text-center text-slate-400 italic">
                        No tests selected. Search above and click ADD.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right: Financial Summary Box (4 cols) matching Screenshot 4 */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span>💳</span> Financial Summary
              </div>

              <div className="text-xs space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold text-slate-900 font-mono">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount:</span>
                  <span className="font-bold text-rose-600 font-mono">₹{discount}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-800">Total Amount:</span>
                  <span className="font-extrabold text-slate-900 font-mono">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Deposits:</span>
                  <span className="font-bold text-slate-900 font-mono">₹{totalDeposits}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-800">Balance Due:</span>
                  <span className={`font-extrabold font-mono ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{balanceDue}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSaveTests}
                  disabled={saving || selectedTests.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving Tests...' : '1. Confirm & Save Tests'}</span>
                </button>

                <button
                  onClick={onMakePayment}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>2. Record Payment (Deposit)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons with Vibrant Colors */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={onPrintInvoice}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Invoice</span>
            </button>

            <button
              onClick={onFillResults}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Fill Test Results</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Clean Professional Footer */}
      <div className="text-center py-3 text-xs font-semibold text-slate-400 tracking-wide">
        Lab Expert Pathology LIS • 24/7 Clinical Support: 8799021616
      </div>
    </div>
  );
}
