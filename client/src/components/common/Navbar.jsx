import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/context.auth.jsx';
import { Search, User as UserIcon, Lock, X } from 'lucide-react';

export default function Navbar({ onSearch }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const querySearch = new URLSearchParams(location.search).get('search') || '';
  const [searchTerm, setSearchTerm] = useState(querySearch);

  useEffect(() => {
    setSearchTerm(querySearch);
  }, [querySearch]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchTerm.trim();
    if (onSearch) {
      onSearch(trimmed);
    } else {
      navigate(trimmed ? `/patients?search=${encodeURIComponent(trimmed)}` : '/patients');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    } else {
      navigate('/patients');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-2">
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Left: Global Search Input matching Screenshot */}
        <div className="w-full max-w-xs md:max-w-sm">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={handleSearchSubmit} />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search patients (PID, Name, Mobile)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-700 placeholder:text-slate-400 font-medium transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Right Info: Lab Mobile, Icons, Clinic Badge matching Screenshot */}
        <div className="flex items-center gap-4 text-xs shrink-0">
          {/* Lab Mobiles */}
          <div className="hidden sm:flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="text-slate-500 font-normal">Lab Mobile:</span>
            <span className="text-slate-900 font-bold">9733525031, 9647393949</span>
          </div>

          {/* Quick User & Security Icons */}
          <div className="flex items-center gap-2 text-slate-600">
            <button
              title={`Logged in as ${user?.name || user?.loginId || 'Staff'}`}
              className="p-1 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
            </button>
            <button
              title="Secure Clinical Session"
              className="p-1 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>

          {/* Clinic Brand & License Type */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {/* Heart Crest Emblem */}
            <div className="w-7 h-7 rounded-full border border-rose-400 p-0.5 flex items-center justify-center bg-white shadow-2xs shrink-0">
              <svg viewBox="0 0 24 24" className="w-full h-full text-rose-500" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div className="text-left leading-tight hidden xs:block">
              <div className="font-extrabold text-xs text-slate-900 tracking-tight">
                NEW LIFE RIMPA
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Type :Normal
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
