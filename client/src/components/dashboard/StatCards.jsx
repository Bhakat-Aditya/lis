import React from 'react';
import {
  Users,
  CreditCard,
  FileCheck2,
  IndianRupee,
} from 'lucide-react';

export default function StatCards({
  totalPatients = 0,
  paymentReceived = 0,
  reportsReleased = 0,
  totalBilledAmount = 0,
  // Legacy / fallback props
  totalCount,
  totalRevenue,
  readyPrint,
}) {
  const patientCount = Number(totalPatients ?? totalCount ?? 0);
  const receivedAmount = Number(paymentReceived ?? 0);
  const releasedCount = Number(reportsReleased ?? readyPrint ?? 0);
  const billedAmount = Number(totalBilledAmount ?? totalRevenue ?? 0);

  const cards = [
    {
      id: 'TOTAL_PATIENTS',
      title: 'Total Patients',
      value: patientCount.toLocaleString('en-IN'),
      subtitle: 'Registered diagnostic patients',
      icon: Users,
      color: 'indigo',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    {
      id: 'PAYMENT_RECEIVED',
      title: 'Total Payment Received',
      value: `₹${receivedAmount.toLocaleString('en-IN')}`,
      subtitle: 'Total collections received',
      icon: CreditCard,
      color: 'emerald',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'REPORTS_RELEASED',
      title: 'Total Report Released',
      value: releasedCount.toLocaleString('en-IN'),
      subtitle: 'Verified & released reports',
      icon: FileCheck2,
      color: 'blue',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'BILLED_AMOUNT',
      title: 'Total Billed Amount',
      value: `₹${billedAmount.toLocaleString('en-IN')}`,
      subtitle: 'Gross diagnostic invoices',
      icon: IndianRupee,
      color: 'amber',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs transition-all duration-200 relative select-none hover:border-slate-300"
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Value */}
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {card.value}
            </div>

            {/* Subtitle */}
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate font-medium">
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
