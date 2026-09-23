import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, GraduationCap } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('aft_admin_token', res.data.token);
        await login(res.data.token, res.data.user);
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStudent = () => {
    setEmail('student@americanfuturetech.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative selection:bg-[#E5C275] selection:text-[#0B1220]">
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-3">
            <img
              src="/images/logo-horizontal.webp"
              alt="American FutureTech"
              className="h-12 w-auto object-contain"
            />
          </Link>
          <div className="text-xs font-bold uppercase tracking-wider text-[#4338CA] mt-1 flex items-center justify-center gap-1.5">
            <GraduationCap className="w-4 h-4" />
            <span>Student Classroom Portal</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
          <h2 className="text-2xl font-heading font-black text-[#0B1220] mb-1">Learner Authentication</h2>
          <p className="text-xs text-slate-600 mb-6">Enter your student portal credentials to access enrolled cohorts and labs.</p>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Student Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="student@americanfuturetech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#0B1220] focus:bg-white transition-all"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#0B1220] focus:bg-white transition-all font-mono"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Authenticating...' : (
                <>
                  Access Student Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Login */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoStudent}
              className="w-full py-2.5 px-4 rounded-full bg-[#F7F7F5] hover:bg-slate-50 text-[#0B1220] text-xs font-bold border-2 border-[#0B1220] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
              1-Click Demo Fill (Ethan Hunt)
            </button>
          </div>

          <div className="mt-5 text-center text-xs text-slate-600">
            Enrolling for the first time?{' '}
            <Link to="/student/register" className="text-[#4338CA] hover:text-[#0B1220] font-bold hover:underline">
              Create Student Account
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-600 hover:text-[#0B1220] transition-colors font-semibold">
            &larr; Return to American FutureTech Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
