import React from 'react';
import {
  Printer,
  Home,
  Download,
  FileText,
  Share2,
  FileEdit,
  UserPlus,
  Settings,
  RefreshCw,
  LogOut,
  Tag,
  PlusCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/context.auth.jsx';
import { formatDisplayDate } from '../../utils/dateUtils.js';

export default function PrintableInvoice({
  invoiceData,
  onFillResults,
  onHome,
  onDiscount,
  onDeposit,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  if (!invoiceData) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
        Loading invoice...
      </div>
    );
  }

  const { clinic = {}, patient = {}, items = [], financials = {} } = invoiceData;
  const pid = patient.patientId || patient.slNo || '37653';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    alert(`Sending invoice PDF to patient mobile: ${patient.mobile || '9733525031'}`);
  };

  const displayItems = items || [];
  const totalAmount = Number(financials.totalBill ?? financials.totalAmount ?? displayItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0));
  const discount = Number(financials.discount || 0);
  const netAmount = Number(financials.netBill ?? financials.netAmount ?? (totalAmount - discount));
  const rawPaid = Number(financials.paidAmount ?? financials.deposited ?? 0);
  const rawDue = Number(financials.dueAmount ?? financials.totalDue ?? Math.max(0, netAmount - rawPaid));
  const isPaid = netAmount > 0 && rawDue <= 0 && (rawPaid > 0 || patient.billPayStatus === 2 || patient.billPayStatus === '2');
  const depositedCash = (isPaid && rawPaid <= 0) ? netAmount : rawPaid;
  const totalDue = isPaid ? 0 : rawDue;

  const btnBase =
    'w-full flex items-center gap-2 font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap justify-start text-white active:scale-95';

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start justify-center p-2 print:p-0">
      {/* Left Floating Action Toolbar with Vibrant Tasteful Colors */}
      <div className="no-print flex xl:flex-col flex-wrap gap-1.5 w-full xl:w-36 shrink-0">
        <button onClick={handlePrint} className={`${btnBase} bg-blue-600 hover:bg-blue-700`}>
          <Printer className="w-3.5 h-3.5" />
          <span>PRINT</span>
        </button>

        <button onClick={onHome || (() => navigate('/patients'))} className={`${btnBase} bg-slate-700 hover:bg-slate-800`}>
          <Home className="w-3.5 h-3.5" />
          <span>HOME</span>
        </button>

        <button onClick={handlePrint} className={`${btnBase} bg-indigo-600 hover:bg-indigo-700`}>
          <Download className="w-3.5 h-3.5" />
          <span>DOWNLOAD</span>
        </button>

        <button
          onClick={() => navigate(`/patients/${pid}?tab=results`)}
          className={`${btnBase} bg-violet-600 hover:bg-violet-700`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>REPORT</span>
        </button>

        <button onClick={handleWhatsApp} className={`${btnBase} bg-emerald-600 hover:bg-emerald-700`}>
          <Share2 className="w-3.5 h-3.5" />
          <span>WHATSAPP</span>
        </button>

        <button
          onClick={() => alert('Specimen marked for processing')}
          className={`${btnBase} bg-amber-600 hover:bg-amber-700`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>MARK</span>
        </button>

        <button
          onClick={() => navigate('/patients')}
          className={`${btnBase} bg-sky-600 hover:bg-sky-700`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>PATIENTS</span>
        </button>

        <button
          onClick={onFillResults || (() => navigate(`/patients/${pid}?tab=results`))}
          className={`${btnBase} bg-teal-600 hover:bg-teal-700`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>FILL RESULT</span>
        </button>

        <button
          onClick={() => window.location.reload()}
          className={`${btnBase} bg-slate-600 hover:bg-slate-700`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>REFRESH</span>
        </button>

        <button onClick={logout} className={`${btnBase} bg-rose-600 hover:bg-rose-700`}>
          <LogOut className="w-3.5 h-3.5" />
          <span>LOGOUT</span>
        </button>
      </div>

      {/* Main A4 Printable Invoice Sheet matching Screenshot 5 exactly */}
      <div className="w-full max-w-[820px] bg-white border border-slate-400 shadow-md p-6 text-black print:border-none print:shadow-none print:p-0">
        {/* Outer Frame */}
        <div className="border border-black">
          {/* Header Box: Clinic Brand & Badges */}
          <div className="p-3 border-b border-black flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Logo & Clinic Info */}
            <div className="flex items-center gap-3">
              {/* Circular Emblem */}
              <div className="w-14 h-14 rounded-full border-2 border-rose-500 p-0.5 flex items-center justify-center bg-white shrink-0">
                <div className="w-full h-full rounded-full border border-sky-500 flex flex-col items-center justify-center text-[7px] font-extrabold text-rose-600 leading-tight">
                  <span>NEW</span>
                  <span className="text-sky-600">LIFE</span>
                </div>
              </div>

              <div>
                <h1 className="font-extrabold text-sm md:text-base tracking-tight uppercase leading-tight text-slate-900">
                  {clinic.name || 'NEW LIFE CARE DIAGNOSTIC CENTER'}
                </h1>
                <p className="text-[10px] font-semibold text-slate-700 leading-tight">
                  {clinic.address || 'KERANITOLA, STATION ROAD, PASCHIM MIDNAPOUR (WB) PIN - 721101'}
                </p>
                <p className="text-[10px] font-semibold text-slate-700 leading-tight">
                  Mobile: {clinic.mobile || '9733525031, 9647393949'}
                </p>
                <p className="text-[10px] text-slate-600 leading-tight">
                  {clinic.email || 'noreply@labexperts.in'} || {clinic.website || 'https://newlifecare.labexperts.in'}
                </p>
              </div>
            </div>

            {/* Badges & QR Code */}
            <div className="flex items-center gap-3 shrink-0">
              {/* ISO Badge */}
              <div className="w-11 h-11 rounded-full border-2 border-amber-600 bg-amber-50 flex flex-col items-center justify-center text-[6.5px] font-extrabold text-amber-800 leading-tight text-center">
                <span>ISO</span>
                <span>9001:2015</span>
              </div>

              {/* NABL Badge */}
              <div className="w-11 h-11 rounded-full border-2 border-rose-600 bg-rose-50 flex flex-col items-center justify-center text-[6.5px] font-extrabold text-rose-800 leading-tight text-center">
                <span>NABL</span>
                <span>LABS</span>
              </div>

              {/* QR Code */}
              <div className="w-12 h-12 border border-black p-0.5 bg-white flex flex-col items-center justify-center">
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[6px] text-white font-mono font-bold text-center leading-none">
                  [QR CODE]
                </div>
              </div>
            </div>
          </div>

          {/* Document Title: INVOICE */}
          <div className="border-b border-black text-center py-1 font-extrabold text-xs tracking-wider uppercase bg-slate-50">
            INVOICE
          </div>

          {/* Patient Details Grid (2-columns) matching Screenshot 5 */}
          <div className="p-3 border-b border-black grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-900">
            <div className="flex">
              <span className="font-bold w-24 shrink-0">+ Name</span>
              <span className="font-semibold">: {patient.title ? `${patient.title} ` : ''}{patient.name || 'B/O mobina khatun'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-28 shrink-0">Patient ID</span>
              <span className="font-semibold">: {pid}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24 shrink-0">Age</span>
              <span className="font-semibold">: {patient.age || '1'} {patient.age_unit || 'Days'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-28 shrink-0">Collection Date</span>
              <span className="font-semibold">: {formatDisplayDate(patient.collectionDate || patient.regDate) || '—'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24 shrink-0">Gender</span>
              <span className="font-semibold">: {patient.gender || 'Male'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-28 shrink-0">Ref by Dr.</span>
              <span className="font-semibold truncate">: {patient.referedDr || 'D. A . KHAN MD PEDIATRICS'}</span>
            </div>
          </div>

          {/* Test Items Table with Black Header matching Screenshot 5 */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white text-[10px] font-bold">
                <th className="py-1.5 px-3 w-12 text-center border-r border-slate-700">S.N.</th>
                <th className="py-1.5 px-3 border-r border-slate-700">TEST NAME</th>
                <th className="py-1.5 px-3 text-right w-24 border-r border-slate-700">RATE</th>
                <th className="py-1.5 px-3 text-right w-20 border-r border-slate-700">DISC</th>
                <th className="py-1.5 px-3 text-right w-24">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20 text-slate-900">
              {displayItems.length > 0 ? (
                displayItems.map((item, idx) => (
                  <tr key={idx} className="h-7 text-xs">
                    <td className="py-1 px-3 text-center border-r border-black font-semibold">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-3 border-r border-black font-bold uppercase truncate max-w-xs">
                      {item.testName}
                    </td>
                    <td className="py-1 px-3 text-right border-r border-black font-mono">
                      {Number(item.rate || 0)}
                    </td>
                    <td className="py-1 px-3 text-right border-r border-black font-mono">
                      {Number(item.disc || 0)}
                    </td>
                    <td className="py-1 px-3 text-right font-mono font-bold">
                      {Number(item.amount || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 italic">
                    No diagnostic tests ordered or billed for this patient yet.
                  </td>
                </tr>
              )}
              {/* Pad empty lines if needed */}
              {displayItems.length > 0 && displayItems.length < 3 && (
                <tr className="h-10">
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Financial Summary Box on Bottom Right matching Screenshot 5 */}
          <div className="border-t border-black flex justify-end">
            <div className="w-64 border-l border-black text-xs font-semibold divide-y divide-black/30">
              <div className="flex justify-between py-1 px-3">
                <span className="text-slate-700">TOTAL AMOUNT</span>
                <span className="font-mono font-bold">{totalAmount}</span>
              </div>
              <div className="flex justify-between py-1 px-3 bg-slate-50">
                <span className="font-bold">NET AMOUNT</span>
                <span className="font-mono font-extrabold">₹{netAmount}</span>
              </div>
              <div className="flex justify-between py-1 px-3">
                <span className="text-slate-700">Depositd by Cash</span>
                <span className="font-mono font-bold">{depositedCash}</span>
              </div>
              <div className="flex justify-between py-1 px-3 bg-slate-50">
                <span className="font-bold">TOTAL DUE</span>
                <span className="font-mono font-extrabold text-slate-900">₹{totalDue}</span>
              </div>
            </div>
          </div>

          {/* In Words & Signature Footer matching Screenshot 5 */}
          <div className="p-3 border-t border-black text-xs space-y-3">
            <div className="font-semibold text-slate-900 italic">
              {financials?.amountInWords || 'Zero Rupees Only.'}
            </div>

            <div className="flex items-end justify-between pt-4">
              <div className="text-[10px] text-slate-600 font-mono">
                Print Date & Time : 16-10-2026 05:51:AM || New Life MAMPI
              </div>
              <div className="text-right">
                <div className="w-36 border-t border-black pt-1 text-[11px] font-bold text-center uppercase">
                  SIGNATURE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Floating Action Toolbar (Screenshot 5) */}
      <div className="no-print flex xl:flex-col flex-wrap gap-1.5 w-full xl:w-36 shrink-0">
        <button
          onClick={onDiscount || (() => alert('Apply discount'))}
          className={`${btnBase} bg-rose-600 hover:bg-rose-700`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>DISCOUNT</span>
        </button>

        <button
          onClick={onDeposit || (() => alert('Add deposit'))}
          className={`${btnBase} bg-emerald-600 hover:bg-emerald-700`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>DEPOSIT</span>
        </button>

        <button
          onClick={onDeposit || (() => alert('Update deposit'))}
          className={`${btnBase} bg-blue-600 hover:bg-blue-700`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>UPDATE DEPOSIT</span>
        </button>

        <button
          onClick={() => alert('Update amount')}
          className={`${btnBase} bg-amber-500 hover:bg-amber-600`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>UPDATE AMOUNT</span>
        </button>
      </div>
    </div>
  );
}
