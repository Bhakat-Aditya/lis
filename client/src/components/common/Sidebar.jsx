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
  PanelLeftClose,
  PanelLeft,
  FlaskConical,
  ShieldCheck,
  Database,
  FileText,
  CreditCard,
  Phone,
  FileEdit,
  Plus,
  Printer,
  MinusCircle,
  TestTube,
  Send,
  Undo2,
  MessageSquare,
  Edit,
  Barcode,
  ExternalLink,
  X,
  User,
  Activity,
} from 'lucide-react';

export default function Sidebar({ onOpenNewPatient }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });

  const {
    activePatient,
    clearActivePatient,
    openModal,
    activePatientMenuOpen = true,
    setActivePatientMenuOpen,
  } = usePatientContext();

  const [dropdownOpenLocal, setDropdownOpenLocal] = useState(true);
  const dropdownOpen = setActivePatientMenuOpen ? activePatientMenuOpen : dropdownOpenLocal;
  const setDropdownOpen = setActivePatientMenuOpen || setDropdownOpenLocal;

  const navItemClass = (isActive, activeColorClass = 'bg-blue-50 text-blue-700 font-bold') =>
    `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
      isActive
        ? `${activeColorClass} shadow-2xs`
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const isPatientRoute =
    location.pathname.startsWith('/patients') || location.pathname.startsWith('/invoice');

  // Only show selected patient dropdown when a particular patient's page is open (e.g. /patients/:id)
  const isParticularPatientOpen = Boolean(
    location.pathname.startsWith('/patients/') &&
      location.pathname.split('/')[2] &&
      location.pathname.split('/')[2].trim() !== ''
  );

  // Active patient data extraction
  const rawPid = String(activePatient?.patientId || activePatient?.slNo || activePatient?.id || '').trim();
  const cleanPid = rawPid
    ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
    : '';

  const fullName = [activePatient?.title, activePatient?.name].filter(Boolean).join(' ') || 'Active Patient';
  const barcodeText = activePatient?.slNo || activePatient?.barcode || cleanPid || '-';

  const handleAction = (modalName, tabName) => {
    if (!cleanPid) return;
    const isCurrentlyOnPatientPage = location.pathname.startsWith(`/patients/${cleanPid}`);

    if (tabName) {
      navigate(`/patients/${cleanPid}?tab=${tabName}`);
      return;
    }

    if (modalName) {
      if (isCurrentlyOnPatientPage) {
        openModal(modalName);
      } else {
        navigate(`/patients/${cleanPid}?modal=${modalName}`);
      }
    }
  };

  const handleFillResults = () => {
    if (!cleanPid) return;
    navigate(`/patients/${cleanPid}?tab=results`);
  };

  const handlePrintInvoice = () => {
    if (!cleanPid) return;
    const token = localStorage.getItem('lis_auth_token') || localStorage.getItem('token') || '';
    window.open(`/api/billing/pdf?patientId=${encodeURIComponent(cleanPid)}${token ? `&token=${encodeURIComponent(token)}` : ''}`, '_blank');
  };

  const handleOpenAwsPdf = () => {
    if (!cleanPid) return;
    const token = localStorage.getItem('lis_auth_token') || localStorage.getItem('token') || '';
    window.open(`/api/reports/pdf?patientId=${encodeURIComponent(cleanPid)}&addHeader=true${token ? `&token=${encodeURIComponent(token)}` : ''}`, '_blank');
  };

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
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>Patients Directory</span>
                {activePatient && isParticularPatientOpen && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="Active Patient Selected" />
                )}
              </div>
            )}
          </NavLink>

          {/* Collapsed state active patient icon */}
          {collapsed && activePatient && isParticularPatientOpen && (
            <div className="flex justify-center my-1">
              <button
                onClick={() => setCollapsed(false)}
                title={`Active: ${fullName} (Click to open quick actions)`}
                className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-300 flex items-center justify-center text-blue-700 relative hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1 right-1 ring-2 ring-white animate-pulse" />
                <FileEdit className="w-4 h-4 text-blue-700" />
              </button>
            </div>
          )}

          {/* Clean Dropdown Under Patients Directory - only shown when a particular patient panel is open */}
          {activePatient && !collapsed && isParticularPatientOpen && (
            <div className="ml-2 pl-2 border-l-2 border-blue-200 my-1">
              {/* Patient Name Dropdown Header */}
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-blue-50/70 hover:bg-blue-100/60 transition-colors">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                  title="Click to toggle quick actions"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-blue-600 transition-transform duration-200 shrink-0 ${
                      dropdownOpen ? '' : '-rotate-90'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate" title={fullName}>
                      {fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {barcodeText}
                    </div>
                  </div>
                </button>

                {/* Deselect / Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearActivePatient();
                  }}
                  title="Deselect patient"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* List of Things to be Done (Quick Actions Dropdown List) */}
              {dropdownOpen && (
                <div className="mt-1 space-y-0.5 pl-1">
                  {/* Overview Link */}
                  <button
                    onClick={() => handleAction(null, 'profile')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Patient Overview</span>
                  </button>

                  {/* 1. Fill Results Bench (Highlighted primary item) */}
                  <button
                    onClick={handleFillResults}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors text-left cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Fill Results</span>
                  </button>

                  {/* 2. Order Tests */}
                  <button
                    onClick={() => handleAction(null, 'tests')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span>Order Tests</span>
                  </button>

                  {/* 3. Add Deposit */}
                  <button
                    onClick={() => handleAction('deposit')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Add Deposit</span>
                  </button>

                  {/* 4. Print Invoice */}
                  <button
                    onClick={handlePrintInvoice}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                    title="Open official AWS Invoice PDF in a new tab"
                  >
                    <span className="flex items-center gap-2.5">
                      <Printer className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span>Print Invoice</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* 5. Add Discount */}
                  <button
                    onClick={() => handleAction('discount')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Add Discount</span>
                  </button>

                  {/* 6. Receive Sample */}
                  <button
                    onClick={() => handleAction('receive_sample')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <TestTube className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>Receive Sample</span>
                  </button>

                  {/* 7. Release Report */}
                  <button
                    onClick={() => handleAction('release_report')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Release Report</span>
                  </button>

                  {/* 8. Recall Report */}
                  <button
                    onClick={() => handleAction('recall_report')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Recall Report</span>
                  </button>

                  {/* 9. WhatsApp Hub */}
                  <button
                    onClick={() => handleAction('whatsapp')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>WhatsApp Hub</span>
                  </button>

                  {/* 10. Edit Patient */}
                  <button
                    onClick={() => handleAction('edit')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Edit Details</span>
                  </button>

                  {/* 11. Barcode Label */}
                  <button
                    onClick={() => handleAction('barcode')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <Barcode className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>Barcode Label</span>
                  </button>

                  {/* 12. AWS Report PDF */}
                  <button
                    onClick={handleOpenAwsPdf}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>AWS Report PDF</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* 13. Track 10-Stage Journey */}
                  <button
                    onClick={() => handleAction(null, 'journey')}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 transition-colors text-left cursor-pointer"
                    title="Track 10-Stage Diagnostic Pipeline"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Track 10-Stage Journey</span>
                  </button>
                </div>
              )}
            </div>
          )}

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
