import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Code2,
  Cpu,
  Layers,
  Zap,
  DollarSign
} from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import BulletContent from './common/BulletContent';

export default function PersonalizedLearningSection() {
  const { settings } = useSiteSettings();
  const pl = settings?.personalizedLearning || {};

  if (pl.enabled === false) return null;

  const defaultFeatures = [
    'Dedicated 1-on-1 weekly sessions with Principal FAANG / Fortune 500 Engineers',
    'Custom tailored curriculum matching your background, schedule, and target role',
    'Private GitHub repository code reviews, architectural defenses, and CI/CD setup',
    'Production-grade Capstone deployed live on AWS cloud infrastructure',
    'Algorithmic ATS resume overhaul and unlimited high-pressure mock interviews',
    'Direct executive referrals to 100+ vetted enterprise hiring partners across the US'
  ];

  const features = (pl.features && pl.features.length > 0) ? pl.features : defaultFeatures;
  const tools = (pl.tools && pl.tools.length > 0) ? pl.tools : ['Python', 'Docker', 'AWS', 'Kubernetes', 'PyTorch', 'PostgreSQL'];
  const price = pl.price || pl.fee || 2199;
  const originalPrice = pl.originalPrice || pl.originalFee || 3499;
  const depositPrice = pl.depositPrice || 99;
  const duration = pl.duration || '6 Months (Extended Track)';
  const headline = pl.headline || pl.title || 'Personalized Learning Track';
  const subheadline = pl.subheadline || pl.description || 'Accelerate your transition into high-growth tech roles with bespoke curriculum pacing, dedicated principal engineer mentorship, and personalized portfolio development.';
  const badgeText = pl.badgeText || pl.subtitle || '1-ON-1 VIP MENTORSHIP & EXTENDED CAREER TRACK';

  return (
    <section id="personalized-learning" className="py-16 sm:py-20 bg-gradient-to-b from-[#fffff2] via-white to-[#fffff2] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#76ff8a]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Eyebrow */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffe6fa] border border-[#9e4f8f]/30 text-[#9e4f8f] text-xs font-mono font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#9e4f8f]" />
            <span>{badgeText}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-[#1a361d] tracking-tight leading-[1.15] mb-4">
            {headline}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {subheadline}
          </p>
        </div>

        {/* Bento Grid Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column (7 cols): Curriculum, Duration & Core Deliverables */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#1a361d]/15 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-6 text-left">
              {/* Duration and Program Tag */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#10b981]" />
                  <span className="text-xs font-mono font-bold text-[#1a361d] uppercase">Track Duration:</span>
                  <span className="text-xs font-bold text-[#2d5c36] bg-[#d8ffd2] px-2.5 py-0.5 rounded-full">
                    {duration}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <UserCheck className="w-3.5 h-3.5 text-[#9e4f8f]" />
                  <span>Only 10 Fellows Per Quarter</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold font-heading text-[#1a361d] mb-3">
                  Tailored 1-on-1 Engineering Mentorship
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Unlike traditional cohort models where everyone moves at the exact same pace, Personalized Learning matches you with a dedicated Senior Staff / Principal Engineer who customizes each week's deliverables to your target salary and job profile.
                </p>
              </div>

              {/* Bullet Features with intelligent BulletContent parser */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
                  What's Included in the 6-Month Intensive
                </h4>
                <div className="space-y-2.5">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-[#fffff2] border border-slate-100 transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-slate-700 font-medium">
                        <BulletContent content={feature} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tools Chips */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Featured Core Tech Stack
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 text-[#1a361d] text-xs font-mono font-bold border border-slate-200"
                    >
                      <Zap className="w-3 h-3 text-[#10b981]" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>* Includes US Accredited Professional Credential</span>
              <span>100% Verifiable Registry</span>
            </div>
          </div>

          {/* Right Column (5 cols): Investment & Direct Reservation Card */}
          <div className="lg:col-span-5 bg-[#1a361d] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#2d5c36] flex flex-col justify-between relative overflow-hidden text-left">
            {/* Ambient Background Graphic */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#76ff8a]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2]/10 border border-[#76ff8a]/30 text-[#76ff8a] text-[11px] font-mono font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Guaranteed Career Placement
              </div>

              <div>
                <div className="text-xs font-mono text-slate-400 uppercase">Independent Tuition</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-[#fffff2] tracking-tight">
                    ${price}
                  </span>
                  <span className="text-sm font-mono text-slate-400 line-through">
                    ${originalPrice}
                  </span>
                </div>
                <div className="text-xs text-[#76ff8a] font-medium mt-1">
                  Flexible financing available · Save ${(originalPrice - price).toLocaleString()} today
                </div>
              </div>

              {/* Deposit Callout */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-300 font-bold">Seat Reservation</span>
                  <span className="text-xs font-mono font-black text-[#76ff8a] bg-[#76ff8a]/15 px-2 py-0.5 rounded">
                    ${depositPrice} Deposit
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Lock your spot in the upcoming intake with a risk-free ${depositPrice} deposit. Balance is only payable upon mentor pairing and schedule confirmation.
                </p>
              </div>

              {/* Trust highlights */}
              <div className="space-y-2 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#76ff8a] shrink-0" />
                  <span>Direct 1-on-1 Faculty Matching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#76ff8a] shrink-0" />
                  <span>Full Lifetime Access to LMS Labs & Materials</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#76ff8a] shrink-0" />
                  <span>Interview Readiness Guarantee or Full Refund</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 pt-6 space-y-3">
              <Link
                to={pl.ctaLink || `/checkout?plan=personalized&tier=deposit`}
                className="w-full py-4 px-6 rounded-xl bg-[#76ff8a] hover:bg-[#5ce872] text-[#1a361d] font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 text-center group"
              >
                <span>{pl.ctaText || `Reserve Your Seat — $${depositPrice}`}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="text-center text-[11px] text-slate-400 font-mono">
                Admissions reviewed in 24 hours · Money-back satisfaction guarantee
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
