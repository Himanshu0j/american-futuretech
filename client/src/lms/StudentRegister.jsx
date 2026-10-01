import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, ArrowRight, Mail, PhoneCall, UserPlus } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

/**
 * Public self-registration has been removed.
 *
 * Student accounts, batch seats, program/course access and LMS content are
 * assigned by authorized staff (Admin → Enrolled Students → Add Student), so a
 * stranger can never create an account and land inside the classroom. This page
 * replaces the old signup form and routes people to the real enrollment flow.
 */
export default function StudentRegister() {
  const { settings } = useSiteSettings();
  const message = settings?.registration?.closedMessage
    || 'Student accounts are created by our admissions team. Please submit an admission enquiry and a counselor will set up your access.';

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-3">
            <img src="/images/logo-horizontal.webp" alt="American FutureTech" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-7 sm:p-9 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F2F6FF] border border-[#1D4ED8]/20 flex items-center justify-center mx-auto mb-5">
            <UserPlus className="w-6 h-6 text-[#1D4ED8]" />
          </div>

          <h1 className="text-2xl font-display font-black text-[#002060] mb-2">
            Registration is handled by admissions
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-6">{message}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-slate-200">
              <GraduationCap className="w-4 h-4 text-[#1D4ED8] mb-2" />
              <div className="text-xs font-bold text-[#002060]">Students with access</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Use your admissions-issued credentials to enter the LMS classroom.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-[#1D4ED8] mb-2" />
              <div className="text-xs font-bold text-[#002060]">Access is assigned</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Program, batch and course access is granted by staff — you only ever see what you are enrolled in.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/student/login"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#002060] hover:bg-[#1D4ED8] text-[#FFD9D9] text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              Go to LMS Login
              <ArrowRight className="w-4 h-4 text-[#FF6B6B]" />
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-[#002060] text-sm font-bold border-2 border-[#002060] transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Request Admission Access
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-[#1D4ED8]" />
            Already enrolled? Your advisor can resend credentials any time.
          </span>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-600 hover:text-[#002060] transition-colors font-semibold">
            &larr; Return to American FutureTech Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
