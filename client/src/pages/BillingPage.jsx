import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Receipt,
  Printer,
  PlusCircle,
  Search,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  Edit,
  Calendar,
  Percent,
  Calculator,
  QrCode,
  Banknote,
  ArrowRight,
  Filter,
  Globe,
  MoreHorizontal,
} from 'lucide-react';
import Modal from '../components/common/Modal.jsx';
import BillPreviewModal from '../components/billing/BillPreviewModal.jsx';
import EditBillModal from '../components/billing/EditBillModal.jsx';
import FinancialDrilldownModal from '../components/billing/FinancialDrilldownModal.jsx';
import {
  formatDisplayDate,
  getLocalDateString,
  shiftDateDays,
} from '../utils/dateUtils.js';

/**
 * Standard LIS payment categories: CASH, OFFLINE_UPI, CARD, ONLINE_UPI, OTHERS
 */
export const PAYMENT_MODES = ['CASH', 'OFFLINE_UPI', 'CARD', 'ONLINE_UPI', 'OTHERS'];

export const normalizePaymentCategory = (raw) => {
  const m = String(raw || '').trim().toUpperCase();
  if (m === 'CARD' || m.includes('CARD') || m.includes('POS')) return 'CARD';
  if (m === 'ONLINE_UPI' || (m.includes('ONLINE') && m.includes('UPI'))) return 'ONLINE_UPI';
  if (m === 'OFFLINE_UPI' || m === 'OFFLINE UPI' || m === 'OFFLINE-UPI' || m.includes('UPI')) return 'OFFLINE_UPI';
  if (m === 'OTHERS' || m === 'OTHER' || m.includes('OTHER')) return 'OTHERS';
  if (m === 'CASH') return 'CASH';
  if (m) return 'OTHERS';
  return 'CASH';
};

