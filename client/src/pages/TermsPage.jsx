import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[#E5C275] selection:text-[#0B1220] relative">
      <Navbar />

      <main className="pt-28 pb-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-left">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
          <Link to="/" className="hover:text-[#0B1220] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Terms & Conditions</span>
        </div>

        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 text-[#0B1220] text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Academic Fellowship Terms of Service</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#0B1220]">
            Terms & Conditions
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-mono mt-3">
            Last Updated: January 1, 2026 • American Futuretech LLC (Wyoming, USA)
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-8 text-slate-700">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#0B1220]">1. Agreement to Terms</h2>
            <p>
              By accessing the website, enrolling in educational fellowship cohorts, utilizing our Learning Management System (LMS), or applying for positions through the Partner Career Network of American Futuretech LLC ("American FutureTech", "we", "us"), you agree to be bound by these Terms and Conditions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#0B1220]">2. Academic Integrity & Code of Conduct</h2>
            <p>
              Fellows are expected to maintain the highest standards of professional and academic honesty. Capstone submissions, code reviews, and laboratory assessments must reflect authentic original work. Plagiarism or unauthorized sharing of proprietary course code repositories results in immediate expulsion without refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#0B1220]">3. Intellectual Property Rights</h2>
            <p>
              All curriculum designs, lesson videos, laboratory virtual machines, and architectural documentation provided by American FutureTech are proprietary assets protected under United States and international copyright laws. Code produced independently by students in personal capstone projects remains the intellectual property of the student.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#0B1220]">4. Certification & Credential Verification</h2>
            <p>
              Completion certificates are conferred upon students who fulfill minimum attendance thresholds, pass technical capstone defenses, and resolve payment obligations. American FutureTech maintains permanent public verification endpoints allowing third-party employers to authenticate graduate credentials.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#0B1220]">5. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Wyoming, United States, without regard to its conflict of law provisions.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
