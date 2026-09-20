import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden antialiased">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <Link to="/" className="inline-flex flex-col items-center gap-2 group">
          <img
            src="/images/logo-horizontal-white.webp"
            alt="American FutureTech"
            className="h-12 w-auto object-contain"
          />
          <div className="text-xs font-semibold text-sky-400 uppercase tracking-widest font-mono">
            Enterprise Control Plane
          </div>
        </Link>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-[#0f172a]/90 backdrop-blur-2xl border border-white/[0.1] shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(14,165,233,0.15)] p-8 sm:p-9 z-10">
        
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold font-heading text-white tracking-tight">
            Staff Authentication
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access CMS, Lead CRM pipeline, cohorts, and analytics.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@americanfuturetech.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Access Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-300 hover:from-sky-300 hover:to-cyan-200 shadow-[0_0_20px_rgba(14,165,233,0.35)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons for frictionless evaluation */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] space-y-3 text-center">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Demo Logins (Click to Autofill):</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAdmin('admin@americanfuturetech.com', 'admin123')}
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-sky-500/30 text-sky-300 hover:bg-sky-500/10 text-xs font-semibold text-left transition-colors"
            >
              <div className="font-bold">SuperAdmin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@... / admin123</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAdmin('counselor@americanfuturetech.com', 'admin123')}
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold text-left transition-colors"
            >
              <div className="font-bold">Counselor</div>
              <div className="text-[10px] text-slate-400 truncate">counselor@... / admin123</div>
            </button>
          </div>
        </div>

      </div>

      <div className="mt-6 text-xs text-slate-500 relative z-10">
        <Link to="/" className="text-sky-400 hover:underline">
          ← Back to Public Website
        </Link>
      </div>
    </div>
  );
}
