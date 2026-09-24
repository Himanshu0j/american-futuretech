import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CookiePolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[#E5C275] selection:text-[#0B1220] relative">
      <Navbar />

      <main className="pt-28 pb-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-left">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 mb-6">
          <Link to="/" className="hover:text-[#0B1220] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Cookie Policy</span>
        </div>

        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 text-[#0B1220] text-xs font-semibold mb-4">
            <Cookie className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Digital Telemetry Disclosure</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#0B1220]">
            Cookie Policy
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-mono mt-3">
            Last Updated: January 1, 2026 • American Futuretech LLC (Wyoming, USA)
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-8 text-slate-700">
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#0B1220]">1. What Are Cookies?</h2>
            <p>
              Cookies are small alphanumeric files placed on your device by your web browser when you visit websites. They enable the site to authenticate your session, remember your preferences, and maintain secure user authentication states across our Learning Management System.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#0B1220]">2. Cookies We Utilize</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Essential Session Tokens:</strong> Strictly necessary for authenticating student accounts, safeguarding JWT tokens, and keeping your session active in the LMS classroom.</li>
              <li><strong>Functional & Preference Cookies:</strong> Remembers your UI display modes, sound preferences, and code editor themes.</li>
              <li><strong>Performance Telemetry:</strong> Aggregated analytical metrics that help our engineering team diagnose page load performance and optimize interactive sandbox speeds.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#0B1220]">3. Managing Your Cookie Preferences</h2>
            <p>
              Most web browsers permit you to modify cookie controls through browser settings. Disabling essential cookies may impair access to your authenticated student dashboard and active lesson video player.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
