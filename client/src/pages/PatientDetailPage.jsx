import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { usePatientContext } from '../context/context.patient.jsx';
import PatientProfileView from '../components/patient/PatientProfileView.jsx';
import TestSelectionView from '../components/patient/TestSelectionView.jsx';
import ResultsEntry from '../components/results/ResultsEntry.jsx';
import PrintableInvoice from '../components/billing/PrintableInvoice.jsx';
import BarcodeModal from '../components/patient/BarcodeModal.jsx';
import DiscountModal from '../components/patient/DiscountModal.jsx';
import DoctorApprovalModal from '../components/results/DoctorApprovalModal.jsx';
import Modal from '../components/common/Modal.jsx';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  FileCheck,
  CheckCircle,
  FileText,
  User,
  CreditCard,
  Edit,
} from 'lucide-react';
import { formatDisplayDate, getLocalDateString } from '../utils/dateUtils.js';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activePatient, setActivePatient, activeModal, openModal, closeModal } = usePatientContext();

  const activeTab = searchParams.get('tab') || 'profile'; // profile, tests, results, invoice

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);

  // Modals
  const [showApproval, setShowApproval] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notification, setNotification] = useState('');

  // Listen to sidebar trigger
  useEffect(() => {
    if (activeModal === 'barcode') setShowBarcodeModal(true);
    if (activeModal === 'deposit') {
      const due = patient?.balance ? Number(patient.balance) : (Number(patient?.totalBill) || 0);
      setDepositAmount(due > 0 ? String(due) : '');
      setShowDepositModal(true);
    }
    if (activeModal === 'discount') setShowDiscountModal(true);
    if (activeModal) closeModal();
  }, [activeModal, closeModal, patient]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/patient-report', {
        params: { patientId: id },
      });
      const pt = res.data?.patient;
      const repList = res.data?.reports || [];
      if (pt) {
        setPatient(pt);
        setReports(repList);
        setTemplates(res.data?.templates || []);
        setActivePatient(pt);
      } else {
        applyFallbackPatient();
      }

      // Also fetch invoice format
      try {
        const invRes = await api.get('/billing/invoice', {
          params: { patientId: id },
        });
        if (invRes.data?.invoice) {
          setInvoiceData(invRes.data.invoice);
        } else {
          setInvoiceData(generateDemoInvoice(pt || activePatient, repList));
        }
      } catch (e) {
        setInvoiceData(generateDemoInvoice(pt || activePatient, repList));
      }
    } catch (err) {
      console.warn('Error loading patient detail, using demo catalog:', err.message);
      applyFallbackPatient();
    } finally {
      setLoading(false);
    }
  };

  const applyFallbackPatient = () => {
    const fallback =
      activePatient || {
        patientId: id,
        slNo: id,
        name: 'Patient',
        gender: 'Male',
        age: '30',
        age_unit: 'Years',
        referedDr: 'Self',
        center: 'Main',
        collectionDate: getLocalDateString(),
        status: 'REGISTERED',
        totalBill: 0,
        paidBill: 0,
        balance: 0,
        billPayStatus: 1,
      };

    setPatient(fallback);
    setReports([]);
    setActivePatient(fallback);
    setInvoiceData(generateDemoInvoice(fallback, []));
  };

  const generateDemoInvoice = (p, rList = []) => {
    const hasItems = rList && rList.length > 0;
    const items = hasItems
      ? rList.map((r, idx) => ({
          slNo: idx + 1,
          testName: r.testName || r.profileName || `Test ${idx + 1}`,
          rate: Number(r.rate) || 0,
          disc: 0,
          amount: Number(r.rate) || 0,
        }))
      : [];

    const total = items.reduce((acc, it) => acc + it.amount, 0) || Number(p?.totalBill || 0);
    const isPaid = (p?.billPayStatus === 2 || p?.billPayStatus === '2') && total > 0;
    const paid = isPaid ? total : Number(p?.paidBill || 0);
    const due = Math.max(0, total - paid);

    return {
      clinic: {
        name: 'NEW LIFE CARE DIAGNOSTIC CENTER',
        address: 'KERANITOLA, STATION ROAD, PASCHIM MIDNAPOUR (WB) PIN - 721101',
        mobile: '9733525031, 9647393949',
        email: 'noreply@labexperts.in',
        website: 'https://newlifecare.labexperts.in',
      },
      patient: p || {
        patientId: id,
        name: 'Patient',
        gender: 'Male',
        age: '30',
        age_unit: 'Years',
        referedDr: 'Self',
        collectionDate: getLocalDateString(),
        billPayStatus: 1,
      },
      items,
      financials: {
        totalBill: total,
        netBill: total,
        paidAmount: paid,
        dueAmount: due,
      },
    };
  };

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const handleReceiveSample = async () => {
    try {
      await api.post('/reports/receive-sample', { patientId: id });
      setNotification('Sample specimen received and verified!');
      fetchPatientData();
    } catch (err) {
      alert('Failed to receive sample');
    }
  };

  const handleConfirmDeposit = async () => {
    try {
      await api.post('/billing/deposit', {
        patientId: id,
        amount: Number(depositAmount),
        paymentMode,
      });
      setNotification(`Deposit receipt of ₹${depositAmount} issued successfully!`);
      setShowDepositModal(false);
      fetchPatientData();
    } catch (err) {
      alert('Failed to record deposit');
    }
  };

  const handleOpenDepositModal = () => {
    const reportsTotal = (reports && reports.length > 0)
      ? reports.reduce((acc, r) => acc + (Number(r.rate) || 0), 0)
      : Number(patient?.totalBill || 0);
    const paid = Number(patient?.paidBill || 0);
    const due = Math.max(0, reportsTotal - paid);
    setDepositAmount(due > 0 ? String(due) : (reportsTotal > 0 ? String(reportsTotal) : ''));
    setShowDepositModal(true);
  };

  const handleDiscountApplied = (data) => {
    setNotification(`Clinical discount of ₹${data.value} applied successfully!`);
    setShowDiscountModal(false);
  };

  if (loading && !patient) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
        <span className="font-semibold text-xs">Loading patient record...</span>
      </div>
    );
  }

  const pid = patient?.patientId || id;

  return (
    <section className="space-y-4 pb-8">
      <Helmet>
        <title>{patient ? `${patient.name} (${pid})` : 'Patient Profile'} | Lab Expert</title>
        <meta
          name="description"
          content={`Patient record and clinical investigations for ${patient?.name || ''}`}
        />
      </Helmet>

      {/* Top Header Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/patients')}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors cursor-pointer"
            title="Back to patient worklist"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {patient?.title ? `${patient.title} ` : ''}{patient?.name || 'Patient'}
              </h1>
              <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.2 rounded border border-indigo-200">
                PID: {pid}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Ref by: <strong className="text-slate-700">{patient?.referedDr || 'Self'}</strong> • Date: {formatDisplayDate(patient?.collectionDate || patient?.regDate)}
            </span>
          </div>
        </div>

        {/* View Switcher Tabs matching screenshot capabilities */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => setSearchParams({ tab: 'profile' })}
              className={`py-1.5 px-3 rounded transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'tests' })}
              className={`py-1.5 px-3 rounded transition-all cursor-pointer ${
                activeTab === 'tests'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Test Selection
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'results' })}
              className={`py-1.5 px-3 rounded transition-all cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fill Results
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'invoice' })}
              className={`py-1.5 px-3 rounded transition-all cursor-pointer ${
                activeTab === 'invoice'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoice
            </button>
          </div>

          <button
            onClick={() => setShowApproval(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Doctor Sign-off</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification('')}
            className="font-bold text-emerald-700 hover:opacity-75 cursor-pointer text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'profile' && (
        <PatientProfileView
          patient={patient}
          reports={reports}
          onAddTests={() => setSearchParams({ tab: 'tests' })}
          onFillResults={() => setSearchParams({ tab: 'results' })}
          onPrintInvoice={() => setSearchParams({ tab: 'invoice' })}
          onPrintReport={() => setSearchParams({ tab: 'results' })}
          onReceiveSample={handleReceiveSample}
          onAddDeposit={handleOpenDepositModal}
          onAddDiscount={() => setShowDiscountModal(true)}
          onOpenSettings={() => setShowBarcodeModal(true)}
        />
      )}

      {activeTab === 'tests' && (
        <TestSelectionView
          patient={patient}
          reports={reports}
          onRefresh={fetchPatientData}
          onPrintInvoice={() => setSearchParams({ tab: 'invoice' })}
          onFillResults={() => setSearchParams({ tab: 'results' })}
          onMakePayment={handleOpenDepositModal}
        />
      )}

      {activeTab === 'results' && (
        <ResultsEntry
          patient={patient}
          reports={reports}
          templates={templates}
          onRefresh={fetchPatientData}
        />
      )}

      {activeTab === 'invoice' && (
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
          <PrintableInvoice
            invoiceData={invoiceData}
            onFillResults={() => setSearchParams({ tab: 'results' })}
            onHome={() => navigate('/patients')}
            onDiscount={() => setShowDiscountModal(true)}
            onDeposit={handleOpenDepositModal}
          />
        </div>
      )}

      {/* Barcode Modal */}
      <BarcodeModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        patient={patient}
      />

      {/* Discount Modal */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        patient={patient}
        onDiscountApplied={handleDiscountApplied}
      />

      {/* Doctor Approval Modal */}
      <DoctorApprovalModal
        isOpen={showApproval}
        onClose={() => setShowApproval(false)}
        patient={patient}
        reports={reports}
        onApproved={fetchPatientData}
      />

      {/* Deposit Modal */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title={`Add Diagnostic Fee Deposit — ${patient?.name}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Deposit Amount (₹)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded font-mono text-base font-extrabold text-slate-900 focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded font-semibold text-xs focus:outline-none focus:bg-white"
            >
              <option value="Cash">Cash (Counter Desk)</option>
              <option value="UPI">UPI / QR Code Scan</option>
              <option value="Card">Debit / Credit Card</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowDepositModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeposit}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Record Deposit Receipt
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
