import React from 'react';
import {
  TrendingUp,
  Phone,
  PhoneOff,
  UserCheck,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Receipt,
  FileCheck2,
  Printer,
  Microscope,
  Activity,
  ShieldCheck,
} from 'lucide-react';

/**
 * 1. Statistics for "Last 9 Days Patient Registration"
 */
export function RegistrationStats({ data = [] }) {
  const totalInWindow = data.reduce((acc, d) => acc + (d.totalCount || ((d.withNumber || 0) + (d.withoutNumber || 0))), 0);
  const totalWith = data.reduce((acc, d) => acc + (d.withNumber || 0), 0);
  const totalWithout = data.reduce((acc, d) => acc + (d.withoutNumber || 0), 0);
  const mobileRate = totalInWindow > 0 ? ((totalWith / totalInWindow) * 100).toFixed(1) : 0;
  const avgPerDay = data.length > 0 ? Math.round(totalInWindow / data.length) : 0;

  // Find peak day
  let peak = { dayLabel: '-', totalCount: 0 };
  data.forEach((d) => {
    const c = d.totalCount || ((d.withNumber || 0) + (d.withoutNumber || 0));
    if (c > peak.totalCount) peak = { dayLabel: d.dayLabel, totalCount: c };
  });

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            9-Day Volume
          </span>
          <span className="text-xl font-extrabold text-slate-900">{totalInWindow}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Total registered</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Avg Daily Intake
          </span>
          <span className="text-xl font-extrabold text-blue-600">{avgPerDay}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Patients / day</span>
        </div>
      </div>

      <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            Phone Verification Rate
          </span>
          <span className="font-bold text-blue-700">{mobileRate}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${mobileRate}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>With Phone: <strong className="text-slate-800">{totalWith}</strong></span>
          <span>Without: <strong className="text-red-600">{totalWithout}</strong></span>
        </div>
      </div>

      <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200/70 rounded-xl text-emerald-800 text-[11px]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Peak Registration:</span>
        </div>
        <span className="font-bold">{peak.dayLabel} ({peak.totalCount} patients)</span>
      </div>
    </div>
  );
}

/**
 * 2. Statistics for "Male-Female Ratio"
 */
export function GenderStats({ data }) {
  const male = data?.breakdown?.find((b) => b.label.toLowerCase().includes('male')) || { count: 49, percentage: 55.7 };
  const female = data?.breakdown?.find((b) => b.label.toLowerCase().includes('female')) || { count: 39, percentage: 44.3 };
  const total = (data?.total || (male.count + female.count)) || 88;
  const ratioText = data?.dailyStatistics?.ratioText || `${((male.count || 1) / (female.count || 1)).toFixed(2)} : 1`;

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Male</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{male.count}</div>
          <div className="text-[11px] font-bold text-red-600">{male.percentage}%</div>
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Female</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{female.count}</div>
          <div className="text-[11px] font-bold text-emerald-600">{female.percentage}%</div>
        </div>
      </div>

      <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">Sex Ratio (M:F)</span>
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
            {ratioText}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100 text-[11px]">
          <span>Total Evaluated:</span>
          <span className="font-bold text-slate-800">{total} Patients</span>
        </div>
      </div>

      <div className="p-2.5 bg-blue-50 border border-blue-200/70 rounded-xl text-blue-900 text-[11px] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
        <span>Gender-specific clinical reference ranges applied in reports</span>
      </div>
    </div>
  );
}

/**
 * 3. Statistics for "Patient Bill Status"
 */
