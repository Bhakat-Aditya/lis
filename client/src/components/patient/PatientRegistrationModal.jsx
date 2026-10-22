import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal.jsx';
import api from '../../services/api';
import { useMaster } from '../../context/context.master.jsx';
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
} from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils.js';

export default function PatientRegistrationModal({ isOpen, onClose, onPatientAdded }) {
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
        referedDr: 'Self',
        referDr: 'D1',
        refagent: '1',
        branch: '1',
      });
      setDoctorSearchQuery('');
      setReferralSearchQuery('');
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

  // Filtered doctors based on search
  const filteredDoctors = doctors.filter((doc) => {
    if (!doctorSearchQuery.trim()) return true;
    const q = doctorSearchQuery.toLowerCase();
    const name = (doc.Name || '').toLowerCase();
    const deg = (doc.Deg || '').toLowerCase();
    const id = String(doc['Doct Id'] || '').toLowerCase();
    return name.includes(q) || deg.includes(q) || id.includes(q);
  });

  // When a doctor is selected from commission search:
  // Auto-fill Refer Doctor text field, set referDr ID, and update search input
  const handleSelectDoctor = (doc) => {
    const docName = doc.Name || 'Self';
    const docId = doc['Doct Id'] || 'D1';

    setFormData((prev) => ({
      ...prev,
      referDr: docId,
      referedDr: docName, // Automatically updates Refer Doctor text box!
    }));

    setDoctorSearchQuery(doc.Name ? `${doc.Name}${doc.Deg ? ` (${doc.Deg})` : ''}` : '');
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

    try {
      // Auto-assign slNo if left blank
      const payload = {
        ...formData,
        slNo: formData.slNo.trim() || `${Date.now()}`.slice(-9),
        referedDr: formData.referedDr.trim() || 'Self',
      };

      const res = await api.post('/patients/add', payload);
      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        if (onPatientAdded) onPatientAdded(res.data);
        onClose();
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
      <div className="-mt-1">
        {/* Header matching screenshot */}
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
            <span>Add New Patient</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: BarCode Serial | Mobile Number | Collection Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. BarCode Serial */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                BarCode Serial
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="slNo"
                  placeholder="Leave Blank for Auto"
                  value={formData.slNo}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-500/80 rounded-lg text-xs font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            {/* 2. Mobile Number */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="mobile"
                  placeholder="10-digit number"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>

            {/* 3. Collection Date */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Collection Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  name="regDate"
                  value={formData.regDate}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Title | Patient Name | Sample Type Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 4. Title (Auto-changes Gender) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Title
              </label>
              <select
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
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

            {/* 5. Patient Name */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Patient Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>

            {/* 6. Sample Type Toggle Switch */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Sample Type
              </label>
              <div className="flex items-center gap-2.5 py-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      sampleType: prev.sampleType === 'Outside' ? 'Inside' : 'Outside',
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.sampleType === 'Outside' ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={formData.sampleType === 'Outside'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.sampleType === 'Outside' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-medium text-slate-700 select-none">
                  Outside Sample
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Age & Unit | Gender (Box Clicking) | Refer Doctor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 7. Age */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Age
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-1/2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
                <select
                  name="age_unit"
                  value={formData.age_unit}
                  onChange={handleInputChange}
                  className="w-1/2 px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                >
                  <option value="Years">Years</option>
                  <option value="Months">Months</option>
                  <option value="Days">Days</option>
                </select>
              </div>
            </div>

            {/* 8. Gender (Segmented Clickable Boxes - NO DROPDOWN) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Gender
              </label>
              <div className="flex rounded-lg border border-slate-300 overflow-hidden divide-x divide-slate-300 shadow-2xs">
                {['Male', 'Female', 'Transgender'].map((g) => {
                  const isSelected = formData.gender.toLowerCase() === g.toLowerCase();
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGenderSelect(g)}
                      className={`flex-1 py-2 px-1 text-center font-bold text-xs transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-inner'
                          : 'bg-white text-blue-700 hover:bg-slate-50 font-semibold'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 9. Refer Doctor (Free text name printed on reports) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Refer Doctor
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="referedDr"
                  placeholder="Doctor Name"
                  value={formData.referedDr}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Doctor For Commission (Searchable Combobox) | Referral | Collection Center */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 10. Doctor For Commission (Searchable Autocomplete) */}
            <div className="relative" ref={doctorDropdownRef}>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Doctor For Commission
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type initials to search doctor..."
                  value={doctorSearchQuery}
                  onFocus={() => setIsDoctorDropdownOpen(true)}
                  onChange={(e) => {
                    setDoctorSearchQuery(e.target.value);
                    setIsDoctorDropdownOpen(true);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              {/* Autocomplete Dropdown List - Opens UPWARDS so it never clips at modal bottom */}
              {isDoctorDropdownOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-slate-300 rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                    Select Doctor For Commission
                  </div>
                  <div
                    onClick={() => handleSelectDoctor({ 'Doct Id': 'D1', Name: 'Self' })}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs font-semibold text-slate-700 flex justify-between items-center"
                  >
                    <span>Self / Walk-in</span>
                    <span className="text-[10px] text-slate-400 font-mono">D1</span>
                  </div>

                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doc, idx) => (
                      <div
                        key={doc['Doct Id'] || idx}
                        onClick={() => handleSelectDoctor(doc)}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs text-slate-800 flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold">{doc.Name}</span>
                          {doc.Deg && (
                            <span className="text-[11px] text-slate-500 ml-1.5">
                              ({doc.Deg})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          {doc['Doct Id']}
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

            {/* 11. Referral (Searchable Autocomplete & Free Typing) */}
            <div className="relative" ref={referralDropdownRef}>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Referral
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type initials to search referral..."
                  value={referralSearchQuery}
                  onFocus={() => setIsReferralDropdownOpen(true)}
                  onChange={(e) => {
                    setReferralSearchQuery(e.target.value);
                    setFormData((prev) => ({ ...prev, refagent: e.target.value }));
                    setIsReferralDropdownOpen(true);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              {/* Referral Dropdown List - Opens UPWARDS so it never clips at modal bottom */}
              {isReferralDropdownOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-slate-300 rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                    Select Referral Agent / Partner
                  </div>
                  <div
                    onClick={() => handleSelectReferral({ id: '1', Name: 'Direct' })}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs font-semibold text-slate-700 flex justify-between items-center"
                  >
                    <span>Direct / Main</span>
                    <span className="text-[10px] text-slate-400 font-mono">1</span>
                  </div>

                  {filteredReferrals.length > 0 ? (
                    filteredReferrals.map((ref, idx) => (
                      <div
                        key={ref.id || idx}
                        onClick={() => handleSelectReferral(ref)}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs text-slate-800 flex justify-between items-center"
                      >
                        <span className="font-bold">{ref.Name || ref.name}</span>
                        {ref.contact && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ref.contact}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-slate-400 italic text-xs">
                      Press enter to use custom referral: "{referralSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 12. Collection Center */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Collection Center
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
              >
                <option value="1">Main</option>
                {branches.map((b) => (
                  <option key={b.branchId || b.id} value={b.branchId || b.id}>
                    {b.name || `Branch ${b.branchId}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bottom Action Footer matching Screenshot */}
          <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0b172a] hover:bg-slate-800 active:scale-95 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Add Patient</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
