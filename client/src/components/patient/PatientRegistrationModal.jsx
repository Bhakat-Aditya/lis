import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../common/Modal.jsx';
import api from '../../services/api';
import { useMaster } from '../../context/context.master.jsx';
import { useAuth } from '../../context/context.auth.jsx';
import {
  UserPlus,
  Phone,
  Calendar,
  CreditCard,
  User,
  ChevronRight,
  Loader2,
  Stethoscope,
  Users,
  X,
  GraduationCap,
  Sparkles,
  Building2,
  BadgePercent,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils.js';

export default function PatientRegistrationModal({ isOpen, onClose, onPatientAdded }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { doctors = [], branches = [], references = [] } = useMaster();

  const [formData, setFormData] = useState({
    slNo: '',
    title: 'Mr',
    name: '',
    mobile: '',
    regDate: getLocalDateString(),
    gender: 'Male',
    age: '',
    age_unit: 'Years',
    sampleType: 'Inside', // 'Inside' or 'Outside'
    referedDr: '',
    referDr: '',
    refagent: '',
    branch: '0',
  });

  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const doctorDropdownRef = useRef(null);

  const [isReferDoctorDropdownOpen, setIsReferDoctorDropdownOpen] = useState(false);
  const referDoctorDropdownRef = useRef(null);

  const [referralSearchQuery, setReferralSearchQuery] = useState('');
  const [isReferralDropdownOpen, setIsReferralDropdownOpen] = useState(false);
  const referralDropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(e.target)) {
        setIsDoctorDropdownOpen(false);
      }
      if (referDoctorDropdownRef.current && !referDoctorDropdownRef.current.contains(e.target)) {
        setIsReferDoctorDropdownOpen(false);
      }
      if (referralDropdownRef.current && !referralDropdownRef.current.contains(e.target)) {
        setIsReferralDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        slNo: '',
        title: 'Mr',
        name: '',
        mobile: '',
        regDate: getLocalDateString(),
        gender: 'Male',
        age: '',
        age_unit: 'Years',
        sampleType: 'Inside',
        referedDr: '',
        referDr: '',
        refagent: '',
        branch: '0',
      });
      setDoctorSearchQuery('');
      setIsDoctorDropdownOpen(false);
      setIsReferDoctorDropdownOpen(false);
      setReferralSearchQuery('');
      setIsReferralDropdownOpen(false);
      setError('');
    }
  }, [isOpen]);

  // Handle Title Change with Automatic Gender Sync
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setFormData((prev) => {
      let newGender = prev.gender;
      const lower = newTitle.toLowerCase();
      if (['mr', 'master'].includes(lower)) {
        newGender = 'Male';
      } else if (['mrs', 'miss', 'ms'].includes(lower)) {
        newGender = 'Female';
      }
      return {
        ...prev,
        title: newTitle,
        gender: newGender,
      };
    });
  };

  // Handle Box Clicking for Gender
  const handleGenderSelect = (selectedGender) => {
    setFormData((prev) => ({
      ...prev,
      gender: selectedGender,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Filtered doctors based on search in Commission dropdown
  const filteredDoctors = doctors.filter((doc) => {
    if (!doctorSearchQuery.trim()) return true;
    const q = doctorSearchQuery.toLowerCase();
    const name = (doc.Name || '').toLowerCase();
    const deg = (doc.Deg || '').toLowerCase();
    const id = String(doc['Doct Id'] || '').toLowerCase();
    return name.includes(q) || deg.includes(q) || id.includes(q);
  });

  // Filtered doctors for Refer Doctor field
  const filteredReferDoctors = doctors.filter((doc) => {
    const q = (formData.referedDr || '').toLowerCase().trim();
    if (!q || q === 'self') return true;
    const name = (doc.Name || '').toLowerCase();
    const deg = (doc.Deg || '').toLowerCase();
    const id = String(doc['Doct Id'] || '').toLowerCase();
    return name.includes(q) || deg.includes(q) || id.includes(q);
  });

  // Helper to format doctor name with degree
  const formatDoctorWithDegree = (doc) => {
    if (!doc || !doc.Name || doc.Name === 'Self') return 'Self';
    const deg = (doc.Deg || '').trim();
    return deg ? `${doc.Name} (${deg})` : doc.Name;
  };

  // When a doctor is selected from Refer Doctor search:
  const handleSelectReferDoctor = (doc) => {
    if (!doc || !doc.Name) return;
    const isSelf = doc.Name === 'Self' || doc['Doct Id'] === 'Self';
    const fullNameWithDeg = isSelf ? 'Self' : formatDoctorWithDegree(doc);

    setFormData((prev) => ({
      ...prev,
      referedDr: fullNameWithDeg,
    }));
    setIsReferDoctorDropdownOpen(false);
  };

  // When user types directly into Refer Doctor field
  const handleReferedDrChange = (e) => {
    const text = e.target.value;
    setIsReferDoctorDropdownOpen(true);
    setFormData((prev) => ({
      ...prev,
      referedDr: text,
    }));
  };

  // When a doctor is selected for Doctor For Commission:
  const handleSelectCommissionDoctor = (doc) => {
    if (!doc || !doc.Name || doc['Doct Id'] === '') {
      setFormData((prev) => ({
        ...prev,
        referDr: '',
      }));
      setDoctorSearchQuery('');
    } else if (doc['Doct Id'] === 'Self' || doc.Name === 'Self') {
      setFormData((prev) => ({
        ...prev,
        referDr: '',
      }));
      setDoctorSearchQuery('Self / Walk-in');
    } else {
      const docId = String(doc['Doct Id'] || doc.id || '');
      const fullNameWithDeg = formatDoctorWithDegree(doc);
      setFormData((prev) => ({
        ...prev,
        referDr: docId,
      }));
      setDoctorSearchQuery(fullNameWithDeg);
    }
    setIsDoctorDropdownOpen(false);
  };

  // When user types directly into Commission Doctor field
  const handleDoctorSearchChange = (e) => {
    const text = e.target.value;
    setDoctorSearchQuery(text);
    setIsDoctorDropdownOpen(true);

    if (!text.trim()) {
      setFormData((prev) => ({
        ...prev,
        referDr: '',
      }));
      return;
    }

    const match = doctors.find(
      (d) =>
        (d.Name && d.Name.toLowerCase() === text.trim().toLowerCase()) ||
        String(d['Doct Id'] || d.id || '').toLowerCase() === text.trim().toLowerCase()
    );

    if (match) {
      const docId = String(match['Doct Id'] || match.id || '');
      setFormData((prev) => ({
        ...prev,
        referDr: docId,
      }));
    }
  };

  // Find currently matched doctor to display their degree pill
  const matchedDoctor = doctors.find(
    (d) =>
      (formData.referDr && d['Doct Id'] === formData.referDr) ||
      (formData.referedDr && d.Name && formData.referedDr.toLowerCase().includes(d.Name.toLowerCase()))
  );

  // Filtered referrals based on search
  const filteredReferrals = references.filter((ref) => {
    if (!referralSearchQuery.trim()) return true;
    const q = referralSearchQuery.toLowerCase();
    const name = (ref.Name || ref.name || '').toLowerCase();
    const contact = String(ref.contact || '').toLowerCase();
    const id = String(ref['Refer Id'] ?? ref.id ?? ref['Doct Id'] ?? '').toLowerCase();
    return name.includes(q) || contact.includes(q) || id.includes(q);
  });

  const handleSelectReferral = (ref) => {
    if (!ref || !ref.Name) {
      setFormData((prev) => ({
        ...prev,
        refagent: '',
      }));
      setReferralSearchQuery('');
    } else {
      const refName = ref.Name || ref.name || '';
      const refId = String(ref['Refer Id'] ?? ref.id ?? ref['Doct Id'] ?? '');
      setFormData((prev) => ({
        ...prev,
        refagent: refId,
      }));
      setReferralSearchQuery(refName);
    }
    setIsReferralDropdownOpen(false);
  };

  const handleReferralSearchChange = (e) => {
    const text = e.target.value;
    setReferralSearchQuery(text);
    setIsReferralDropdownOpen(true);

    if (!text.trim()) {
      setFormData((prev) => ({ ...prev, refagent: '' }));
      return;
    }

    const match = references.find(
      (r) =>
        String(r.Name || r.name || '').toLowerCase() === text.toLowerCase().trim() ||
        String(r['Refer Id'] ?? r.id ?? r['Doct Id'] ?? '').trim() === text.trim()
    );
    if (match) {
      const matchId = String(match['Refer Id'] ?? match.id ?? match['Doct Id'] ?? '');
      setFormData((prev) => ({ ...prev, refagent: matchId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter patient name');
      return;
    }

    if (!formData.referedDr || !formData.referedDr.trim()) {
      setError('Please enter or select Refer Doctor (Required)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rawDate = formData.regDate;
      const cleanRegDate = getLocalDateString(rawDate || new Date());
      const rawGender = String(formData.gender || '').trim().toLowerCase();
      const cleanGender = rawGender.startsWith('m')
        ? 'Male'
        : rawGender.startsWith('f')
        ? 'Female'
        : 'Transgender';

      const trimmedReferedDr = String(formData.referedDr || '').trim();
      const cleanReferDr = String(formData.referDr || '').trim();
      const cleanRefAgent = String(formData.refagent || '').trim();
      const cleanBranch = String(
        formData.branch !== undefined && formData.branch !== null && formData.branch !== ''
          ? formData.branch
          : '0'
      ).trim();

      const payload = {
        ...formData,
        gender: cleanGender,
        regDate: cleanRegDate,
        slNo: formData.slNo.trim() || `${Date.now()}`.slice(-9),
        referedDr: trimmedReferedDr,
        referDr: cleanReferDr,
        refagent: cleanRefAgent,
        referAgent: cleanRefAgent,
        branch: cleanBranch,
      };

      const res = await api.post('/patients/add', payload);
      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        const pid = res.data?.patientId || res.data?.patient?.patientId || res.data?.patient?.slNo || payload.slNo;
        if (onPatientAdded) onPatientAdded(res.data);
        onClose();
        if (pid) {
          navigate(`/patients/${pid}?tab=tests`);
        }
      } else {
        setError(res.data?.Message || 'Failed to register patient');
      }
    } catch (err) {
      setError(err.response?.data?.Message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" overflow="overflow-visible">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="text-slate-800 -mt-1"
      >
        {/* Modern Clinical Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Add New Patient</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  LIS Intake
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Create new lab entry • Auto-synced billing ledger & doctor routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
              Esc to close
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Cancel / Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert Box */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 16 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2.5 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* SECTION 1: Patient Identity & Demographics */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Patient Identity & Demographics</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Fields with <span className="text-rose-500 font-bold">*</span> are required</span>
            </div>

            {/* Row 1: Title & Full Name + Gender */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Title & Name Group */}
              <div className="md:col-span-7 flex gap-2">
                <div className="w-24 shrink-0">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Title
                  </label>
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                    <option value="Ms">Ms</option>
                    <option value="Master">Master</option>
                    <option value="Baby">Baby</option>
                    <option value="B/O">B/O (Baby of)</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Patient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Gender Segmented Switch */}
              <div className="md:col-span-5">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Gender
                </label>
                <div className="grid grid-cols-3 p-0.5 bg-slate-200/70 border border-slate-300/80 rounded-xl">
                  {['Male', 'Female', 'Transgender'].map((g) => {
                    const isSelected = formData.gender.toLowerCase() === g.toLowerCase();
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleGenderSelect(g)}
                        className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-semibold'
                        }`}
                      >
                        {g === 'Transgender' ? 'Other' : g}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 2: Age & Unit | Mobile Number | Sample Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Age & Unit */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Age & Unit
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    name="age"
                    placeholder="30"
                    min="0"
                    max="120"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-1/2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                  />
                  <select
                    name="age_unit"
                    value={formData.age_unit}
                    onChange={handleInputChange}
                    className="w-1/2 px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="Years">Years</option>
                    <option value="Months">Months</option>
                    <option value="Days">Days</option>
                  </select>
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="10-digit mobile"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Sample Intake Type */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Sample Source
                </label>
                <div className="flex items-center justify-between px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${formData.sampleType === 'Outside' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-semibold text-slate-800">
                      {formData.sampleType === 'Outside' ? 'Outside Sample' : 'In-House (Central)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        sampleType: prev.sampleType === 'Outside' ? 'Inside' : 'Outside',
                      }))
                    }
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.sampleType === 'Outside' ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={formData.sampleType === 'Outside'}
                    title="Toggle In-House vs Outside Sample"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        formData.sampleType === 'Outside' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: BarCode Serial | Collection Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-0.5">
              {/* Barcode Serial */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    BarCode / Serial No
                  </label>
                  <span className="text-[10px] text-emerald-600 font-medium">Leave blank for auto-generate</span>
                </div>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="slNo"
                    placeholder="Auto-generated if empty"
                    value={formData.slNo}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Collection Date */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Collection Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    name="regDate"
                    value={formData.regDate}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Referral Governance & Center Assignment */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                <span>Referral Routing & Master Catalog Channels</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Default: Central Main Lab #0</span>
            </div>

            {/* Refer Doctor (Required, Default Blank) */}
            <div className={`relative ${isReferDoctorDropdownOpen ? 'z-40' : 'z-30'}`} ref={referDoctorDropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <span>Refer Doctor (Prescribing Doctor)</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                {matchedDoctor?.Deg && (
                  <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-indigo-600" />
                    <span>Degree: {matchedDoctor.Deg}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="referedDr"
                  required
                  placeholder="Doctor Name (Degree) - Required (type initials to search catalog)"
                  value={formData.referedDr}
                  onFocus={() => setIsReferDoctorDropdownOpen(true)}
                  onClick={() => setIsReferDoctorDropdownOpen(true)}
                  onChange={handleReferedDrChange}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
                />

                {/* Refer Doctor Autocomplete Dropdown - Anchored directly to input */}
                {isReferDoctorDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 flex items-center justify-between">
                      <span>Select Prescribing Doctor</span>
                      <span className="text-slate-400 font-mono text-[9px]">{filteredReferDoctors.length} found</span>
                    </div>
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectReferDoctor({ 'Doct Id': '', Name: 'Self' });
                      }}
                      className="px-3.5 py-2 hover:bg-indigo-50 cursor-pointer text-xs font-semibold text-slate-700 flex justify-between items-center transition-colors"
                    >
                      <span>Self / Walk-in</span>
                      <span className="text-[10px] text-slate-400 font-mono italic">Walk-in</span>
                    </div>

                    {filteredReferDoctors.length > 0 ? (
                      filteredReferDoctors.map((doc, idx) => (
                        <div
                          key={doc['Doct Id'] || idx}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectReferDoctor(doc);
                          }}
                          className="px-3.5 py-2 hover:bg-indigo-50/80 cursor-pointer text-xs text-slate-800 flex justify-between items-center transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{doc.Name}</span>
                            {doc.Deg && (
                              <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                                {doc.Deg}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                            #{doc['Doct Id']}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-3.5 py-2.5 text-xs text-slate-400 italic">No matching doctor found in catalog</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row: Doctor For Commission | Referring Agent | Collection Center */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Doctor For Commission (Default Blank) */}
              <div className={`relative ${isDoctorDropdownOpen ? 'z-40' : 'z-20'}`} ref={doctorDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Doctor For Commission
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Optional</span>
                </div>
                <div className="relative">
                  <BadgePercent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search doctor (optional)..."
                    value={doctorSearchQuery}
                    onFocus={() => setIsDoctorDropdownOpen(true)}
                    onClick={() => setIsDoctorDropdownOpen(true)}
                    onChange={handleDoctorSearchChange}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
                  />

                  {/* Autocomplete Dropdown List - Anchored directly below input */}
                  {isDoctorDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                        Doctor For Commission
                      </div>
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCommissionDoctor({ 'Doct Id': '', Name: '' });
                        }}
                        className="px-3.5 py-2 hover:bg-rose-50 text-rose-600 cursor-pointer text-xs font-semibold flex justify-between items-center transition-colors"
                      >
                        <span>None / No Commission (Blank)</span>
                        <span className="text-[10px] font-mono italic">Blank</span>
                      </div>
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCommissionDoctor({ 'Doct Id': 'Self', Name: 'Self' });
                        }}
                        className="px-3.5 py-2 hover:bg-indigo-50 cursor-pointer text-xs font-semibold text-slate-700 flex justify-between items-center transition-colors"
                      >
                        <span>Self / Walk-in</span>
                        <span className="text-[10px] text-slate-400 font-mono italic">Walk-in</span>
                      </div>

                      {filteredDoctors.length > 0 ? (
                        filteredDoctors.map((doc, idx) => (
                          <div
                            key={doc['Doct Id'] || idx}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectCommissionDoctor(doc);
                            }}
                            className="px-3.5 py-2 hover:bg-indigo-50/80 cursor-pointer text-xs text-slate-800 flex justify-between items-center transition-colors"
                          >
                            <div>
                              <span className="font-bold">{doc.Name}</span>
                              {doc.Deg && (
                                <span className="text-[10px] text-indigo-700 font-semibold ml-1.5 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                                  {doc.Deg}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                              #{doc['Doct Id']}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-slate-400 italic text-xs">
                          No matching doctor found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected doctor confirmation badge */}
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    Comm ID:{' '}
                    <strong className="text-indigo-600 font-mono font-bold">
                      {formData.referDr ? `#${formData.referDr}` : 'None (Blank)'}
                    </strong>
                    {matchedDoctor?.Name && formData.referDr ? ` (${matchedDoctor.Name})` : ''}
                  </span>
                </div>
              </div>

              {/* Referring Agent (Default Blank) */}
              <div className={`relative ${isReferralDropdownOpen ? 'z-40' : 'z-20'}`} ref={referralDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Referring Agent (Catalog)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Optional</span>
                </div>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search referring agent..."
                    value={referralSearchQuery}
                    onFocus={() => setIsReferralDropdownOpen(true)}
                    onClick={() => setIsReferralDropdownOpen(true)}
                    onChange={handleReferralSearchChange}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
                  />

                  {/* Referral Dropdown List - Anchored directly below input */}
                  {isReferralDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 flex items-center justify-between">
                        <span>Referring Agent Catalog</span>
                        <span className="font-mono text-[9px] text-slate-400">{filteredReferrals.length} in Catalog</span>
                      </div>

                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectReferral(null);
                        }}
                        className="px-3.5 py-2 hover:bg-rose-50 text-rose-600 cursor-pointer text-xs font-semibold flex justify-between items-center transition-colors"
                      >
                        <span>None / Direct (No Agent - Blank)</span>
                        <span className="text-[10px] font-mono italic">Blank</span>
                      </div>

                      {filteredReferrals.length > 0 ? (
                        filteredReferrals.map((ref, idx) => {
                          const refId = String(ref.id ?? ref['Doct Id'] ?? ref['Refer Id'] ?? idx + 1);
                          const isSelected = String(formData.refagent) === refId;
                          return (
                            <div
                              key={refId}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectReferral(ref);
                              }}
                              className={`px-3.5 py-2 hover:bg-indigo-50/80 cursor-pointer text-xs flex justify-between items-center transition-colors ${
                                isSelected ? 'bg-indigo-50/80 font-bold text-indigo-900' : 'text-slate-800'
                              }`}
                            >
                              <div>
                                <div className="font-bold">{ref.Name || ref.name}</div>
                                {ref.Address && (
                                  <div className="text-[10px] text-slate-400 truncate max-w-xs">
                                    {ref.Address}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700">
                                  Agent #{refId}
                                </span>
                                {ref.Contact && (
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {ref.Contact}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-slate-400 italic text-xs">
                          No referring agents found matching "{referralSearchQuery}".
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected agent confirmation badge */}
                {(() => {
                  const selectedAgent = references.find(
                    (r) => String(r.id ?? r['Doct Id'] ?? r['Refer Id']) === String(formData.refagent)
                  );
                  return (
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        Agent ID:{' '}
                        <strong className="text-indigo-600 font-mono font-bold">
                          {formData.refagent ? `#${formData.refagent}` : 'None (Blank)'}
                        </strong>
                        {selectedAgent?.Name ? ` (${selectedAgent.Name})` : ''}
                      </span>
                      {selectedAgent?.Rate && (
                        <span className="text-slate-500 font-mono">Comm: {selectedAgent.Rate}</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Collection Center (Default '0') */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Collection Center
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Branch #0 default</span>
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs cursor-pointer"
                  >
                    {!branches.some((b) => String(b.branchId ?? b['Branch Id'] ?? b.id) === '0') && (
                      <option value="0">Main Lab (Central) (Branch #0)</option>
                    )}
                    {branches.map((b) => {
                      const bId = String(b.branchId ?? b['Branch Id'] ?? b.id ?? '');
                      return (
                        <option key={bId} value={bId}>
                          {b.name || b.Name || `Branch ${bId}`} (Branch #{bId})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Selected Center:{' '}
                  <strong className="text-indigo-600 font-mono font-bold">
                    #{formData.branch}
                  </strong>{' '}
                  {formData.branch === '0' ? '(Central Main Lab)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct redirect to test ordering upon save</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 active:scale-[0.98] text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-950/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Add Patient & Order Tests</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </Modal>
  );
}