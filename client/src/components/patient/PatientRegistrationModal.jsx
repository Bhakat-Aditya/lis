import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import api from '../../services/api';
import { useMaster } from '../../context/context.master.jsx';
import { UserPlus, Check } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils.js';

export default function PatientRegistrationModal({ isOpen, onClose, onPatientAdded }) {
  const { doctors, branches, references } = useMaster();

  const [formData, setFormData] = useState({
    slNo: `${Date.now()}`.slice(-9),
    title: 'Mr',
    name: '',
    mobile: '',
    regDate: getLocalDateString(),
    gender: 'Male',
    age: '28',
    age_unit: 'Years',
    sampleType: 'Inside',
    referedDr: 'Self',
    referDr: 'D1',
    refagent: '1',
    branch: '1',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'referDr') {
        const found = doctors.find((d) => String(d['Doct Id']) === String(value));
        if (found) updated.referedDr = found.Name;
      }
      return updated;
    });
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
      const res = await api.post('/patients/add', formData);
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
    <Modal isOpen={isOpen} onClose={onClose} title="New Patient Registration" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Title */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Title</label>
            <select
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white"
            >
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Miss">Miss</option>
              <option value="Master">Master</option>
              <option value="Baby">Baby</option>
              <option value="B/O">B/O (Baby of)</option>
              <option value="Dr">Dr</option>
            </select>
          </div>

          {/* Full Name */}
          <div className="md:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">
              Patient Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Sandip Patra"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Mobile */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              placeholder="10-digit number"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Age & Unit */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Age & Unit</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-medium"
              />
              <select
                name="age_unit"
                value={formData.age_unit}
                onChange={handleChange}
                className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Years">Years</option>
                <option value="Months">Months</option>
                <option value="Days">Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Referred Doctor */}
          <div className="md:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Referred By Doctor</label>
            <select
              name="referDr"
              value={formData.referDr}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white font-medium"
            >
              <option value="D1">Self / Walk-in</option>
              {doctors.map((doc, idx) => (
                <option key={doc['Doct Id'] || idx} value={doc['Doct Id']}>
                  {doc.Name} {doc.Deg ? `(${doc.Deg})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Collection Type */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Sample Collection</label>
            <select
              name="sampleType"
              value={formData.sampleType}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="Inside">Inside Lab</option>
              <option value="Outside">Outside Collection</option>
              <option value="Home Visit">Home Collection</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Branch */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Center Branch</label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="1">1 - Midnapore</option>
              <option value="2">2 - Kolkata</option>
            </select>
          </div>

          {/* Registration Date */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Registration Date</label>
            <input
              type="date"
              name="regDate"
              value={formData.regDate}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Sample Serial No */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Serial / Barcode No</label>
            <input
              type="text"
              name="slNo"
              value={formData.slNo}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
            />
          </div>
        </div>

        {/* Action Buttons with Vibrant Colors */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Registering...' : 'Register Patient'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
