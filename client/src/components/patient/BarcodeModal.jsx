import React, { useState, useRef } from 'react';
import Modal from '../common/Modal.jsx';
import { Printer, CheckCircle2, Zap } from 'lucide-react';

export default function BarcodeModal({ isOpen, onClose, patient, barcodeUrls = [] }) {
  const [printStatus, setPrintStatus] = useState('');
  const [activeUrlIndex, setActiveUrlIndex] = useState(null);
  const printFrameRef = useRef(null);

  if (!patient) return null;
  const barcodeValue = patient.slNo || patient.barcode || '-';

  // Gather URLs from prop or patient object
  const urls = Array.isArray(barcodeUrls) && barcodeUrls.length > 0
    ? barcodeUrls
    : (Array.isArray(patient?.printBarCodeUrls) ? patient.printBarCodeUrls : []);

  /**
   * Invokes the desktop thermal printer protocol (lisprint://) silently
   * using a hidden <iframe> so React is never reloaded or navigated away.
   */
  const triggerProtocol = (protocolUrl, index = null) => {
    if (!protocolUrl) return;

    if (index !== null) {
      setActiveUrlIndex(index);
    }
    setPrintStatus('Sending to printer...');

    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = protocolUrl;
      document.body.appendChild(iframe);

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    } catch {
      if (printFrameRef.current) {
        printFrameRef.current.src = protocolUrl;
      } else {
        window.location.href = protocolUrl;
      }
    }

    setTimeout(() => {
      setPrintStatus('✓ Sent to printer');
      setTimeout(() => {
        setPrintStatus('');
        setActiveUrlIndex(null);
      }, 2500);
    }, 400);
  };

  /**
   * Dispatches all barcodes sequentially
   */
  const handlePrintAllBarcodes = () => {
    if (!urls.length) return;
    setPrintStatus(`Sending ${urls.length} barcode(s) to printer...`);

    urls.forEach((url, i) => {
      setTimeout(() => {
        triggerProtocol(url, i);
      }, i * 600);
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Barcode" maxWidth="max-w-md">
      <div className="space-y-4 text-xs">
        {/* Simple Patient & Barcode Info */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Patient:</span>
            <span className="font-bold text-slate-800 truncate">
              {patient.title ? `${patient.title} ` : ''}{patient.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Barcode:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              #{barcodeValue}
            </span>
          </div>
        </div>

        {/* Print Action Buttons */}
        {urls.length > 0 ? (
          <div className="space-y-2">
            {urls.length === 1 ? (
              <button
                type="button"
                onClick={() => triggerProtocol(urls[0], 0)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer ${
                  activeUrlIndex === 0
                    ? 'bg-purple-800 text-white ring-2 ring-purple-400'
                    : 'bg-purple-700 hover:bg-purple-800 active:scale-98 text-white'
                }`}
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print Barcode</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {urls.map((url, idx) => {
                    const isPrintingThis = activeUrlIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => triggerProtocol(url, idx)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                          isPrintingThis
                            ? 'bg-purple-700 text-white ring-2 ring-purple-400'
                            : 'bg-white hover:bg-purple-50 text-purple-900 border border-purple-300'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Print Barcode {idx + 1}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handlePrintAllBarcodes}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Print All Barcodes ({urls.length})</span>
                </button>
              </div>
            )}

            {/* Status Feedback */}
            {printStatus && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-3 rounded-xl animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{printStatus}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-slate-500 text-xs">
            No barcode URL available for this patient.
          </div>
        )}

        {/* Hidden Fallback Iframe for OS Protocol Trigger */}
        <iframe
          ref={printFrameRef}
          title="LIS Barcode Trigger"
          className="hidden"
          style={{ display: 'none' }}
        />

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
