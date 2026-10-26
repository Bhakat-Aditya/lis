import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal.jsx';
import api from '../../services/api.js';
import { useMaster } from '../../context/context.master.jsx';
import {
  UserCheck,
  Phone,
  Calendar,
  User,
  Loader2,
  Stethoscope,
  Building,
  X,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Save,
} from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils.js';

export default function PatientEditModal({ isOpen, onClose, patient, onPatientUpdated }) {
  const { doctors = [], branches = [], references = [] } = useMaster();

  const [formData, setFormData] = useState({
    patientId: '',
    slNo: '',
    title: 'Mr',
    name: '',
    mobile: '',
    regDate: getLocalDateString(),
    gender: 'Male',
    age: '',
    age_unit: 'Years',
    sampleType: 'Inside', // 'Inside' or 'Outside'
    referedDr: 'Self',
    referDr: 'D1',
    refagent: '1',
    branch: '1',
  });

  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const doctorDropdownRef = useRef(null);

  const [referralSearchQuery, setReferralSearchQuery] = useState('');
  const [isReferralDropdownOpen, setIsReferralDropdownOpen] = useState(false);
  const referralDropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(e.target)) {
        setIsDoctorDropdownOpen(false);
      }
      if (referralDropdownRef.current && !referralDropdownRef.current.contains(e.target)) {
        setIsReferralDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Initialize form data when patient prop changes or modal opens
  useEffect(() => {
    if (isOpen && patient) {
      const pid = patient.patientId || patient.slNo || '';
      const rawGender = String(patient.gender || '').trim();
      const isMale = rawGender.toLowerCase().startsWith('m');
      const isFemale = rawGender.toLowerCase().startsWith('f');
      const resolvedGender = isMale ? 'Male' : isFemale ? 'Female' : (rawGender || 'Male');

      // Clean age string to separate number and unit if combined (e.g., "25 Years")
      let initialAge = String(patient.age || '').trim();
      let initialAgeUnit = patient.age_unit || 'Years';
      if (initialAge.toLowerCase().includes('year')) {
        initialAge = initialAge.replace(/years?/i, '').trim();
        initialAgeUnit = 'Years';
      } else if (initialAge.toLowerCase().includes('month')) {
        initialAge = initialAge.replace(/months?/i, '').trim();
        initialAgeUnit = 'Months';
      } else if (initialAge.toLowerCase().includes('day')) {
        initialAge = initialAge.replace(/days?/i, '').trim();
        initialAgeUnit = 'Days';
      }

      setFormData({
        patientId: pid,
        slNo: patient.slNo || pid,
        title: patient.title || (resolvedGender === 'Female' ? 'Mrs' : 'Mr'),
        name: patient.name || '',
        mobile: patient.mobile || '',
        regDate: patient.regDate || patient.collectionDate || getLocalDateString(),
        gender: resolvedGender,
        age: initialAge,
        age_unit: initialAgeUnit,
        sampleType: patient.sampleType || 'Inside',
        referedDr: patient.referedDr || 'Self',
        referDr: patient.referDr || 'D1',
        refagent: patient.refagent || '1',
        branch: patient.branch || '1',
      });

      setDoctorSearchQuery(patient.referedDr || '');
      setReferralSearchQuery('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

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

  // Filtered doctors based on search
  const filteredDoctors = doctors.filter((doc) => {
    if (!doctorSearchQuery.trim()) return true;
    const q = doctorSearchQuery.toLowerCase();
    const name = (doc.Name || '').toLowerCase();
    const deg = (doc.Deg || '').toLowerCase();
    const id = String(doc['Doct Id'] || '').toLowerCase();
    return name.includes(q) || deg.includes(q) || id.includes(q);
  });

  const formatDoctorWithDegree = (doc) => {
    if (!doc || !doc.Name || doc.Name === 'Self') return 'Self';
    const deg = (doc.Deg || '').trim();
    return deg ? `${doc.Name} (${deg})` : doc.Name;
  };

  const handleSelectDoctor = (doc) => {
    const docName = doc.Name || 'Self';
    const docId = doc['Doct Id'] || 'D1';
    const fullNameWithDeg = formatDoctorWithDegree(doc);

    setFormData((prev) => ({
      ...prev,
      referDr: docId,
      referedDr: fullNameWithDeg,
    }));

    setDoctorSearchQuery(docName && docName !== 'Self' ? fullNameWithDeg : 'Self');
    setIsDoctorDropdownOpen(false);
  };

  // Filtered referrals based on search
  const filteredReferrals = references.filter((ref) => {
    if (!referralSearchQuery.trim()) return true;
    const q = referralSearchQuery.toLowerCase();
    const name = (ref.Name || ref.name || '').toLowerCase();
    const contact = String(ref.contact || '').toLowerCase();
    const id = String(ref.id || '').toLowerCase();
    return name.includes(q) || contact.includes(q) || id.includes(q);
  });

  const handleSelectReferral = (ref) => {
    const refName = ref.Name || ref.name || '';
    const refId = ref.id || '1';

    setFormData((prev) => ({
      ...prev,
      refagent: refId,
    }));

    setReferralSearchQuery(refName);
    setIsReferralDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter patient name');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        patientId: formData.patientId || patient.patientId || patient.slNo,
        slNo: formData.slNo || patient.slNo || formData.patientId,
        referedDr: formData.referedDr.trim() || 'Self',
      };

      const res = await api.post('/patients/update', payload);

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        setSuccess('Patient details updated successfully!');
        if (onPatientUpdated) {
          onPatientUpdated(res.data);
        }
        setTimeout(() => {
          onClose();
        }, 400);
      } else {
        setError(res.data?.Message || 'Failed to update patient details');
      }
    } catch (err) {
      setError(err.response?.data?.Message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" overflow="overflow-visible">
      <div className="-mt-1">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Edit Patient Details
              </h3>
              <div className="text-[11px] text-blue-700 font-mono font-bold">
                PID: #{formData.patientId}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Cancel / Close (Esc)"
          >
            <X className="w-5 h-5" />
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Top Form Row: Patient Full Name & Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Patient Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="Mr">Mr.</option>
                <option value="Mrs">Mrs.</option>
                <option value="Miss">Miss</option>
                <option value="Master">Master</option>
                <option value="Dr">Dr.</option>
                <option value="Baby">Baby</option>
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Demographic Grid: Mobile, Gender, Age & Reg Date */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Mobile Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Mobile Number</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="10-digit mobile"
                maxLength={10}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Gender <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGenderSelect(g)}
                    className={`py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      formData.gender === g
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Age & Age Unit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Age & Unit
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  name="age"
                  min="0"
                  max="130"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="e.g. 30"
                  className="w-20 px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
                <select
                  name="age_unit"
                  value={formData.age_unit}
                  onChange={handleInputChange}
                  className="flex-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Years">Years</option>
                  <option value="Months">Months</option>
                  <option value="Days">Days</option>
                </select>
              </div>
            </div>

            {/* Registration / Collection Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Collection Date</span>
              </label>
              <input
                type="date"
                name="regDate"
                value={formData.regDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Referral & Clinical Origin Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* 1. Referring Doctor with searchable dropdown */}
            <div className="relative" ref={doctorDropdownRef}>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                <span>Referring Doctor</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.referedDr}
                  onChange={(e) => {
                    handleInputChange({ target: { name: 'referedDr', value: e.target.value } });
                    setDoctorSearchQuery(e.target.value);
                    setIsDoctorDropdownOpen(true);
                  }}
                  onFocus={() => setIsDoctorDropdownOpen(true)}
                  placeholder="Search doctor or type name..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              {/* Doctor Search Dropdown Menu */}
              {isDoctorDropdownOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                  <div
                    onClick={() =>
                      handleSelectDoctor({ Name: 'Self', Deg: '', 'Doct Id': 'D1' })
                    }
                    className="p-2.5 hover:bg-blue-50/70 cursor-pointer text-xs font-bold text-slate-800 transition-colors flex items-center justify-between"
                  >
                    <span>Self (Walk-in Patient)</span>
                    <span className="text-[10px] text-slate-400">Default</span>
                  </div>

                  {filteredDoctors.map((doc, idx) => {
                    const formatted = formatDoctorWithDegree(doc);
                    return (
                      <div
                        key={doc['Doct Id'] || idx}
                        onClick={() => handleSelectDoctor(doc)}
                        className="p-2.5 hover:bg-blue-50/70 cursor-pointer text-xs transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate">
                            {doc.Name}
                          </span>
                          {doc.Deg && (
                            <span className="text-[10px] text-slate-500 block truncate flex items-center gap-1">
                              <GraduationCap className="w-2.5 h-2.5 text-indigo-500 inline shrink-0" />
                              {doc.Deg}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                          {doc['Doct Id'] || 'Dr'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Referral Agent / Organization */}
            <div className="relative" ref={referralDropdownRef}>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Referral Organization</span>
              </label>
              <select
                name="refagent"
                value={formData.refagent}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="1">Direct / Internal (Default)</option>
                {references.map((ref) => (
                  <option key={ref.id || ref.Name} value={ref.id || ref.Name}>
                    {ref.Name || ref.name || `Agent #${ref.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Center / Branch & Specimen Source */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Branch
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="1">Main Branch</option>
                  {branches.map((b) => (
                    <option key={b.id || b.Name} value={b.id || b.Name}>
                      {b.Name || b.name || `Branch ${b.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Collection
                </label>
                <select
                  name="sampleType"
                  value={formData.sampleType}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Inside">Inside (Lab)</option>
                  <option value="Outside">Outside (Home)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * Changes will be synced with upstream diagnostic records immediately.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 min-w-[130px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Patient</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
