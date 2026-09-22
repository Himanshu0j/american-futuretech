import React, { useState } from 'react';
import {
  Briefcase, CheckCircle2, Award, Users, Calendar, ArrowRight, Shield, Sparkles,
  PhoneCall, Check, FileText, Info, Quote, Linkedin, MessagesSquare, Code2, Zap, Compass
} from 'lucide-react';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';
import LeadModal from '../components/LeadModal';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { DEFAULT_CAREER_SUPPORT } from '../data/siteContent';

export default function CareerSupportPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const { settings } = useSiteSettings();

  // Six-stage career framework + transparency (admin override, static fallback)
  const career = { ...DEFAULT_CAREER_SUPPORT, ...(settings?.careerSupport || {}) };
  const stageIcons = { FileText, Linkedin, MessagesSquare, Code2, Zap, Compass };

  const pillars = [
    {
      num: '01',
      title: 'Algorithmic ATS Resume Engineering',
      desc: 'Our senior talent advisors overhaul your technical resume to clear automated Applicant Tracking Systems (ATS) and compel hiring managers within seconds.',
      features: ['Quantified project impact metrics & GitHub repo links', 'Keyword mapping for AI, Cyber, and Cloud titles', 'Clean, machine-parseable PDF and Markdown formatting'],
    },
    {
      num: '02',
      title: '1-on-1 Technical Mock Interviews',
      desc: 'Simulate high-pressure enterprise engineering rounds with veteran tech leads who provide line-by-line code reviews and architectural critiques.',
      features: ['Live coding & data structure optimization', 'Distributed systems design & defense scenarios', 'STAR framework behavioral calibration'],
    },
    {
      num: '03',
      title: 'Inbound Profile & Portfolio Strategy',
      desc: 'Turn your GitHub and LinkedIn into recruiter magnets that consistently generate direct inbound interview invitations from enterprise engineering teams.',
      features: ['Algorithmic headline and summary indexing', 'Interactive documentation for capstone builds', 'Executive recommendations and peer endorsements'],
    },
    {
      num: '04',
      title: 'Offer Evaluation & Compensation Strategy',
      desc: 'Never leave capital on the table. Our mentors guide you through multi-offer leverage tactics, equity vesting schedules, and sign-on negotiations.',
      features: ['Total compensation market benchmarking', 'Counter-offer scripts with proven success rates', 'Relocation and remote equity parity advice'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      <main className="pt-28 pb-10">

        <CompanyMarquee />

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center pt-8 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-4">
            <Award className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>ALUMNI PLACEMENT ACCELERATION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#1a361d] mb-6">
            We Don't Just Teach Code. <br className="hidden sm:inline" />
            We <span className="highlight">Architect High-Impact Careers</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Every American FutureTech fellowship track includes our dedicated career acceleration infrastructure. From day one, you are paired with industry advisors committed to your placement success.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="py-3 px-7 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Book Free Career Strategy Session &rarr;
            </button>
            <Link
              to="/courses"
              className="py-3 px-6 rounded-full border-2 border-[#1a361d] hover:bg-[#1a361d] hover:text-white text-[#1a361d] text-xs font-bold transition-colors"
            >
              Explore Programs
            </Link>
          </div>
        </section>

        {/* 4 Pillars of Career Placement */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((p) => (
              <div
                key={p.num}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-left shadow-xs hover:border-[#1a361d]/30 hover:shadow-md transition-all"
              >
                <div>
                  <span className="text-xs font-bold text-[#1a361d] px-2.5 py-1 rounded-full bg-[#d8ffd2] mb-3 inline-block">
                    PILLAR {p.num}
                  </span>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-[#1a361d] tracking-tight mb-3">
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {p.features.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-[#40844e] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Six-Stage Career Acceleration Framework ───────────────────── */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider mb-4">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2d5c36]" />
              <span>Our 6-Stage Framework</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-heading text-[#1a361d] tracking-tight">
              {career.title}
            </h2>
            <p className="text-sm text-slate-600 mt-2">{career.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(career.stages || []).map((st, idx) => {
              const Icon = stageIcons[st.icon] || FileText;
              return (
                <div key={idx} className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs hover:shadow-lg hover:border-[#1a361d]/25 transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#1a361d] text-[#76ff8a] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] tracking-wider">
                      {st.stage}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold font-heading text-[#1a361d] leading-tight">{st.title}</h3>
                  <p className="text-[11px] font-semibold text-[#2d5c36] mb-3">{st.tagline}</p>

                  <div className="space-y-2 pt-3 border-t border-slate-100 flex-1">
                    {(st.points || []).map((pt, pi) => (
                      <div key={pi} className="flex items-start gap-2 text-[11px] text-slate-700 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Transparency: What Placement Assistance Actually Means ────── */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mb-10">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider mb-4">
              <Shield className="w-3.5 h-3.5 text-[#2d5c36]" />
              <span>Transparency First</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#1a361d] tracking-tight mb-2">
              {career.transparency?.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed mb-8">
              {career.transparency?.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#f7f9f6] border border-slate-200">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1a361d] mb-4">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                  What We Provide
                </div>
                <div className="space-y-3">
                  {(career.transparency?.whatWeProvide || []).map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-4">
                  <Info className="w-4 h-4 text-amber-600" />
                  Student Accountability
                </div>
                <div className="space-y-3">
                  {(career.transparency?.studentAccountability || []).map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-amber-900/90 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Student Transitions ──────────────────────────────────────── */}
        {(career.transitions || []).length > 0 && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mb-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-bold font-heading uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#2d5c36]" />
                <span>Student Transitions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#1a361d] tracking-tight">
                Learners Who Reached Their Target Roles
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {career.transitions.map((t, idx) => (
                <div key={idx} className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col">
                  <Quote className="w-6 h-6 text-[#76ff8a] mb-3" />
                  <p className="text-xs text-slate-600 italic leading-relaxed flex-1 mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="text-sm font-bold text-[#1a361d]">{t.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.fromRole}{t.toRole && t.toRole !== t.fromRole ? ` → ${t.toRole}` : ''}
                    </div>
                    {t.company && <div className="text-[11px] font-semibold text-[#2d5c36] mt-1">{t.company}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hiring Partners Showcase */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 text-center shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              EMPLOYER NETWORK
            </span>
            <h3 className="text-2xl font-display font-bold text-[#1a361d] mb-3">
              Where Our Alumni Excel
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto mb-8">
              American FutureTech graduates have secured engineering, architecture, and security positions across leading US and global enterprises.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-slate-800 font-display font-bold text-xs tracking-wider">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">Microsoft</div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">Amazon AWS</div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">Palo Alto</div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">Deloitte</div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">Google Cloud</div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">Snowflake</div>
            </div>
          </div>
        </section>
      </main>

      <Footer onOpenLeadModal={() => setIsLeadModalOpen(true)} />
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
      />
    </div>
  );
}