export function BillStatusStats({ data }) {
  const items = data?.breakdown || [];
  const totalInvoices = data?.dailyStatistics?.totalInvoices || data?.total || 88;
  const clearanceRate = data?.dailyStatistics?.clearanceRate || 62.5;

  return (
    <div className="space-y-3 text-xs">
      <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Bill Clearance Rate
          </span>
          <span className="text-2xl font-black text-emerald-600">{clearanceRate}%</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Invoices
          </span>
          <span className="text-xl font-bold text-slate-900">{totalInvoices}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {items.map((item) => (
          <div key={item.label} className="p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-slate-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-500 font-semibold">{item.count}</span>
              <span className="font-bold text-slate-900 w-12 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4. Statistics for "Bill Amount Breakup"
 */
export function BillAmountStats({ data }) {
  const items = data?.breakdown || [];
  const gross = data?.grossAmount || 142500;
  const received = data?.dailyStatistics?.totalReceived || 78232.5;
  const due = data?.dailyStatistics?.outstandingDue || 54577.5;
  const efficiency = data?.dailyStatistics?.collectionEfficiency || 54.9;

  return (
    <div className="space-y-3 text-xs">
      <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Collection Efficiency
          </span>
          <span className="font-black text-emerald-600 text-sm">{efficiency}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${efficiency}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 pt-2 mt-2 border-t border-slate-100">
          <span>Gross Billed: <strong>₹{Number(gross).toLocaleString('en-IN')}</strong></span>
          <span>Received: <strong className="text-emerald-600">₹{Number(received).toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {items.map((item) => (
          <div key={item.label} className="p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-slate-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-800 font-bold">
                ₹{Number(item.amount || 0).toLocaleString('en-IN')}
              </span>
              <span className="font-bold text-slate-500 w-12 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      {due > 0 && (
        <div className="p-2 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 flex items-center justify-between">
          <span>Pending Due Balance:</span>
          <strong className="text-amber-900 font-mono">₹{Number(due).toLocaleString('en-IN')}</strong>
        </div>
      )}
    </div>
  );
}

/**
 * 5. Statistics for "Test Result Summary"
 */
export function TestResultStats({ data }) {
  const items = data?.breakdown || [];
  const total = data?.totalTests || 384;
  const autoRatio = data?.dailyStatistics?.autoCalculatedRatio || 17.2;

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Tests
          </span>
          <span className="text-xl font-extrabold text-slate-900">{total}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Parameters run</span>
        </div>

        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
            Auto-Calculated
          </span>
          <span className="text-xl font-extrabold text-blue-700">{autoRatio}%</span>
          <span className="text-[10px] text-blue-600 block mt-0.5">Analyzer auto-calc</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden max-h-[190px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.label} className="p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-slate-700 text-[11px]">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500 text-[11px]">{item.count}</span>
              <span className="font-bold text-slate-900 text-[11px] w-12 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. Statistics for "Department Wise Report Count"
 */
export function DepartmentReportStats({ data }) {
  const items = data?.breakdown || [];
  const topDept = data?.dailyStatistics?.highestVolumeDept || 'BIOCHEMISTRY TESTS';

  return (
    <div className="space-y-3 text-xs">
      <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block mb-0.5">
            Top Laboratory Bench
          </span>
          <span className="text-sm font-extrabold text-slate-900">{topDept}</span>
        </div>
        <span className="text-xs font-bold text-red-600 bg-white px-2.5 py-1 rounded-lg border border-red-200 shadow-2xs">
          63.5%
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden max-h-[190px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.label} className="p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate max-w-[190px]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-slate-700 text-[11px] truncate">{item.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-slate-500 text-[11px]">{item.count}</span>
              <span className="font-bold text-slate-900 text-[11px] w-12 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 7. Statistics for "Patient Report Preparation Progress"
 */
export function ReportProgressStats({ data }) {
  const items = data?.breakdown || [];
  const printing = data?.dailyStatistics?.readyForDelivery || 70;
  const total = data?.totalWorklist || 88;
  const progressPct = data?.dailyStatistics?.turnaroundProgress || 86.3;

  return (
    <div className="space-y-3 text-xs">
      <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-100 shadow-2xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700">
            Ready to Print & Release
          </span>
          <span className="font-black text-pink-700 text-lg">{printing}</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-pink-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 pt-1.5 mt-1 border-t border-pink-100">
          <span>Verification Velocity: <strong className="text-slate-800">{progressPct}%</strong></span>
          <span>Queue Total: <strong className="text-slate-800">{total}</strong></span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {items.map((item) => (
          <div key={item.label} className="p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-slate-700 text-[11px]">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500 text-[11px]">{item.count}</span>
              <span className="font-bold text-slate-900 text-[11px] w-12 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

