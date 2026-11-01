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
  Eye,
  EyeOff,
  Activity,
  Sparkles,
  FlaskConical,
  Building2,
  CheckCircle2,
  ArrowRight,
  Headphones,
  FileCheck2,
  Stethoscope,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionLogoutReason = searchParams.get('reason') || '';

  // Clean, normal login state - ZERO auto-filled credentials
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totp, setTotp] = useState('');
  const [showTotp, setShowTotp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setError('Please provide your operator username and access password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await login(loginId.trim(), password, totp || null);
      setLoading(false);

      if (res.success) {
        navigate('/');
      } else {
        if (res.message?.includes('2FA') || res.message?.includes('totp')) {
          setShowTotp(true);
        }
        setError(res.message || 'Login credentials invalid or account locked.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Unable to connect to authentication server. Please check your network.');
    }
  };

  return (
    <main className="min-h-screen w-full bg-slate-950 flex flex-col justify-between items-center relative overflow-x-hidden selection:bg-blue-500 selection:text-white font-sans">
      <Helmet>
        <title>Staff Portal Login | New Life Care Midnapore</title>
        <meta
          name="description"
          content="Secure authorized staff and clinician authentication gateway for New Life Care Midnapore Laboratory Information System (LIS)."
        />
      </Helmet>

      {/* Atmospheric Ambient Glows & Medical Grid Texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Soft Radial Backlight Orbs */}
        <div className="absolute -top-40 -left-32 w-[520px] h-[520px] bg-blue-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[560px] h-[560px] bg-emerald-500/15 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[160px]" />

        {/* Subtle Precision Laboratory Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#FFFFFF 1px, transparent 1px), linear-gradient(to right, #FFFFFF 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Subtle Animated Cardiac ECG Pulse Path in Background */}
        <svg
          className="absolute bottom-16 left-0 right-0 w-full h-32 opacity-15 pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
        >
          <path
            d="M0,60 L280,60 L310,60 L325,10 L340,110 L355,40 L370,80 L385,60 L420,60 L700,60 L730,60 L745,10 L760,110 L775,40 L790,80 L805,60 L840,60 L1200,60"
            fill="none"
            stroke="url(#ecgGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
              <stop offset="30%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Clinical Header Banner */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-900/90 rounded-[14px] flex items-center justify-center text-white">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tracking-tight block">
              NEW LIFE CARE MIDNAPORE
            </span>
            <span className="text-[10px] font-medium text-slate-400 block tracking-wider uppercase">
              Clinical Laboratory Information System
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Core Node: Midnapore Central</span>
        </div>
      </header>

      {/* Central Hero Form Container */}
      <section className="w-full max-w-md px-4 py-6 z-10 relative my-auto">
        <div className="backdrop-blur-2xl bg-white/[0.98] dark:bg-slate-900/[0.92] border border-white/80 dark:border-slate-800/90 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300">
          {/* Card Brand Header */}
          <div className="pt-8 pb-6 px-7 text-center relative border-b border-slate-100 dark:border-slate-800/80">
            {/* Glowing Icon Crest */}
            <div className="inline-flex items-center justify-center relative mb-4">
              <div className="absolute -inset-3 rounded-full bg-blue-500/20 blur-md animate-pulse" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 relative">
                <Activity className="w-8 h-8 text-white drop-shadow-sm" />
              </div>
            </div>

            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
              NEW LIFE CARE MIDNAPORE
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Authorized Clinician &amp; Diagnostic Portal Access
            </p>

            <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>256-Bit SSL Encrypted Verification</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-7 space-y-4">
            {sessionLogoutReason && !error && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{sessionLogoutReason}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center justify-between gap-2 font-medium shadow-xs animate-in fade-in shake duration-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="loginId"
                  className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Operator ID / Username
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="loginId"
                    type="text"
                    placeholder="Enter staff login ID"
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      if (error) setError('');
                    }}
                    autoComplete="username"
                    autoFocus
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Access Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter access password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic 2FA TOTP (Shows only if prompted by backend security) */}
              {showTotp && (
                <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-2 animate-in fade-in duration-200">
                  <label
                    htmlFor="totp"
                    className="block text-[10.5px] font-extrabold text-blue-950 dark:text-blue-300 uppercase tracking-wider"
                  >
                    Two-Factor Authentication (2FA TOTP)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="totp"
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit authenticator code"
                      value={totp}
                      onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-center font-mono text-sm font-bold tracking-widest text-blue-900 dark:text-blue-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-blue-700 dark:text-blue-300">
                    Open your Google Authenticator or registered 2FA app to provide the current verification code.
                  </p>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Clinical Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Clinical Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card Footer: Clinical Credentials Notice */}
          <div className="py-3 px-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center text-[10.5px] text-slate-500 dark:text-slate-400">
            <span>Staff access is monitored and logged in compliance with clinical laboratory auditing protocols.</span>
          </div>
        </div>
      </section>

      {/* Global Bottom Quality & Center Standards Footer */}
      <footer className="w-full py-4 px-6 z-10 text-center text-slate-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-900/60 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-semibold text-slate-300">
            New Life Care Midnapore • Main Diagnostic Lab Center, Keranitola
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>NABL Reference Standard</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Headphones className="w-3.5 h-3.5 text-indigo-400" />
            <span>Desk: +91 86702 07475</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
