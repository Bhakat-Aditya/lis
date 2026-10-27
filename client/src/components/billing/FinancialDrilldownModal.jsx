import React from 'react';
import Modal from '../common/Modal.jsx';
import {
  DollarSign,
  Receipt,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  Calculator,
  AlertCircle,
  Edit,
  Printer,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils.js';

export default function FinancialDrilldownModal({
  isOpen,
  onClose,
  type, // 'discount', 'roundoff', 'upi', 'cash', 'card', 'due', 'invoiced', 'collected'
  items = [],
  onOpenEditBill,
  onOpenDeposit,
  onOpenPreview,
}) {
  if (!isOpen || !type) return null;

  const configs = {
    discount: {
      title: 'Discount Ledger Breakdown',
      subtitle: 'List of all patient bills with diagnostic discounts applied',
      icon: Percent,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-200',
      filter: (p) => Number(p.discountAmount || 0) > 0,
      badgeText: 'Total Discount',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      getTotal: (list) => list.reduce((sum, p) => sum + Number(p.discountAmount || 0), 0),
    },
    roundoff: {
      title: 'Round Off Ledger Breakdown',
      subtitle: 'List of all diagnostic bills with round-off adjustments',
      icon: Calculator,
      iconColor: 'text-teal-600 bg-teal-50 border-teal-200',
      filter: (p) => Number(p.roundOff || 0) !== 0,
      badgeText: 'Net Round Off',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      getTotal: (list) => list.reduce((sum, p) => sum + Number(p.roundOff || 0), 0),
    },
    upi: {
      title: 'UPI / QR Payments Ledger',
      subtitle: 'Verified digital collections via Dynamic UPI and QR codes',
      icon: QrCode,
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
      filter: (p) => Number(p.upiPayment || 0) > 0,
      badgeText: 'Total UPI Received',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      getTotal: (list) => list.reduce((sum, p) => sum + Number(p.upiPayment || 0), 0),
    },
    cash: {
      title: 'Cash Collections Ledger',
      subtitle: 'Direct counter cash receipts recorded for diagnostic bills',
      icon: Banknote,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      filter: (p) => Number(p.cashPayment || 0) > 0,
      badgeText: 'Total Cash Received',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      getTotal: (list) => list.reduce((sum, p) => sum + Number(p.cashPayment || 0), 0),
    },
    card: {
      title: 'Card / POS Payments Ledger',
      subtitle: 'Credit and Debit card swipe transactions',
      icon: CreditCard,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      filter: (p) => Number(p.cardPayment || 0) > 0,
      badgeText: 'Total Card Received',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      getTotal: (list) => list.reduce((sum, p) => sum + Number(p.cardPayment || 0), 0),
    },
    due: {
      title: 'Outstanding Accounts Due',
      subtitle: 'Patients with pending balance due for diagnostic reports',
      icon: AlertCircle,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
      filter: (p) => Number(p.totalOutstanding || 0) > 0,
      badgeText: 'Total Due Amount',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      getTotal: (list) => list.reduce((sum, p) => sum + Number(p.totalOutstanding || 0), 0),
    },
  };

  const currentConfig = configs[type] || configs.discount;
  const filteredList = items.filter(currentConfig.filter);
  const totalAmount = currentConfig.getTotal(filteredList);
  const IconComponent = currentConfig.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" overflow="overflow-visible">
      <div className="space-y-4">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${currentConfig.iconColor}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {currentConfig.title}
              </h2>
              <p className="text-xs text-slate-500">{currentConfig.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${currentConfig.badgeColor}`}>
              {currentConfig.badgeText}: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {filteredList.length} Bill{filteredList.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Table Content */}
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <IconComponent className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold text-slate-600">No matching bills found in this period</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting the date filter to see earlier records</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">SN</th>
                  <th className="py-2.5 px-3 w-28">Barcode / SL No</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3 text-slate-500">Date</th>
                  <th className="py-2.5 px-3 text-right">Gross Bill</th>
                  {type === 'discount' && <th className="py-2.5 px-3 text-right text-purple-700">Discount</th>}
                  {type === 'roundoff' && <th className="py-2.5 px-3 text-right text-teal-700">Round Off</th>}
                  {type === 'upi' && <th className="py-2.5 px-3 text-right text-blue-700">UPI Paid</th>}
                  {type === 'cash' && <th className="py-2.5 px-3 text-right text-emerald-700">Cash Paid</th>}
                  {type === 'card' && <th className="py-2.5 px-3 text-right text-indigo-700">Card Paid</th>}
                  {type === 'due' && <th className="py-2.5 px-3 text-right text-rose-700">Balance Due</th>}
                  <th className="py-2.5 px-3 text-right text-slate-500">Net Amount</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredList.map((p, idx) => {
                  const gross = Number(p.totalBill || 0);
                  const net = Math.max(0, gross - Number(p.discountAmount || 0) - Number(p.roundOff || 0));
                  const due = Number(p.totalOutstanding || 0);

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {/* SN (1 to size) */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                        {idx + 1}
                      </td>

                      {/* Barcode / SL No (NO PATIENT ID) */}
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <span className="bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded text-[11px]">
                          {p.slNo || p.barcode || '-'}
                        </span>
                      </td>

                      {/* Patient Name */}
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {p.title ? `${p.title} ` : ''}{p.name}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDisplayDate(p.regDate || p.collectionDate)}
                      </td>

                      {/* Gross Bill */}
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                        ₹{gross.toLocaleString('en-IN')}
                      </td>

                      {/* Dynamic Target Column */}
                      {type === 'discount' && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                          (-) ₹{Number(p.discountAmount || 0).toLocaleString('en-IN')}
                        </td>
                      )}
                      {type === 'roundoff' && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700">
                          {Number(p.roundOff || 0) >= 0 ? '+' : ''}₹{Number(p.roundOff || 0).toLocaleString('en-IN')}
                        </td>
                      )}
                      {type === 'upi' && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                          ₹{Number(p.upiPayment || 0).toLocaleString('en-IN')}
                        </td>
                      )}
                      {type === 'cash' && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          ₹{Number(p.cashPayment || 0).toLocaleString('en-IN')}
                        </td>
                      )}
                      {type === 'card' && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                          ₹{Number(p.cardPayment || 0).toLocaleString('en-IN')}
                        </td>
                      )}
                      {type === 'due' && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                          ₹{due.toLocaleString('en-IN')}
                        </td>
                      )}

                      {/* Net Bill */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{net.toLocaleString('en-IN')}
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {type === 'due' ? (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                if (onOpenDeposit) onOpenDeposit(p);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                              title="Record Deposit Voucher"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>Deposit</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  if (onOpenEditBill) onOpenEditBill(p);
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title="Edit Bill"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  if (onOpenPreview) onOpenPreview(p);
                                }}
                                className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                                title="Preview Bill"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </Modal>
  );
}
