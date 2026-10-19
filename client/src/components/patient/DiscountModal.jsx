import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { MinusCircle } from 'lucide-react';

export default function DiscountModal({ isOpen, onClose, patient, onDiscountApplied }) {
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percent'
  const [discountVal, setDiscountVal] = useState('100');
  const [reason, setReason] = useState('Doctor Recommended');

  if (!patient) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onDiscountApplied) {
      onDiscountApplied({
        type: discountType,
        value: Number(discountVal),
        reason,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Apply Clinical Discount — ${patient.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDiscountType('flat')}
              className={`py-2 px-3 rounded font-bold border transition-colors cursor-pointer ${
                discountType === 'flat'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              Flat Amount (₹)
            </button>
            <button
              type="button"
              onClick={() => setDiscountType('percent')}
              className={`py-2 px-3 rounded font-bold border transition-colors cursor-pointer ${
                discountType === 'percent'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-600'
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
            max={discountType === 'percent' ? 100 : 10000}
            value={discountVal}
            onChange={(e) => setDiscountVal(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-sm text-slate-900 focus:outline-none focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Reason / Authorization</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:bg-white"
            placeholder="e.g. Doctor Concession, Camp Privilege..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Apply Discount</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
