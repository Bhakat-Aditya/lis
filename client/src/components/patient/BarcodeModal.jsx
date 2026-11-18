import React, { useState, useRef } from 'react';
import Modal from '../common/Modal.jsx';
import { Printer, CheckCircle2, Tag, Copy, ExternalLink, Zap } from 'lucide-react';
import { formatDisplayDate, formatAgeDisplay } from '../../utils/dateUtils.js';

const formatGender = (raw) => {
  const s = String(raw || '').trim().toLowerCase();
  if (s.startsWith('m')) return 'Male';
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('t') || s.startsWith('o')) return 'Transgender';
  return raw || 'Male';
};

// Try to extract readable tube/specimen hint (e.g., EDTA, CLOT, SERUM) from Base64 TSPL commands
const getLabelHint = (url, index) => {
  try {
    const raw = url.split('data=')[1];
    if (!raw) return `Label #${index + 1}`;
    const decoded = atob(decodeURIComponent(raw));
    const sampleMatches = decoded.match(/-([A-Z0-9_]{3,12})/g);
    if (sampleMatches && sampleMatches.length > 0) {
      const types = Array.from(new Set(sampleMatches.map((s) => s.replace(/^-+/, ''))));
      return `Label #${index + 1} (${types.join(', ')})`;
    }
  } catch (e) {
    // fallback
  }
  return `Barcode Label #${index + 1}`;
};

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
    setPrintStatus('Dispatched to thermal barcode printer...');

    try {
      // Create and inject a transient hidden iframe to trigger OS protocol handshake
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = protocolUrl;
      document.body.appendChild(iframe);

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    } catch (e) {
      // Fallback
      if (printFrameRef.current) {
        printFrameRef.current.src = protocolUrl;
      } else {
        window.location.href = protocolUrl;
      }
    }

    setTimeout(() => {
      setPrintStatus('✓ Command sent to LisBarcodePrinter!');
      setTimeout(() => {
        setPrintStatus('');
        setActiveUrlIndex(null);
      }, 3000);
    }, 500);
  };

  /**
   * Dispatches all barcodes sequentially (e.g. for EDTA, CLOT, URINE)
   */
  const handlePrintAllBarcodes = () => {
    if (!urls.length) return;
    setPrintStatus(`Sending ${urls.length} barcode(s) to thermal printer...`);

    urls.forEach((url, i) => {
      setTimeout(() => {
        triggerProtocol(url, i);
      }, i * 700);
    });
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Specimen Barcode & Token Label">
      <div className="space-y-4 text-xs">
        {/* Printable Barcode Card Preview */}
        <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-2 max-w-xs mx-auto shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            NEW LIFE CARE DIAGNOSTIC
          </div>
          <div className="font-extrabold text-sm text-slate-900">
            {patient.title ? `${patient.title} ` : ''}{patient.name}
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Barcode: #{barcodeValue} • {formatGender(patient.gender)} / {formatAgeDisplay(patient.age, patient.age_unit || 'Years')}
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
              *{barcodeValue}*
            </div>
          </div>

          <div className="text-[10px] text-slate-400">
            {patient.sampleTime ? `Collection: ${patient.sampleTime}` : `Reg: ${formatDisplayDate(patient.regDate || patient.collectionDate)}`} • Center: {patient.center || 'Main'}
          </div>
        </div>

        {/* 1. Thermal Printer Handshake (lisprint:// protocol buttons) */}
        {urls.length > 0 ? (
          <div className="bg-purple-50/70 border border-purple-200/90 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-purple-900 font-extrabold text-xs">
                <Tag className="w-4 h-4 text-purple-700" />
                <span>Thermal Label Printer ({urls.length} Label{urls.length === 1 ? '' : 's'} Ready)</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                lisprint://
              </span>
            </div>

            <p className="text-[11px] text-purple-800 leading-relaxed">
              Click below to trigger the direct OS label printer (<span className="font-mono font-semibold">LisBarcodePrinter.jar</span>) without refreshing the portal:
            </p>

            {/* Individual Label Buttons (up to 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {urls.map((url, idx) => {
                const labelText = getLabelHint(url, idx);
                const isPrintingThis = activeUrlIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => triggerProtocol(url, idx)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer text-left ${
                      isPrintingThis
                        ? 'bg-purple-700 text-white ring-2 ring-purple-400'
                        : 'bg-white hover:bg-purple-100/70 text-purple-900 border border-purple-300'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">{labelText}</span>
                  </button>
                );
              })}

              {/* Print All Button (if multiple labels exist) */}
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrintAllBarcodes}
                  className="sm:col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Print All {urls.length} Barcodes at Once</span>
                </button>
              )}
            </div>

            {/* Status Feedback */}
            {printStatus && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-900 bg-purple-100/80 px-2.5 py-1.5 rounded-lg border border-purple-200 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{printStatus}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-slate-500 text-[11px]">
            No direct thermal <span className="font-mono font-semibold">lisprint://</span> URLs returned yet for this patient. You can use standard sheet print below.
          </div>
        )}

        {/* Hidden Fallback Iframe for OS Protocol Trigger */}
        <iframe
          ref={printFrameRef}
          title="LIS Barcode Trigger"
          className="hidden"
          style={{ display: 'none' }}
        />

        {/* Modal Footer Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          
          <button
            onClick={handleBrowserPrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Print via standard browser printer dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Browser Print Sheet</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
