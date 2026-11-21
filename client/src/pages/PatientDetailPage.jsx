import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { openReportPdf, openBillingPdf } from '../services/api';
import { usePatientContext } from '../context/context.patient.jsx';
import PatientProfileView from '../components/patient/PatientProfileView.jsx';
import PatientJourneyTimeline from '../components/patient/PatientJourneyTimeline.jsx';
import WhatsAppModal from '../components/patient/WhatsAppModal.jsx';
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
import ConfirmationModal from '../components/common/ConfirmationModal.jsx';
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
  Percent,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Printer,
  Download,
  ExternalLink,
  ChevronDown,
  TestTube,
  Send,
  MessageSquare,
  Undo2,
  Activity,
  FlaskConical,
  Receipt,
} from 'lucide-react';
import { formatDisplayDate, getLocalDateString } from '../utils/dateUtils.js';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activePatient, setActivePatient, clearActivePatient, activeModal, openModal, closeModal } = usePatientContext();
  const { tests: catalogTests = [], profiles: catalogProfiles = [], packages: catalogPackages = [], templates: catalogTemplates = [] } = useMaster();

  const activeTab = searchParams.get('tab') || 'profile'; // profile, tests, results, invoice

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(() => {
    if (activePatient && (
      activePatient.patientId === id ||
      activePatient.slNo === id ||
      activePatient.barcode === id ||
      String(activePatient.patientId || '').replace(/^P+/i, '') === String(id || '').replace(/^P+/i, '')
    )) {
      return activePatient;
    }
    return null;
  });
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);
  const [reportPdfUrl, setReportPdfUrl] = useState('');
  const [billPdfUrl, setBillPdfUrl] = useState('');
  const [billRefreshKey, setBillRefreshKey] = useState(0);
  const [barcodeUrls, setBarcodeUrls] = useState([]);

  // Modals
  const [showApproval, setShowApproval] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false);
  const [showEditBillModal, setShowEditBillModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppDefaultType, setWhatsAppDefaultType] = useState('patientReportMsg');
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [notification, setNotification] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    description: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
    icon: null,
    onConfirm: null,
  });

  const patientLots = useMemo(() => {
    return groupInvestigationsIntoLots(reports, patient, catalogProfiles, catalogPackages, catalogTests, catalogTemplates, templates);
  }, [reports, patient, catalogProfiles, catalogPackages, catalogTests, catalogTemplates, templates]);

  const lotsTotal = useMemo(() => {
    return patientLots.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
  }, [patientLots]);

  const discountAmount = Number(patient?.discount || 0);
  const syncedGross = Number(patient?.grossTotal || 0);
  const syncedNet = Number(patient?.totalBill || 0);

  const grossTotal = lotsTotal > 0
    ? lotsTotal
    : (syncedGross > 0
        ? syncedGross
        : (syncedNet > 0 && discountAmount > 0
            ? syncedNet + discountAmount
            : (syncedNet > 0 ? syncedNet : 0)));

  const netBill = syncedNet > 0 && syncedNet !== grossTotal
    ? syncedNet
    : Math.max(0, grossTotal - discountAmount);

  const effectiveTotal = grossTotal;

  // Accurately calculate outstanding balance due for deposit modal
  const calculateDueAmount = (pt = patient, repList = reports) => {
    if (!pt) return 0;
    if (Number(pt.billPayStatus) === 2) return 0;

    const discount = Number(pt.discount || 0);
    const paid = Number(pt.paidBill || 0);

    const explicitDue =
      pt.dueAmount !== undefined && pt.dueAmount !== null && pt.dueAmount !== ''
        ? Number(pt.dueAmount)
        : (pt.balance !== undefined && pt.balance !== null && pt.balance !== ''
            ? Number(pt.balance)
            : null);

    if (explicitDue !== null && !isNaN(explicitDue)) {
      return Math.max(0, explicitDue);
    }

    let baseGross = Number(pt.grossTotal || 0);
    if (baseGross === 0 && Array.isArray(repList) && repList.length > 0) {
      const lots = groupInvestigationsIntoLots(repList, pt, catalogProfiles, catalogPackages, catalogTests, catalogTemplates, templates);
      baseGross = lots.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    }
    if (baseGross === 0) {
      const rawNet = Number(pt.totalBill || 0);
      baseGross = rawNet > 0 && discount > 0 ? rawNet + discount : rawNet;
    }

    if (baseGross > 0) {
      return Math.max(0, baseGross - discount - paid);
    }

    return 0;
  };

  // Listen to right panel / sidebar modal triggers
  useEffect(() => {
    if (!activeModal || !patient) return;
    if (activeModal === 'barcode') setShowBarcodeModal(true);
    if (activeModal === 'deposit') handleOpenDepositModal();
    if (activeModal === 'discount') setShowDiscountModal(true);
    if (activeModal === 'edit' || activeModal === 'update') setShowEditPatientModal(true);
    if (activeModal === 'whatsapp') {
      setWhatsAppDefaultType('patientReportMsg');
      setShowWhatsAppModal(true);
    }
    if (activeModal === 'bill' || activeModal === 'invoice') setShowBillPreviewModal(true);
    if (activeModal === 'approval') setShowApproval(true);
    if (activeModal === 'receive_sample') handleReceiveSample();
    if (activeModal === 'release_report') handleReleaseReport();
    if (activeModal === 'recall_report') handleRecallReport();
    if (activeModal === 'delete') handleDeletePatient();
    closeModal();
  }, [activeModal, closeModal, patient, reports]);

  // Listen to modal query param from external navigation (e.g. sidebar from another page)
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    if (!modalParam || !patient) return;
    if (modalParam === 'barcode') setShowBarcodeModal(true);
    else if (modalParam === 'deposit') handleOpenDepositModal();
    else if (modalParam === 'discount') setShowDiscountModal(true);
    else if (modalParam === 'edit' || modalParam === 'update') setShowEditPatientModal(true);
    else if (modalParam === 'whatsapp') {
      setWhatsAppDefaultType('patientReportMsg');
      setShowWhatsAppModal(true);
    }
    else if (modalParam === 'bill' || modalParam === 'invoice') setShowBillPreviewModal(true);
    else if (modalParam === 'approval') setShowApproval(true);
    else if (modalParam === 'receive_sample') handleReceiveSample();
    else if (modalParam === 'release_report') handleReleaseReport();
    else if (modalParam === 'recall_report') handleRecallReport();
    else if (modalParam === 'delete') handleDeletePatient();

    const newParams = new URLSearchParams(searchParams);
    newParams.delete('modal');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, patient]);

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
      const bUrls = res.data?.printBarCodeUrls || pt?.printBarCodeUrls || [];
      if (awsReportUrl) setReportPdfUrl(awsReportUrl);
      if (awsBillUrl) setBillPdfUrl(awsBillUrl);
      if (Array.isArray(bUrls) && bUrls.length > 0) setBarcodeUrls(bUrls);

      if (pt) {
        setPatient(pt);
        setReports(Array.isArray(repList) ? repList : []);
        setTemplates(Array.isArray(res.data?.templates) ? res.data.templates : []);
        setActivePatient(pt);

        // Seamlessly update route URL if URL was an slNo/barcode and upstream assigned a real P-ID (e.g. /patients/8769959959 -> /patients/P14)
        if (pt.patientId && pt.patientId !== id && !id.toUpperCase().startsWith('P')) {
          const queryString = searchParams.toString();
          navigate(`/patients/${pt.patientId}${queryString ? `?${queryString}` : ''}`, { replace: true });
        }
      } else if (!isRateLimited) {
        // Only apply fallback patient if not rate-limited and no existing data
        setPatient((prev) => {
          if (!prev) {
            if (activePatient && (
              activePatient.patientId === id ||
              activePatient.slNo === id ||
              activePatient.barcode === id ||
              String(activePatient.patientId || '').replace(/^P+/i, '') === String(id || '').replace(/^P+/i, '')
            )) {
              return activePatient;
            }
            return applyFallbackPatient();
          }
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

  const handleOpenReportPdf = () => {
    const rawPid = patient?.patientId || id;
    const target = patient?.printPDFUrl || patient?.reportUrl || reportPdfUrl;
    openReportPdf(rawPid, { targetUrl: target });
  };

  const handleOpenBillPdf = () => {
    const rawPid = patient?.patientId || id;
    const target = patient?.billUrl || billPdfUrl;
    openBillingPdf(rawPid, { targetUrl: target });
  };

  const handleDeletePatient = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Patient Record?',
      message: `Are you sure you want to permanently delete patient "${patient?.name || id}" (ID: ${id})?`,
      description: 'This will remove the patient record from active worklists and diagnostic reports.',
      confirmText: 'Delete Patient',
      cancelText: 'Cancel',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        try {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          setLoading(true);
          const res = await api.post('/patients/delete', {
            patientId: id,
            patientName: patient?.name,
            slNo: patient?.slNo,
            mobile: patient?.mobile,
          });
          if (res.data?.STATUS === 'FAILED') {
            throw new Error(res.data?.Message || 'Failed to delete patient');
          }
          clearActivePatient();
          navigate('/patients');
        } catch (err) {
          setErrorMessage(err.response?.data?.Message || err.message || 'Error deleting patient');
          setLoading(false);
        }
      },
    });
  };


  const applyFallbackPatient = () => {
    const isMatchingActive =
      activePatient && (
        activePatient.patientId === id ||
        activePatient.slNo === id ||
        activePatient.barcode === id ||
        String(activePatient.patientId || '').replace(/^P+/i, '') === String(id || '').replace(/^P+/i, '')
      );
    const fallback = isMatchingActive
      ? activePatient
      : {
          patientId: id,
          slNo: activePatient?.slNo || '',
          barcode: activePatient?.barcode || activePatient?.slNo || '',
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
    return fallback;
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
      const lots = groupInvestigationsIntoLots(rList, p, catalogProfiles, catalogPackages, catalogTests, catalogTemplates, templates);
      items = lots.map((lot, idx) => ({
        slNo: idx + 1,
        testName: lot.name,
        rate: Number(lot.amount || 0),
        disc: 0,
        amount: Number(lot.amount || 0),
      }));
    }

    const itemsSum = items.reduce((acc, it) => acc + it.amount, 0);
    const discount = Number(p?.discount || 0);
    const roundoff = Number(p?.roundoff || 0);
    const grossTotal = itemsSum > 0
      ? itemsSum
      : (Number(p?.grossTotal || 0) > 0
          ? Number(p.grossTotal)
          : (Number(p?.totalBill || 0) > 0 && discount > 0
              ? Number(p.totalBill) + discount
              : Number(p?.totalBill || 0)));
    const netTotal = (Number(p?.totalBill || 0) > 0 && Number(p.totalBill) !== grossTotal)
      ? Number(p.totalBill)
      : Math.max(0, grossTotal - discount - roundoff);
    const isPaid = (p?.billPayStatus === 2 || p?.billPayStatus === '2') && netTotal > 0;
    const paid = isPaid ? netTotal : Number(p?.paidBill || 0);
    const due = isPaid ? 0 : (p?.dueAmount !== undefined && p?.dueAmount !== null ? Number(p.dueAmount) : Math.max(0, netTotal - paid));

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
      // Immediately reset previous patient state to avoid stale data leakage when switching or adding patients
      setPatient(null);
      setReports([]);
      setTemplates([]);
      setInvoiceData(null);
      setReportPdfUrl('');
      setBillPdfUrl('');
      setDepositAmount('');
      setNotification('');
      setErrorMessage('');
      fetchPatientData();
    }
  }, [id]);

  const handleReceiveSample = () => {
    const rawPid = patient?.patientId || id;
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';

    setConfirmDialog({
      isOpen: true,
      title: 'Receive Sample Specimen',
      message: `Confirm sample specimen receipt for ${patient?.name || 'Patient'} (${cleanPid || rawPid})?`,
      description: 'This will mark all ordered diagnostic specimens as received at the laboratory accession desk and update upstream tracking (RECEIVESAMPLE).',
      confirmText: 'Receive Sample',
      cancelText: 'Cancel',
      variant: 'indigo',
      icon: TestTube,
      onConfirm: async () => {
        setErrorMessage('');
        setNotification('');
        try {
          const res = await api.post('/reports/receive-sample', { patientId: cleanPid || rawPid });
          if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode === '1211') {
            throw new Error(res.data?.Message || 'Failed to receive sample (1211)');
          }
          setNotification(res.data?.Message || 'Sample specimen received and accessioned!');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await fetchPatientData();
        } catch (err) {
          const msg = err.response?.data?.Message || err.message || 'Failed to receive sample';
          setErrorMessage(msg);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleReleaseReport = () => {
    const rawPid = patient?.patientId || id;
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';

    setConfirmDialog({
      isOpen: true,
      title: 'Release Diagnostic Report',
      message: `Are you sure you want to release the diagnostic report for ${patient?.name || 'Patient'} (${cleanPid || rawPid})?`,
      description: 'Releasing will mark the report as finalized, making it ready for patient delivery, portal access, and official printing (RELEASEREPORT).',
      confirmText: 'Release Report',
      cancelText: 'Cancel',
      variant: 'teal',
      icon: Send,
      onConfirm: async () => {
        setErrorMessage('');
        setNotification('');
        try {
          const res = await api.post('/reports/release', { patientId: cleanPid || rawPid });
          if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode === '1211') {
            throw new Error(res.data?.Message || 'Failed to release report (1211)');
          }
          setNotification(res.data?.Message || 'Diagnostic report released successfully!');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await fetchPatientData();
        } catch (err) {
          const msg = err.response?.data?.Message || err.message || 'Failed to release report';
          setErrorMessage(msg);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Task - 10 : Report Recall (RECALLPORT)
  const handleRecallReport = () => {
    const rawPid = patient?.patientId || id;
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';

    setConfirmDialog({
      isOpen: true,
      title: 'Recall Diagnostic Report (RECALLPORT)',
      message: `Are you sure you want to recall the diagnostic report for ${patient?.name || 'Patient'} (${cleanPid || rawPid})?`,
      description: 'Recalling resets the report from approved or released status back to active testing/draft so modifications or re-tests can be performed.',
      confirmText: 'Recall Report',
      cancelText: 'Cancel',
      variant: 'rose',
      icon: Undo2,
      onConfirm: async () => {
        setErrorMessage('');
        setNotification('');
        try {
          const res = await api.post('/reports/recall', { patientId: cleanPid || rawPid });
          if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode === '1211') {
            throw new Error(res.data?.Message || 'Failed to recall report');
          }
          setNotification(res.data?.Message || 'Diagnostic report recalled successfully to draft state!');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await fetchPatientData();
        } catch (err) {
          const msg = err.response?.data?.Message || err.message || 'Failed to recall report';
          setErrorMessage(msg);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const WHATSAPP_TYPE_LABELS = {
    onboardingMsg: {
      title: 'Onboarding Message',
      desc: 'Dispatches registration welcome greetings, Patient ID, Barcode, and booking confirmation.',
      target: patient?.mobile || 'Patient Mobile',
    },
    patientReportMsg: {
      title: 'Report to Patient',
      desc: 'Dispatches official diagnostic report PDF download link directly to patient.',
      target: patient?.mobile || 'Patient Mobile',
    },
    doctorReportMsg: {
      title: 'Report to Doctor',
      desc: 'Dispatches diagnostic findings and clinical report directly to referring doctor.',
      target: patient?.referedDr || 'Referring Doctor',
    },
    agentReportMsg: {
      title: 'Report to Referring Agent',
      desc: 'Dispatches diagnostic report copy and test status to referring agent / center.',
      target: patient?.center || 'Referring Agent',
    },
  };

  const handleSendWhatsApp = (sendType = 'patientReportMsg') => {
    const rawPid = patient?.patientId || id;
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';
    const phone = patient?.mobile || patient?.phone || '';
    const meta = WHATSAPP_TYPE_LABELS[sendType] || WHATSAPP_TYPE_LABELS.patientReportMsg;

    setConfirmDialog({
      isOpen: true,
      title: `Send ${meta.title} via WhatsApp`,
      message: `Send ${meta.title} via WhatsApp for ${patient?.name || 'Patient'} to ${meta.target}?`,
      description: `${meta.desc} (API parameter: sendType=${sendType})`,
      confirmText: 'Send WhatsApp',
      cancelText: 'Cancel',
      variant: 'whatsapp',
      icon: MessageSquare,
      onConfirm: async () => {
        setErrorMessage('');
        setNotification('');
        try {
          const res = await api.post('/reports/send-whatsapp', {
            patientId: cleanPid || rawPid,
            sendType,
          });
          if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode === '1211') {
            throw new Error(res.data?.Message || 'Failed to send report via WhatsApp (1211)');
          }
          setNotification(res.data?.Message || `${meta.title} dispatched via WhatsApp successfully!`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await fetchPatientData();
        } catch (err) {
          const msg = err.response?.data?.Message || err.message || 'Failed to send report via WhatsApp';
          setErrorMessage(msg);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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
      setBillRefreshKey((prev) => prev + 1);
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
    setBillRefreshKey((prev) => prev + 1);
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
        <title>{patient ? `${patient.name} (${patient?.slNo || patient?.barcode || 'Patient'})` : 'Patient Profile'} | Lab Expert</title>
        <meta
          name="description"
          content={`Patient record and clinical investigations for ${patient?.name || ''}`}
        />
      </Helmet>

      {/* Top Header Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              clearActivePatient();
              navigate('/patients');
            }}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors cursor-pointer"
            title="Back to patient worklist"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {(patient?.title || activePatient?.title) ? `${patient?.title || activePatient?.title} ` : ''}
                {patient?.name || activePatient?.name || 'Patient'}
              </h1>
              <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Barcode: {patient?.slNo || patient?.barcode || activePatient?.slNo || activePatient?.barcode || '-'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Ref by: <strong className="text-slate-700">{patient?.referedDr || activePatient?.referedDr || 'Self'}</strong> • Reg: {formatDisplayDate(patient?.regDate || patient?.collectionDate || activePatient?.regDate || activePatient?.collectionDate)}{patient?.sampleTime ? ` • Sample: ${patient.sampleTime}` : ''}
            </span>
          </div>
        </div>

        {/* Clean, High-Contrast View Switcher Tabs */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'profile' })}
            className={`py-1.5 px-3.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'journey' })}
            className={`py-1.5 px-3.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'journey'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium'
            }`}
          >
            10-Stage Journey
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'tests' })}
            className={`py-1.5 px-3.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium'
            }`}
          >
            Test Selection
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'billing' })}
            className={`py-1.5 px-3.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'billing' || activeTab === 'invoice'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium'
            }`}
          >
            Billing
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

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="font-bold text-rose-700 hover:opacity-75 cursor-pointer text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'profile' && (
        <PatientProfileView
          key={patient?.patientId || id}
          patient={patient}
          reports={reports}
          templates={templates}
          onAddTests={() => setSearchParams({ tab: 'tests' })}
          onFillResults={() => setSearchParams({ tab: 'results' })}
          onPrintInvoice={handleOpenBillPdf}
          onPrintReport={handleOpenReportPdf}
          onReceiveSample={handleReceiveSample}
          onReleaseReport={handleReleaseReport}
          onRecallReport={handleRecallReport}
          onSendWhatsApp={handleSendWhatsApp}
          onOpenWhatsAppModal={(defaultType) => {
            setWhatsAppDefaultType(defaultType || 'patientReportMsg');
            setShowWhatsAppModal(true);
          }}
          onAddDeposit={handleOpenDepositModal}
          onAddDiscount={() => setShowDiscountModal(true)}
          onOpenSettings={() => setShowBarcodeModal(true)}
          onEditPatient={() => setShowEditPatientModal(true)}
          onDeletePatient={handleDeletePatient}
          onEditBill={() => setShowEditBillModal(true)}
          onTrackJourney={() => setSearchParams({ tab: 'journey' })}
          onOpenApproval={() => setShowApproval(true)}
        />
      )}

      {activeTab === 'journey' && (
        <PatientJourneyTimeline
          key={patient?.patientId || id}
          patient={patient}
          reports={reports}
          onReceiveSample={handleReceiveSample}
          onReleaseReport={handleReleaseReport}
          onRecallReport={handleRecallReport}
          onSendWhatsApp={handleSendWhatsApp}
          onOpenWhatsAppModal={(defaultType) => {
            setWhatsAppDefaultType(defaultType || 'patientReportMsg');
            setShowWhatsAppModal(true);
          }}
          onOpenApproval={() => setShowApproval(true)}
        />
      )}

      {activeTab === 'tests' && (
        <TestSelectionView
          key={patient?.patientId || activePatient?.patientId || id}
          patient={patient || activePatient}
          reports={reports}
          templates={templates}
          onRefresh={fetchPatientData}
          onPrintInvoice={() => setSearchParams({ tab: 'billing' })}
          onFillResults={() => setSearchParams({ tab: 'results' })}
          onMakePayment={handleOpenDepositModal}
          onAddDiscount={() => setShowDiscountModal(true)}
        />
      )}

      {activeTab === 'results' && (
        <ResultsEntry
          key={patient?.patientId || id}
          patient={patient}
          reports={reports}
          templates={templates}
          onRefresh={fetchPatientData}
        />
      )}

      {(activeTab === 'billing' || activeTab === 'invoice') && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Diagnostic Billing & Financial Ledger</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official diagnostic charges, payments, concessions, and real-time AWS ledger
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Payment Button (Colored - Emerald Green) */}
              <button
                type="button"
                onClick={handleOpenDepositModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                title="Record Patient Payment / Deposit"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payment</span>
              </button>

              {/* Add Discount Button (Colored - Indigo) */}
              <button
                type="button"
                onClick={() => setShowDiscountModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                title="Apply Concession or Discount to Bill"
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Add Discount</span>
              </button>

              {/* Edit Bill Particulars & Rates */}
              <button
                type="button"
                onClick={() => setShowEditBillModal(true)}
                className="p-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
                title="Edit Bill Particulars & Rates (BILLUPDATE)"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AwsBillViewer
            key={`aws-bill-${id}-${billRefreshKey}`}
            patientId={id}
            refreshKey={billRefreshKey}
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
        barcodeUrls={barcodeUrls.length > 0 ? barcodeUrls : patient?.printBarCodeUrls}
      />

      {/* Discount Modal */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        patient={patient}
        totalAmount={grossTotal}
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

      {/* WhatsApp Dispatch Hub Modal (Task 11: 4 Message Types) */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        patient={patient}
        defaultType={whatsAppDefaultType}
        onSuccess={(type, msg) => {
          setNotification(msg);
          setShowWhatsAppModal(false);
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
              <option value="CASH">CASH</option>
              <option value="OFFLINE_UPI">OFFLINE_UPI</option>
              <option value="CARD">CARD</option>
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
            setBillRefreshKey((prev) => prev + 1);
            await fetchPatientData();
            setShowEditBillModal(false);
          }}
          onOpenDeposit={handleOpenDepositModal}
          onOpenPrint={() => setShowBillPreviewModal(true)}
        />
      )}

      {/* Universal Side-Effect Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        icon={confirmDialog.icon}
      />
    </section>
  );
}
