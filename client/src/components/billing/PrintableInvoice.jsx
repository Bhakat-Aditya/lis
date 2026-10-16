import React from 'react';
import {
  Printer,
  Home,
  Download,
  FileText,
  Share2,
  Plus,
  UserPlus,
  FileEdit,
  Settings,
  LogOut,
  QrCode,
  Award,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrintableInvoice({ invoiceData, onFillResults, onHome }) {
  const navigate = useNavigate();

  if (!invoiceData) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Loading invoice...
      </div>
    );
  }

  const { clinic, patient, items = [], financials } = invoiceData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start justify-center p-4">
      {/* Left Action Buttons Bar (Matching User Screenshot 2) */}
      <div className="no-print flex xl:flex-col flex-wrap gap-1.5 w-full xl:w-36 shrink-0">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs py-2 px-3 rounded shadow-xs cursor-pointer transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>PRINT</span>
        </button>

        <button
          onClick={onHome || (() => navigate('/patients'))}
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs py-2 px-3 rounded shadow-xs cursor-pointer transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>HOME</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs py-2 px-3 rounded shadow-xs cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>DOWNLOAD</span>
        </button>

        <button
          onClick={() => navigate(`/patients/${patient.patientId}?tab=report`)}
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs py-2 px-3 rounded shadow-xs cursor-pointer transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>REPORT</span>
        </button>

        <button
          onClick={() => alert(`Sending invoice to patient mobile: ${patient.mobile || 'WhatsApp'}`)}
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs py-2 px-3 rounded shadow-xs cursor-pointer transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>WHATSAPP</span>
        </button>

        {onFillResults && (
          <button
            onClick={onFillResults}
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs py-2 px-3 rounded shadow-xs cursor-pointer transition-colors"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>FILL RESULT</span>
          </button>
        )}
      </div>

      {/* Main Invoice Sheet (Exact Replica of User Screenshot 2) */}
      <div className="w-full max-w-[850px] bg-white border border-slate-300 shadow-md p-8 text-black print-shadow-none">
        {/* Top Header: Clinic Name & Badges */}
        <div className="border border-black p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Address */}
          <div className="flex items-center gap-4">
            {/* Heartbeat Clinic Crest */}
            <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center bg-white shrink-0 p-1">
              <div className="w-full h-full rounded-full border border-sky-500 flex flex-col items-center justify-center text-[8px] font-bold text-red-600">
                <span>NEW</span>
                <span className="text-sky-600">LIFE</span>
              </div>
            </div>
            <div>
              <h1 className="font-extrabold text-base md:text-lg tracking-tight uppercase leading-tight">
                {clinic.name || 'NEW LIFE CARE DIAGNOSTIC CENTER'}
              </h1>
              <p className="text-[11px] font-medium leading-tight">
                {clinic.address}
              </p>
              <p className="text-[11px] font-medium leading-tight">
                Mobile: {clinic.mobile}
              </p>
              <p className="text-[11px] text-slate-700 leading-tight">
                {clinic.email} || {clinic.website}
              </p>
            </div>
          </div>

          {/* Accreditations & QR Code */}
          <div className="flex items-center gap-3 shrink-0">
            {/* ISO Badge */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-amber-500 flex flex-col items-center justify-center text-[7px] font-bold text-amber-700 bg-amber-50 leading-tight">
                <span>ISO</span>
                <span>9001:2015</span>
              </div>
            </div>

            {/* NABL Badge */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-red-600 flex flex-col items-center justify-center text-[8px] font-bold text-red-600 bg-red-50 leading-tight">
                <span>NABL</span>
                <span>LABS</span>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="w-14 h-14 border border-black p-1 flex items-center justify-center bg-white">
              <QrCode className="w-12 h-12 text-black" />
            </div>
          </div>
        </div>

        {/* INVOICE Title Banner */}
        <div className="border-x border-b border-black text-center py-1 font-bold text-sm tracking-wider uppercase bg-slate-50">
          INVOICE
        </div>

        {/* Patient Metadata Grid */}
        <div className="border-x border-b border-black text-xs">
          <div className="grid grid-cols-2 divide-x divide-black">
            {/* Left Col */}
            <div className="p-2 space-y-1">
              <div className="flex">
                <span className="w-24 font-bold">+ Name:</span>
                <span className="font-semibold uppercase">{patient.name}</span>
              </div>
              <div className="flex">
                <span className="w-24 font-bold">Age:</span>
                <span>{patient.age}</span>
              </div>
              <div className="flex">
                <span className="w-24 font-bold">Gender:</span>
                <span>{patient.gender}</span>
              </div>
            </div>

            {/* Right Col */}
            <div className="p-2 space-y-1">
              <div className="flex">
                <span className="w-28 font-bold">Patient ID:</span>
                <span className="font-mono font-bold">{patient.patientId}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold">Collection Date:</span>
                <span>{patient.collectionDate}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold">Ref by Dr.:</span>
                <span className="font-semibold uppercase">{patient.referredBy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Table (Matching Screenshot 2) */}
        <div className="border-x border-b border-black">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white font-bold text-[11px]">
                <th className="py-1.5 px-3 text-left w-12 border-r border-slate-700">S.N.</th>
                <th className="py-1.5 px-3 text-left border-r border-slate-700">TEST NAME</th>
                <th className="py-1.5 px-3 text-center w-24 border-r border-slate-700">RATE</th>
                <th className="py-1.5 px-3 text-center w-20 border-r border-slate-700">DISC</th>
                <th className="py-1.5 px-3 text-right w-28">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {items.map((item, idx) => (
                <tr key={idx} className="min-h-[28px]">
                  <td className="py-2 px-3 text-center border-r border-black font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-black font-medium uppercase">
                    {item.name}
                  </td>
                  <td className="py-2 px-3 text-center border-r border-black">
                    {item.rate}
                  </td>
                  <td className="py-2 px-3 text-center border-r border-black">
                    {item.discount || 0}
                  </td>
                  <td className="py-2 px-3 text-right font-medium">
                    {item.amount}
                  </td>
                </tr>
              ))}
              {/* Blank filler rows to match standard A4 medical invoice height */}
              {items.length < 5 && (
                Array.from({ length: 5 - items.length }).map((_, i) => (
                  <tr key={`fill-${i}`} className="h-7">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Calculations Box */}
        <div className="border-x border-b border-black text-xs">
          <div className="grid grid-cols-12">
            {/* Amount In Words (Left 7 cols) */}
            <div className="col-span-7 p-3 flex flex-col justify-end border-r border-black">
              <span className="font-bold block text-[11px] mb-1">
                {financials.amountInWords}
              </span>
            </div>

            {/* Calculations Breakdown (Right 5 cols) */}
            <div className="col-span-5 divide-y divide-black font-medium">
              <div className="flex justify-between py-1.5 px-3">
                <span className="font-bold">TOTAL AMOUNT</span>
                <span>{financials.totalAmount}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 font-bold">
                <span>NET AMOUNT</span>
                <span>₹{financials.netAmount}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3">
                <span>Depositd by {financials.paymentMode}</span>
                <span>{financials.deposited}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 font-bold bg-slate-50">
                <span>TOTAL DUE</span>
                <span>₹{financials.totalDue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Print Stamp & Signature */}
        <div className="border-x border-b border-black p-3 text-xs flex items-center justify-between">
          <div className="text-[11px] text-slate-700">
            Print Date & Time : {financials.printedAt || new Date().toLocaleString()} || New Life {invoiceData.printedBy}
          </div>
          <div className="text-right">
            <div className="font-bold uppercase tracking-wider text-xs">
              SIGNATURE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
