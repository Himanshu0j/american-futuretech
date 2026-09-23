import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin, Award, ArrowRight, ExternalLink, Linkedin, Youtube, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCompanyInfo from '../hooks/useCompanyInfo';

export default function Footer({ onOpenLeadModal }) {
  const company = useCompanyInfo();
  const socials = [
    { key: 'linkedin', href: company.socials.linkedin, Icon: Linkedin, label: 'LinkedIn' },
    { key: 'youtube', href: company.socials.youtube, Icon: Youtube, label: 'YouTube' },
    { key: 'instagram', href: company.socials.instagram, Icon: Instagram, label: 'Instagram' },
    { key: 'twitter', href: company.socials.twitter, Icon: Twitter, label: 'X' },
  ].filter((s) => s.href);

  return (
    <footer id="contact" className="border-t border-[#4338CA] bg-[#0B1220] pt-16 pb-12 text-[#EFE6D6]/80 text-sm relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Alumni Hiring Network Strip */}
        <div id="placement" className="pb-12 border-b border-[#4338CA]/80">
          <p className="text-[11px] uppercase tracking-widest font-mono font-bold text-[#E5C275] mb-6 text-center">
            Alumni Engineering at Leading Enterprise & High-Growth Technology Companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-6">
            <div className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xs hover:scale-105">
              <img src="/images/companies/google-cloud.svg" alt="Google Cloud" className="h-6 sm:h-7 w-auto object-contain filter-none" />
            </div>
            <div className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xs hover:scale-105">
              <img src="/images/companies/microsoft-footer.svg" alt="Microsoft" className="h-6 sm:h-7 w-auto object-contain filter-none" />
            </div>
            <div className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xs hover:scale-105">
              <img src="/images/companies/aws-footer.svg" alt="Amazon AWS" className="h-6 sm:h-7 w-auto object-contain filter-none" />
            </div>
            <div className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xs hover:scale-105">
              <img src="/images/companies/crowdstrike.svg" alt="CrowdStrike" className="h-6 sm:h-7 w-auto object-contain filter-none" />
            </div>
            <div className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xs hover:scale-105">
              <img src="/images/companies/palantir.svg" alt="Palantir" className="h-6 sm:h-7 w-auto object-contain filter-none" />
            </div>
            <div className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xs hover:scale-105">
              <img src="/images/companies/snowflake.svg" alt="Snowflake" className="h-6 sm:h-7 w-auto object-contain filter-none" />
            </div>
            <div className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xs hover:scale-105">
              <img src="/images/companies/databricks.svg" alt="Databricks" className="h-6 sm:h-7 w-auto object-contain filter-none" />
            </div>
          </div>
        </div>

        {/* 4-Column Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-12 text-left">
          {/* Col 1: Institutional Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="inline-block mb-1">
              <img
                src="/images/logo-horizontal-white.webp"
                alt="American FutureTech"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-[#EFE6D6]/80 leading-relaxed font-normal">
              An accredited US technology workforce institute providing rigorous cohort fellowships in applied AI engineering, offensive cybersecurity, and enterprise cloud architecture.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#E5C275] font-semibold pt-1">
              <Award className="w-4 h-4 text-[#E5C275] shrink-0" />
              <span>Wyoming Registered Corporate Charter</span>
            </div>
          </div>

          {/* Col 2: Specializations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#E5C275] uppercase tracking-wider font-heading">
              Engineering Fellowships
            </h4>
            <ul className="space-y-2.5 text-xs text-[#EFE6D6]/80">
              <li>
                <Link to="/courses/data-science-with-ai-integration" className="hover:text-white transition-colors">
                  Data Science with AI Integration
                </Link>
              </li>
              <li>
                <Link to="/courses/cyber-security-with-ethical-hacking" className="hover:text-white transition-colors">
                  Cyber Security & Ethical Hacking
                </Link>
              </li>
              <li>
                <Link to="/courses/cyber-security-and-artificial-intelligence" className="hover:text-white transition-colors">
                  Cyber Security & AI Hybrid Track
                </Link>
              </li>
              <li>
                <Link to="/courses/advanced-generative-and-agentic-ai-master-program" className="hover:text-white transition-colors">
                  Advanced Generative & Agentic AI
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-[#E5C275] transition-colors font-bold text-[#E5C275] flex items-center gap-1 pt-1">
                  <span>View All 8 Specializations</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Admissions & Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#E5C275] uppercase tracking-wider font-heading">
              Admissions & Offices
            </h4>
            <ul className="space-y-2.5 text-xs text-[#EFE6D6]/80">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E5C275] shrink-0 mt-0.5" />
                <span>{company.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E5C275] shrink-0" />
                <a href={company.phoneHref} className="hover:text-white transition-colors">{company.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E5C275] shrink-0" />
                <a href={company.emailHref} className="hover:text-white transition-colors break-all">{company.email}</a>
              </li>
              {socials.length > 0 && (
                <li className="flex items-center gap-2.5 pt-1">
                  {socials.map(({ key, href, Icon, label }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#EFE6D6] hover:text-[#0B1220] hover:bg-[#E5C275] transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </li>
              )}
              <li className="pt-2">
                <button
                  onClick={onOpenLeadModal}
                  className="text-xs font-bold text-[#0B1220] bg-[#E5C275] hover:bg-white px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  Contact Admissions Advisor
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Portals & Registry */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#E5C275] uppercase tracking-wider font-heading">
              Academy Portals
            </h4>
            <div className="flex flex-col gap-2.5">
              <Link
                to="/student/login"
                className="text-xs text-[#EFE6D6] hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
              >
                <span>Student LMS Classroom</span>
                <ArrowRight className="w-3 h-3 text-[#E5C275]" />
              </Link>
              <Link
                to="/certificate/AFT-CERT-AI9821"
                className="text-xs text-[#EFE6D6] hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
              >
                <span>Digital Credential Verification</span>
                <ArrowRight className="w-3 h-3 text-[#E5C275]" />
              </Link>
              <Link
                to="/careers"
                className="text-xs text-[#EFE6D6] hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
              >
                <span>Verified Employer Jobs</span>
                <ArrowRight className="w-3 h-3 text-[#E5C275]" />
              </Link>
              <Link
                to="/admin/login"
                className="text-xs text-[#EFE6D6]/60 hover:text-white transition-colors flex items-center gap-1.5 mt-2 pt-2 border-t border-[#4338CA]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#E5C275]" />
                <span>Enterprise Staff Console</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright & legal links */}
        <div className="pt-8 border-t border-[#4338CA]/80 flex flex-col sm:flex-row items-center justify-between text-xs text-[#EFE6D6]/70 gap-4">
          <div>
            © 2026 {company.legalName}. All rights reserved. Registered in Wyoming, USA.
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-white transition-colors">Refund & Return Policy</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/careers" className="hover:text-white transition-colors">Live Jobs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
