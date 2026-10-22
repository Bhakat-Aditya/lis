import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { MinusCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api.js';

export default function DiscountModal({ isOpen, onClose, patient, onDiscountApplied }) {
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percent'
  const [discountVal, setDiscountVal] = useState('100');
  const [reason, setReason] = useState('Doctor Recommended');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!patient) return null;

  const rawPid = patient.patientId || patient.slNo || '';
  const cleanPid = rawPid
    ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
    : '';

  const grossTotal = Number(patient.grossTotal || patient.totalBill || 0);
  const val = Number(discountVal) || 0;
  const calculatedDiscount = discountType === 'percent'
    ? Math.round(((grossTotal * Math.min(100, Math.max(0, val))) / 100) * 100) / 100
    : Math.min(grossTotal, Math.max(0, val));
  const newNetBill = Math.max(0, grossTotal - calculatedDiscount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cleanPid) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/billing/discount', {
        patientId: cleanPid,
        discountType,
        discountValue: Number(discountVal),
        reason,
      });

      if (onDiscountApplied) {
        onDiscountApplied({
          type: discountType,
          value: calculatedDiscount,
          reason,
          message: res.data?.Message,
          data: res.data,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to apply discount:', err);
      setErrorMsg(err.response?.data?.Message || 'Failed to apply discount on server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Apply Clinical Discount — ${patient.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Bill Overview Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">Total Amount</span>
            <span className="font-mono font-bold text-slate-800 text-xs">₹{grossTotal.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">Discount Deducted</span>
            <span className="font-mono font-bold text-rose-600 text-xs">(-) ₹{calculatedDiscount.toFixed(2)}</span>
          </div>
          <div className="bg-emerald-50 rounded-lg p-1 border border-emerald-200">
            <span className="text-[10px] text-emerald-800 font-bold block">New Net Bill</span>
            <span className="font-mono font-extrabold text-emerald-700 text-xs">₹{newNetBill.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDiscountType('flat');
                setDiscountVal('100');
              }}
              className={`py-2 px-3 rounded-xl font-bold border transition-colors cursor-pointer ${
                discountType === 'flat'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Flat Amount (₹)
            </button>
            <button
              type="button"
              onClick={() => {
                setDiscountType('percent');
                setDiscountVal('10');
              }}
              className={`py-2 px-3 rounded-xl font-bold border transition-colors cursor-pointer ${
                discountType === 'percent'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Percentage (%)
            </button>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {discountType === 'flat' ? 'Discount Amount (₹)' : 'Discount Percentage (%)'}
          </label>
          <input
            type="number"
            min="0"
            max={discountType === 'percent' ? 100 : grossTotal || 10000}
            value={discountVal}
            onChange={(e) => setDiscountVal(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-extrabold text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            required
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Select:</span>
            {discountType === 'flat' ? (
              [50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDiscountVal(String(amt))}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                >
                  ₹{amt}
                </button>
              ))
            ) : (
              [5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountVal(String(pct))}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                >
                  {pct}%
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Reason / Authorization</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="e.g. Doctor Concession, Camp Privilege..."
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold text-xs">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <MinusCircle className="w-3.5 h-3.5" />
            )}
            <span>{submitting ? 'Applying Discount...' : `Apply ₹${calculatedDiscount.toFixed(2)} Discount`}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
