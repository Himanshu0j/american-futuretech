import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RefundPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 pb-20 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-left">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
          <Link to="/" className="hover:text-[#1a361d] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Refund & Return Policy</span>
        </div>

        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-4">
            <RefreshCw className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>Academic Tuition Guarantee</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#1a361d]">
            Refund & Return Policy
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-mono mt-3">
            Last Updated: January 1, 2026 • American Futuretech LLC (Wyoming, USA)
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-8 text-slate-700">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1a361d]">1. 14-Day Academic Trial Window</h2>
            <p>
              American FutureTech offers a transparent, student-first admissions policy. If within the first 14 calendar days of your fellowship cohort start date you decide that the curriculum does not align with your professional goals, you are eligible for a 100% full refund of tuition fees paid, minus non-refundable third-party credential registration fees.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1a361d]">2. Refund Eligibility Criteria</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Refund requests must be formally submitted in writing to <code>info@americantechgloballlc.com</code> before the conclusion of Day 14 of the cohort.</li>
              <li>Students must have attended or viewed all orientation sessions and submitted initial diagnostic assessments to qualify for unconditional withdrawal.</li>
              <li>After the 14-day trial period, tuition payments are committed to reserving faculty instruction and live sandbox infrastructure; prorated refunds will be evaluated on a case-by-case basis under verified medical emergencies.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1a361d]">3. Processing Timeline</h2>
            <p>
              Approved refund requests are credited back to the original method of payment (credit card, wire transfer, or financing provider) within 5 to 7 business days following formal approval by the Admissions Bursar.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1a361d]">4. Cohort Transfer & Deferral Option</h2>
            <p>
              In lieu of cancellation, students in good standing may request a one-time cohort deferral to a future cohort date at no additional fee, provided written notice is submitted at least 7 days prior to scheduled batch commencement.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
