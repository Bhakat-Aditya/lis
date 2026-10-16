import React from 'react';

export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.2',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold border rounded-md uppercase tracking-tight ${variants[variant] || variants.default} ${sizes[size] || sizes.sm}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status = '' }) {
  const s = status.toUpperCase();
  if (s === 'REGISTERED') return <Badge variant="primary">Registered</Badge>;
  if (s === 'SAMPLE' || s === 'SAMPLE RECEIVED') return <Badge variant="warning">Sample Recd</Badge>;
  if (s === 'TESTING' || s === 'IN TESTING') return <Badge variant="purple">In Testing</Badge>;
  if (s === 'SAVED') return <Badge variant="blue">Saved</Badge>;
  if (s === 'PRINTING') return <Badge variant="blue">Ready To Print</Badge>;
  if (s === 'VERIFIED') return <Badge variant="success">Verified</Badge>;
  if (s === 'APPROVED' || s === 'RELEASED') return <Badge variant="success">Approved</Badge>;
  if (s === 'REJECTED') return <Badge variant="danger">Rejected</Badge>;

  return <Badge>{status || 'Normal'}</Badge>;
}