export default function BillingPage() {
  const navigate = useNavigate();

  // Date Filtering: Default is TODAY, with presets: Yesterday, Last 7 Days, and Custom (From-To)
  const todayStr = getLocalDateString();
  const [dateFilterPreset, setDateFilterPreset] = useState('today'); // 'today' | 'yesterday' | 'last7days' | 'custom'
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  const [billingPatients, setBillingPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingBillPatient, setEditingBillPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PAID, DUE
  const [depositPatient, setDepositPatient] = useState(null);
  const [previewPatient, setPreviewPatient] = useState(null);
  const [drilldownType, setDrilldownType] = useState(null); // 'discount' | 'roundoff' | 'cash' | 'offline_upi' | 'card' | 'online_upi' | 'others' | 'due' | 'upi'
  const [amount, setAmount] = useState('500');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [notification, setNotification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Handle Preset Selection
  const handleDatePreset = (preset) => {
    setDateFilterPreset(preset);
    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = shiftDateDays(todayStr, -1);
      setFromDate(yest);
      setToDate(yest);
    } else if (preset === 'last7days') {
      const past7 = shiftDateDays(todayStr, -7);
      setFromDate(past7);
      setToDate(todayStr);
    }
  };

  /**
   * Task - 8: 1st call GetPatientList then GetBillList
   * Map both lists with Patient Id and traverse using patientList only.
   */
  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [patientRes, billRes] = await Promise.all([
        api.get('/patients/list', { params: { fromDate, toDate } }),
        api.get('/billing/list', { params: { fromDate, toDate } }).catch(() => ({ data: { bills: [] } })),
      ]);

      const patientList = patientRes.data?.patients || [];
      const billList = billRes.data?.bills || [];

      // Build Map of bills by Patient Id
      const billMap = new Map();
      billList.forEach((b) => {
        const bPid = String(b['Patient Id'] || b.patientId || '').trim().toUpperCase();
        if (bPid) {
          billMap.set(bPid, b);
        }
      });

      // Traverse patientList only (ignore any extra items in billList)
      const mapped = patientList.map((p, idx) => {
        const pid = String(p.patientId || p.slNo || '').trim().toUpperCase();
        const b = billMap.get(pid) || {};

        const discountAmount = Number(b['Discount Amount'] ?? p.discount ?? 0);
        const roundOff = Number(b['Round Off'] ?? b.roundOff ?? p.roundOff ?? 0);
        const totalBill = Number(b['Total Bill'] ?? b['Total Amount'] ?? p.totalBill ?? 0);
        const totalPayment = Number(b['Total Payment'] ?? p.paidBill ?? (p.billPayStatus === 2 ? totalBill : 0));
        const totalOutstanding = Number(b['Total Outstanding'] ?? p.balance ?? Math.max(0, totalBill - totalPayment));
        const drCom = Number(b['Dr Com'] ?? 0);
        const agentCom = Number(b['Agent Com'] ?? 0);
        const paymentList = b['Payment List'] || [];
        const testList = b['Test List'] || [];
        const billName = b['Bill Name'] || 'TXN/RECEIPT';
        const billId = b['Bill Id'] || '';

        // Calculate breakdown of CASH, OFFLINE_UPI, CARD, ONLINE_UPI, OTHERS
        let cashPayment = 0;
        let offlineUpiPayment = 0;
        let cardPayment = 0;
        let onlineUpiPayment = 0;
        let othersPayment = 0;

        paymentList.forEach((pm) => {
          const amt = Number(pm.Amount || pm.amount || 0);
          const rawMode = pm['Payment Mode'] || pm.paymentMode || pm.mode || '';
          const category = normalizePaymentCategory(rawMode);

          if (category === 'CASH') cashPayment += amt;
          else if (category === 'OFFLINE_UPI') offlineUpiPayment += amt;
          else if (category === 'CARD') cardPayment += amt;
          else if (category === 'ONLINE_UPI') onlineUpiPayment += amt;
          else if (category === 'OTHERS') othersPayment += amt;
          else cashPayment += amt;
        });

        if (paymentList.length === 0 && totalPayment > 0) {
          cashPayment = totalPayment;
        }

        const upiPayment = offlineUpiPayment + onlineUpiPayment;

        return {
          ...p,
          sn: idx + 1,
          bill: b,
          discountAmount,
          roundOff,
          totalBill,
          totalPayment,
          totalOutstanding,
          drCom,
          agentCom,
          paymentList,
          testList,
          billName,
          billId,
          cashPayment,
          offlineUpiPayment,
          cardPayment,
          onlineUpiPayment,
          othersPayment,
          upiPayment,
        };
      });

      setBillingPatients(mapped);
    } catch (err) {
      console.warn('Billing fetch error:', err.message);
      setBillingPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [fromDate, toDate]);

  const handleDepositSubmit = async () => {
    if (!depositPatient) return;
    setSubmitting(true);
    try {
      await api.post('/billing/deposit', {
        patientId: depositPatient.patientId,
        amount: Number(amount),
        paymentMode: paymentMode,
      });
      setNotification(`Deposit voucher of ₹${amount} recorded for patient ${depositPatient.name} (Barcode: ${depositPatient.slNo || '-'})`);
      setDepositPatient(null);
      fetchBillingData();
      setTimeout(() => setNotification(''), 4500);
    } catch (e) {
      alert('Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter in-memory
  const filtered = useMemo(() => {
    return billingPatients.filter((p) => {
      const isPaid = p.totalBill > 0 && p.totalOutstanding <= 0 && p.totalPayment >= p.totalBill;

      if (statusFilter === 'PAID' && !isPaid) return false;
      if (statusFilter === 'DUE' && isPaid) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase().trim();
      const name = String(p.name || '').toLowerCase();
      const mobile = String(p.mobile || p.phone || '').toLowerCase();
      const slNo = String(p.slNo || '').toLowerCase();
      const doctor = String(p.referedDr || '').toLowerCase();
      const billName = String(p.billName || '').toLowerCase();

      return (
        name.includes(term) ||
        slNo.includes(term) ||
        mobile.includes(term) ||
        doctor.includes(term) ||
        billName.includes(term)
      );
    });
  }, [billingPatients, statusFilter, searchTerm]);

  // Financial aggregates across all mapped bills (5 modes: CASH, OFFLINE_UPI, CARD, ONLINE_UPI, OTHERS)
  const aggregates = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalDue = 0;
    let totalDiscount = 0;
    let totalRoundOff = 0;
    let totalCash = 0;
    let totalOfflineUpi = 0;
    let totalCard = 0;
    let totalOnlineUpi = 0;
    let totalOthers = 0;

    billingPatients.forEach((p) => {
      totalInvoiced += Number(p.totalBill || 0);
      totalCollected += Number(p.totalPayment || 0);
      totalDue += Number(p.totalOutstanding || 0);
      totalDiscount += Number(p.discountAmount || 0);
      totalRoundOff += Number(p.roundOff || 0);
      totalCash += Number(p.cashPayment || 0);
      totalOfflineUpi += Number(p.offlineUpiPayment || 0);
      totalCard += Number(p.cardPayment || 0);
      totalOnlineUpi += Number(p.onlineUpiPayment || 0);
      totalOthers += Number(p.othersPayment || 0);
    });

    return {
      totalInvoiced,
      totalCollected,
      totalDue,
      totalDiscount,
      totalRoundOff,
      totalCash,
      totalOfflineUpi,
      totalCard,
      totalOnlineUpi,
      totalOthers,
      totalUpi: totalOfflineUpi + totalOnlineUpi,
    };
  }, [billingPatients]);

  return (
    <section className="space-y-5">
      <Helmet>
        <title>Billing Management & Accounts Ledger | Lab Expert LIS</title>
        <meta
          name="description"
          content="Manage diagnostic invoices, collect patient deposits, analyze discounts, round off, and UPI/Cash reconciliation."
        />
      </Helmet>

      {/* Header & Date Controls Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Billing & Diagnostic Invoices Management
              </h1>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Ledger Desk
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Correlated patient billing with payment breakdown, discount & round-off audit
            </p>
          </div>
        </div>

        {/* Date Filters: Today, Yesterday, Last 7 Days, and Custom (From-To) */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs font-semibold">
            <button
              type="button"
              onClick={() => handleDatePreset('today')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                dateFilterPreset === 'today'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('yesterday')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                dateFilterPreset === 'yesterday'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('last7days')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                dateFilterPreset === 'last7days'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDateFilterPreset('custom');
              }}
              className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-800 font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDateFilterPreset('custom');
              }}
              className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-800 font-medium"
            />
          </div>

          <button
            onClick={fetchBillingData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all cursor-pointer disabled:opacity-50 ml-1 shadow-2xs"
            title="Refresh billing ledger"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Fetch</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification('')}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Summary KPI Divs at the top of the list (Clickable with interactive popup breakdown) */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Financial Summary & Accounts Overview
            </h2>
            <span className="text-[11px] text-slate-400 italic">
              Click on any card to view detailed bill-by-bill breakdown
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Total Bill */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                Total Invoiced
              </span>
              <div className="text-lg font-extrabold text-slate-900 font-mono">
                ₹{aggregates.totalInvoiced.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Gross billing</span>
            </div>

            {/* 2. Total Collected */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block truncate">
                Total Realized
              </span>
              <div className="text-lg font-extrabold text-emerald-600 font-mono">
                ₹{aggregates.totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-emerald-700/70 block truncate">Collected</span>
            </div>

            {/* 3. Total Due (Clickable) */}
            <button
              type="button"
              onClick={() => setDrilldownType('due')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 text-left hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block truncate">
                  Outstanding Due
                </span>
                <AlertCircle className="w-3 h-3 text-amber-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-lg font-extrabold text-amber-600 font-mono">
                ₹{aggregates.totalDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-amber-600/80 block truncate font-medium">Click to view ↗</span>
            </button>

            {/* 4. Total Discount (Clickable) */}
            <button
              type="button"
              onClick={() => setDrilldownType('discount')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 text-left hover:border-purple-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block truncate">
                  Total Discount
                </span>
                <Percent className="w-3 h-3 text-purple-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-lg font-extrabold text-purple-700 font-mono">
                ₹{aggregates.totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-purple-600/80 block truncate font-medium">Click to view ↗</span>
            </button>

            {/* 5. Total Round Off (Clickable) */}
            <button
              type="button"
              onClick={() => setDrilldownType('roundoff')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 text-left hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block truncate">
                  Total Round Off
                </span>
                <Calculator className="w-3 h-3 text-teal-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-lg font-extrabold text-teal-700 font-mono">
                ₹{aggregates.totalRoundOff.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-teal-600/80 block truncate font-medium">Click to view ↗</span>
            </button>
          </div>
        </div>

        {/* Payment Modes Breakdown (CASH, OFFLINE_UPI, CARD, ONLINE_UPI, OTHERS) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>Payment Mode Breakdown</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium border border-slate-200">Reconciliation</span>
            </h3>
            <span className="text-[11px] text-slate-400 italic">
              All 5 payment categories calculated & tracked
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. CASH */}
            <button
              type="button"
              onClick={() => setDrilldownType('cash')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 text-left hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block truncate">
                  CASH
                </span>
                <Banknote className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-lg font-extrabold text-emerald-700 font-mono">
                ₹{aggregates.totalCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-emerald-600/80 block truncate font-medium">Counter cash ↗</span>
            </button>

            {/* 2. OFFLINE_UPI */}
            <button
              type="button"
              onClick={() => setDrilldownType('offline_upi')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 text-left hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block truncate">
                  OFFLINE_UPI
                </span>
                <QrCode className="w-3 h-3 text-blue-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-lg font-extrabold text-blue-700 font-mono">
                ₹{aggregates.totalOfflineUpi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-blue-600/80 block truncate font-medium">QR code scans ↗</span>
            </button>

            {/* 3. CARD */}
            <button
              type="button"
              onClick={() => setDrilldownType('card')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 text-left hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block truncate">
                  CARD
                </span>
                <CreditCard className="w-3 h-3 text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-lg font-extrabold text-indigo-700 font-mono">
                ₹{aggregates.totalCard.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-indigo-600/80 block truncate font-medium">POS swipe / chip ↗</span>
            </button>

            {/* 4. ONLINE_UPI */}
            <button
              type="button"
              onClick={() => setDrilldownType('online_upi')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 text-left hover:border-cyan-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 block truncate">
                  ONLINE_UPI
                </span>
                <Globe className="w-3 h-3 text-cyan-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-lg font-extrabold text-cyan-700 font-mono">
                ₹{aggregates.totalOnlineUpi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-cyan-600/80 block truncate font-medium">Online gateways ↗</span>
            </button>

            {/* 5. OTHERS */}
            <button
              type="button"
              onClick={() => setDrilldownType('others')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 text-left hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block truncate">
                  OTHERS
                </span>
                <MoreHorizontal className="w-3 h-3 text-slate-600 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-lg font-extrabold text-slate-700 font-mono">
                ₹{aggregates.totalOthers.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-600/80 block truncate font-medium">Cheque / NEFT ↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List Table (Billing Centered with NO Patient ID) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Barcode, Patient Name, Doctor, Mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DUE')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'DUE'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Due
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium ml-2">
              Showing <strong>{filtered.length}</strong> bill{filtered.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Billing Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-3 px-3 w-12 text-center text-slate-500">SN</th>
                <th className="py-3 px-3 w-28 text-slate-500">Barcode / SL No</th>
                <th className="py-3 px-3 min-w-[150px]">Patient Name</th>
                <th className="py-3 px-3 min-w-[110px] text-slate-500">Bill Ref</th>
                <th className="py-3 px-3 min-w-[160px] text-slate-500">Particulars / Tests</th>
                <th className="py-3 px-3 text-right">Total Bill</th>
                <th className="py-3 px-3 text-right text-purple-700">Discount</th>
                <th className="py-3 px-3 text-right text-teal-700">Round Off</th>
                <th className="py-3 px-3 text-center text-slate-500">Mode</th>
                <th className="py-3 px-3 text-right text-emerald-700">Paid</th>
                <th className="py-3 px-3 text-right text-rose-700">Due</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span className="font-semibold text-xs">Loading correlated billing ledger...</span>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((p, idx) => {
                  const billTotal = Number(p.totalBill || 0);
                  const billPaid = Number(p.totalPayment || 0);
                  const billDue = Number(p.totalOutstanding || 0);
                  const isPaid = billTotal > 0 && billDue <= 0 && billPaid >= billTotal;
                  const isPartial = billTotal > 0 && billPaid > 0 && billDue > 0;

                  // Preview test names or particulars
                  const testCount = p.testList?.length || 0;
                  const testSummary = p.testList?.map((t) => t['Bill Particulars'] || t.name).filter(Boolean).join(', ');

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. SN (1 to size) */}
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {idx + 1}
                      </td>

                      {/* 2. Barcode / SL No (NO PATIENT ID) */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <span className="bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded text-[11px]">
                          {p.slNo || p.barcode || '-'}
                        </span>
                      </td>

                      {/* 3. Patient Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 leading-tight">
                          {p.title ? `${p.title} ` : ''}{p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {p.mobile ? `Ph: ${p.mobile}` : formatDisplayDate(p.regDate)}
                        </div>
                      </td>

                      {/* 4. Bill Ref */}
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {p.billName || 'TXN/RECEIPT'}
                        </span>
                      </td>

                      {/* 5. Particulars / Tests */}
                      <td className="py-3 px-3 text-slate-700 text-xs max-w-[200px] truncate" title={testSummary}>
                        {testCount > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                              {testCount} Test{testCount === 1 ? '' : 's'}
                            </span>
                            <span className="truncate text-slate-600 text-[11px]">{testSummary}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Diagnostic Services</span>
                        )}
                      </td>

                      {/* 6. Total Bill */}
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 text-xs font-mono">
                        ₹{billTotal.toLocaleString('en-IN')}
                      </td>

                      {/* 7. Discount */}
                      <td className="py-3 px-3 text-right font-bold text-xs font-mono">
                        {p.discountAmount > 0 ? (
                          <span className="text-purple-700">(-) ₹{Number(p.discountAmount).toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹0</span>
                        )}
                      </td>

                      {/* 8. Round Off */}
                      <td className="py-3 px-3 text-right font-bold text-xs font-mono">
                        {p.roundOff !== 0 ? (
                          <span className="text-teal-700 font-semibold">
                            {p.roundOff > 0 ? '+' : ''}₹{Number(p.roundOff).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹0</span>
                        )}
                      </td>

                      {/* 9. Payment Mode Badges (CASH, OFFLINE_UPI, CARD, ONLINE_UPI, OTHERS) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {p.cashPayment > 0 && (
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                              CASH
                            </span>
                          )}
                          {p.offlineUpiPayment > 0 && (
                            <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                              OFFLINE_UPI
                            </span>
                          )}
                          {p.cardPayment > 0 && (
                            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                              CARD
                            </span>
                          )}
                          {p.onlineUpiPayment > 0 && (
                            <span className="text-[9px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 px-1.5 py-0.5 rounded">
                              ONLINE_UPI
                            </span>
                          )}
                          {p.othersPayment > 0 && (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded">
                              OTHERS
                            </span>
                          )}
                          {p.totalPayment === 0 && (
                            <span className="text-[9px] font-medium text-slate-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* 10. Paid Amount */}
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-700 text-xs font-mono">
                        ₹{billPaid.toLocaleString('en-IN')}
                      </td>

                      {/* 11. Due Balance */}
                      <td className="py-3 px-3 text-right font-extrabold text-xs font-mono">
                        {billDue > 0 ? (
                          <span className="text-rose-600 font-bold">₹{billDue.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹0</span>
                        )}
                      </td>

                      {/* 12. Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isPartial
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : billTotal > 0
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {isPaid
                            ? 'Settled'
                            : isPartial
                            ? 'Partial'
                            : billTotal > 0
                            ? 'Due'
                            : 'Unbilled'}
                        </span>
                      </td>

                      {/* 13. Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingBillPatient(p)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-1 px-2.5 rounded-lg shadow-2xs cursor-pointer transition-all"
                            title="Edit Invoice Particulars & Rates (BILLUPDATE)"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit Bill</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDepositPatient(p);
                              const dueVal = Number(p.totalOutstanding || 0);
                              setAmount(dueVal > 0 ? String(dueVal) : (p.totalBill ? String(p.totalBill) : '500'));
                            }}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-1 px-2.5 rounded-lg shadow-2xs cursor-pointer transition-all"
                            title="Record deposit receipt"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Deposit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewPatient(p)}
                            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs py-1 px-2 rounded-lg shadow-2xs cursor-pointer transition-all"
                            title="Preview official AWS bill"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <span className="font-semibold text-xs text-slate-600 block">No billing records found</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Adjust the date range above to view invoices</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Financial Drilldown Popup Modal */}
      <FinancialDrilldownModal
        isOpen={Boolean(drilldownType)}
        onClose={() => setDrilldownType(null)}
        type={drilldownType}
        items={billingPatients}
        onOpenEditBill={(p) => setEditingBillPatient(p)}
        onOpenDeposit={(p) => {
          setDepositPatient(p);
          const dueVal = Number(p.totalOutstanding || 0);
          setAmount(dueVal > 0 ? String(dueVal) : (p.totalBill ? String(p.totalBill) : '500'));
        }}
        onOpenPreview={(p) => setPreviewPatient(p)}
      />

      {/* Deposit Modal */}
      <Modal
        isOpen={!!depositPatient}
        onClose={() => setDepositPatient(null)}
        title={`Receive Diagnostic Payment — ${depositPatient?.name}`}
      >
        <div className="space-y-4 text-xs">
          {depositPatient && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Bill</span>
                <span className="font-extrabold text-slate-800 font-mono">
                  ₹{Number(depositPatient.totalBill || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-emerald-700 block text-[10px] font-bold uppercase">Discount</span>
                <span className={`font-extrabold font-mono ${Number(depositPatient.discountAmount || 0) > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {Number(depositPatient.discountAmount || 0) > 0 ? `(-) ₹${Number(depositPatient.discountAmount).toLocaleString('en-IN')}` : '₹0'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Deposited</span>
                <span className="font-extrabold text-sky-700 font-mono">
                  ₹{Number(depositPatient.totalPayment || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-amber-100/60 rounded-lg p-1 border border-amber-200">
                <span className="text-amber-900 block text-[10px] font-bold uppercase">Remaining Due</span>
                <span className="font-extrabold text-rose-700 font-mono">
                  ₹{Number(depositPatient.totalOutstanding || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs focus:outline-none focus:bg-white"
            >
              <option value="CASH">CASH</option>
              <option value="OFFLINE_UPI">OFFLINE_UPI</option>
              <option value="CARD">CARD</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setDepositPatient(null)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDepositSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer transition-all"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Payment...</span>
                </>
              ) : (
                <span>Record Deposit Receipt</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bill Preview Modal Popup */}
      <BillPreviewModal
        isOpen={!!previewPatient}
        onClose={() => setPreviewPatient(null)}
        patientId={previewPatient?.patientId}
        patientName={previewPatient?.name}
      />

      {/* Edit Bill Modal Popup */}
      {editingBillPatient && (
        <EditBillModal
          isOpen={!!editingBillPatient}
          onClose={() => setEditingBillPatient(null)}
          patient={editingBillPatient}
          onBillUpdated={() => {
            setNotification(`Bill invoice updated for ${editingBillPatient.name}`);
            fetchBillingData();
            setTimeout(() => setNotification(''), 4500);
          }}
          onOpenDeposit={(p) => {
            setDepositPatient(p);
            const dueVal = Number(p.totalOutstanding || 0);
            setAmount(dueVal > 0 ? String(dueVal) : (p.totalBill ? String(p.totalBill) : '500'));
          }}
          onOpenPrint={(p) => setPreviewPatient(p)}
        />
      )}
    </section>
  );
}
