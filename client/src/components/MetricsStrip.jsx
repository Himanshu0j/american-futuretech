import React from 'react';
import {
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Building2,
  Users2,
  ShieldCheck,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function MetricsStrip() {
  const valueProps = [
    {
      label: 'LEARN',
      tag: '24 Cohort Weeks',
      icon: BookOpen,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      accentBorder: 'hover:border-emerald-500/40',
      title: 'Build practical skills through structured programs.',
      description: 'Engage in instructor-led weekend labs, production codebases on GitHub, and asynchronous LMS coursework engineered to Silicon Valley standards.',
      bullets: ['Instructor-Led Labs', 'Production Repositories', 'Silicon Valley Standards'],
    },
    {
      label: 'CERTIFY',
      tag: 'Accredited Credential',
      icon: Award,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      accentBorder: 'hover:border-amber-500/40',
      title: 'Demonstrate verifiable engineering achievement.',
      description: 'Graduate with accredited US credentials and cryptographic registry IDs that prove your applied competence to hiring managers.',
      bullets: ['Verifiable US Credential', 'Cryptographic Registry ID', 'Official Employer Verification'],
    },
    {
      label: 'ADVANCE',
      tag: 'Career Acceleration',
      icon: TrendingUp,
      iconBg: 'bg-purple-50 text-[#9e4f8f] border-purple-200/80',
      accentBorder: 'hover:border-purple-500/40',
      title: 'Build toward accelerated tech opportunities.',
      description: 'Access dedicated 1-on-1 mentorship, technical interview defense panels, and direct referral pathways into our 200+ employer network.',
      bullets: ['1-on-1 Technical Mentorship', 'Interview Defense Panels', 'Direct Partner Referrals'],
    },
  ];

  const metrics = [
    {
      stat: '6 Months',
      label: 'Comprehensive Fellowship',
      subtext: 'Intensive weekend labs & production capstones',
      image: '/images/classroom-lab.jpg',
      icon: Calendar,
      badge: 'Curriculum Depth',
    },
    {
      stat: '200+',
      label: 'Corporate Hiring Partners',
      subtext: 'Exclusive placement drives & direct interviews',
      image: '/images/fellows-collaborating.jpg',
      icon: Building2,
      badge: 'Partner Network',
    },
    {
      stat: '1-on-1',
      label: 'Faculty Office Hours',
      subtext: 'Personalized code reviews & career defense',
      image: '/images/mentorship-session.jpg',
      icon: Users2,
      badge: 'Direct Mentorship',
    },
    {
      stat: '$99',
      label: 'Seat Deposit Guarantee',
      subtext: '100% Risk-free reservation & refund protection',
      image: '/images/gold-seal-medal.webp',
      isSeal: true,
      icon: ShieldCheck,
      badge: 'Risk-Free Terms',
    },
  ];

  return (
    <section id="curriculum-metrics" className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#fffff2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* ============================================================
            SECTION A: 3 DISTINCT VALUE PROPOSITION CARDS (Separated UI)
            ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left">
          {valueProps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 ${item.accentBorder} shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden`}
              >
                {/* Subtle card top glowing ambient accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#2d5c36]/20 to-transparent group-hover:via-[#2d5c36]/60 transition-all" />

                <div className="space-y-4">
                  {/* Top Bar: Icon + Category Badge + Tag */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl ${item.iconBg} border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold tracking-widest text-[#1a361d] font-heading uppercase">
                        {item.label}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] font-bold border border-[#76ff8a]/40 shadow-2xs">
                      {item.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-[#1a361d] font-heading leading-snug pt-1">
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
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#40844e] shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#2d5c36]">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#40844e]" />
                    Included in All Cohorts
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#1a361d] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-[#1a361d] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#40844e] animate-pulse" />
              <span>FELLOWSHIP STANDARDS & BENCHMARKS</span>
            </div>
            <div className="text-xs text-slate-500 font-mono hidden sm:block">
              US Academic Year 2026
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-[#1a361d]/40 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top Thumbnail Image Header */}
                  <div className="relative h-28 w-full rounded-2xl overflow-hidden mb-4 border border-slate-100 bg-slate-50">
                    <img
                      src={m.image}
                      alt={m.label}
                      className={`w-full h-full ${
                        m.isSeal ? 'object-contain p-2 group-hover:scale-110' : 'object-cover group-hover:scale-105'
                      } transition-transform duration-500`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Floating Pill Badge */}
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 text-[10px] font-bold text-[#1a361d] shadow-2xs flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-[#2d5c36]" />
                      <span>{m.badge}</span>
                    </div>
                  </div>

                  {/* Main Metric Stat & Title */}
                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-black text-[#1a361d] font-heading tracking-tight flex items-baseline gap-1">
                      <span>{m.stat}</span>
                      {m.stat === '$99' && (
                        <span className="text-xs font-mono font-bold text-[#9e4f8f] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                          Refundable
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900 leading-snug">
                      {m.label}
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed pt-1">
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
