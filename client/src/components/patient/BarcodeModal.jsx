import React from 'react';
import Modal from '../common/Modal.jsx';
import { QrCode, Printer } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils.js';

export default function BarcodeModal({ isOpen, onClose, patient }) {
  if (!patient) return null;
  const pid = patient.patientId || patient.slNo || '37653';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Specimen Barcode & Token Label">
      <div className="space-y-4 text-xs">
        {/* Printable Barcode Card */}
        <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-lg text-center space-y-2 max-w-xs mx-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            NEW LIFE CARE DIAGNOSTIC
          </div>
          <div className="font-extrabold text-sm text-slate-900">
            {patient.title ? `${patient.title} ` : ''}{patient.name}
          </div>
          <div className="text-xs font-semibold text-slate-600">
            PID: #{pid} • {patient.gender || 'Male'} / {patient.age || '1'} {patient.age_unit || 'Days'}
          </div>

          {/* Simulated Barcode Lines */}
          <div className="py-2 flex flex-col items-center justify-center">
            <div className="h-12 w-48 flex items-stretch justify-center gap-0.5 bg-white p-1">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 1, 3, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3].map((w, idx) => (
                <div
                  key={idx}
                  className="bg-black h-full"
                  style={{ width: `${w * 1.5}px` }}
                />
              ))}
            </div>
            <div className="font-mono text-xs font-extrabold tracking-widest text-slate-800 mt-1">
              *{pid}*
            </div>
          </div>

          <div className="text-[10px] text-slate-400">
            Collection: {formatDisplayDate(patient.collectionDate || patient.regDate)} • Center: {patient.center || 'Main'}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Label</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
