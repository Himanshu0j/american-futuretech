import React from 'react';
import {
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle2,
  Briefcase,
  Users2,
  Video,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function MetricsStrip() {
  const valueProps = [
    {
      label: 'LEARN',
      tag: '24 Cohort Weeks',
      icon: BookOpen,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
      accentBorder: 'hover:border-blue-500/40',
      title: 'Build practical skills through structured programs.',
      description: 'Engage in instructor-led weekend labs, production codebases on GitHub, and asynchronous LMS coursework engineered to Silicon Valley standards.',
      bullets: ['Instructor-Led Labs', 'Production Repositories', 'Silicon Valley Standards'],
    },
    {
      label: 'CERTIFY',
      tag: 'Accredited Credential',
      icon: Award,
      iconBg: 'bg-red-50 text-red-700 border-red-200/80',
      accentBorder: 'hover:border-red-500/40',
      title: 'Demonstrate verifiable engineering achievement.',
      description: 'Graduate with accredited US credentials and cryptographic registry IDs that prove your applied competence to hiring managers.',
      bullets: ['Verifiable US Credential', 'Cryptographic Registry ID', 'Official Employer Verification'],
    },
    {
      label: 'ADVANCE',
      tag: 'Career Acceleration',
      icon: TrendingUp,
      iconBg: 'bg-blue-50 text-[#1D4ED8] border-blue-200/80',
      accentBorder: 'hover:border-blue-500/40',
      title: 'Build toward accelerated tech opportunities.',
      description: 'Access dedicated 1-on-1 mentorship, technical interview defense panels, and direct referral pathways into our 200+ employer network.',
      bullets: ['1-on-1 Technical Mentorship', 'Interview Defense Panels', 'Direct Partner Referrals'],
    },
  ];

  // Three cards only — the client asked for the fourth ($99 seat-deposit
  // guarantee) card to be removed and for the remaining three to carry these
  // exact titles: Live Expert Mentorship · Live Interactive Class ·
  // Job Placement Assistant. The middle card is deliberately a touch bigger.
  const metrics = [
    {
      title: 'Live Expert Mentorship',
      subtext: 'Weekly 1-on-1 reviews with serving Principal Engineers & tech leads',
      image: '/images/mentorship-session.jpg',
      icon: Users2,
      badge: 'Direct Mentorship',
    },
    {
      title: 'Live Interactive Class',
      subtext: 'Instructor-led weekend labs, live debugging & real production codebases',
      image: '/images/classroom-lab.jpg',
      icon: Video,
      badge: 'Instructor-Led',
      emphasise: true,
    },
    {
      title: 'Job Placement Assistant',
      subtext: 'ATS resume engineering, mock hiring panels & direct partner referrals',
      image: '/images/fellows-collaborating.jpg',
      icon: Briefcase,
      badge: 'Placement Support',
    },
  ];

  return (
    <section id="curriculum-metrics" className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F7F5] relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ============================================================
            SECTION A: 3 DISTINCT VALUE PROPOSITION CARDS (Separated UI)
            ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-6 text-left">
          {valueProps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 ${item.accentBorder} shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden`}
              >
                {/* Subtle card top glowing ambient accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#1D4ED8]/20 to-transparent group-hover:via-[#1D4ED8]/60 transition-all" />

                <div className="space-y-4">
                  {/* Top Bar: Icon + Category Badge + Tag */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl ${item.iconBg} border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold tracking-widest text-[#002060] font-heading uppercase">
                        {item.label}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#FCE7E7] text-[#002060] font-bold border border-[#F00000]/40 shadow-2xs">
                      {item.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-[#002060] font-heading leading-snug pt-1">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>

                  {/* Micro bullet highlights */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {item.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1D4ED8]">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    Included in All Cohorts
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#002060] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ============================================================
            SECTION B: 4 METRICS CARDS WITH IMAGES (Elevated Premium UI)
            ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-[#002060] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span>FELLOWSHIP STANDARDS & BENCHMARKS</span>
            </div>
            <div className="text-xs text-slate-600 font-mono hidden sm:block">
              US Academic Year 2026
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-3xl bg-white border border-slate-200/90 hover:border-[#002060]/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${
                    m.emphasise ? 'p-6 sm:p-7 sm:scale-[1.02] shadow-md' : 'p-5 sm:p-6 shadow-xs'
                  }`}
                >
                  {/* Top Thumbnail Image Header */}
                  <div className={`relative w-full rounded-2xl overflow-hidden mb-4 border border-slate-100 bg-slate-50 ${m.emphasise ? 'h-32' : 'h-28'}`}>
                    <img
                      src={m.image}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Floating Pill Badge */}
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 text-[10px] font-bold text-[#002060] shadow-2xs flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-[#1D4ED8]" />
                      <span>{m.badge}</span>
                    </div>
                  </div>

                  {/* Title words — centred + bold, per the client's request */}
                  <div className="space-y-2 text-center">
                    <h3
                      className={`font-black text-[#002060] font-heading tracking-tight leading-tight ${m.emphasise ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}
                    >
                      {m.title}
                    </h3>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      {m.subtext}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
