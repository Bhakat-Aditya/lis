import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import PatientProfileView from '../components/patient/PatientProfileView.jsx';
import ResultsEntry from '../components/results/ResultsEntry.jsx';
import PrintableInvoice from '../components/billing/PrintableInvoice.jsx';
import DoctorApprovalModal from '../components/results/DoctorApprovalModal.jsx';
import AddTestsModal from '../components/patient/AddTestsModal.jsx';
import Modal from '../components/common/Modal.jsx';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  FileCheck,
  CheckCircle,
  Share2,
} from 'lucide-react';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'profile'; // profile, results, invoice

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);

  // Modals state
  const [showAddTests, setShowAddTests] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1500');
  const [notification, setNotification] = useState('');

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/patient-report', {
        params: { patientId: id },
      });
      setPatient(res.data?.patient);
      setReports(res.data?.reports || []);
      setTemplates(res.data?.templates || []);

      // Also fetch invoice format
      const invRes = await api.get('/billing/invoice', {
        params: { patientId: id },
      });
      setInvoiceData(invRes.data?.invoice);
    } catch (err) {
      console.warn('Error loading patient detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const handleReceiveSample = async () => {
    try {
      await api.post('/reports/receive-sample', { patientId: id });
      setNotification('Sample received! Status updated to SAMPLE.');
      fetchPatientData();
    } catch (err) {
      alert('Failed to receive sample');
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      await api.post('/reports/send-whatsapp', { patientId: id });
      setNotification('Report link sent to patient via WhatsApp!');
    } catch (err) {
      alert('WhatsApp dispatch failed');
    }
  };

  const handleConfirmDeposit = async () => {
    try {
      await api.post('/billing/generate', { patientId: id });
      setNotification(`Deposit of ₹${depositAmount} recorded successfully!`);
      setShowDepositModal(false);
      fetchPatientData();
    } catch (err) {
      alert('Failed to record deposit');
    }
  };

  if (loading && !patient) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
        <span>Loading patient data from AWS server...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/patients')}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              {patient?.name} ({patient?.patientId || id})
            </h1>
            <span className="text-[11px] text-slate-500">
              Serial No: <strong className="text-slate-700">{patient?.slNo}</strong> | Collection: {patient?.sampleTime || patient?.regDate}
            </span>
          </div>
        </div>

        {/* View Switcher Tabs & Quick Top Actions */}
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setSearchParams({ tab: 'profile' })}
              className={`py-1.5 px-3 rounded-md transition-colors cursor-pointer ${
                activeTab === 'profile' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Profile Overview
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'results' })}
              className={`py-1.5 px-3 rounded-md transition-colors cursor-pointer ${
                activeTab === 'results' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Fill Results ({reports.length})
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'invoice' })}
              className={`py-1.5 px-3 rounded-md transition-colors cursor-pointer ${
                activeTab === 'invoice' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Print Invoice
            </button>
          </div>

          <button
            onClick={() => setShowAddTests(true)}
            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tests</span>
          </button>

          <button
            onClick={() => setShowApproval(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Doctor Sign-off</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="font-bold text-emerald-700 text-sm">×</button>
        </div>
      )}

      {/* Main View Body */}
      {activeTab === 'profile' && (
        <PatientProfileView
          patient={patient}
          reports={reports}
          onFillResults={() => setSearchParams({ tab: 'results' })}
          onPrintInvoice={() => setSearchParams({ tab: 'invoice' })}
          onPrintReport={() => setSearchParams({ tab: 'results' })}
          onReceiveSample={handleReceiveSample}
          onAddDeposit={() => setShowDepositModal(true)}
          onAddDiscount={() => alert('Add discount requested')}
          onSendWhatsApp={handleSendWhatsApp}
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

      {activeTab === 'invoice' && invoiceData && (
        <PrintableInvoice
          invoiceData={invoiceData}
          onFillResults={() => setSearchParams({ tab: 'results' })}
          onHome={() => navigate('/patients')}
        />
      )}

      {/* Add Tests Modal */}
      <AddTestsModal
        isOpen={showAddTests}
        onClose={() => setShowAddTests(false)}
        patient={patient}
        onTestsAdded={() => {
          setNotification('Tests added to patient worklist!');
          fetchPatientData();
        }}
      />

      {/* Doctor Approval Modal */}
      <DoctorApprovalModal
        isOpen={showApproval}
        onClose={() => setShowApproval(false)}
        patient={patient}
        reports={reports}
        onApproved={() => {
          setNotification('Report verified and approved by Doctor!');
          fetchPatientData();
        }}
      />

      {/* Add Deposit Modal */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title={`Add Deposit - ${patient?.name}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Deposit Amount (₹)</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg">
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Card">Debit / Credit Card</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowDepositModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeposit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
            >
              Confirm Receipt
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
