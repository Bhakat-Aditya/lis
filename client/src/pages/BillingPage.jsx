import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Receipt, Printer, PlusCircle, Search, RefreshCw, DollarSign } from 'lucide-react';
import Modal from '../components/common/Modal.jsx';

export default function BillingPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [depositPatient, setDepositPatient] = useState(null);
  const [amount, setAmount] = useState('500');

  const fetchBillingList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/list');
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
    try {
      await api.post('/billing/generate', { patientId: depositPatient.patientId });
      alert(`Receipt recorded for patient ${depositPatient.name}`);
      setDepositPatient(null);
      fetchBillingList();
    } catch (e) {
      alert('Failed to record payment');
    }
  };

  const filtered = patients.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Billing & Invoices Management</h1>
            <p className="text-xs text-slate-500">Collect deposits, print GST receipts, and manage account balances</p>
          </div>
        </div>

        <button
          onClick={fetchBillingList}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Invoices: <strong>{filtered.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-4 w-20">PID</th>
                <th className="py-2.5 px-4">Patient Name</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-4">Payment Status</th>
                <th className="py-2.5 px-4 text-right">Total Bill</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const isPaid = p.billPayStatus === 2 || p.billPayStatus === '2';
                return (
                  <tr key={p.patientId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{p.patientId}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{p.regDate?.substring(0, 10)}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{p.mobile || '-'}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isPaid ? 'Payment Complete' : 'Balance Due'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      ₹{p.totalBill || 0}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDepositPatient(p)}
                          className="flex items-center gap-1 bg-indigo-900 hover:bg-indigo-950 text-white font-medium text-xs py-1 px-2.5 rounded shadow-xs cursor-pointer"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Deposit</span>
                        </button>
                        <button
                          onClick={() => navigate(`/invoice/${p.patientId}`)}
                          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-1 px-2.5 rounded shadow-xs cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Invoice</span>
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
        title={`Receive Payment - ${depositPatient?.name}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Payment Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Mode</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg">
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / QR</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setDepositPatient(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleDepositSubmit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
            >
              Issue Receipt
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
