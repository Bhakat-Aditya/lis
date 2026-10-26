import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { usePatientContext } from '../context/context.patient.jsx';
import PatientProfileView from '../components/patient/PatientProfileView.jsx';
import TestSelectionView from '../components/patient/TestSelectionView.jsx';
import ResultsEntry from '../components/results/ResultsEntry.jsx';
import PrintableInvoice from '../components/billing/PrintableInvoice.jsx';
import AwsBillViewer from '../components/billing/AwsBillViewer.jsx';
import BillPreviewModal from '../components/billing/BillPreviewModal.jsx';
import BarcodeModal from '../components/patient/BarcodeModal.jsx';
import DiscountModal from '../components/patient/DiscountModal.jsx';
import DoctorApprovalModal from '../components/results/DoctorApprovalModal.jsx';
import PatientEditModal from '../components/patient/PatientEditModal.jsx';
import EditBillModal from '../components/billing/EditBillModal.jsx';
import Modal from '../components/common/Modal.jsx';
import { useMaster } from '../context/context.master.jsx';
import { groupInvestigationsIntoLots } from '../utils/labTestUtils.js';
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
  Loader2,
  AlertCircle,
  Printer,
  Download,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { formatDisplayDate, getLocalDateString } from '../utils/dateUtils.js';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activePatient, setActivePatient, activeModal, openModal, closeModal } = usePatientContext();
  const { tests: catalogTests = [], profiles: catalogProfiles = [], packages: catalogPackages = [] } = useMaster();

  const activeTab = searchParams.get('tab') || 'profile'; // profile, tests, results, invoice

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);
  const [reportPdfUrl, setReportPdfUrl] = useState('');
  const [billPdfUrl, setBillPdfUrl] = useState('');

  // Modals
  const [showApproval, setShowApproval] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false);
  const [showEditBillModal, setShowEditBillModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notification, setNotification] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositError, setDepositError] = useState('');

  const patientLots = useMemo(() => {
    return groupInvestigationsIntoLots(reports, patient, catalogProfiles, catalogPackages, catalogTests);
  }, [reports, patient, catalogProfiles, catalogPackages, catalogTests]);

  const lotsTotal = useMemo(() => {
    return patientLots.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
  }, [patientLots]);

  const effectiveTotal = lotsTotal > 0
    ? lotsTotal
    : Number(patient?.grossTotal || patient?.totalBill || 0);

  // Accurately calculate outstanding balance due for deposit modal
  const calculateDueAmount = (pt = patient, repList = reports) => {
    if (!pt) return 0;
    if (Number(pt.billPayStatus) === 2) return 0;

    const discount = Number(pt.discount || 0);
    const paid = Number(pt.paidBill || 0);

    let baseTotal = 0;
    if (Array.isArray(repList) && repList.length > 0) {
      const lots = groupInvestigationsIntoLots(repList, pt, catalogProfiles, catalogPackages, catalogTests);
      const lotsTotal = lots.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
      if (lotsTotal > 0) baseTotal = lotsTotal;
    }

    if (baseTotal === 0 && Number(pt.totalBill || 0) > 0) {
      baseTotal = Number(pt.totalBill);
    }

    if (baseTotal > 0) {
      return Math.max(0, baseTotal - discount - paid);
    }

    const explicitDue =
      pt.balance !== undefined && pt.balance !== null && pt.balance !== ''
        ? Number(pt.balance)
        : pt.dueAmount !== undefined && pt.dueAmount !== null && pt.dueAmount !== ''
        ? Number(pt.dueAmount)
        : null;

    if (explicitDue !== null && !isNaN(explicitDue)) {
      return Math.max(0, explicitDue);
    }

    return 0;
  };

  // Listen to sidebar trigger
  useEffect(() => {
    if (activeModal === 'barcode') setShowBarcodeModal(true);
    if (activeModal === 'deposit') {
      const due = calculateDueAmount(patient, reports);
      setDepositAmount(due > 0 ? String(due) : '');
      setDepositError('');
      setShowDepositModal(true);
    }
    if (activeModal === 'discount') setShowDiscountModal(true);
    if (activeModal) closeModal();
  }, [activeModal, closeModal, patient, reports]);

  const fetchPatientData = async (isFresh = false) => {
    setLoading(true);
    try {
      const res = await api.get('/reports/patient-report', {
        params: { patientId: id, ...(isFresh ? { fresh: 'true' } : {}) },
      });
      const pt = res.data?.patient;
      const repList = res.data?.reports || [];
      const isRateLimited =
        res.data?.StatusCode === '8887' ||
        res.data?.rateLimited ||
        String(res.data?.Message || '').includes('8887');

      const awsReportUrl = res.data?.printPDFUrl || pt?.printPDFUrl || res.data?.reportUrl || '';
      const awsBillUrl = res.data?.billUrl || pt?.billUrl || '';
      if (awsReportUrl) setReportPdfUrl(awsReportUrl);
      if (awsBillUrl) setBillPdfUrl(awsBillUrl);

      if (pt) {
        setPatient(pt);
        if (repList.length > 0) {
          setReports(repList);
        }
        if (res.data?.templates?.length > 0) {
          setTemplates(res.data.templates);
        }
        setActivePatient(pt);
      } else if (!isRateLimited) {
        // Only apply fallback patient if not rate-limited and no existing data
        setPatient((prev) => {
          if (!prev) applyFallbackPatient();
          return prev;
        });
      }

      // Generate invoice format directly from loaded patient and report data
      setInvoiceData((prevInv) => {
        const effectivePt = pt || patient || activePatient;
        const effectiveReps = repList.length > 0 ? repList : (reports || []);
        return generateDemoInvoice(effectivePt, effectiveReps);
      });
      return res.data;
    } catch (err) {
      console.warn('Error loading patient detail:', err.message);
      setPatient((prev) => {
        if (!prev) applyFallbackPatient();
        return prev;
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReportPdf = (withHeader = true) => {
    const rawPid = patient?.patientId || id;
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';
    const token = localStorage.getItem('token');
    window.open(`/api/reports/pdf?patientId=${cleanPid || rawPid}&addHeader=${withHeader}${token ? `&token=${token}` : ''}`, '_blank');
  };

  const handleOpenBillPdf = () => {
    setShowBillPreviewModal(true);
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
    let items = [];
    if (p?.testList && p.testList.length > 0) {
      items = p.testList.map((t, idx) => ({
        slNo: idx + 1,
        testName: t['Bill Particulars'] || `Item ${idx + 1}`,
        rate: Number(t.Amount || 0),
        disc: 0,
        amount: Number(t.Amount || 0),
      }));
    } else if (rList && rList.length > 0) {
      const lots = groupInvestigationsIntoLots(rList, p, catalogProfiles, catalogPackages, catalogTests);
      items = lots.map((lot, idx) => ({
        slNo: idx + 1,
        testName: lot.name,
        rate: Number(lot.amount || 0),
        disc: 0,
        amount: Number(lot.amount || 0),
      }));
    }

    const itemsSum = items.reduce((acc, it) => acc + it.amount, 0);
    const grossTotal = itemsSum > 0 ? itemsSum : (Number(p?.grossTotal || p?.totalBill || 0));
    const discount = Number(p?.discount || 0);
    const roundoff = Number(p?.roundoff || 0);
    const netTotal = Math.max(0, grossTotal - discount - roundoff);
    const isPaid = (p?.billPayStatus === 2 || p?.billPayStatus === '2') && netTotal > 0;
    const paid = isPaid ? netTotal : Number(p?.paidBill || 0);
    const due = isPaid ? 0 : Math.max(0, netTotal - paid);

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
        grossAmount: grossTotal,
        totalAmount: grossTotal,
        totalBill: netTotal,
        discount,
        roundoff,
        netAmount: netTotal,
        netBill: netTotal,
        deposited: paid,
        paidAmount: paid,
        totalDue: due,
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
      const rawPid = patient?.patientId || id;
      const cleanPid = rawPid
        ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
        : '';
      await api.post('/reports/receive-sample', { patientId: cleanPid || rawPid });
      setNotification('Sample specimen received and verified!');
      fetchPatientData();
    } catch (err) {
      alert('Failed to receive sample');
    }
  };

  const handleConfirmDeposit = async () => {
    const amt = Number(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError('Please enter a valid deposit amount greater than ₹0');
      return;
    }

    const rawPid = patient?.patientId || id;
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';

    setSubmittingDeposit(true);
    setDepositError('');

    try {
      await api.post('/billing/deposit', {
        patientId: cleanPid || rawPid,
        amount: amt,
        paymentMode,
      });
      setNotification(`Deposit receipt of ₹${amt} issued successfully!`);
      setShowDepositModal(false);
      fetchPatientData();
    } catch (err) {
      setDepositError(err.response?.data?.Message || 'Failed to record deposit');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleOpenDepositModal = () => {
    const due = calculateDueAmount(patient, reports);
    setDepositAmount(due > 0 ? String(due) : '');
    setDepositError('');
    setShowDepositModal(true);
  };

  const handleDiscountApplied = (data) => {
    setNotification(data?.message || `Clinical discount of ₹${data.value} applied successfully!`);
    setShowDiscountModal(false);
    fetchPatientData();
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
              Ref by: <strong className="text-slate-700">{patient?.referedDr || 'Self'}</strong> • Reg: {formatDisplayDate(patient?.regDate || patient?.collectionDate)}{patient?.sampleTime ? ` • Sample: ${patient.sampleTime}` : ''}
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
            onClick={() => setShowEditPatientModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Edit Patient Demographic Details"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Patient</span>
          </button>

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
          onPrintInvoice={() => setShowBillPreviewModal(true)}
          onPrintReport={() => handleOpenReportPdf(true)}
          onReceiveSample={handleReceiveSample}
          onAddDeposit={handleOpenDepositModal}
          onAddDiscount={() => setShowDiscountModal(true)}
          onOpenSettings={() => setShowBarcodeModal(true)}
          onEditPatient={() => setShowEditPatientModal(true)}
          onEditBill={() => setShowEditBillModal(true)}
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
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Diagnostic Invoice Particulars & Ledger</h4>
              <p className="text-[11px] text-slate-500">Modify test billing rates, add items, or adjust charges</p>
            </div>
            <button
              onClick={() => setShowEditBillModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Bill Particulars (BILLUPDATE)</span>
            </button>
          </div>
          <AwsBillViewer
            patientId={id}
            onBack={() => setSearchParams({ tab: 'profile' })}
            title="Official Diagnostic Bill & Receipt (AWS Server)"
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
        totalAmount={effectiveTotal}
        onDiscountApplied={handleDiscountApplied}
      />

      {/* Doctor Approval Modal */}
      <DoctorApprovalModal
        isOpen={showApproval}
        onClose={() => setShowApproval(false)}
        patient={patient}
        reports={reports}
        onApproved={() => {
          setNotification('Doctor review and approval status updated successfully!');
          fetchPatientData();
        }}
      />

      {/* Deposit Modal */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => !submittingDeposit && setShowDepositModal(false)}
        title={`Add Diagnostic Fee Deposit — ${patient?.name}`}
      >
        <div className="space-y-4 text-xs">
          {/* Financial context card */}
          {(() => {
            const discount = Number(patient?.discount || 0);
            const due = calculateDueAmount(patient, reports);
            const paid = Number(patient?.paidBill || 0);

            return (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Total Billed</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    ₹{effectiveTotal.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Discount</span>
                  <span className={`font-mono font-bold text-xs ${discount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {discount > 0 ? `(-) ₹${discount.toFixed(2)}` : '₹0.00'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Deposited</span>
                  <span className="font-mono font-bold text-sky-700 text-xs">
                    ₹{paid.toFixed(2)}
                  </span>
                </div>
                <div className="bg-amber-100/60 rounded-lg p-1 border border-amber-200">
                  <span className="text-[10px] text-amber-900 font-bold block">Balance Due</span>
                  <span className="font-mono font-extrabold text-rose-700 text-xs">
                    ₹{due.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })()}

          {depositError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{depositError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                Deposit Amount (₹)
              </label>
              {calculateDueAmount() > 0 && (
                <button
                  type="button"
                  onClick={() => setDepositAmount(String(calculateDueAmount()))}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer underline"
                >
                  Pay Full Balance (₹{calculateDueAmount()})
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              value={depositAmount}
              onChange={(e) => {
                setDepositAmount(e.target.value);
                setDepositError('');
              }}
              placeholder={`e.g. ${calculateDueAmount() || '100'}`}
              disabled={submittingDeposit}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-extrabold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              disabled={submittingDeposit}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs focus:outline-none focus:bg-white"
            >
              <option value="Cash">Cash (Counter Desk)</option>
              <option value="UPI">UPI / QR Code Scan</option>
              <option value="Card">Debit / Credit Card</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDepositModal(false)}
              disabled={submittingDeposit}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeposit}
              disabled={submittingDeposit}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingDeposit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Deposit...</span>
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
        isOpen={showBillPreviewModal}
        onClose={() => setShowBillPreviewModal(false)}
        patientId={id}
        patientName={patient?.name}
        onOpenEditBill={() => setShowEditBillModal(true)}
      />

      {/* Patient Demographic Details Edit Modal */}
      {showEditPatientModal && patient && (
        <PatientEditModal
          isOpen={showEditPatientModal}
          onClose={() => setShowEditPatientModal(false)}
          patient={patient}
          onPatientUpdated={async () => {
            setNotification('Patient demographic details updated successfully!');
            await fetchPatientData();
            setShowEditPatientModal(false);
          }}
        />
      )}

      {/* Invoice Particulars / Bill Edit Modal (BILLUPDATE) */}
      {showEditBillModal && patient && (
        <EditBillModal
          isOpen={showEditBillModal}
          onClose={() => setShowEditBillModal(false)}
          patient={patient}
          onBillUpdated={async () => {
            setNotification('Bill invoice updated successfully via BILLUPDATE!');
            await fetchPatientData();
            setShowEditBillModal(false);
          }}
          onOpenDeposit={handleOpenDepositModal}
          onOpenPrint={() => setShowBillPreviewModal(true)}
        />
      )}
    </section>
  );
}
