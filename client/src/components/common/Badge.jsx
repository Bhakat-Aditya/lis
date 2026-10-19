import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}) {
  const variants = {
    default: 'bg-slate-100/90 text-slate-700 border-slate-200/90',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/80',
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    purple: 'bg-purple-500',
    blue: 'bg-sky-500',
    teal: 'bg-teal-500',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded-sm font-semibold tracking-wide',
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-semibold tracking-tight',
    md: 'text-xs px-2.5 py-1 rounded-md font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border shadow-2xs font-medium uppercase ${variants[variant] || variants.default} ${sizes[size] || sizes.sm} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'} shrink-0`} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status = '', size = 'sm' }) {
  const s = String(status || '').toUpperCase().trim();

  if (s === 'REGISTERED') {
    return <Badge variant="primary" size={size} dot>Registered</Badge>;
  }
  if (s === 'SAMPLE' || s === 'SAMPLE RECEIVED' || s === 'SAMPLE_RECEIVED') {
    return <Badge variant="warning" size={size} dot>Sample Recd</Badge>;
  }
  if (s === 'TESTING' || s === 'IN TESTING' || s === 'SAVED') {
    return <Badge variant="purple" size={size} dot>In Testing</Badge>;
  }
  if (s === 'PRINTING' || s === 'READY TO PRINT') {
    return <Badge variant="blue" size={size} dot>Ready to Print</Badge>;
  }
  if (s === 'VERIFIED') {
    return <Badge variant="teal" size={size} dot>Doctor Verified</Badge>;
  }
  if (s === 'APPROVED' || s === 'RELEASED') {
    return <Badge variant="success" size={size} dot>Approved</Badge>;
  }
  if (s === 'REJECTED') {
    return <Badge variant="danger" size={size} dot>Rejected</Badge>;
  }

  return <Badge size={size}>{status || 'Active'}</Badge>;
}

export function PriorityBadge({ priority = 'Routine' }) {
  const p = String(priority).toUpperCase();
  if (p === 'STAT' || p === 'EMERGENCY' || p === 'CRITICAL') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        STAT
      </span>
    );
  }
  if (p === 'URGENT') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
        URGENT
      </span>
    );
  }
  return (
    <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 bg-slate-100 rounded">
      Routine
    </span>
  );
}

export function PaymentBadge({ balance = 0, total = 0 }) {
  const bal = Number(balance) || 0;
  if (bal <= 0 && total > 0) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
        PAID
      </span>
    );
  }
  if (bal > 0 && bal < total) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-700 border border-amber-200">
        DUE ₹{bal.toFixed(0)}
      </span>
    );
  }
  if (bal > 0) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-rose-50 text-rose-700 border border-rose-200">
        UNPAID
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
      PAID
    </span>
  );
}

