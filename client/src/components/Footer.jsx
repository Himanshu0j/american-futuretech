import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer({ onOpenLeadModal }) {
  return (
    <footer id="contact" className="border-t border-[#2d5c36] bg-[#1a361d] pt-16 pb-12 text-[#d8ffd2]/80 text-sm relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Alumni Hiring Network Strip */}
        <div id="placement" className="pb-12 border-b border-[#2d5c36]/80">
          <p className="text-[11px] uppercase tracking-widest font-mono font-bold text-[#76ff8a] mb-6 text-center">
            Alumni Engineering at Leading Enterprise & High-Growth Technology Companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-90">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Google Cloud</span>
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Microsoft</span>
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Amazon AWS</span>
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white">CrowdStrike</span>
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Palantir</span>
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Snowflake</span>
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Databricks</span>
          </div>
        </div>

        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12 text-left">
          
          {/* Institutional Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="inline-block mb-1">
              <img
                src="/images/logo-horizontal-white.webp"
                alt="American FutureTech"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-[#d8ffd2]/80 leading-relaxed font-normal">
              An accredited US technology academy providing rigorous cohort fellowships in applied AI engineering, offensive cybersecurity, and enterprise cloud architecture.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#76ff8a] font-semibold">
              <Award className="w-4 h-4 text-[#76ff8a]" />
              <span>Wyoming Registered Corporate Entity</span>
            </div>
          </div>

          {/* Programs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#76ff8a] uppercase tracking-wider font-heading">
              Engineering Fellowships
            </h4>
            <ul className="space-y-2.5 text-xs text-[#d8ffd2]/80">
              <li><Link to="/courses/data-science-with-ai-integration" className="hover:text-white transition-colors">Data Science with AI Integration</Link></li>
              <li><Link to="/courses/cyber-security-with-ethical-hacking" className="hover:text-white transition-colors">Cyber Security & Ethical Hacking</Link></li>
              <li><Link to="/courses/cyber-security-and-artificial-intelligence" className="hover:text-white transition-colors">Cyber Security & AI Hybrid Track</Link></li>
              <li><Link to="/courses/advanced-generative-and-agentic-ai-master-program" className="hover:text-white transition-colors">Advanced Generative & Agentic AI</Link></li>
            </ul>
          </div>

          {/* Admissions & Corporate Office */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#76ff8a] uppercase tracking-wider font-heading">
              Admissions & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-[#d8ffd2]/80">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#76ff8a] shrink-0" />
                <span>30 N Gould St, Sheridan, WY 82801</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#76ff8a] shrink-0" />
                <span>+1 (307) 201-9494</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#76ff8a] shrink-0" />
                <span>admissions@americanfuturetech.com</span>
              </li>
            </ul>
          </div>

          {/* Student & Staff Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#76ff8a] uppercase tracking-wider font-heading">
              Portals
            </h4>
            <div className="flex flex-col gap-2">
              <Link
                to="/student/login"
                className="text-xs text-[#d8ffd2] hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
              >
                <span>Student LMS Classroom</span>
                <ArrowRight className="w-3 h-3 text-[#76ff8a]" />
              </Link>
              <Link
                to="/certificate/AFT-CERT-AI9821"
                className="text-xs text-[#d8ffd2] hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
              >
                <span>Digital Credential Verification</span>
                <ArrowRight className="w-3 h-3 text-[#76ff8a]" />
              </Link>
              <Link
                to="/admin/login"
                className="text-xs text-[#d8ffd2]/60 hover:text-white transition-colors flex items-center gap-1.5 mt-2 pt-2 border-t border-[#2d5c36]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#76ff8a]" />
                <span>Enterprise Staff Console</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom copyright & disclosures */}
        <div className="pt-8 border-t border-[#2d5c36]/80 flex flex-col sm:flex-row items-center justify-between text-xs text-[#d8ffd2]/70 gap-4">
          <div>
            © 2026 American FutureTech LLC. All rights reserved. Registered in Wyoming, USA.
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-white transition-colors">Refund & Return Policy</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/jobs" className="hover:text-white transition-colors">Live Jobs</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
