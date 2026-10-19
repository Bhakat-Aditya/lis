import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/context.auth.jsx';
import { usePatientContext } from '../../context/context.patient.jsx';
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
  Barcode,
  X,
  Phone,
} from 'lucide-react';

export default function Sidebar({ onOpenNewPatient }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activePatient,
    clearActivePatient,
    activePatientMenuOpen,
    setActivePatientMenuOpen,
    openModal,
  } = usePatientContext();

  const [collapsed, setCollapsed] = useState(false);

  const handlePatientClose = (e) => {
    e?.stopPropagation();
    clearActivePatient();
    navigate('/patients');
  };

  const handlePatientAction = (action) => {
    if (!activePatient) return;
    const pid = activePatient.patientId || activePatient.slNo;

    switch (action) {
      case 'report':
      case 'results':
        navigate(`/patients/${pid}?tab=results`);
        break;
      case 'invoice':
        navigate(`/invoice/${pid}`);
        break;
      case 'barcode':
        openModal('barcode');
        break;
      case 'deposit':
        openModal('deposit');
        break;
      case 'tests':
        navigate(`/patients/${pid}?tab=tests`);
        break;
      case 'update':
        openModal('update');
        break;
      case 'close':
        clearActivePatient();
        navigate('/patients');
        break;
      default:
        break;
    }
  };

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
      } shrink-0 min-h-[calc(100vh-56px)] transition-all duration-200 select-none flex flex-col justify-between bg-white border-r border-slate-200/90 text-slate-800 shadow-2xs relative z-20`}
    >
      <div>
        {/* Lab Expert Brand Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Clean Medical Emblem */}
            <div className="w-8 h-8 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FlaskConical className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="leading-tight truncate">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block truncate">
                  Lab Expert LIS
                </span>
                <span className="text-[10px] font-medium text-slate-400 block truncate">
                  New Life Care Diagnostics
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

        {/* Active Patient Quick Card (Clean & White with soft border) */}
        {!collapsed && activePatient && (
          <div className="mx-3 my-2 border border-blue-200 bg-blue-50/30 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-blue-100">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-xs text-slate-900 truncate">
                  {activePatient.title ? `${activePatient.title} ` : ''}
                  {activePatient.name}
                </span>
              </div>
              <button
                onClick={handlePatientClose}
                title="Deselect patient"
                className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[10px] text-slate-500 mb-2 font-mono flex items-center justify-between">
              <span>PID: #{activePatient.patientId || activePatient.slNo}</span>
              <span className="font-semibold text-slate-700">₹{activePatient.totalBill || 0}</span>
            </div>

            {/* Quick Action Chips with Attractive Colors */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
              <button
                onClick={() => handlePatientAction('tests')}
                className="flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg transition-colors text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                <span>Order Tests</span>
              </button>
              <button
                onClick={() => handlePatientAction('deposit')}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Deposit</span>
              </button>
              <button
                onClick={() => handlePatientAction('results')}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Fill Results</span>
              </button>
              <button
                onClick={() => handlePatientAction('invoice')}
                className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg transition-colors text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Invoice</span>
              </button>
            </div>
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

      {/* User Status & Logout Footer */}
      <div className="p-3 border-t border-slate-100 space-y-2">
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
