import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Sparkles, Send, Lock, User, Mail, Phone, Calendar, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../lib/api';

export default function LeadModal({ isOpen, onClose, preselectedCourse, courses = [] }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [targetCourse, setTargetCourse] = useState('');
  const [preferredBatch, setPreferredBatch] = useState('Weekend Live (2 Hours)');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (preselectedCourse) {
      setTargetCourse(preselectedCourse._id || '');
    } else if (courses.length > 0 && !targetCourse) {
      setTargetCourse(courses[0]._id);
    }
  }, [preselectedCourse, courses]);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0ea5e9', '#38bdf8', '#f43f5e', '#10b981', '#ffffff'],
      });
    } catch (e) {
      console.log('Confetti triggered');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/leads/apply', {
        fullName,
        email,
        phone,
        targetCourse: targetCourse || undefined,
        preferredBatch,
        marketingSource: 'Landing Page Modal',
      });

      if (res.data.success) {
        setIsSuccess(true);
        triggerConfetti();
      } else {
        setErrorMsg(res.data.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Unable to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setIsSuccess(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Dialog Surface */}
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          /* Thank You / Confetti State */
          <div className="p-6 sm:p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EFE6D6] border border-[#E5C275] flex items-center justify-center text-[#0B1220] mx-auto shadow-md animate-bounce">
              <CheckCircle className="w-8 h-8 text-[#4338CA]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-[#0B1220]">
                Application Received!
              </h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong className="text-slate-900">{fullName}</strong>. An admissions advisor will review your profile and reach out within 24 hours.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-2">
              <div className="flex justify-between">
                <span>Confirmation sent to:</span>
                <span className="text-slate-900 font-medium font-mono">{email}</span>
              </div>
              <div className="flex justify-between">
                <span>Admissions Status:</span>
                <span className="text-[#4338CA] font-semibold">Priority Queue Active</span>
              </div>
            </div>

            <button
              onClick={resetAndClose}
              className="w-full py-3 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          /* Lead Capture Form */
          <div className="p-6 sm:p-6 text-left">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 text-[#0B1220] text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>Priority 2026 Admissions</span>
              </div>
              <h3 className="text-2xl font-display font-bold tracking-tight text-[#0B1220]">
                Apply for Certification
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Fast-track your engineering career with live cohorts and 1-on-1 career mentorship.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                  />
                </div>
              </div>

              {/* Email & Phone in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Target Course dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Program Track
                </label>
                <select
                  aria-label="Select program track"
                  value={targetCourse}
                  onChange={(e) => setTargetCourse(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id} className="bg-white text-slate-900">
                      {c.title} ({c.duration || '6 Months'})
                    </option>
                  ))}
                  {courses.length === 0 && (
                    <>
                      <option value="ds" className="bg-white text-slate-900">Data Science with AI Integration</option>
                      <option value="cs" className="bg-white text-slate-900">Cyber Security with Ethical Hacking</option>
                    </>
                  )}
                </select>
              </div>

              {/* Preferred Batch Timing */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Batch Timing
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    aria-label="Preferred batch timing"
                    value={preferredBatch}
                    onChange={(e) => setPreferredBatch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                  >
                    <option value="Weekend Live (2 Hours)" className="bg-white text-slate-900">Weekend Live Classes (2 Hours Each)</option>
                    <option value="Morning Batch" className="bg-white text-slate-900">Morning Weekday Batch</option>
                    <option value="Evening Batch" className="bg-white text-slate-900">Evening Weekday Batch</option>
                    <option value="Late Evening Batch" className="bg-white text-slate-900">Late Evening / Flexible</option>
                  </select>
                </div>
              </div>

              {/* Security guarantee */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <Lock className="w-3.5 h-3.5 text-[#047857]" />
                <span>Zero spam guarantee. Your details are strictly confidential.</span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 mt-3 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer group disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Securing Seat...</span>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
