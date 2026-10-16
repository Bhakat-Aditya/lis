import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/context.auth.jsx';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileSpreadsheet,
  CheckCircle,
  Receipt,
  Database,
  Printer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function Sidebar({ onOpenNewPatient }) {
  const { user, hasRole } = useAuth();

  const isSuper = user?.role === 'Super';
  const isDoctor = hasRole(['Doctor', 'Super']);
  const isTech = hasRole(['Technician', 'Super']);
  const isReception = hasRole(['Receptionist', 'Branch', 'Office', 'Super']);

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-53px)] select-none">
      <div className="p-3 space-y-4 flex-1">
        {/* Quick Action: Register Patient */}
        {isReception && (
          <button
            onClick={onOpenNewPatient}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Patient</span>
          </button>
        )}

        {/* Navigation Sections */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Core Clinical
          </div>

          <NavLink to="/" className={navItemClass}>
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/patients" className={navItemClass}>
            <Users className="w-4 h-4 text-slate-500" />
            <span>Patient Worklist</span>
          </NavLink>

          {isTech && (
            <NavLink to="/results" className={navItemClass}>
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Fill Results</span>
            </NavLink>
          )}

          {isDoctor && (
            <NavLink to="/approvals" className={navItemClass}>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Doctor Verification</span>
            </NavLink>
          )}

          {isReception && (
            <NavLink to="/billing" className={navItemClass}>
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Billing & Invoices</span>
            </NavLink>
          )}
        </div>

        {/* Administration & Master Data */}
        {isSuper && (
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Management
            </div>

            <NavLink to="/master" className={navItemClass}>
              <Database className="w-4 h-4 text-slate-500" />
              <span>Master Data (24h)</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Footer Support Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between font-semibold text-slate-700">
          <span>LIS System v2.6</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="text-[10px] text-slate-400">
          Connected to AWS Main Server
        </div>
      </div>
    </aside>
  );
}
