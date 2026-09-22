import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 pb-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-left">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
          <Link to="/" className="hover:text-[#1a361d] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>Institutional Data Protection Policy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#1a361d]">
            Privacy Policy
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-mono mt-3">
            Last Updated: January 1, 2026 • American Futuretech LLC (Wyoming, USA)
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-8 text-slate-700">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1a361d]">1. Introduction & Scope</h2>
            <p>
              American Futuretech LLC ("American FutureTech", "we", "our", or "us"), an EdTech and professional technology training organization incorporated in Sheridan, Wyoming, USA, is committed to safeguarding the privacy and security of prospective students, enrolled fellows, alumni, and website visitors.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, disclose, and protect personal information when you visit our website, apply for fellowship cohorts, access our Learning Management System (LMS), or interact with our admissions and placement teams.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1a361d]">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Personal Identifiers:</strong> Name, email address, telephone number, mailing address, government ID for accredited certification verification.</li>
              <li><strong>Academic & Career Information:</strong> Resume/CV, GitHub portfolio link, LinkedIn profile URL, educational background, and capstone project submissions.</li>
              <li><strong>Billing & Tuition Information:</strong> Payment transaction records, billing addresses, and payment gateway invoice tokens (credit card details are processed directly by PCI-DSS compliant payment gateways).</li>
              <li><strong>Telemetry & Usage Data:</strong> LMS progress telemetry, laboratory sandbox completion records, IP address, device telemetry, and session logs.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1a361d]">3. How We Use Your Data</h2>
            <p>We process your personal information strictly for legitimate educational, administrative, and placement purposes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To evaluate fellowship cohort applications and deliver instructor-led live training.</li>
              <li>To issue verifiable, tamper-evident digital certificates registered under official American Futuretech LLC seals.</li>
              <li>To facilitate direct career placement introductions with vetted technology partner employers upon student consent.</li>
              <li>To maintain compliance with US corporate record-keeping and accreditation standards.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1a361d]">4. Data Retention & Security</h2>
            <p>
              We implement enterprise-grade security protocols, including AES-256 encryption at rest, TLS 1.3 encryption in transit, and role-based access control (RBAC) to ensure unauthorized parties cannot access student academic files or personal identifiers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1a361d]">5. Contact Institutional Privacy Officer</h2>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 font-mono text-xs">
              <p><strong>American Futuretech LLC</strong></p>
              <p>30 N Gould St, Sheridan, WY 82801, USA</p>
              <p>Email: <a href="mailto:info@americantechgloballlc.com" className="text-[#2d5c36] hover:underline">info@americantechgloballlc.com</a></p>
              <p>Phone: +1 (816) 846-6717</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
