import React, { useState } from 'react';
import { useAuth } from '../context/context.auth.jsx';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, Phone } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

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
      setError(res.message || 'Login failed');
    }
  };

  const handleQuickFill = (u, p) => {
    setLoginId(u);
    setPassword(p);
    setShowTotp(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header with Hospital Branding */}
        <div className="bg-slate-900 text-white p-6 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 font-extrabold text-xl shadow-md">
            LE
          </div>
          <h1 className="text-base font-bold tracking-tight">
            NEW LIFE CARE DIAGNOSTIC CENTER
          </h1>
          <p className="text-xs text-slate-400">
            Laboratory Information System (LIS) Portal
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full text-[10px] text-slate-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Clinic Staff Access Only</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Login ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. sandip"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-xs font-medium"
                />
              </div>
            </div>

            {showTotp && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  2FA TOTP Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="6-digit authenticator code"
                    value={totp}
                    onChange={(e) => setTotp(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white font-mono text-center tracking-widest text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          {/* Quick Staff Role Accounts Helper */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 block mb-1.5">
              Available Test Staff Credentials:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('sandip', 'Life')}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-800 block">Super Admin</span>
                <span className="text-[10px] text-slate-500">sandip / Life</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('entry', '010101')}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-slate-800 block">Front Desk / Entry</span>
                <span className="text-[10px] text-slate-500">entry / 010101</span>
              </button>
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
          <Phone className="w-3 h-3 text-indigo-600" />
          <span>Support Helpline: 8799021616 / 9733525031</span>
        </div>
      </div>
    </div>
  );
}
