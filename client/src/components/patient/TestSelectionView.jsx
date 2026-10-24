import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Package,
  Layers,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ListTree,
  X,
} from 'lucide-react';
import { useMaster } from '../../context/context.master.jsx';
import api from '../../services/api';
import { groupInvestigationsIntoLots } from '../../utils/labTestUtils.js';

export default function TestSelectionView({
  patient,
  reports = [],
  onRefresh,
  onPrintInvoice,
  onFillResults,
  onMakePayment,
}) {
  const { tests: catalogTests = [], profiles: catalogProfiles = [], packages: catalogPackages = [] } = useMaster();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownCategoryFilter, setDropdownCategoryFilter] = useState('ALL'); // ALL, PKG, PROF, TEST
  const [expandedSuggestions, setExpandedSuggestions] = useState({});
  const [expandedLots, setExpandedLots] = useState({});

  const dropdownContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Map of test IDs to test names for sub-test resolution
  const testMapById = useMemo(() => {
    const map = new Map();
    (catalogTests || []).forEach((t) => {
      const id = String(t['Test Id'] || t.id || '').trim();
      const name = String(t.Name || t.name || '').trim();
      if (id) map.set(id, name);
    });
    return map;
  }, [catalogTests]);

  // Map of profile IDs to their resolved sub-tests
  const profileSubTestsMap = useMemo(() => {
    const map = new Map();
    (catalogProfiles || []).forEach((p) => {
      const pId = String(p['Profile Id'] || p.id || '').trim();
      const testIds = String(p['Test Id List'] || '').split(',').map((s) => s.trim()).filter(Boolean);
      const subNames = testIds.map((id) => testMapById.get(id) || id);
      map.set(pId, subNames);
    });
    return map;
  }, [catalogProfiles, testMapById]);

  // Combine tests, profiles, and packages into unified catalog with resolved sub-tests
  const allCatalogItems = useMemo(() => {
    const items = [];

    // 1. Packages
    (catalogPackages || []).forEach((pkg) => {
      const id = String(pkg['Package Id'] || pkg.id || '').trim();
      if (id) {
        const kTestIds = String(pkg['Test Id List'] || '').split(',').map((s) => s.trim()).filter(Boolean);
        const kProfIds = String(pkg['Profile Id List'] || '').split(',').map((s) => s.trim()).filter(Boolean);
        const subTests = [];

        kTestIds.forEach((tId) => {
          const name = testMapById.get(tId);
          if (name && !subTests.includes(name)) subTests.push(name);
        });

        kProfIds.forEach((pId) => {
          const profTests = profileSubTestsMap.get(pId) || [];
          profTests.forEach((name) => {
            if (name && !subTests.includes(name)) subTests.push(name);
          });
        });

        items.push({
          type: 'PKG',
          id,
          testId: id,
          name: pkg.Name || pkg.name,
          shortName: '',
          rate: Number(pkg.Rate) || 0,
          category: 'Package',
          subTests,
          subTestCount: subTests.length,
        });
      }
    });

    // 2. Profiles
    (catalogProfiles || []).forEach((p) => {
      const id = String(p['Profile Id'] || p.id || '').trim();
      if (id) {
        const subTests = profileSubTestsMap.get(id) || [];
        items.push({
          type: 'PROF',
          id,
          testId: id,
          name: p.Name || p.name,
          shortName: '',
          rate: Number(p.Rate) || 0,
          category: 'Profile',
          subTests,
          subTestCount: subTests.length,
        });
      }
    });

    // 3. Standalone Individual Tests
    (catalogTests || []).forEach((t) => {
      const id = String(t['Test Id'] || t.id || '').trim();
      if (id) {
        items.push({
          type: 'TEST',
          id,
          testId: id,
          name: t.Name || t.name,
          shortName: t['Short Name'] || '',
          rate: Number(t.Rate) || 0,
          category: 'Test',
          subTests: [],
          subTestCount: 0,
        });
      }
    });

    return items;
  }, [catalogTests, catalogProfiles, catalogPackages, testMapById, profileSubTestsMap]);

  // Group existing reports and patient testList into clean Package, Profile, and Test lots
  const existingLots = useMemo(() => {
    return groupInvestigationsIntoLots(reports, patient, catalogProfiles, catalogPackages, catalogTests);
  }, [reports, patient, catalogProfiles, catalogPackages, catalogTests]);

  // Combined selected investigations list: existing booked lots + newly added uncommitted lots
  const [selectedTests, setSelectedTests] = useState(existingLots);

  // Sync when patient reports update from backend
  useEffect(() => {
    setSelectedTests((prev) => {
      // Build lookup of all already booked lot keys & names in existingLots
      const existingKeySet = new Set();
      const existingNameSet = new Set();

      existingLots.forEach((lot) => {
        const type = (lot.type || 'TEST').toUpperCase();
        const id = String(lot.testId || lot.id || '').toUpperCase().trim();
        const name = String(lot.name || '').toLowerCase().trim();

        if (id) {
          existingKeySet.add(`${type}|${id}`);
          if (type === 'TEST') {
            if (id.startsWith('T')) existingKeySet.add(`TEST|${id.slice(1)}`);
            else existingKeySet.add(`TEST|T${id}`);
          } else if (type === 'PROF') {
            existingKeySet.add(`PROF|${id.replace(/^P+/i, '')}`);
            existingKeySet.add(`PROF|P${id.replace(/^P+/i, '')}`);
          } else if (type === 'PKG') {
            existingKeySet.add(`PKG|${id.replace(/^K+/i, '')}`);
            existingKeySet.add(`PKG|K${id.replace(/^K+/i, '')}`);
          }
        }
        if (name) existingNameSet.add(name);
      });

      // Keep only newly added items that have not yet been booked into existingLots
      const newlyAdded = prev.filter((t) => {
        if (!t.isNew) return false;
        if (t.isRepeat) return true; // keep unsaved intentional repeats

        const type = (t.type || 'TEST').toUpperCase();
        const id = String(t.testId || t.id || '').toUpperCase().trim();
        const name = String(t.name || '').toLowerCase().trim();

        if (existingKeySet.has(`${type}|${id}`)) return false;
        if (existingNameSet.has(name)) return false;
        return true;
      });

      return [...existingLots, ...newlyAdded];
    });
  }, [existingLots]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { item, message }

  // Map and Sets of already booked investigations for this patient
  const alreadyBookedInfo = useMemo(() => {
    const bookedTestIds = new Set();
    const bookedProfIds = new Set();
    const bookedPkgIds = new Set();
    const bookedNames = new Set();
    const coveredSubTestNames = new Map(); // testNameLower -> parentLotName

    // 1. From selectedTests (both existing lots and newly added uncommitted lots)
    selectedTests.forEach((t) => {
      const type = (t.type || 'TEST').toUpperCase();
      const id = String(t.testId || t.id || '').toUpperCase().trim();
      const name = String(t.name || '').toLowerCase().trim();

      if (id) {
        if (type === 'TEST') {
          bookedTestIds.add(id);
          if (id.startsWith('T')) bookedTestIds.add(id.slice(1));
          else bookedTestIds.add(`T${id}`);
        }
        if (type === 'PROF') {
          bookedProfIds.add(id);
          bookedProfIds.add(id.replace(/^P+/i, ''));
        }
        if (type === 'PKG') {
          bookedPkgIds.add(id);
          bookedPkgIds.add(id.replace(/^K+/i, ''));
        }
      }
      if (name) bookedNames.add(name);

      // Record any sub-tests covered by this lot
      if (Array.isArray(t.subTests)) {
        t.subTests.forEach((sub) => {
          const sLower = String(sub).toLowerCase().trim();
          if (sLower && !coveredSubTestNames.has(sLower)) {
            coveredSubTestNames.set(sLower, t.name);
          }
        });
      }
    });

    // 2. From patient reports (direct lab parameters)
    (reports || []).forEach((r) => {
      if (r.testId) {
        const tid = String(r.testId).toUpperCase().trim();
        bookedTestIds.add(tid);
        if (tid.startsWith('T')) bookedTestIds.add(tid.slice(1));
        else bookedTestIds.add(`T${tid}`);
      }
      if (r.testName) bookedNames.add(String(r.testName).toLowerCase().trim());
      if (r.profileName && String(r.profileName).trim() !== 'undefined') {
        const pid = String(r.profileName).toUpperCase().trim();
        bookedProfIds.add(pid);
        bookedProfIds.add(pid.replace(/^P+/i, ''));
      }
      if (r.packageName && String(r.packageName).trim() !== 'undefined') {
        const kid = String(r.packageName).toUpperCase().trim();
        bookedPkgIds.add(kid);
        bookedPkgIds.add(kid.replace(/^K+/i, ''));
      }
    });

    // 3. From bill test list
    const billList = patient?.testList || patient?.billing?.testList;
    if (Array.isArray(billList)) {
      billList.forEach((b) => {
        const n = String(b['Bill Particulars'] || b.name || '').toLowerCase().trim();
        if (n) bookedNames.add(n);
      });
    }

    return {
      bookedTestIds,
      bookedProfIds,
      bookedPkgIds,
      bookedNames,
      coveredSubTestNames,
    };
  }, [selectedTests, reports, patient]);

  // Check if a catalog item is already booked or covered under a booked profile/package
  const getCatalogItemStatus = (item) => {
    if (!item) return { isBooked: false, isCovered: false, coveredBy: null };
    const type = (item.type || 'TEST').toUpperCase();
    const id = String(item.id || item.testId || '').toUpperCase().trim();
    const name = String(item.name || '').toLowerCase().trim();

    let isBooked = false;
    if (type === 'TEST' && alreadyBookedInfo.bookedTestIds.has(id)) isBooked = true;
    if (type === 'PROF') {
      const cleanId = id.replace(/^P+/i, '');
      if (alreadyBookedInfo.bookedProfIds.has(id) || alreadyBookedInfo.bookedProfIds.has(cleanId)) {
        isBooked = true;
      }
    }
    if (type === 'PKG') {
      const cleanId = id.replace(/^K+/i, '');
      if (alreadyBookedInfo.bookedPkgIds.has(id) || alreadyBookedInfo.bookedPkgIds.has(cleanId)) {
        isBooked = true;
      }
    }

    if (!isBooked && alreadyBookedInfo.bookedNames.has(name)) {
      isBooked = true;
    }

    let coveredBy = null;
    if (type === 'TEST' && !isBooked) {
      coveredBy = alreadyBookedInfo.coveredSubTestNames.get(name);
    }

    return {
      isBooked,
      isCovered: Boolean(coveredBy),
      coveredBy,
    };
  };

  // Financial calculations based on lot rates (avoids duplicating sub-test rates)
  const subtotal = useMemo(() => {
    if (selectedTests.length > 0) {
      return selectedTests.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    }
    return Number(patient?.totalBill) || 0;
  }, [selectedTests, patient]);

  const discount = Number(patient?.discount || 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const totalDeposits = Number(patient?.paidBill || 0);
  const explicitDue =
    patient?.balance !== undefined && patient?.balance !== null
      ? Number(patient.balance)
      : patient?.dueAmount !== undefined
      ? Number(patient.dueAmount)
      : null;
  const balanceDue =
    totalAmount > 0
      ? explicitDue !== null && selectedTests.filter((t) => t.isNew).length === 0
        ? explicitDue
        : Math.max(0, totalAmount - totalDeposits)
      : 0;

  // Filter matched suggestions: shows catalog items immediately on focus, and filters as user types
  const matchedSuggestions = useMemo(() => {
    let items = allCatalogItems;

    // Apply category filter if user clicked a category pill in the dropdown header
    if (dropdownCategoryFilter !== 'ALL') {
      items = items.filter((it) => it.type === dropdownCategoryFilter);
    }

    // If search term is present, filter by name, shortName, or code
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter((it) => {
        const n = String(it.name || '').toLowerCase();
        const s = String(it.shortName || '').toLowerCase();
        const id = String(it.id || '').toLowerCase();
        return n.includes(q) || s.includes(q) || id === q;
      });
    }

    return items.slice(0, 30);
  }, [searchTerm, allCatalogItems, dropdownCategoryFilter]);

  const handleAddTest = (itemToAdd = null, allowRepeatOverride = false) => {
    let item = itemToAdd;
    if (!item && searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      item = allCatalogItems.find((it) => {
        const n = String(it.name || '').toLowerCase();
        const s = String(it.shortName || '').toLowerCase();
        const id = String(it.id || '').toLowerCase();
        return n === q || s === q || id === q || n.includes(q);
      });
    }

    if (!item) {
      setSaveError('Please select a valid test, profile, or package from the catalog dropdown.');
      return;
    }

    const status = getCatalogItemStatus(item);

    // If already booked or covered and user has not clicked explicit repeat override
    if (!allowRepeatOverride) {
      if (status.isBooked) {
        setDuplicateWarning({
          item,
          message: `"${item.name}" is already booked for this patient. Duplicate addition was blocked.`,
        });
        setSaveError(`"${item.name}" is already booked in this patient's worklist.`);
        setShowSuggestions(false);
        return;
      }

      if (status.isCovered) {
        setDuplicateWarning({
          item,
          message: `"${item.name}" is already covered under booked panel "${status.coveredBy}".`,
        });
        setSaveError(`"${item.name}" is already covered under "${status.coveredBy}".`);
        setShowSuggestions(false);
        return;
      }
    }

    // Add as a single lot item with its lot name & lot total price
    const newLot = {
      id: `${item.type}|${item.id}_${Date.now()}`,
      testId: item.id,
      type: item.type,
      name: allowRepeatOverride ? `${item.name} (Repeat)` : item.name,
      amount: item.rate,
      category: item.category,
      isNew: true,
      isRepeat: Boolean(allowRepeatOverride),
      subTestCount: item.subTestCount || 0,
      subTests: item.subTests || [],
    };

    setSelectedTests((prev) => [...prev, newLot]);
    setSearchTerm('');
    setShowSuggestions(false);
    setDuplicateWarning(null);
    setSaveSuccess('');
    setSaveError('');
  };

  const handleRemoveTest = (id) => {
    setSelectedTests((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClear = () => {
    setSelectedTests((prev) => prev.filter((t) => !t.isNew));
    setSearchTerm('');
    setDuplicateWarning(null);
    setSaveSuccess('');
    setSaveError('');
  };

  const toggleExpandSuggestion = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedSuggestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExpandLot = (id) => {
    setExpandedLots((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const rawPid = patient?.patientId || patient?.slNo || '';
  const cleanPid = rawPid
    ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
    : '';
  const pid = cleanPid || patient?.patientId || patient?.slNo || '';

  const handleSaveTests = async () => {
    const newTests = selectedTests.filter((t) => t.isNew && t.testId);

    if (newTests.length === 0) {
      setSaveError('No new investigations selected. Search above and select from the catalog.');
      return;
    }

    if (!pid) {
      setSaveError('Patient ID is missing. Please refresh the page and try again.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const formattedIds = newTests
        .map((t) => `${t.type || 'TEST'}|${t.testId}`)
        .join(',');

      const hasRepeat = newTests.some((t) => t.isRepeat);

      const res = await api.post('/patients/add-tests', {
        patientId: pid,
        selectedTestIds: formattedIds,
        allowRepeat: hasRepeat,
      });

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        setSaveSuccess(`Added ${newTests.length} investigation lot(s) successfully!`);
        // Immediately mark newly added items as booked so they transition without duplicate or delete trash icon
        setSelectedTests((prev) =>
          prev.map((t) => (t.isNew ? { ...t, isNew: false, isRepeat: false } : t))
        );
        if (onRefresh) await onRefresh();
      } else {
        setSaveError(res.data?.Message || 'Failed to order tests');
      }
    } catch (err) {
      setSaveError(err.response?.data?.Message || 'Server error while ordering tests');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Top PID Strip */}
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

        <div className="flex items-center gap-2">
          <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-lg text-xs font-bold">
            {selectedTests.length} Investigation Lots
          </span>
          <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-lg text-xs font-bold">
            {reports.length} Tests in Lab Bench
          </span>
        </div>
      </div>

      {/* 2. Main Test Selection Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header */}
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
          {/* Test Search & Autocomplete Container */}
          <div className="flex flex-wrap items-center gap-2 relative" ref={dropdownContainerRef}>
            <div className="flex-1 min-w-[280px] relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Click to browse catalog or type to filter (e.g. CBC, Lipid, Typhus)..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onClick={() => setShowSuggestions(true)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTest()}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown: Shows items immediately on click/focus, filters as user types */}
              {showSuggestions && (
                <div
                  data-lenis-prevent="true"
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-300 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100 max-h-[380px] flex flex-col"
                >
                  {/* Dropdown Header with Category Filter Tabs */}
                  <div className="p-2 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDropdownCategoryFilter('ALL')}
                        className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                          dropdownCategoryFilter === 'ALL'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        All ({allCatalogItems.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setDropdownCategoryFilter('PKG')}
                        className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          dropdownCategoryFilter === 'PKG'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <Package className="w-3 h-3" />
                        <span>Packages ({catalogPackages.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDropdownCategoryFilter('PROF')}
                        className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          dropdownCategoryFilter === 'PROF'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>Profiles ({catalogProfiles.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDropdownCategoryFilter('TEST')}
                        className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          dropdownCategoryFilter === 'TEST'
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'
                        }`}
                      >
                        <FlaskConical className="w-3 h-3" />
                        <span>Tests ({catalogTests.length})</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                      Click row to add • Click icon to preview tests
                    </span>
                  </div>

                  {/* Suggestions List */}
                  <div
                    data-lenis-prevent="true"
                    className="overflow-y-auto divide-y divide-slate-100 flex-1"
                  >
                    {matchedSuggestions.length > 0 ? (
                      matchedSuggestions.map((t) => {
                        const testName = t.name;
                        const testCode = t.id || '';
                        const rate = t.rate || 0;
                        const category = t.category || 'Test';
                        const hasSubTests = t.subTests && t.subTests.length > 0;
                        const isExpanded = Boolean(expandedSuggestions[t.id]);

                        let badgeColor = 'bg-sky-50 text-sky-800 border-sky-300';
                        let icon = <FlaskConical className="w-3.5 h-3.5 text-sky-600" />;
                        if (category === 'Package') {
                          badgeColor = 'bg-amber-50 text-amber-900 border-amber-300';
                          icon = <Package className="w-3.5 h-3.5 text-amber-600" />;
                        } else if (category === 'Profile') {
                          badgeColor = 'bg-purple-50 text-purple-900 border-purple-300';
                          icon = <Layers className="w-3.5 h-3.5 text-purple-600" />;
                        }

                        const itemStatus = getCatalogItemStatus(t);
                        const isAlreadyBooked = itemStatus.isBooked;
                        const isCovered = itemStatus.isCovered;

                        return (
                          <div
                            key={`${t.type}_${testCode}`}
                            className={`transition-colors ${
                              isAlreadyBooked
                                ? 'bg-slate-50/70 hover:bg-amber-50/50'
                                : 'hover:bg-indigo-50/70'
                            }`}
                          >
                            <div
                              onClick={() => handleAddTest(t)}
                              className="p-2.5 flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                                <span className="p-1 rounded-lg bg-slate-100 shrink-0">{icon}</span>

                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 text-xs flex flex-wrap items-center gap-1.5">
                                    <span className="truncate">{testName}</span>
                                    <span
                                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${badgeColor}`}
                                    >
                                      {category}
                                    </span>
                                    {isAlreadyBooked && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border bg-emerald-100 text-emerald-900 border-emerald-300 flex items-center gap-0.5">
                                        <Check className="w-2.5 h-2.5 stroke-[3]" /> Booked
                                      </span>
                                    )}
                                    {isCovered && !isAlreadyBooked && (
                                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border bg-amber-100 text-amber-900 border-amber-300">
                                        In {itemStatus.coveredBy}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                    {testCode && <span>Code: #{testCode}</span>}
                                    {hasSubTests && (
                                      <span className="text-indigo-600 font-sans font-semibold">
                                        • {t.subTestCount} Tests Included
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Dedicated Icon Button beside Profile/Package to toggle child test preview */}
                                {hasSubTests && (
                                  <button
                                    type="button"
                                    onClick={(e) => toggleExpandSuggestion(t.id, e)}
                                    title="Click to view all tests included under this panel"
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                      isExpanded
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                    }`}
                                  >
                                    <ListTree className="w-3 h-3" />
                                    <span>{isExpanded ? 'Hide' : `${t.subTestCount} Tests`}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                )}

                                <span className="font-extrabold text-indigo-700 font-mono text-xs w-16 text-right">
                                  ₹{rate}
                                </span>

                                {isAlreadyBooked ? (
                                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-semibold border border-slate-200" title="Already in patient worklist">
                                    In Worklist
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-md font-bold">
                                    + Add
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Expanded Sub-tests preview drawer inside dropdown */}
                            {isExpanded && hasSubTests && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="px-3.5 pb-2.5 pt-1 bg-indigo-50/50 border-t border-indigo-100/80 animate-in fade-in duration-150"
                              >
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                  Tests under {testName}:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {t.subTests.map((sub, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="text-[10px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs"
                                    >
                                      {sub}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No tests, profiles, or packages found matching "{searchTerm}".
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleAddTest()}
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
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onMakePayment}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer"
                title="Record patient deposit payment"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Record Deposit</span>
              </button>
              <button
                type="button"
                onClick={onPrintInvoice}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
                title="Print investigation bill slip"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>

          {/* Duplicate Test Warning Banner with Repeat Test Option */}
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs animate-in fade-in">
              <div className="flex items-start gap-2.5 text-amber-900 font-semibold max-w-xl">
                <span className="p-1 rounded-lg bg-amber-200 text-amber-900 shrink-0 text-sm">⚠️</span>
                <div>
                  <div className="font-bold text-amber-950">{duplicateWarning.message}</div>
                  <div className="text-[11px] text-amber-800 font-normal mt-0.5">
                    Adding the same test again was blocked to prevent double-billing. If this is a physician-directed repeat order, click below to confirm.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAddTest(duplicateWarning.item, true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-lg cursor-pointer text-xs shadow-xs transition-all"
                >
                  Order Repeat Test
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

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

          {/* Two-Column Grid: Grouped Investigation Lots vs Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Investigation Lots Table (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Ordered Investigation Lots (Packages, Profiles & Standalone Tests)</span>
                </span>
                <span className="bg-indigo-900 text-white px-2 py-0.5 rounded text-[10px] font-mono">
                  {selectedTests.length} Lots
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50/50 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Investigation Lot Name</th>
                    <th className="py-2.5 px-3 text-right w-32">Lot Total (₹)</th>
                    <th className="py-2.5 px-3 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
                  {selectedTests.length > 0 ? (
                    selectedTests.map((t) => {
                      const isExpanded = Boolean(expandedLots[t.id]);
                      const hasSubTests = t.subTests && t.subTests.length > 0;

                      let categoryBadge = 'bg-sky-50 text-sky-800 border-sky-300';
                      let catIcon = <FlaskConical className="w-3 h-3 text-sky-600" />;
                      if (t.category === 'Package') {
                        categoryBadge = 'bg-amber-50 text-amber-900 border-amber-300';
                        catIcon = <Package className="w-3 h-3 text-amber-600" />;
                      } else if (t.category === 'Profile') {
                        categoryBadge = 'bg-purple-50 text-purple-900 border-purple-300';
                        catIcon = <Layers className="w-3 h-3 text-purple-600" />;
                      }

                      return (
                        <React.Fragment key={t.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${categoryBadge}`}
                                  >
                                    {catIcon}
                                    <span>{t.category} Lot</span>
                                  </span>

                                  <span className="font-bold text-slate-900 text-xs tracking-tight">
                                    {t.name}
                                  </span>

                                  {t.isNew ? (
                                    t.isRepeat ? (
                                      <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.2 rounded-md">
                                        Repeat
                                      </span>
                                    ) : (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.2 rounded-md">
                                        New
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.2 rounded-md">
                                      Booked
                                    </span>
                                  )}
                                </div>

                                {/* Expandable subtest toggle */}
                                {hasSubTests && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandLot(t.id)}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <ListTree className="w-3 h-3" />
                                    <span>
                                      {t.subTestCount} Included Investigation{t.subTestCount === 1 ? '' : 's'}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Lot Total Amount */}
                            <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 text-xs">
                              ₹{Number(t.amount || 0).toFixed(2)}
                            </td>

                            {/* Actions / Status */}
                            <td className="py-3 px-3 text-center">
                              {t.isNew ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTest(t.id)}
                                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remove New Investigation Lot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Booked
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded sub-test chips */}
                          {isExpanded && hasSubTests && (
                            <tr className="bg-slate-50/60">
                              <td colSpan="3" className="py-2.5 px-6">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Included Tests in {t.name}:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {t.subTests.map((subName, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="text-[10px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                                      >
                                        {subName}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-slate-400 italic">
                        No investigation lots ordered. Search above to add packages, profiles, or tests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right: Financial Summary Box (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-xs">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Financial Ledger Summary</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {selectedTests.length} Lots
                </span>
              </div>

              <div className="text-xs space-y-2.5 text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Gross Lot Subtotal:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-rose-600">
                    <span className="font-medium">Discount Applied:</span>
                    <span className="font-bold font-mono text-sm">
                      (-) ₹{discount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="font-extrabold text-slate-900">Net Bill Amount:</span>
                  <span className="font-extrabold text-slate-900 font-mono text-base">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Deposits Recorded:</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">
                    ₹{totalDeposits.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="font-extrabold text-slate-800">Outstanding Balance:</span>
                  <span
                    className={`font-extrabold font-mono text-base ${
                      balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    ₹{balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Save Tests Action right after the Total */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveTests}
                  disabled={saving || selectedTests.filter((t) => t.isNew).length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {saving
                      ? 'Saving Tests...'
                      : selectedTests.filter((t) => t.isNew).length > 0
                      ? `Save Tests (${selectedTests.filter((t) => t.isNew).length} New)`
                      : 'Save Tests'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
