import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  UserCheck, 
  Target, 
  Compass, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Award,
  Zap,
  Clock,
  Briefcase
} from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function PersonalizedLearningSection({ onOpenLeadModal }) {
  const { settings } = useSiteSettings();
  const pl = settings?.personalizedLearning || {};

  const personalizedFee = pl.price ? `$${pl.price.toLocaleString()}` : "$5,499";
  const originalFee = pl.originalPrice ? `$${pl.originalPrice.toLocaleString()}` : "$6,999";
  const depositFee = pl.depositPrice ? `$${pl.depositPrice.toLocaleString()}` : "$99";

  const DEFAULT_FEATURES = [
    { title: "Everything in Group Programs", description: "All live cohort classes, HD session recordings, and lifetime LMS access included.", icon: Sparkles },
    { title: "1-on-1 Dedicated Industry Mentor", description: "Weekly 60-minute private sessions with a Principal Engineer or Tech Lead from Microsoft, IBM, or Accenture.", icon: UserCheck },
    { title: "Custom Tailored Curriculum", description: "Bespoke syllabus created specifically around your current experience, target roles, and chosen tech stack.", icon: Target },
    { title: "Bespoke Production Capstone", description: "Build an end-to-end enterprise system with automated CI/CD, cloud deployment, and architectural review.", icon: Compass },
    { title: "Executive Placement & Mock Interviews", description: "Private interview coaching, system design drills, resume rebuild, and direct introduction to our hiring network.", icon: Briefcase }
  ];

  const featureIconMap = { UserCheck, Target, Compass, Briefcase, ShieldCheck, Award, Zap, Clock, Sparkles };
  const features = (pl.features && pl.features.length > 0)
    ? pl.features.map((f, i) => ({
        title: typeof f === 'string' ? f : (f.title || f),
        description: typeof f === 'string' ? '' : (f.description || ''),
        icon: DEFAULT_FEATURES[i % DEFAULT_FEATURES.length]?.icon || Sparkles
      }))
    : DEFAULT_FEATURES;

  return (
    <section className="relative py-14 bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 text-white overflow-hidden" id="personalized-learning">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Eyebrow */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{pl.badgeText || 'Exclusive 1-on-1 Mentorship Track'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {pl.headline ? pl.headline : <>Personalized Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">Accelerator</span></>}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            {pl.subheadline || 'A standalone premium offering designed for professionals requiring a custom syllabus, flexible schedule, and direct 1-on-1 guidance from top Silicon Valley mentors.'}
          </p>
        </div>

        {/* 2-Column Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Visual & Mentorship Overview */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Pacing & Structure</span>
                  <p className="text-xl font-bold text-white mt-1">4 to 12 Weeks • Self-Paced or Intensive</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% Placement Support</span>
                </div>
              </div>

              {/* Sourced Image Showcase */}
              <div className="relative my-8 rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl group">
                <img
                  src="/static/images/oneonone.png"
                  alt="Personalized 1-on-1 Mentorship Session at American FutureTech"
                  className="w-full h-56 sm:h-72 object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to about-hero if oneonone.png is not loaded
                    e.target.src = "/static/images/industry.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    Private 1-on-1 Live Room
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700 text-amber-300 font-mono">
                    Weekly Code Reviews
                  </span>
                </div>
              </div>

              {/* 4 Core Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-white">{feat.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Guarantee Banner */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>Includes Verified Microsoft Certificate Preparation</span>
              </span>
              <span className="font-mono text-indigo-300">Limited to 15 Fellows/Cohort</span>
            </div>
          </div>

          {/* Right Column: Pricing & Direct Enrollment Card */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-[#0F172A] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
            {/* Top Ribbon */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] tracking-wider uppercase py-1.5 px-6 rounded-bl-xl shadow-lg">
                Independent Offering
              </div>
            </div>

            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Separate Tuition</span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">{personalizedFee}</span>
                  <span className="text-lg text-slate-500 line-through">{originalFee}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Full upfront tuition or flexible interest-free monthly installments.
                </p>
              </div>

              {/* $99 Reservation Box */}
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Reserve Your Seat Today
                    </p>
                    <p className="text-sm font-extrabold text-white mt-0.5">
                      Pay only {depositFee} Deposit Now
                    </p>
                  </div>
                  <span className="text-2xl font-black text-amber-400">{depositFee}</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2">
                  Lock in your dedicated mentor match and syllabus consultation today. Remainder due upon cohort confirmation.
                </p>
              </div>

              {/* What's Included Checklist */}
              <div className="space-y-3 mb-8">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Included in Tuition:</p>
                {[
                  "Dedicated 1-on-1 Senior Mentor with weekly private calls",
                  "Fully customized curriculum designed around your background",
                  "Dedicated Capstone with code reviews and GitHub architecture",
                  "Unlimited portfolio, resume, and LinkedIn optimization",
                  "Direct referrals to our 200+ hiring partner network",
                  "Microsoft & American FutureTech Verified Credentials"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-6 border-t border-slate-800">
              <Link
                to="/checkout?tier=deposit&program=personalized"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] transition-all"
              >
                <span>Reserve Personalized Seat — {depositFee}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => onOpenLeadModal?.({ title: "Personalized Learning Accelerator", price: pl.price || 5499 })}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <span>Request 1-on-1 Syllabus & Consultation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
