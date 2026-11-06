import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/context.auth.jsx';
import {
  Home,
  UserPlus,
  Users,
  Search,
  Receipt,
  LogOut,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  PanelLeftClose,
  PanelLeft,
  FlaskConical,
  ShieldCheck,
  Database,
  FileText,
  CreditCard,
  Phone,
} from 'lucide-react';

export default function Sidebar({ onOpenNewPatient }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const navItemClass = (isActive, activeColorClass = 'bg-blue-50 text-blue-700 font-bold') =>
    `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
      isActive
        ? `${activeColorClass} shadow-2xs`
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const isPatientRoute =
    location.pathname.startsWith('/patients') || location.pathname.startsWith('/invoice');

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } shrink-0 h-full max-h-screen transition-all duration-200 select-none flex flex-col justify-between bg-white border-r border-slate-200/90 text-slate-800 shadow-2xs relative z-20 overflow-hidden`}
    >
      {/* Scrollable Upper Navigation & Action Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Lab Expert Brand Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Clean Medical Emblem */}
            <div className="w-8 h-8 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FlaskConical className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="leading-tight truncate">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block truncate">
                  New Life Care
                </span>
                <span className="text-[10px] font-semibold text-blue-600 block truncate">
                  Midnapore LIS Portal
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Helpline Banner */}
        {!collapsed && (
          <div className="px-4 py-2 text-[11px] font-semibold text-blue-700 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-blue-500" />
              <span>Helpline Desk:</span>
            </span>
            <span className="font-bold font-mono">8799021616</span>
          </div>
        )}

        {/* Action Button: + New Patient (Colorful, Prominent) */}
        {!collapsed ? (
          <div className="p-3 pb-1">
            <button
              onClick={onOpenNewPatient}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register New Patient</span>
            </button>
          </div>
        ) : (
          <div className="p-2 flex justify-center">
            <button
              onClick={onOpenNewPatient}
              title="Register New Patient"
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Primary Navigation Links */}
        <nav className="p-3 space-y-1">
          {/* Dashboard */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              navItemClass(isActive && !isPatientRoute, 'bg-blue-50 text-blue-700 font-bold')
            }
            title="Dashboard Overview"
          >
            <Home className="w-4 h-4 text-blue-600 shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>

          {/* Patients Directory */}
          <NavLink
            to="/patients"
            className={({ isActive }) =>
              navItemClass(isActive || isPatientRoute, 'bg-blue-50 text-blue-700 font-bold')
            }
            title="Patient Directory & Registration Worklist"
          >
            <Users className="w-4 h-4 text-indigo-600 shrink-0" />
            {!collapsed && <span>Patients Directory</span>}
          </NavLink>

          {/* Results Entry & Testing */}
          <NavLink
            to="/results"
            className={({ isActive }) =>
              navItemClass(isActive, 'bg-violet-50 text-violet-700 font-bold')
            }
            title="Laboratory Results Entry Bench"
          >
            <FlaskConical className="w-4 h-4 text-violet-600 shrink-0" />
            {!collapsed && <span>Results Entry</span>}
          </NavLink>

          {/* Doctor Verifications */}
          <NavLink
            to="/approvals"
            className={({ isActive }) =>
              navItemClass(isActive, 'bg-teal-50 text-teal-700 font-bold')
            }
            title="Pathologist Approvals & Sign-Off"
          >
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            {!collapsed && <span>Approvals & Sign-Off</span>}
          </NavLink>

          {/* Billing & Invoices */}
          <NavLink
            to="/billing"
            className={({ isActive }) =>
              navItemClass(isActive, 'bg-emerald-50 text-emerald-700 font-bold')
            }
            title="Diagnostic Invoices & Ledgers"
          >
            <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
            {!collapsed && <span>Billing & Invoices</span>}
          </NavLink>

          {/* Master Catalogs */}
          <NavLink
            to="/master"
            className={({ isActive }) =>
              navItemClass(isActive, 'bg-slate-100 text-slate-900 font-bold')
            }
            title="Master Catalogs & 24h Cache"
          >
            <Database className="w-4 h-4 text-slate-500 shrink-0" />
            {!collapsed && <span>Master Catalogs</span>}
          </NavLink>
        </nav>
      </div>

      {/* User Status & Fixed Bottom Logout Footer */}
      <div className="shrink-0 p-3 border-t border-slate-100 bg-white space-y-2 mt-auto sticky bottom-0 z-10 shadow-xs">
        {!collapsed && (
          <div className="px-2 py-1.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
            <div className="truncate">
              <span className="font-bold text-slate-900 block truncate">
                {user?.name || user?.loginId || 'Staff'}
              </span>
              <span className="text-[10px] font-semibold text-blue-600 block capitalize">
                {user?.role || 'Receptionist'}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Session" />
          </div>
        )}

        <button
          onClick={logout}
          className={`w-full ${navItemClass(
            false
          )} text-slate-500 hover:text-rose-600 hover:bg-rose-50`}
          title="Sign out of portal"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-rose-600" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
