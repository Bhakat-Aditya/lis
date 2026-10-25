import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Modal from '../components/common/Modal.jsx';
import BillPreviewModal from '../components/billing/BillPreviewModal.jsx';
import { formatDisplayDate, sortPatientsByRecent } from '../utils/dateUtils.js';

export default function BillingPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PAID, DUE
  const [depositPatient, setDepositPatient] = useState(null);
  const [previewPatient, setPreviewPatient] = useState(null);
  const [amount, setAmount] = useState('500');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notification, setNotification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBillingList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/list', { params: { allDates: 'true' } });
      setPatients(res.data?.patients || []);
    } catch (err) {
      console.warn('Billing list error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingList();
  }, []);

  const handleDepositSubmit = async () => {
    if (!depositPatient) return;
    setSubmitting(true);
    try {
      await api.post('/billing/deposit', {
        patientId: depositPatient.patientId,
        amount: Number(amount),
        paymentMode: paymentMode,
      });
      setNotification(`Deposit voucher of ₹${amount} recorded for patient ${depositPatient.name} (#${depositPatient.patientId})`);
      setDepositPatient(null);
      fetchBillingList();
      setTimeout(() => setNotification(''), 4500);
    } catch (e) {
      alert('Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = sortPatientsByRecent(
    patients.filter((p) => {
      const billTotal = Number(p.totalBill || 0);
      const billPaid = Number(p.paidBill || 0);
      const billDue = Number(p.balance ?? Math.max(0, billTotal - billPaid));
      const statusNum = Number(p.billPayStatus);
      const isPaid = statusNum === 2 || (billTotal > 0 && billDue <= 0 && billPaid >= billTotal);

      if (statusFilter === 'PAID' && !isPaid) return false;
      if (statusFilter === 'DUE' && isPaid) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase().trim();
      const name = String(p.name || '').toLowerCase();
      const pid = String(p.patientId || '').toLowerCase();
      const mobile = String(p.mobile || p.phone || '').toLowerCase();
      const slNo = String(p.slNo || '').toLowerCase();
      const doctor = String(p.referedDr || '').toLowerCase();

      return (
        name.includes(term) ||
        pid.includes(term) ||
        mobile.includes(term) ||
        slNo.includes(term) ||
        doctor.includes(term)
      );
    })
  );

  // Financial aggregates
  const totalInvoiced = patients.reduce((acc, p) => acc + (Number(p.totalBill) || 0), 0);
  const totalCollected = patients.reduce((acc, p) => acc + (Number(p.paidBill) || (p.billPayStatus === 2 ? Number(p.totalBill) : 0)), 0);
  const totalDue = Math.max(0, totalInvoiced - totalCollected);

  return (
    <section className="space-y-5">
      <Helmet>
        <title>Billing, Invoices & Accounts | Lab Expert LIS</title>
        <meta
          name="description"
          content="Manage diagnostic invoices, record patient deposits, track accounts receivable, and generate printed receipts."
        />
      </Helmet>

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Billing & Diagnostic Invoices Management
              </h1>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Accounts Desk
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Collect diagnostic advances, generate GST compliant medical receipts, and balance clinic ledgers
            </p>
          </div>
        </div>

        <button
          onClick={fetchBillingList}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
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

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Invoiced Billing
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{totalInvoiced.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Gross across all diagnostic investigations</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Realized Collections
          </span>
          <div className="text-2xl font-extrabold text-emerald-600">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Deposited via Cash & UPI QR</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Outstanding Accounts Due
          </span>
          <div className="text-2xl font-extrabold text-amber-600">
            ₹{totalDue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Pending collection upon report delivery</span>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient ID, Name, Mobile..."
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
              Showing <strong>{filtered.length}</strong> invoices
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-3 px-4 w-20 text-slate-500">PID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4 text-slate-500">Date</th>
                <th className="py-3 px-4 text-slate-500">Mobile</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Deposited</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const billTotal = Number(p.totalBill || 0);
                const billPaid = Number(p.paidBill || 0);
                const billDue = Number(p.balance !== undefined ? p.balance : Math.max(0, billTotal - billPaid));
                const isPaid = billTotal > 0 && billDue <= 0 && (p.billPayStatus === 2 || p.billPayStatus === '2' || billPaid >= billTotal);
                const isPartial = billTotal > 0 && billPaid > 0 && billDue > 0;

                return (
                  <tr key={p.patientId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      #{p.patientId}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                      {formatDisplayDate(p.regDate)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.mobile || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-xs font-mono">
                      ₹{billTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700 text-xs font-mono">
                      ₹{billPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-xs font-mono">
                      {billDue > 0 ? (
                        <span className="text-rose-600 font-bold">₹{billDue.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isPartial
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : billTotal > 0
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {isPaid
                          ? 'Settled (Paid)'
                          : isPartial
                          ? `Partial (₹${billDue} Due)`
                          : billTotal > 0
                          ? `Unpaid (₹${billDue} Due)`
                          : 'Unbilled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setDepositPatient(p);
                            const dueVal = Number(p.balance !== undefined ? p.balance : Math.max(0, (p.totalBill || 0) - (p.paidBill || 0)));
                            setAmount(dueVal > 0 ? String(dueVal) : (p.totalBill ? String(p.totalBill) : '500'));
                          }}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs cursor-pointer transition-all"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Deposit</span>
                        </button>
                        <button
                          onClick={() => setPreviewPatient(p)}
                          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs cursor-pointer transition-all"
                          title="Preview official AWS bill"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Preview Bill</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal
        isOpen={!!depositPatient}
        onClose={() => setDepositPatient(null)}
        title={`Receive Diagnostic Payment — ${depositPatient?.name}`}
      >
        <div className="space-y-4 text-xs">
          {depositPatient && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Bill</span>
                <span className="font-extrabold text-slate-800 font-mono">
                  ₹{Number(depositPatient.totalBill || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Already Deposited</span>
                <span className="font-extrabold text-emerald-700 font-mono">
                  ₹{Number(depositPatient.paidBill || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Remaining Due</span>
                <span className="font-extrabold text-rose-700 font-mono">
                  ₹{Number(depositPatient.balance !== undefined ? depositPatient.balance : Math.max(0, (depositPatient.totalBill || 0) - (depositPatient.paidBill || 0))).toLocaleString('en-IN')}
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
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs focus:outline-none focus:bg-white"
            >
              <option value="Cash">Cash (Counter Receipt)</option>
              <option value="UPI">UPI / Dynamic QR Code</option>
              <option value="Card">Debit / Credit Card (POS Machine)</option>
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
    </section>
  );
}
