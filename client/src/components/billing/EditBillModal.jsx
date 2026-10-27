import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal.jsx';
import api from '../../services/api.js';
import {
  Receipt,
  Plus,
  Trash2,
  Save,
  Loader2,
  Printer,
  DollarSign,
  AlertCircle,
  CheckCircle,
  X,
  CreditCard,
  PlusCircle,
} from 'lucide-react';

export default function EditBillModal({
  isOpen,
  onClose,
  patient,
  onBillUpdated,
  onOpenDeposit,
  onOpenPrint,
}) {
  const [headingName, setHeadingName] = useState('TXN/RECEIPT');
  const [items, setItems] = useState([]);
  const [discountPercent, setDiscountPercent] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [discountMode, setDiscountMode] = useState('percent'); // 'percent' | 'flat'
  const [roundoff, setRoundoff] = useState('0');
  const [isManualRoundoff, setIsManualRoundoff] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch patient's existing bill data from upstream GETBILLJSON
  useEffect(() => {
    if (!isOpen || !patient) return;

    let isMounted = true;
    setLoading(true);
    setError('');
    setSuccess('');

    const loadBillData = async () => {
      try {
        const rawPid = patient.patientId || patient.id;
        const cleanPid = rawPid
          ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
          : '';

        let billJson = null;
        try {
          const res = await api.get('/billing/bill-json', {
            params: { patientId: cleanPid || rawPid },
          });
          billJson = res.data?.payLoadJSON?.bill || null;
        } catch (e) {
          console.warn('[EditBill] bill-json error:', e.message);
        }

        if (!isMounted) return;

        let parsedItems = [];
        let billHeading = 'TXN/RECEIPT';
        let discPct = '0';
        let discAmt = '0';
        let roundoffVal = '0';
        let manualRo = false;

        if (billJson) {
          billHeading = billJson['Bill Name'] || billJson['billname'] || 'TXN/RECEIPT';
          discAmt = String(billJson['Discount'] || billJson['discamt'] || '0');
          roundoffVal = String(billJson['Round Off'] || billJson['roundoff'] || '0');
          manualRo = roundoffVal !== '0' && roundoffVal !== '0.00' && Boolean(roundoffVal);

          const rawList = billJson['Test List'] || [];
          if (Array.isArray(rawList) && rawList.length > 0) {
            parsedItems = rawList
              .filter((t) => t && String(t['Bill Particulars'] || t.name || '').trim() !== '')
              .map((t, idx) => ({
                id: idx + 1,
                name: t['Bill Particulars'] || t.name || '',
                amount: t.Amount !== undefined ? String(t.Amount) : (t.amount !== undefined ? String(t.amount) : '0'),
                date: t['Bill Date'] || t.date || '',
              }));
          }
        }

        // If no items in bill JSON yet, fallback to patient report test items
        if (parsedItems.length === 0) {
          try {
            const invoiceRes = await api.get('/billing/invoice', {
              params: { patientId: cleanPid || rawPid },
            });
            const invData = invoiceRes.data;
            if (Array.isArray(invData?.items) && invData.items.length > 0) {
              parsedItems = invData.items
                .filter((it) => it && String(it.testName || it.name || '').trim() !== '')
                .map((it, idx) => ({
                  id: idx + 1,
                  name: it.testName || it.name || '',
                  amount: String(it.rate !== undefined ? it.rate : (it.amount || 0)),
                  date: '',
                }));
            }
          } catch (err) {
            console.warn('[EditBill] invoice fallback error:', err.message);
          }
        }

        // If completely empty, supply at least 1 row to edit
        if (parsedItems.length === 0) {
          parsedItems.push({
            id: 1,
            name: '',
            amount: '',
            date: '',
          });
        }

        setHeadingName(billHeading);
        setItems(parsedItems);
        setDiscountAmount(discAmt);
        setRoundoff(roundoffVal);
        setIsManualRoundoff(manualRo);
      } catch (err) {
        if (isMounted) setError('Failed to load bill details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBillData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, patient]);

  // Real-time Financial Calculations
  const grossTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const val = parseFloat(item.amount);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [items]);

  // Recalculate discount
  const computedDiscountAmount = useMemo(() => {
    if (discountMode === 'percent') {
      const pct = parseFloat(discountPercent) || 0;
      return Math.round(((grossTotal * Math.min(100, Math.max(0, pct))) / 100) * 100) / 100;
    }
    const flat = parseFloat(discountAmount) || 0;
    return Math.min(grossTotal, Math.max(0, flat));
  }, [grossTotal, discountPercent, discountAmount, discountMode]);

  const computedRoundoff = useMemo(() => {
    if (isManualRoundoff) {
      const customRo = parseFloat(roundoff);
      return isNaN(customRo) ? 0 : customRo;
    }
    const remainder = grossTotal - computedDiscountAmount;
    if (remainder <= 0) return 0;
    const rounded = Math.round(remainder);
    return Math.round((remainder - rounded) * 100) / 100;
  }, [grossTotal, computedDiscountAmount, roundoff, isManualRoundoff]);

  const netBillAmount = useMemo(() => {
    const net = grossTotal - computedDiscountAmount - computedRoundoff;
    return Math.max(0, Math.round(net));
  }, [grossTotal, computedDiscountAmount, computedRoundoff]);

  const handleAutoRoundoff = () => {
    setIsManualRoundoff(false);
    const remainder = grossTotal - computedDiscountAmount;
    if (remainder <= 0) {
      setRoundoff('0');
      return;
    }
    const rounded = Math.round(remainder);
    const autoRo = Math.round((remainder - rounded) * 100) / 100;
    setRoundoff(String(autoRo));
  };

  const handleZeroRoundoff = () => {
    setIsManualRoundoff(true);
    setRoundoff('0');
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: '',
        amount: '',
        date: '',
      },
    ]);
  };

  const handleRemoveItemRow = (index) => {
    setItems((prev) => {
      if (prev.length <= 1) {
        return [{ id: 1, name: '', amount: '', date: '' }];
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSaveBill = async (e) => {
    if (e) e.preventDefault();
    if (!patient) return;

    // Filter out completely blank rows
    const validItems = items.filter(
      (item) => String(item.name || '').trim() !== '' || parseFloat(item.amount) > 0
    );

    if (validItems.length === 0) {
      setError('Please add at least one test / bill particular');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const rawPid = patient.patientId || patient.id;
      const cleanPid = rawPid
        ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
        : '';

      const today = new Date();
      const d = String(today.getDate()).padStart(2, '0');
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const y = today.getFullYear();
      const formattedDate = `${d}/${m}/${y}`;

      const payload = {
        patientId: cleanPid || rawPid,
        isNew: '0',
        action: 'addbill',
        billname: headingName.trim() || 'TXN/RECEIPT',
        items: validItems.map((item) => ({
          name: item.name.trim(),
          amount: parseFloat(item.amount) || 0,
          date: item.date || formattedDate,
        })),
        totalamt: grossTotal,
        discountPercent: discountMode === 'percent' ? parseFloat(discountPercent) || 0 : 0,
        discountAmount: computedDiscountAmount,
        roundoff: computedRoundoff,
        billamount: netBillAmount,
      };

      const res = await api.post('/billing/update-bill', payload);

      const isSuccess =
        res.data?.STATUS === 'SUCCESS' &&
        (res.data?.StatusCode === '0000' || !res.data?.StatusCode) &&
        res.data?.STATUS !== 'FAILED' &&
        res.data?.STATUS !== 'ERROR';

      if (isSuccess) {
        setSuccess('Bill invoice updated successfully via BILLUPDATE!');
        if (onBillUpdated) onBillUpdated(res.data);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setError(res.data?.Message || 'Failed to update invoice bill (BILLUPDATE returned failure)');
      }
    } catch (err) {
      setError(err.response?.data?.Message || err.message || 'Server error while updating invoice');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" overflow="overflow-visible">
      <div className="-mt-1 space-y-4">
        {/* Header with Top Action Buttons matching Screenshot */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-2">
                <span>👤+ Edit Bill</span>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Barcode: #{patient?.slNo || patient?.barcode || '-'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Patient: <strong className="text-slate-800">{patient?.name}</strong> • Modifying invoice particulars
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Collect Payment & Receipt Print */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenDeposit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDeposit(patient);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                title="Record payment deposit"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Collect Payment</span>
              </button>
            )}

            {onOpenPrint && (
              <button
                type="button"
                onClick={() => onOpenPrint(patient)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                title="Print official diagnostic receipt"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Receipt Print</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Loading patient invoice details...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveBill} className="space-y-4 text-xs">
            {/* Heading Name Box matching Screenshot */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Heading Name
              </label>
              <input
                type="text"
                value={headingName}
                onChange={(e) => setHeadingName(e.target.value)}
                placeholder="TXN/RECEIPT"
                className="w-full sm:w-96 px-3.5 py-2 text-sm font-extrabold text-slate-900 bg-white border-2 border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all shadow-2xs font-mono uppercase"
                required
              />
            </div>

            {/* Particulars & Amounts Table (Middle Date Column REMOVED per user request) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                <span className="flex-1">Test / Bill Particulars</span>
                <span className="w-44 text-right pr-9">Amount (₹)</span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    {/* Item Name Input (Blue Outline Box matching Screenshot) */}
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="Enter test / bill particular name"
                      className="flex-1 px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border-2 border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-2xs"
                    />

                    {/* Amount Input (Light Yellow Background + Green Outline Box matching Screenshot) */}
                    <div className="relative w-44 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 text-xs font-extrabold font-mono text-slate-900 bg-[#fef9c3] border-2 border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all shadow-2xs text-right"
                      />
                    </div>

                    {/* Delete Row Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Remove line item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Line Button */}
              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 font-bold text-xs transition-all cursor-pointer mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Particular / Test</span>
              </button>
            </div>

            {/* Bottom Row: Billing Summary Box matching Screenshot */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-3 border-t border-slate-100">
              {/* Quick Discount & Round Off Panel */}
              <div className="w-full sm:w-88 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Adjustment / Concession
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={handleAutoRoundoff}
                      className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        !isManualRoundoff
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title="Automatically round to nearest whole rupee"
                    >
                      Auto Round
                    </button>
                    <button
                      type="button"
                      onClick={handleZeroRoundoff}
                      className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        isManualRoundoff && (roundoff === '0' || parseFloat(roundoff) === 0)
                          ? 'bg-slate-700 text-white shadow-2xs'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title="Set round off to 0"
                    >
                      Zero
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => {
                        setDiscountPercent(e.target.value);
                        setDiscountMode('percent');
                      }}
                      className="w-full px-2 py-1 text-xs font-bold font-mono border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Discount ₹</label>
                    <input
                      type="number"
                      min="0"
                      value={discountMode === 'percent' ? computedDiscountAmount : discountAmount}
                      onChange={(e) => {
                        setDiscountAmount(e.target.value);
                        setDiscountMode('flat');
                      }}
                      className="w-full px-2 py-1 text-xs font-bold font-mono border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Round Off ₹</label>
                    <input
                      type="number"
                      step="0.01"
                      value={isManualRoundoff ? roundoff : computedRoundoff}
                      onChange={(e) => {
                        setRoundoff(e.target.value);
                        setIsManualRoundoff(true);
                      }}
                      placeholder="0.00"
                      className="w-full px-2 py-1 text-xs font-bold font-mono border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Summary Box matching Image 2 */}
              <div className="w-full sm:w-80 bg-white border border-slate-200 shadow-xs rounded-2xl p-3.5 space-y-2.5 ml-auto">
                <div className="text-center text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center justify-center gap-1.5">
                  <span>▬</span>
                  <span>BILLING SUMMARY</span>
                  <span>▬</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-blue-600 text-white font-black text-[11px] rounded-lg tracking-wider uppercase shrink-0">
                    TOTAL AMOUNT
                  </span>
                  <div className="flex-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-right font-extrabold font-mono text-sm text-blue-900">
                    ₹ {grossTotal.toFixed(2)}
                  </div>
                </div>

                {computedDiscountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                    <span>Discount</span>
                    <span className="font-mono font-bold text-rose-600">
                      - ₹ {computedDiscountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <div className="flex items-center gap-1.5">
                    <span>Round Off</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      !isManualRoundoff ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {!isManualRoundoff ? 'Auto' : 'Manual'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-700">
                    {computedRoundoff !== 0
                      ? (computedRoundoff > 0 ? `- ₹ ${computedRoundoff.toFixed(2)}` : `+ ₹ ${Math.abs(computedRoundoff).toFixed(2)}`)
                      : '₹ 0.00'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 px-1 font-bold">
                  <span className="text-xs text-slate-800">Net Payable</span>
                  <span className="text-base font-extrabold font-mono text-emerald-700">
                    ₹ {netBillAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Bill (BILLUPDATE)...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Bill</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
