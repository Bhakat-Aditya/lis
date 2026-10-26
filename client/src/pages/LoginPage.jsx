import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/context.auth.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  AlertCircle,
  Phone,
  Activity,
  Sparkles,
  Stethoscope,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionLogoutReason = searchParams.get('reason') || '';

  const [loginId, setLoginId] = useState('sandip');
  const [password, setPassword] = useState('Life');
  const [totp, setTotp] = useState('');
  const [showTotp, setShowTotp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(loginId, password, totp || null);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      if (res.message?.includes('2FA') || res.message?.includes('totp')) {
        setShowTotp(true);
      }
      setError(res.message || 'Login credentials invalid or account locked.');
    }
  };

  const handleQuickFill = (u, p) => {
    setLoginId(u);
    setPassword(p);
    setShowTotp(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      <Helmet>
        <title>Clinic Portal Login | New Life Care Diagnostic Center LIS</title>
        <meta
          name="description"
          content="Authorized clinic staff login for New Life Care Diagnostic Center Laboratory Information System."
        />
      </Helmet>

      {/* Subtle background glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Hospital & Clinical Branding */}
        <div className="bg-white border-b border-slate-100 p-7 text-center relative overflow-hidden">
          {/* Crest */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-extrabold text-2xl mb-3">
            <Activity className="w-7 h-7" />
          </div>

          <h1 className="text-base font-extrabold tracking-tight text-slate-900">
            NEW LIFE CARE DIAGNOSTIC CENTER
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Laboratory Information System (LIS) Expert Portal
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-full text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Authorized Medical Staff Access Only</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-7 space-y-4">
          {sessionLogoutReason && !error && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-xs flex items-center gap-2 font-medium shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{sessionLogoutReason}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[10px]">
                Staff Login ID / Operator Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. sandip"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white text-xs font-semibold text-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[10px]">
                Access Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white text-xs font-semibold text-slate-900 transition-all"
                />
              </div>
            </div>

            {showTotp && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1">
                <label className="font-bold text-blue-900 block text-[10px] uppercase tracking-wider">
                  Two-Factor Authentication (2FA TOTP)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={totp}
                    onChange={(e) => setTotp(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-blue-300 rounded-lg focus:outline-none font-mono text-center tracking-widest text-sm font-bold text-blue-900"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold py-3 px-4 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Authenticating Secure Session...' : 'Sign In to Clinical Portal'}</span>
            </button>
          </form>

          {/* Quick Staff Credentials Preset Switcher */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Fast Staff Role Demo Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('sandip', 'Life')}
                className="p-2 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="font-bold text-slate-800 group-hover:text-indigo-900 block text-xs">
                  Super Admin
                </span>
                <span className="text-[10px] text-slate-400 font-mono">sandip / Life</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('entry', '010101')}
                className="p-2 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="font-bold text-slate-800 group-hover:text-indigo-900 block text-xs">
                  Reception / Desk
                </span>
                <span className="text-[10px] text-slate-400 font-mono">entry / 010101</span>
              </button>
            </div>
          </div>
        </div>

        {/* Support & Quality Accreditation Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-indigo-600" />
            <span>Support Helplines: <strong>8799021616</strong> / <strong>9733525031</strong></span>
          </div>
          <div className="text-slate-400">
            Midnapore Main Center • Keranitola • ISO 9001:2015 & NABL Standards
          </div>
        </div>
      </div>
    </div>
  );
}
