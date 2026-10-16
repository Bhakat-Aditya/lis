import React from 'react';
import { useAuth } from '../../context/context.auth.jsx';
import { useMaster } from '../../context/context.master.jsx';
import {
  Search,
  Phone,
  User as UserIcon,
  LogOut,
  RefreshCw,
  Building2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function Navbar({ onSearch, searchTerm }) {
  const { user, logout } = useAuth();
  const { refreshCache, loadingMaster } = useMaster();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Helpline */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              LE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">Lab Expert</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  NEW LIFE CARE
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Keranitola, Midnapore
              </div>
            </div>
          </div>

          {/* Quick Helplines */}
          <div className="hidden xl:flex items-center gap-3 text-xs text-slate-600 border-l border-slate-200 pl-4">
            <div className="flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Helpline: <strong className="text-slate-800">8799021616</strong></span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="text-slate-500">
              Lab: <strong className="text-slate-700">9733525031</strong>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient ID, Name, Mobile or SL No..."
              value={searchTerm || ''}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Right: Cache Sync, Branch, User Profile, Logout */}
        <div className="flex items-center gap-3">
          {/* Cache Refresh Action */}
          <button
            onClick={() => refreshCache()}
            disabled={loadingMaster}
            title="Refresh 24h Master Data Cache"
            className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loadingMaster ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">24h Cache</span>
          </button>

          {/* Active Branch */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Branch: <strong className="text-slate-800">{user?.branchId === '2' ? 'Kolkata' : 'Midnapore'}</strong></span>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || user?.loginId}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-indigo-600 uppercase">
                  {user?.role || 'Staff'}
                </span>
                <span className="text-[10px] text-slate-400">({user?.accessType})</span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign out of LIS"
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
